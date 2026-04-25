import { createClient } from "@supabase/supabase-js";

const supabaseUrl = "https://lassqxjnhdfhgrjpmyws.supabase.co";
const supabaseKey = "sb_publishable_Bc36imV7I1PLtguRFu2LHA_FtELcIpp";

export const supabase = createClient(supabaseUrl, supabaseKey);