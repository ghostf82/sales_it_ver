/* ---- DOTENV SAFE PRELOAD (idempotent) ---- */
;(function loadEnvOnce(){
  try {
    if (process.env.__SUPA_ENV_LOADED__ === "1") return;
    const p = (typeof path !== "undefined") ? path : require("path");
    try { require("dotenv").config({ path: p.resolve(__dirname, "../.env") }); } catch (_) {}
    if (!process.env.SUPABASE_URL || !process.env.SUPABASE_KEY) {
      try { require("dotenv").config({ path: p.resolve(__dirname, "../../.env") }); } catch (_) {}
    }
    process.env.__SUPA_ENV_LOADED__ = "1";
  } catch (_) {}
})();
/* ---- END PRELOAD ---- */

const { createClient } = require('@supabase/supabase-js');

const url = process.env.SUPABASE_URL;
const key = process.env.SUPABASE_KEY;
if (!url) throw new Error("SUPABASE_URL environment variable is required");
if (!key) throw new Error("SUPABASE_KEY environment variable is required");
module.exports.supabase = createClient(url, key);