import { existsSync } from "fs";
import { spawn } from "child_process";
import { join } from "path";
const root = process.cwd().endsWith("/api") ? join(process.cwd(), "..") : process.cwd();
const api = join(root, "api");
const entry =
  existsSync(join(api, "server.js")) ? join(api, "server.js") :
  existsSync(join(api, "index.js"))  ? join(api, "index.js")  :
  existsSync(join(api, "dist/index.js")) ? join(api, "dist/index.js") : null;
if (!entry) { console.error("No API entry under /api"); process.exit(1); }
spawn("node", [entry], { cwd: api, stdio: "inherit", env: process.env });