// api/config/supabase.js
'use strict';

const { createClient } = require('@supabase/supabase-js');

const DISABLED = String(process.env.SUPABASE_DISABLED || '').trim() === '1';
const HAS_ENV = !!(process.env.SUPABASE_URL && process.env.SUPABASE_KEY);

let supabase;

if (!DISABLED && HAS_ENV) {
  supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY, {
    auth: { persistSession: false },
    global: { headers: { 'X-Client-Info': 'commission-api/diag' } },
  });
} else {
  // Mock عميل خفيف: أي عملية على أي جدول هترجع Error واضح
  supabase = {
    from() {
      const resp = {
        data: null,
        error: new Error(DISABLED ? 'SUPABASE_DISABLED' : 'MISSING_SUPABASE_ENV'),
      };
      return {
        select: async () => resp,
        insert: async () => resp,
        update: async () => resp,
        delete: async () => resp,
      };
    },
  };
}

module.exports = { supabase, disabled: DISABLED };
