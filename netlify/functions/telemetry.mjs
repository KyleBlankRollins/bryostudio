// Takes a batch of telemetry lines from a game and stores them in MongoDB
// Atlas. The game never holds database credentials: it posts here over
// HTTPS, and only this function talks to the database, with the connection
// string in Netlify's environment (MONGODB_URI, Functions scope, secret).
//
// POST /api/telemetry
// {
//   "game": "pizza-ambulance",
//   "install": "<random id made once per install, 16 to 64 of A-Z a-z 0-9 _ ->",
//   "app": "<the game's version, up to 32 characters>",
//   "batch": "<random id for this batch, the same when it is sent again>",
//   "lines": [ { "v": 7, ... }, ... ]
// }
//
// Replies 202 {"stored": n} when stored, 202 {"stored": 0, "duplicate": true}
// when the batch was already stored (a retry after a lost reply), 400 when
// the batch is malformed, 405 for anything but POST, 413 when it is too big,
// 503 when the database cannot be reached (the game keeps the batch and
// tries again later).

import { MongoClient } from "mongodb";

const DATABASE = "pizza_ambulance";
const COLLECTION = "telemetry";

// What a game may send. Anything else is refused whole, so random traffic
// cannot fill the database.
const GAMES = new Set(["pizza-ambulance"]);
// Line kinds the game writes (core/telemetry/run_telemetry.gd); a line with
// no kind is a delivery.
const KINDS = new Set(["roam", "home", "trip", "debug"]);
const ID = /^[A-Za-z0-9_-]{16,64}$/;
const MAX_BODY_BYTES = 512 * 1024;
const MAX_LINES = 500;
const MAX_LINE_BYTES = 16 * 1024;
const MAX_LINE_KEYS = 200;

// One client per function instance, reused across calls: connecting is the
// slow part, and Atlas's free tier limits connections.
let clientPromise = null;

function getCollection() {
  if (clientPromise === null) {
    const uri = process.env.MONGODB_URI;
    if (!uri) {
      throw new Error("MONGODB_URI is not set");
    }
    const client = new MongoClient(uri, {
      maxPoolSize: 3,
      serverSelectionTimeoutMS: 5000,
      appName: "bryostudio-telemetry",
    });
    clientPromise = client.connect().catch((error) => {
      clientPromise = null;
      throw error;
    });
  }
  return clientPromise.then((client) => {
    const collection = client.db(DATABASE).collection(COLLECTION);
    if (!indexed) {
      // Makes the duplicate check below quick; creating it again is a no-op.
      indexed = collection
        .createIndex({ _game: 1, _install: 1, _batch: 1 }, { name: "batch" })
        .catch((error) => {
          indexed = null;
          console.error("telemetry: cannot make the batch index:", error.message);
        });
    }
    return collection;
  });
}

let indexed = null;

function reply(status, body) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json", "Cache-Control": "no-store" },
  });
}

function isPlainObject(value) {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

// Why a line is refused, or "" when it is fine.
function checkLine(line) {
  if (!isPlainObject(line)) return "a line is not an object";
  if (!Number.isInteger(line.v) || line.v < 1 || line.v > 99) return "a line has no version";
  if ("kind" in line && !KINDS.has(line.kind)) return "a line has an unknown kind";
  if (Object.keys(line).length > MAX_LINE_KEYS) return "a line has too many fields";
  for (const key of Object.keys(line)) {
    if (key.startsWith("$") || key.includes(".") || key.startsWith("_")) {
      return "a line has a field name that is not allowed";
    }
  }
  if (JSON.stringify(line).length > MAX_LINE_BYTES) return "a line is too long";
  return "";
}

export default async (request) => {
  if (request.method !== "POST") {
    return reply(405, { error: "POST only" });
  }

  const text = await request.text();
  if (text.length > MAX_BODY_BYTES) {
    return reply(413, { error: "batch too big" });
  }

  let batch;
  try {
    batch = JSON.parse(text);
  } catch {
    return reply(400, { error: "not JSON" });
  }
  if (!isPlainObject(batch)) return reply(400, { error: "not an object" });
  if (!GAMES.has(batch.game)) return reply(400, { error: "unknown game" });
  if (typeof batch.install !== "string" || !ID.test(batch.install)) return reply(400, { error: "bad install id" });
  if (typeof batch.batch !== "string" || !ID.test(batch.batch)) return reply(400, { error: "bad batch id" });
  if (typeof batch.app !== "string" || batch.app.length === 0 || batch.app.length > 32) {
    return reply(400, { error: "bad app version" });
  }
  if (!Array.isArray(batch.lines) || batch.lines.length === 0 || batch.lines.length > MAX_LINES) {
    return reply(400, { error: "bad lines" });
  }
  for (const line of batch.lines) {
    const why = checkLine(line);
    if (why) return reply(400, { error: why });
  }

  let collection;
  try {
    collection = await getCollection();
  } catch (error) {
    console.error("telemetry: cannot reach the database:", error.message);
    return reply(503, { error: "try again later" });
  }

  try {
    // A batch sent again after a lost reply is stored once.
    const seen = await collection.findOne(
      { _game: batch.game, _install: batch.install, _batch: batch.batch },
      { projection: { _id: 1 } },
    );
    if (seen) {
      return reply(202, { stored: 0, duplicate: true });
    }
    const received = new Date();
    const documents = batch.lines.map((line) => ({
      ...line,
      _game: batch.game,
      _install: batch.install,
      _app: batch.app,
      _batch: batch.batch,
      _received: received,
    }));
    const result = await collection.insertMany(documents, { ordered: false });
    return reply(202, { stored: result.insertedCount });
  } catch (error) {
    console.error("telemetry: cannot store the batch:", error.message);
    return reply(503, { error: "try again later" });
  }
};

export const config = {
  path: "/api/telemetry",
  // A game sends a batch every few minutes at most; this stops one address
  // from flooding the function and the database.
  rateLimit: {
    windowLimit: 30,
    windowSize: 60,
    aggregateBy: ["ip", "domain"],
  },
};
