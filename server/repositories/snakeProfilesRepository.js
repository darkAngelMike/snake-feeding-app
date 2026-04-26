const { getSupabaseClient } = require("../config/supabaseClient");

async function findByUserId(userId) {
  try {
    return await getSupabaseClient()
      .from("snake_profiles")
      .select("*")
      .eq("user_id", userId);
  } catch (error) {
    return { data: null, error };
  }
}

async function findById(id) {
  try {
    return await getSupabaseClient()
      .from("snake_profiles")
      .select("*")
      .eq("id", id)
      .maybeSingle();
  } catch (error) {
    return { data: null, error };
  }
}

async function createProfile(payload) {
  try {
    return await getSupabaseClient()
      .from("snake_profiles")
      .insert([payload])
      .select()
      .maybeSingle();
  } catch (error) {
    return { data: null, error };
  }
}

async function updateProfile(id, payload) {
  try {
    return await getSupabaseClient()
      .from("snake_profiles")
      .update(payload)
      .eq("id", id)
      .select()
      .maybeSingle();
  } catch (error) {
    return { data: null, error };
  }
}

async function updateWeight(id, weightG) {
  try {
    return await getSupabaseClient()
      .from("snake_profiles")
      .update({ current_weight_g: weightG })
      .eq("id", id)
      .select()
      .maybeSingle();
  } catch (error) {
    return { data: null, error };
  }
}

async function updateLastFeedingDate(id, feedingDate) {
  try {
    return await getSupabaseClient()
      .from("snake_profiles")
      .update({ last_successful_feeding_date: feedingDate })
      .eq("id", id)
      .select()
      .maybeSingle();
  } catch (error) {
    return { data: null, error };
  }
}

module.exports = {
  createProfile,
  findById,
  findByUserId,
  updateLastFeedingDate,
  updateProfile,
  updateWeight,
};
