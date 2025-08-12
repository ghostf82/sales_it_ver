const fs = require("fs");
const path = require("path");
const readline = require("readline");

const target = path.resolve(__dirname, "../.env");
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

const ask = (q) => new Promise((resolve) => rl.question(q, (a) => resolve(a.trim())));

(async () => {
  const url = await ask("SUPABASE_URL: ");
  const key = await ask("SUPABASE_KEY (anon): ");
  fs.writeFileSync(target, `SUPABASE_URL=${url}\nSUPABASE_KEY=${key}\n`);
  console.log("✅ Wrote", target);
  rl.close();
})();
