const { createClient } = require("@supabase/supabase-js");

let supabaseClient;

function getSupabaseConfig() {
  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_ANON_KEY || process.env.SUPABASE_KEY;

  if (!supabaseUrl || !supabaseKey) {
    throw new Error(
      "Brak konfiguracji Supabase: SUPABASE_URL i SUPABASE_ANON_KEY są wymagane",
    );
  }

  return { supabaseKey, supabaseUrl };
}

function getSupabaseClient() {
  if (supabaseClient) return supabaseClient;

  const { supabaseKey, supabaseUrl } = getSupabaseConfig();
  supabaseClient = createClient(supabaseUrl, supabaseKey);
  return supabaseClient;
}

function createSupabaseClientForToken(accessToken) {
  const { supabaseKey, supabaseUrl } = getSupabaseConfig();

  return createClient(supabaseUrl, supabaseKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
    global: {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    },
  });
}

module.exports = {
  createSupabaseClientForToken,
  getSupabaseClient,
};
