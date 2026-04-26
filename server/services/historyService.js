const supabase = require("../supabaseClient");

async function saveCalculation(data) {
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

  const { error } = await supabase.from("feeding_calculations").insert([
    {
      user_id,
      snake_id,
      snake_weight_g: Number(weight_g ?? current_weight_g),
      life_stage,
      body_condition,
      meal_weight_min: mealWeightMin,
      meal_weight_max: mealWeightMax,
      meal_weight_target: mealWeightTarget,
      feeding_interval_days: feedingIntervalDays,
      next_feeding_date: nextFeedingDate,
      planner_status: status,
      warnings: warnings || [],
      disclaimer,
      input_snapshot: data,
    },
  ]);

  if (error) {
    console.error(error);
    throw new Error("Błąd zapisu kalkulacji do bazy");
  }

  return { message: "Zapisano kalkulację do Supabase" };
}

async function getHistory() {
  const { data, error } = await supabase
    .from("feedings")
    .select("*")
    .order("id", { ascending: false });

  if (error) {
    console.error(error);
    throw new Error("Błąd pobierania historii");
  }

  return data;
}

module.exports = {
  saveCalculation,
  getHistory,
};
