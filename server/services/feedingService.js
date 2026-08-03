const MS_PER_DAY = 1000 * 60 * 60 * 24;
const MAX_MEAL_PERCENT = 0.15;
const DUE_SOON_DAYS = 2;

const DISCLAIMER =
  "To jest planer karmienia pytona królewskiego, a nie porada weterynaryjna. Przy utracie masy, długiej odmowie jedzenia lub objawach choroby skonsultuj się z weterynarzem od zwierząt egzotycznych.";

const LIFE_STAGES = ["hatchling", "juvenile", "subadult", "adult"];
const BODY_CONDITIONS = ["underweight", "normal", "overweight"];

const MEAL_PERCENT_RANGES = {
  hatchling: { min: 0.12, max: 0.15 },
  juvenile: { min: 0.1, max: 0.15 },
  subadult: { min: 0.1, max: 0.12 },
  adult: { min: 0.08, max: 0.1 },
};

const OVERWEIGHT_ADULT_MEAL_RANGE = { min: 0.06, max: 0.08 };

const INTERVAL_RANGES = {
  hatchling: { min: 5, max: 7 },
  juvenile: { min: 7, max: 10 },
  subadult: { min: 10, max: 14 },
  adult: { min: 14, max: 21 },
};

const STAGE_WEIGHT_LIMITS = {
  hatchling: { min: 40, max: 200 },
  juvenile: { min: 80, max: 800 },
  subadult: { min: 300, max: 1600 },
  adult: { min: 500, max: 5000 },
};

function calculateFeeding(data) {
  const input = normalizeInput(data);
  validateInput(input);

  const warnings = buildWarnings(input);
  const mealRange = getMealPercentRange(input.lifeStage, input.bodyCondition);
  const intervalRange = INTERVAL_RANGES[input.lifeStage];
  const mealPercentTarget = getMealPercentTarget(mealRange, input.bodyCondition);
  let feedingIntervalDays = getFeedingInterval(intervalRange, input.bodyCondition);

  if (input.isShedding) {
    feedingIntervalDays += 5;
  }

  const mealWeightMin = Math.round(input.weightG * mealRange.min);
  const mealWeightMax = Math.round(input.weightG * mealRange.max);
  const mealWeightTarget = Math.round(input.weightG * mealPercentTarget);
  const nextFeedingDate = addDays(input.lastFeedingDate, feedingIntervalDays);
  const timing = getTiming(nextFeedingDate);
  const status = getStatus(timing.daysLeft, warnings, input.bodyCondition);

  if (mealRange.max > MAX_MEAL_PERCENT || mealPercentTarget > MAX_MEAL_PERCENT) {
    warnings.push(
      "Rekomendowana karmówka przekracza 15% masy ciała. Zweryfikuj etap życia, masę i kondycję węża.",
    );
  }

  const daysOverdue = timing.daysLeft < 0 ? Math.abs(timing.daysLeft) : 0;
  const isOverdue = daysOverdue > 0;
  const overdueNotice = isOverdue
    ? `Wymagane natychmiastowe karmienie! Optymalny termin upłynął ${formatDate(nextFeedingDate)} (${daysOverdue} dni temu).`
    : null;

  return {
    message: "Obliczono plan karmienia pytona królewskiego",
    input: {
      lastSuccessfulFeedingDate: formatDate(input.lastFeedingDate),
      weightG: input.weightG,
      lifeStage: input.lifeStage,
      bodyCondition: input.bodyCondition,
      refusedMealsCount: input.refusedMealsCount,
      isShedding: input.isShedding,
      lastMealWeightG: input.lastMealWeightG,
    },
    result: {
      mealWeightMin,
      mealWeightMax,
      mealWeightTarget,
      feedingIntervalDays,
      nextFeedingDate: formatDate(nextFeedingDate),
      status,
      warnings,
      disclaimer: DISCLAIMER,
      daysLeft: Math.max(0, timing.daysLeft),
      daysOverdue,
      isOverdue,
      overdueNotice,
    },
  };
}

function normalizeInput(data) {
  const rawWeight = data.weight_g ?? data.current_weight_g;
  const lifeStage = data.life_stage;
  const rawDate =
    data.last_successful_feeding_date ?? data.feeding_date;

  return {
    weightG: Number(rawWeight),
    lifeStage,
    bodyCondition: data.body_condition ?? data.bodyCondition ?? "normal",
    lastFeedingDate: parseDate(rawDate),
    refusedMealsCount: Number(data.refused_meals_count ?? data.refusedMealsCount ?? 0),
    isShedding: normalizeBoolean(data.is_shedding ?? data.isShedding ?? false),
    lastMealWeightG:
      data.last_meal_weight_g === undefined || data.last_meal_weight_g === null
        ? null
        : Number(data.last_meal_weight_g),
  };
}

function validateInput(input) {
  if (!Number.isFinite(input.weightG) || input.weightG <= 0) {
    throw new Error("Masa węża musi być dodatnią liczbą");
  }

  if (!LIFE_STAGES.includes(input.lifeStage)) {
    throw new Error(`life_stage musi mieć jedną z wartości: ${LIFE_STAGES.join(", ")}`);
  }

  if (!BODY_CONDITIONS.includes(input.bodyCondition)) {
    throw new Error(
      `body_condition musi mieć jedną z wartości: ${BODY_CONDITIONS.join(", ")}`,
    );
  }

  if (!input.lastFeedingDate) {
    throw new Error("Brak wymaganej daty ostatniego udanego karmienia");
  }

  if (input.lastFeedingDate > startOfTodayUtc()) {
    throw new Error("Data ostatniego udanego karmienia nie może być w przyszłości");
  }

  if (!Number.isInteger(input.refusedMealsCount) || input.refusedMealsCount < 0) {
    throw new Error("refused_meals_count musi być liczbą całkowitą większą lub równą 0");
  }

  if (
    input.lastMealWeightG !== null &&
    (!Number.isFinite(input.lastMealWeightG) || input.lastMealWeightG <= 0)
  ) {
    throw new Error("last_meal_weight_g musi być dodatnią liczbą albo null");
  }
}

function buildWarnings(input) {
  const warnings = [];
  const stageLimits = STAGE_WEIGHT_LIMITS[input.lifeStage];

  if (input.bodyCondition === "underweight") {
    warnings.push(
      "Wąż oznaczony jako niedoważony: użyto górnej części zakresu, ale nie zwiększaj agresywnie karmówki bez obserwacji i konsultacji z weterynarzem.",
    );
  }

  if (input.bodyCondition === "overweight") {
    warnings.push(
      "Wąż oznaczony jako nadwagowy: użyto dolnej części zakresu. Monitoruj masę i unikaj przekarmiania.",
    );
  }

  if (input.refusedMealsCount >= 2) {
    warnings.push(
      "Odnotowano co najmniej dwie odmowy karmienia. Sprawdź warunki utrzymania i rozważ konsultację z weterynarzem od zwierząt egzotycznych.",
    );
  }

  if (input.isShedding) {
    warnings.push("Wylinka może czasowo obniżać apetyt i wpływać na przyjęcie karmy.");
  }

  if (input.weightG < stageLimits.min || input.weightG > stageLimits.max) {
    warnings.push(
      "Wybrany etap życia wygląda skrajnie niespójnie z masą węża. Sprawdź etap i aktualną wagę.",
    );
  }

  if (input.lastMealWeightG && input.lastMealWeightG / input.weightG > MAX_MEAL_PERCENT) {
    warnings.push(
      "Ostatnia karmówka przekraczała 15% masy ciała. Dla pytona królewskiego zweryfikuj rozmiar kolejnych karmówek.",
    );
  }

  return warnings;
}

function getMealPercentRange(lifeStage, bodyCondition) {
  const baseRange =
    bodyCondition === "overweight" && lifeStage === "adult"
      ? OVERWEIGHT_ADULT_MEAL_RANGE
      : MEAL_PERCENT_RANGES[lifeStage];

  if (bodyCondition === "underweight") {
    return {
      min: midpoint(baseRange),
      max: baseRange.max,
    };
  }

  if (bodyCondition === "overweight") {
    return {
      min: baseRange.min,
      max: midpoint(baseRange),
    };
  }

  return baseRange;
}

function getMealPercentTarget(range, bodyCondition) {
  if (bodyCondition === "underweight") return range.max;
  if (bodyCondition === "overweight") return range.min;
  return midpoint(range);
}

function getFeedingInterval(range, bodyCondition) {
  if (bodyCondition === "underweight") return range.min;
  if (bodyCondition === "overweight") return range.max;
  return Math.round(midpoint(range));
}

function getStatus(daysLeft, warnings, bodyCondition) {
  if (
    bodyCondition === "underweight" ||
    warnings.some((warning) => warning.includes("weterynarzem"))
  ) {
    return "vet_check_recommended";
  }

  if (daysLeft < 0) return "overdue";
  if (daysLeft <= DUE_SOON_DAYS) return "due_soon";
  return "ok";
}

function parseDate(value) {
  if (!value) return null;

  const dateValue = String(value).split("T")[0];

  if (!/^\d{4}-\d{2}-\d{2}$/.test(dateValue)) return null;

  const date = new Date(`${dateValue}T00:00:00.000Z`);
  if (Number.isNaN(date.getTime())) return null;
  if (formatDate(date) !== dateValue) return null;

  return date;
}

function normalizeBoolean(value) {
  if (typeof value === "boolean") return value;
  if (typeof value === "string") return value.toLowerCase() === "true";
  return Boolean(value);
}

function addDays(date, days) {
  const nextDate = new Date(date);
  nextDate.setUTCDate(nextDate.getUTCDate() + days);
  return nextDate;
}

function getTiming(nextFeedingDate) {
  const today = startOfTodayUtc();
  return {
    daysLeft: Math.ceil((nextFeedingDate - today) / MS_PER_DAY),
  };
}

function startOfTodayUtc() {
  const now = new Date();
  return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
}

function formatDate(date) {
  return date.toISOString().split("T")[0];
}

function midpoint(range) {
  return (range.min + range.max) / 2;
}

module.exports = {
  calculateFeeding,
  constants: {
    BODY_CONDITIONS,
    DISCLAIMER,
    LIFE_STAGES,
  },
};
