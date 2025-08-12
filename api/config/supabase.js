// api/config/supabase.js
const { createClient } = require('@supabase/supabase-js');

const DISABLED = String(process.env.SUPABASE_DISABLED || '').trim() === '1';

function disabledResult() {
  return { data: null, error: new Error('SUPABASE_DISABLED') };
}

// مُنشئ كائن “شبيه بالبرومس” ويدعم السلسلة زي select().order().range()... ثم await
class MockBuilder {
  // أي ميثود من اللي تحت بيرجع this عشان السلسلة تكمّل من غير ما تقع
  select() { return this; }
  insert() { return this; }
  update() { return this; }
  upsert() { return this; }
  delete() { return this; }
  order()  { return this; }
  range()  { return this; }
  eq()     { return this; }
  neq()    { return this; }
  gt()     { return this; }
  gte()    { return this; }
  lt()     { return this; }
  lte()    { return this; }
  like()   { return this; }
  ilike()  { return this; }
  contains(){ return this; }
  in()     { return this; }
  limit()  { return this; }
  single() { return this; }

  // عشان await يشتغل على الكائن ده زي البرومس
  then(resolve/*, reject*/) {
    if (typeof resolve === 'function') resolve(disabledResult());
  }
  catch(onReject) {
    if (typeof onReject === 'function') onReject(new Error('SUPABASE_DISABLED'));
    return this;
  }
}

let supabase;

if (!DISABLED && process.env.SUPABASE_URL && process.env.SUPABASE_KEY) {
  // اتصال حقيقي (لما يكون مسموح بالخروج للإنترنت)
  supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY, {
    auth: { persistSession: false },
    global: { headers: { 'X-Client-Info': 'commission-api/diag' } },
  });
} else {
  // موك كامل يدعم السلسلة + await
  supabase = {
    from() { return new MockBuilder(); },
    rpc()  { return Promise.resolve(disabledResult()); },
    auth: {
      getUser()    { return Promise.resolve(disabledResult()); },
      getSession() { return Promise.resolve(disabledResult()); },
    },
  };
}

module.exports = { supabase, disabled: DISABLED };
