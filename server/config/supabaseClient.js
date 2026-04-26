const { createClient } = require("@supabase/supabase-js");

let supabaseClient;

function getSupabaseClient() {
  if (supabaseClient) return supabaseClient;

  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_KEY;

  if (!supabaseUrl || !supabaseKey) {
    throw new Error("Brak konfiguracji Supabase: SUPABASE_URL i SUPABASE_KEY są wymagane");
  }

  supabaseClient = createClient(supabaseUrl, supabaseKey);
  return supabaseClient;
}

module.exports = {
  getSupabaseClient,
};
