// api/config/supabase.js
'use strict';
const { createClient } = require('@supabase/supabase-js');

const DISABLED = String(process.env.SUPABASE_DISABLED || '').trim() === '1';

function makeMock() {
  const resp = { data: null, error: new Error('SUPABASE_DISABLED') };
  const q = {
    select: async () => resp,
    insert: async () => resp,
    update: async () => resp,
    delete: async () => resp,
    // عشان السلاسل زي .eq() ما تكسرش
    eq: function () { return this; },
    match: function () { return this; },
    single: async () => resp,
  };
  return {
    from: () => q,
    auth: { getUser: async () => resp },
  };
}

let supabase;

if (
  !DISABLED &&
  (
    (process.env.SUPABASE_URL && process.env.SUPABASE_KEY) ||
    (process.env.SUPABASE_PROJECT_REF && process.env.SUPABASE_KEY)
  )
) {
  const url =
    process.env.SUPABASE_URL ||
    `https://${process.env.SUPABASE_PROJECT_REF}.supabase.co`;

  supabase = createClient(url, process.env.SUPABASE_KEY, {
    auth: { persistSession: false },
    global: { headers: { 'X-Client-Info': 'commission-api/diag' } },
  });
} else {
  supabase = makeMock();
}

module.exports = { supabase, disabled: DISABLED };
