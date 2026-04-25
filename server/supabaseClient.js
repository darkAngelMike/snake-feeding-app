const { createClient } = require("@supabase/supabase-js");

const supabaseUrl = "https://lassqxjnhdfhgrjpmyws.supabase.co";
const supabaseKey = "sb_publishable_Bc36imV7I1PLtguRFu2LHA_FtELcIpp";

const supabase = createClient(supabaseUrl, supabaseKey);

module.exports = supabase;