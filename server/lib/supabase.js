const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  // Do not throw during require so the server can start in environments
  // where Supabase isn't configured. Export a safe stub that throws
  // informative errors when used.
  console.warn('Warning: SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY not set. Supabase client disabled.');

  const makeThrow = (name) => () => {
    throw new Error(`Supabase is not configured (missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY). Tried to call ${name}`);
  };

  const stub = {
    storage: {
      from: () => ({
        upload: async () => { throw new Error('Supabase storage not configured'); },
        getPublicUrl: () => ({ publicUrl: null })
      })
    },
    from: () => ({ select: async () => { throw new Error('Supabase client not configured'); } }),
    rpc: async () => { throw new Error('Supabase client not configured'); },
    auth: {
      // placeholder
      persistSession: false
    }
  };

  module.exports = stub;
} else {
  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
    auth: { persistSession: false }
  });

  module.exports = supabase;
}
