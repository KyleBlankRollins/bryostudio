// Posts a small sample batch to the telemetry function, twice, to check the
// whole path end to end: the second post must come back as a duplicate, and a
// bad batch must be refused.
//
//   npm run test:telemetry                                   # https://bryostudio.com
//   npm run test:telemetry -- http://localhost:8888          # netlify dev
//
// The lines it stores have an install id starting "test-"; delete them in
// Atlas's Data Explorer with the filter {"_install": {"$regex": "^test-"}}.

import { randomBytes } from "node:crypto";

interface Reply {
  status: number;
  body: string;
}

const base = (process.argv[2] ?? "https://bryostudio.com").replace(/\/$/, "");
const url = `${base}/api/telemetry`;
const id = (prefix: string): string => `${prefix}${randomBytes(12).toString("hex")}`;

const batch = {
  game: "pizza-ambulance",
  install: id("test-"),
  app: "test",
  batch: id("batch-"),
  lines: [
    { v: 7, utc: new Date().toISOString(), session: "test", job: "over_the_fence", outcome: "delivered", stars: 3, paid: 30 },
    { v: 7, kind: "roam", utc: new Date().toISOString(), session: "test", seconds: 12.5 },
  ],
};

async function post(body: unknown): Promise<Reply> {
  const response = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  return { status: response.status, body: await response.text() };
}

console.log(`POST ${url}`);
const first = await post(batch);
console.log("first: ", first.status, first.body);
const again = await post(batch);
console.log("again: ", again.status, again.body);
const bad = await post({ ...batch, batch: id("batch-"), lines: [{ v: 7, kind: "nonsense" }] });
console.log("bad:   ", bad.status, bad.body);

const ok = first.status === 202 && again.status === 202 && again.body.includes("duplicate") && bad.status === 400;
console.log(ok ? "OK" : "NOT OK");
process.exit(ok ? 0 : 1);
