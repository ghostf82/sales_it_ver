const path = require("path");
try {
  require("dotenv").config({ path: path.resolve(__dirname, "../.env") });
  if (!process.env.SUPABASE_URL || !process.env.SUPABASE_KEY) {
    require("dotenv").config({ path: path.resolve(__dirname, "../../.env") });
  }
} catch (_) {}

const path = require("path");
try {
  require("dotenv").config({ path: path.resolve(__dirname, "../.env") });
  if (!process.env.SUPABASE_URL || !process.env.SUPABASE_KEY) {
    require("dotenv").config({ path: path.resolve(__dirname, "../../.env") });
  }
} catch (_) {}

const { createClient } = require('@supabase/supabase-js');

const url = process.env.SUPABASE_URL;
const key = process.env.SUPABASE_KEY;
if (!url) throw new Error("SUPABASE_URL environment variable is required");
if (!key) throw new Error("SUPABASE_KEY environment variable is required");
module.exports.supabase = createClient(url, key);