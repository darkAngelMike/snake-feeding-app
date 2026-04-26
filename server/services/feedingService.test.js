const assert = require("node:assert/strict");
const { calculateFeeding } = require("./feedingService");

const tests = [];

function test(name, fn) {
  tests.push({ name, fn });
}

function daysAgo(days) {
  const date = new Date();
  date.setUTCDate(date.getUTCDate() - days);
  return date.toISOString().split("T")[0];
}

function daysFromNow(days) {
  const date = new Date();
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString().split("T")[0];
}

test("calculates normal adult feeding range and interval", () => {
  const { result } = calculateFeeding({
    weight_g: 1000,
    life_stage: "adult",
    body_condition: "normal",
    last_successful_feeding_date: daysAgo(1),
  });

  assert.equal(result.mealWeightMin, 80);
  assert.equal(result.mealWeightMax, 100);
  assert.equal(result.mealWeightTarget, 90);
  assert.equal(result.feedingIntervalDays, 18);
  assert.equal(result.status, "ok");
});

test("uses lower adult range for overweight snakes", () => {
  const { result } = calculateFeeding({
    current_weight_g: 1000,
    life_stage: "adult",
    body_condition: "overweight",
    feeding_date: daysAgo(1),
  });

  assert.equal(result.mealWeightMin, 60);
  assert.equal(result.mealWeightMax, 70);
  assert.equal(result.mealWeightTarget, 60);
  assert.equal(result.feedingIntervalDays, 21);
  assert.equal(result.warnings.length > 0, true);
});

test("supports current snake profile field names", () => {
  const { input, result } = calculateFeeding({
    current_weight_g: 400,
    life_stage: "juvenile",
    last_successful_feeding_date: daysAgo(20),
  });

  assert.equal(input.lifeStage, "juvenile");
  assert.equal(result.mealWeightTarget, 50);
  assert.equal(result.feedingIntervalDays, 9);
});

test("adds warnings for repeated refusals and shedding", () => {
  const { result } = calculateFeeding({
    weight_g: 300,
    life_stage: "juvenile",
    body_condition: "normal",
    last_successful_feeding_date: daysAgo(5),
    refused_meals_count: 2,
    is_shedding: true,
  });

  assert.equal(result.status, "vet_check_recommended");
  assert.equal(result.warnings.some((warning) => warning.includes("odmowy")), true);
  assert.equal(result.warnings.some((warning) => warning.includes("Wylinka")), true);
});

test("rejects future last successful feeding date", () => {
  assert.throws(
    () =>
      calculateFeeding({
        weight_g: 500,
        life_stage: "subadult",
        body_condition: "normal",
        last_successful_feeding_date: daysFromNow(1),
      }),
    /nie może być w przyszłości/,
  );
});

test("rejects invalid life stage and body condition", () => {
  assert.throws(
    () =>
      calculateFeeding({
        weight_g: 500,
        life_stage: "teen",
        body_condition: "normal",
        last_successful_feeding_date: daysAgo(1),
      }),
    /life_stage/,
  );

  assert.throws(
    () =>
      calculateFeeding({
        weight_g: 500,
        life_stage: "juvenile",
        body_condition: "round",
        last_successful_feeding_date: daysAgo(1),
      }),
    /body_condition/,
  );
});

for (const { name, fn } of tests) {
  fn();
  console.log(`✓ ${name}`);
}

console.log(`${tests.length} feedingService tests passed`);
