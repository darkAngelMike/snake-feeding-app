const { getSupabaseClient } = require("../config/supabaseClient");

async function getBySnakeId(snakeId, client = getSupabaseClient()) {
  try {
    return await client
      .from("feedings")
      .select("*")
      .eq("snake_id", snakeId)
      .order("feeding_date", { ascending: false });
  } catch (error) {
    return { data: null, error };
  }
}

async function insertFeeding(payload, client = getSupabaseClient()) {
  try {
    return await client
      .from("feedings")
      .insert([payload])
      .select()
      .maybeSingle();
  } catch (error) {
    return { data: null, error };
  }
}

async function findById(id, client = getSupabaseClient()) {
  try {
    return await client
      .from("feedings")
      .select("*")
      .eq("id", id)
      .maybeSingle();
  } catch (error) {
    return { data: null, error };
  }
}

async function deleteFeeding(id, client = getSupabaseClient()) {
  try {
    return await client
      .from("feedings")
      .delete()
      .eq("id", id)
      .select()
      .maybeSingle();
  } catch (error) {
    return { data: null, error };
  }
}

async function updateFeeding(id, payload, client = getSupabaseClient()) {
  try {
    return await client
      .from("feedings")
      .update(payload)
      .eq("id", id)
      .select()
      .maybeSingle();
  } catch (error) {
    return { data: null, error };
  }
}

module.exports = {
  deleteFeeding,
  findById,
  getBySnakeId,
  insertFeeding,
  updateFeeding,
};
