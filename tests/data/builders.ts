type ProfileOverrides = Partial<{
  name: string;
  current_weight_g: number;
  life_stage: "hatchling" | "juvenile" | "subadult" | "adult";
  body_condition: "underweight" | "normal" | "overweight";
  last_successful_feeding_date: string;
}>;

type FeedingOverrides = Partial<{
  snake_id: string;
  feeding_date: string;
  snake_weight_g: number;
  meal_weight_g: number;
  status: "success" | "refused" | "skipped";
}>;

export function buildQaUser() {
  const unique = `${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;

  return {
    nick: `qa_${unique}`,
    email: `qa_${unique}@snake.local`,
    password: `Qa-${unique}-Password!`,
  };
}

export function buildSnakeProfile(overrides: ProfileOverrides = {}) {
  return {
    name: "QA Python",
    current_weight_g: 1000,
    life_stage: "adult",
    body_condition: "normal",
    last_successful_feeding_date: dateDaysAgo(21),
    ...overrides,
  };
}

export function buildFeeding(overrides: FeedingOverrides = {}) {
  return {
    snake_id: "replace-with-profile-id",
    feeding_date: dateDaysAgo(0),
    snake_weight_g: 1000,
    meal_weight_g: 100,
    status: "success",
    ...overrides,
  };
}

export function buildCalculationInput(profileId: string) {
  return {
    snake_id: profileId,
    last_successful_feeding_date: dateDaysAgo(21),
    weight_g: 1000,
    life_stage: "adult",
    body_condition: "normal",
    refused_meals_count: 0,
    is_shedding: false,
    last_meal_weight_g: 100,
  };
}

export function dateDaysAgo(days: number) {
  const date = new Date();
  date.setUTCDate(date.getUTCDate() - days);
  return date.toISOString().slice(0, 10);
}
