const { getSupabaseClient } = require("../config/supabaseClient");

async function getHistory() {
  try {
    return await getSupabaseClient()
      .from("feedings")
      .select("*")
      .order("id", { ascending: false });
  } catch (error) {
    return { data: null, error };
  }
}

async function createFeeding(payload) {
  try {
    return await getSupabaseClient()
      .from("feedings")
      .insert([payload])
      .select()
      .maybeSingle();
  } catch (error) {
    return { data: null, error };
  }
}

module.exports = {
  createFeeding,
  getHistory,
};
