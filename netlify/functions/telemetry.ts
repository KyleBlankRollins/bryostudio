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

import type { Config } from "@netlify/functions";
import { MongoClient, type Collection } from "mongodb";

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

/** One line as the game wrote it: a version, perhaps a kind, and its fields. */
type Line = { v: number; kind?: string } & Record<string, unknown>;

/** A batch as posted, once checked. */
interface Batch {
  game: string;
  install: string;
  app: string;
  batch: string;
  lines: Line[];
}

/** A line as stored: the game's fields and where and when it came from. */
type StoredLine = Line & {
  _game: string;
  _install: string;
  _app: string;
  _batch: string;
  _received: Date;
};

// One client per function instance, reused across calls: connecting is the
// slow part, and Atlas's free tier limits connections.
let clientPromise: Promise<MongoClient> | null = null;
let indexed: Promise<unknown> | null = null;

async function getCollection(): Promise<Collection<StoredLine>> {
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
    clientPromise = client.connect().catch((error: unknown) => {
      clientPromise = null;
      throw error;
    });
  }
  const client = await clientPromise;
  const collection = client.db(DATABASE).collection<StoredLine>(COLLECTION);
  if (indexed === null) {
    // Makes the duplicate check below quick; creating it again is a no-op.
    indexed = collection
      .createIndex({ _game: 1, _install: 1, _batch: 1 }, { name: "batch" })
      .catch((error: unknown) => {
        indexed = null;
        console.error("telemetry: cannot make the batch index:", message(error));
      });
  }
  return collection;
}

function message(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}

function reply(status: number, body: Record<string, unknown>): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json", "Cache-Control": "no-store" },
  });
}

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

function isId(value: unknown): value is string {
  return typeof value === "string" && ID.test(value);
}

// Why a line is refused, or "" when it is fine.
function checkLine(line: unknown): string {
  if (!isPlainObject(line)) return "a line is not an object";
  const v = line.v;
  if (typeof v !== "number" || !Number.isInteger(v) || v < 1 || v > 99) return "a line has no version";
  if ("kind" in line && !(typeof line.kind === "string" && KINDS.has(line.kind))) {
    return "a line has an unknown kind";
  }
  const keys = Object.keys(line);
  if (keys.length > MAX_LINE_KEYS) return "a line has too many fields";
  for (const key of keys) {
    if (key.startsWith("$") || key.includes(".") || key.startsWith("_")) {
      return "a line has a field name that is not allowed";
    }
  }
  if (JSON.stringify(line).length > MAX_LINE_BYTES) return "a line is too long";
  return "";
}

// The batch, or why it is refused.
function checkBatch(value: unknown): Batch | string {
  if (!isPlainObject(value)) return "not an object";
  const { game, install, app, batch, lines } = value;
  if (typeof game !== "string" || !GAMES.has(game)) return "unknown game";
  if (!isId(install)) return "bad install id";
  if (!isId(batch)) return "bad batch id";
  if (typeof app !== "string" || app.length === 0 || app.length > 32) return "bad app version";
  if (!Array.isArray(lines) || lines.length === 0 || lines.length > MAX_LINES) return "bad lines";
  for (const line of lines) {
    const why = checkLine(line);
    if (why) return why;
  }
  return { game, install, app, batch, lines: lines as Line[] };
}

export default async (request: Request): Promise<Response> => {
  if (request.method !== "POST") {
    return reply(405, { error: "POST only" });
  }

  const text = await request.text();
  if (text.length > MAX_BODY_BYTES) {
    return reply(413, { error: "batch too big" });
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(text);
  } catch {
    return reply(400, { error: "not JSON" });
  }
  const batch = checkBatch(parsed);
  if (typeof batch === "string") {
    return reply(400, { error: batch });
  }

  let collection: Collection<StoredLine>;
  try {
    collection = await getCollection();
  } catch (error) {
    console.error("telemetry: cannot reach the database:", message(error));
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
    const documents: StoredLine[] = batch.lines.map((line) => ({
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
    console.error("telemetry: cannot store the batch:", message(error));
    return reply(503, { error: "try again later" });
  }
};

export const config: Config = {
  path: "/api/telemetry",
  // A game sends a batch every few minutes at most; this stops one address
  // from flooding the function and the database.
  rateLimit: {
    windowLimit: 30,
    windowSize: 60,
    aggregateBy: ["ip", "domain"],
  },
};
