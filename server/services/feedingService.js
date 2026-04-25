function calculateFeeding(data) {
  const { feedingDate, weight, stage } = data;

  // 🔥 WALIDACJA
  if (!feedingDate || !weight) {
    throw new Error("Brak wymaganych danych: feedingDate, weight");
  }

  const date = new Date(feedingDate);

  if (isNaN(date)) {
    throw new Error("Niepoprawny format daty");
  }

  if (typeof weight !== "number" || weight <= 0) {
    throw new Error("Waga musi być dodatnią liczbą");
  }

  // 🔥 LOGIKA
  const feedingIntervalDays = 21;
  const mealPercentage = 0.09;

  const mealWeight = Math.round(weight * mealPercentage);

  const nextFeedingDate = new Date(date);
  nextFeedingDate.setDate(nextFeedingDate.getDate() + feedingIntervalDays);

  const today = new Date();
  const isOverdue = today > nextFeedingDate;

  const diffTime = nextFeedingDate - today;
  const daysLeft = Math.max(0, Math.ceil(diffTime / (1000 * 60 * 60 * 24)));

  return {
    message: "Obliczono plan karmienia",
    input: {
      feedingDate,
      weight,
      stage,
    },
    result: {
      feedingIntervalDays,
      mealWeight,
      nextFeedingDate: nextFeedingDate.toISOString().split('T')[0],
      isOverdue,
      daysLeft,
    },
  };
}

module.exports = {
  calculateFeeding,
};
