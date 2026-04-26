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

async function getBySnakeId(snakeId) {
  try {
    return await getSupabaseClient()
      .from("feedings")
      .select("*")
      .eq("snake_id", snakeId)
      .order("feeding_date", { ascending: false });
  } catch (error) {
    return { data: null, error };
  }
}

async function insertFeeding(payload) {
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
  getBySnakeId,
  getHistory,
  insertFeeding,
};
