export const stageLabels = {
  hatchling: "Młody po wykluciu",
  juvenile: "Młody",
  subadult: "Podrostek",
  adult: "Dorosły",
};

export const conditionLabels = {
  underweight: "Niedowaga",
  normal: "Normalny",
  overweight: "Nadwaga",
};

export const feedingStatusLabels = {
  success: "Zjedzone",
  refused: "Odmowa",
  skipped: "Pominięte",
};

export const weightAssessmentLabels = {
  unknown: "Brak danych",
  weight_loss: "Spadek masy",
  rapid_gain: "Szybki wzrost",
  stable: "Stabilna",
  overweight_alert: "Bardzo wysoka",
  invalid: "Nieprawidłowa",
};

export const defaultWeightAssessment = {
  status: "unknown",
  severity: "neutral",
  changePercent: null,
  message: "Brak wystarczającej historii do oceny trendu masy.",
};

export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:3000";
export const MIN_SNAKE_WEIGHT_G = 50;
export const MAX_SNAKE_WEIGHT_G = 5000;
