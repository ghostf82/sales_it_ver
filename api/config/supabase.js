/* ===== Dotenv + Env Normalization (idempotent) ===== */
;(function supaEnv(){
  try {
    if (process.env.__SUPA_ENV_LOADED__ === "1") return;
    const path = require("path");
    try { require("dotenv").config({ path: path.resolve(__dirname, "../.env") }); } catch {}
    if (!process.env.SUPABASE_URL && !process.env.SUPABASE_PROJECT_REF) {
      try { require("dotenv").config({ path: path.resolve(__dirname, "../../.env") }); } catch {}
    }
    process.env.__SUPA_ENV_LOADED__ = "1";
  } catch {}
})();

function normalizeUrl(input) {
  if (!input) return null;
  const raw = String(input).trim().replace(/^['"]|['"]$/g, "");
  if (!/^https?:\/\//i.test(raw)) {
    // accept project ref and build full URL
    if (/^[a-z0-9-]{10,}$/i.test(raw)) return `https://${raw}.supabase.co`;
  }
  try { new URL(raw); return raw; } catch { return null; }
}
function normalizeKey(k) {
  if (!k) return null;
  const raw = String(k).trim().replace(/^['"]|['"]$/g, "");
  if (/^https?:\/\//i.test(raw)) return null; // someone pasted URL instead of key
  return raw;
}

const refOrUrl = process.env.SUPABASE_URL || process.env.SUPABASE_PROJECT_REF;
const SUPABASE_URL_N = normalizeUrl(refOrUrl);
const SUPABASE_KEY_N = normalizeKey(process.env.SUPABASE_KEY);

if (!SUPABASE_URL_N)
  throw new Error('Invalid SUPABASE_URL (expected like "https://xxxx.supabase.co") or set SUPABASE_PROJECT_REF.');
if (!SUPABASE_KEY_N)
  throw new Error("Invalid SUPABASE_KEY (use the anon public key from Supabase Settings → API; not a URL or service_role).");
/* ===== End normalization ===== */

const { createClient } = require("@supabase/supabase-js");
const supabaseUrl = SUPABASE_URL_N;
const supabaseKey = SUPABASE_KEY_N;
module.exports.supabase = createClient(supabaseUrl, supabaseKey);