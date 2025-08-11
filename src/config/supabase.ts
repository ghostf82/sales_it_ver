import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_KEY;

if (!supabaseUrl || !supabaseKey) {
  throw new Error("Missing SUPABASE_URL or SUPABASE_KEY environment variables");
}

// Security check: Reject service role keys
function isServiceRoleKey(key: string): boolean {
  try {
    const payload = JSON.parse(Buffer.from(key.split(".")[1], "base64").toString("utf8"));
    return payload?.role === "service_role";
  } catch {
    return false;
  }
}

if (isServiceRoleKey(supabaseKey)) {
  throw new Error("SECURITY: Do not use SUPABASE service_role key in this runtime. Use anon/public key only.");
}

export const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    persistSession: false,
    autoRefreshToken: false
  }
});

console.log("✅ Supabase client initialized");
console.log(`📍 URL: ${supabaseUrl}`);
console.log(`🔑 Key: ${supabaseKey.slice(0, 5)}...`);