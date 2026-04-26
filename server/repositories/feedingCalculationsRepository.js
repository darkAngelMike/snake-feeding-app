const { getSupabaseClient } = require("../config/supabaseClient");

async function createCalculation(data, client = getSupabaseClient()) {
  const {
    user_id,
    snake_id,
    weight_g,
    current_weight_g,
    life_stage,
    body_condition,
    mealWeightMin,
    mealWeightMax,
    mealWeightTarget,
    feedingIntervalDays,
    nextFeedingDate,
    status,
    warnings,
    disclaimer,
  } = data;

  const payload = {
    user_id,
    snake_id,
    snake_weight_g: Number(weight_g ?? current_weight_g),
    life_stage,
    body_condition,
    meal_weight_min_g: mealWeightMin,
    meal_weight_max_g: mealWeightMax,
    meal_weight_target_g: mealWeightTarget,
    feeding_interval_days: feedingIntervalDays,
    next_feeding_date: nextFeedingDate,
    planner_status: status,
    warnings: warnings || [],
    disclaimer,
    input_snapshot: data,
  };

  try {
    return await client
      .from("feeding_calculations")
      .insert([payload])
      .select()
      .maybeSingle();
  } catch (error) {
    return { data: null, error };
  }
}

module.exports = {
  createCalculation,
};
