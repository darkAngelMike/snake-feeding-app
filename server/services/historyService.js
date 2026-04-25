const supabase = require("../supabaseClient");

async function saveFeeding(data) {
  const {
    feedingDate,
    weight,
    stage,
    mealWeight,
    nextFeedingDate,
    isOverdue,
    daysLeft,
  } = data;

  const { error } = await supabase.from("feedings").insert([
    {
      feedingDate,
      weight,
      stage,
      mealWeight,
      nextFeedingDate,
      isOverdue,
      daysLeft,
      savedAt: new Date().toISOString(),
    },
  ]);

  if (error) {
    console.error(error);
    throw new Error("Błąd zapisu do bazy");
  }

  return { message: "Zapisano do Supabase" };
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
  saveFeeding,
  getHistory,
};
