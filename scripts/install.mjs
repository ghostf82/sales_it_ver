import { existsSync } from "fs";
import { spawnSync } from "child_process";
import { resolve } from "path";

const rootHasApi = existsSync(resolve(process.cwd(), "api", "package.json"));
const inApi = existsSync(resolve(process.cwd(), "package.json")) && process.cwd().endsWith("/api");

const targetDir = rootHasApi && !inApi ? "api" : ".";
const res = spawnSync("npm", ["install"], { cwd: targetDir, stdio: "inherit", env: process.env });
process.exit(res.status ?? 0);