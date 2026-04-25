const { createClient } = require("@supabase/supabase-js");

const supabaseUrl = "https://lassqxjnhdfhgrjpmyws.supabase.co";
const supabaseKey = "sb_publishable_..."; // TEN z góry (Publishable)

const supabase = createClient(supabaseUrl, supabaseKey);

module.exports = supabase;