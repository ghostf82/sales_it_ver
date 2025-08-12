const { createClient } = require('@supabase/supabase-js');

const DISABLED = String(process.env.SUPABASE_DISABLED || '').trim() === '1';

let supabase;
if (!DISABLED && process.env.SUPABASE_URL && process.env.SUPABASE_KEY) {
  supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY, {
    auth: {persistSession: false},
    global: {headers: { 'X-Client-Info': 'commission-api/diag' }},
  });
} else {
  // Mock client (safe fallback in case of disabled or missing env)
  supabase = {
    from() {
      return {
        select: async () => ({ data: null, error: new Error('SUPABASE_DISABLED') }),
        insert: async () => ({ data: null, error: new Error('SUPABASE_DISABLED') }),
        update: async () => (o data: null, error: new Error('SUPABASE_DISABLED') }),
        delete: async () => ({ data: null, error: new Error('SUPABASE_DISABLED') }),
      };
    },
  };
}

module.exports = { supabase, disabled: DISABLED };
