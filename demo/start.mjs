/**
 * `npm run demo` — the whole admin on dummy data, with no database to set up.
 *
 * Starts a throwaway MongoDB inside this process (mongodb-memory-server
 * downloads the binary once, on first run), fills it with a demo store, and
 * runs `next dev` against it. Data lives in .demo-db/, so edits survive a
 * restart; `npm run demo -- --reset` starts again from fresh dummy data.
 *
 * Nothing here touches a real database, R2 bucket or storefront: photo
 * uploads are kept in the demo database instead (see DEMO_MODE in
 * app/api/uploads/product-image), and storefront calls are skipped.
 */
import { spawn } from "node:child_process";
import { existsSync, mkdirSync, rmSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";
import mongoose from "mongoose";
import { MongoMemoryServer } from "mongodb-memory-server";
import { DEMO_LOGIN, seedDemo } from "./seed-data.mjs";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const DB_PATH = path.join(ROOT, ".demo-db");
const PORT = process.env.PORT || "3011";
const reset = process.argv.includes("--reset");

if (reset && existsSync(DB_PATH))
  rmSync(DB_PATH, { recursive: true, force: true });
const fresh = !existsSync(DB_PATH);
mkdirSync(DB_PATH, { recursive: true });

console.log("Starting the demo database…");
const mongo = await MongoMemoryServer.create({
  instance: { dbPath: DB_PATH, storageEngine: "wiredTiger" },
});
const uri = mongo.getUri("atk-demo");

await mongoose.connect(uri);
const hasData =
  (await mongoose.connection.db.collection("products").countDocuments()) > 0;
if (fresh || !hasData) {
  const counts = await seedDemo(mongoose.connection.db);
  // Fresh data means fresh ids. Next's data cache (the category list, for
  // one) would otherwise keep serving ids from the previous demo database.
  // `next dev` keeps it under .next/dev, `next build` under .next.
  for (const dir of [
    [".next", "dev", "cache"],
    [".next", "cache"],
  ]) {
    rmSync(path.join(ROOT, ...dir, "fetch-cache"), {
      recursive: true,
      force: true,
    });
  }
  console.log(
    `Dummy data ready: ${counts.products} products, ${counts.orders} orders, ` +
      `${counts.sessions} visits, ${counts.inquiries} inquiries.`
  );
}
await mongoose.disconnect();

const next = spawn("npx", ["next", "dev", "--webpack", "--port", PORT], {
  cwd: ROOT,
  stdio: "inherit",
  shell: process.platform === "win32",
  env: {
    ...process.env,
    MONGODB_URI: uri,
    DEMO_MODE: "1",
    ADMIN_SESSION_SECRET: "demo-only-session-secret-not-for-production-use",
    INTERNAL_API_SECRET: "demo-internal-secret",
    // Unset so nothing tries to reach a real storefront from the demo.
    STOREFRONT_REVALIDATE_URL: "",
  },
});

console.log(`
  ATK Admin demo → http://localhost:${PORT}
  Sign in with ${DEMO_LOGIN.email} / ${DEMO_LOGIN.password}
  Stop with Ctrl+C. Fresh data: npm run demo -- --reset
`);

async function shutdown() {
  next.kill("SIGINT");
  await mongo.stop({ doCleanup: false });
  process.exit(0);
}
process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);
next.on("exit", async (code) => {
  await mongo.stop({ doCleanup: false });
  process.exit(code ?? 0);
});
