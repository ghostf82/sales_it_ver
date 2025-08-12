// api/config/supabase.js
const { createClient } = require('@supabase/supabase-js');

const DISABLED = String(process.env.SUPABASE_DISABLED || '').trim() === '1';

function disabledResult() {
  return { data: null, error: new Error('SUPABASE_DISABLED') };
}

class MockBuilder {
  select()   { return this; }
  insert()   { return this; }
  update()   { return this; }
  upsert()   { return this; }
  delete()   { return this; }
  order()    { return this; }
  range()    { return this; }
  eq()       { return this; }
  neq()      { return this; }
  gt()       { return this; }
  gte()      { return this; }
  lt()       { return this; }
  lte()      { return this; }
  like()     { return this; }
  ilike()    { return this; }
  contains() { return this; }
  in()       { return this; }
  limit()    { return this; }
  single()   { return this; }
  then(resolve) {
    if (typeof resolve === 'function') resolve(disabledResult());
  }
  catch(onReject) {
    if (typeof onReject === 'function') onReject(new Error('SUPABASE_DISABLED'));
    return this;
  }
}

let supabase;

if (!DISABLED && process.env.SUPABASE_URL && process.env.SUPABASE_KEY) {
  supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY, {
    auth: { persistSession: false },
    global: { headers: { 'X-Client-Info': 'commission-api/diag' } },
  });
} else {
  // Mock client لما SUPABASE_DISABLED=1 أو مفيش مفاتيح
  supabase = {
    from() { return new MockBuilder(); },
    rpc() { return Promise.resolve(disabledResult()); },
    auth: {
      getUser()    { return Promise.resolve(disabledResult()); },
      getSession() { return Promise.resolve(disabledResult()); },
    },
  };
}

module.exports = { supabase, disabled: DISABLED };
