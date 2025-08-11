import { existsSync } from "fs";
import { spawn } from "child_process";

const candidates = [
  { file: "api/server.js",       cmd: ["node", "api/server.js"] },
  { file: "server.js",           cmd: ["node", "server.js"] },
  { file: "api/dist/index.js",   cmd: ["node", "api/dist/index.js"] },
  { file: "dist/index.js",       cmd: ["node", "dist/index.js"] },
  { file: "api/src/index.ts",    cmd: ["npx", "tsx", "watch", "api/src/index.ts"] },
  { file: "src/index.ts",        cmd: ["npx", "tsx", "watch", "src/index.ts"] }
];

const target = candidates.find(c => existsSync(c.file));
if (!target) {
  console.error("No entrypoint found. Looked for:", candidates.map(c => c.file).join(", "));
  process.exit(1);
}
const [cmd, ...args] = target.cmd;
const child = spawn(cmd, args, { stdio: "inherit", env: process.env });
child.on("exit", (code) => process.exit(code ?? 0));