import { existsSync } from "fs";
import { spawnSync, spawn } from "child_process";
import { resolve, join } from "path";

const root = process.cwd().endsWith("/api") ? resolve(process.cwd(), "..") : process.cwd();
const apiDir = resolve(root, "api");

function ensureInstall(dir) {
  const must = ["express","helmet","morgan","compression","express-rate-limit","dotenv"];
  const missing = must.filter(m => !existsSync(join(dir, "node_modules", m)));
  if (missing.length) {
    console.log("Installing dependencies in", dir, "...", missing.join(", "));
    const r = spawnSync("npm", ["install"], { cwd: dir, stdio: "inherit", env: process.env });
    if (r.status !== 0) process.exit(r.status ?? 1);
  }
}

ensureInstall(apiDir);

const entry = existsSync(join(apiDir, "server.js")) ? join(apiDir, "server.js")
            : existsSync(join(apiDir, "index.js"))  ? join(apiDir, "index.js")
            : existsSync(join(apiDir, "dist/index.js")) ? join(apiDir, "dist/index.js")
            : null;

if (!entry) { console.error("No entry found under /api (expected server.js / index.js / dist/index.js)"); process.exit(1); }
spawn("node", [entry], { cwd: apiDir, stdio: "inherit", env: process.env });