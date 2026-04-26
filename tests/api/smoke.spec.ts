import { test, expect } from "../fixtures/test-fixtures";
import { buildCalculationInput, buildFeeding } from "../data/builders";

test.describe("API smoke", () => {
  test("auth, profile, calculation, feeding and history flow @smoke", async ({
    apiClient,
    cleanup,
    snakeProfilesClient,
  }) => {
    void cleanup;

    await test.step("Protected endpoint returns 401 JSON without token", async () => {
      const response = await snakeProfilesClient.list();
      const body = await response.json();

      expect(response.status()).toBe(401);
      expect(body).toMatchObject({
        error: expect.any(String),
      });
    });

    let snakeId = "";

    await test.step("Create snake profile through backend API", async () => {
      const response = await apiClient.snakeProfiles.create({
        name: "QA Python",
        current_weight_g: 1000,
        life_stage: "adult",
        body_condition: "normal",
        last_successful_feeding_date: new Date().toISOString().slice(0, 10),
      });
      const body = await response.json();

      expect(response.status()).toBe(201);
      expect(body.success).toBe(true);
      expect(body.data.id).toEqual(expect.any(String));

      snakeId = body.data.id;
    });

    await test.step("Calculate feeding through backend API", async () => {
      const response = await apiClient.calculations.calculate(
        buildCalculationInput(snakeId),
      );
      const body = await response.json();

      expect(response.status()).toBe(200);
      expect(body.result.nextFeedingDate).toEqual(expect.any(String));
    });

    await test.step("Save feeding through backend API", async () => {
      const response = await apiClient.feedings.create(
        buildFeeding({ snake_id: snakeId }),
      );
      const body = await response.json();

      expect(response.status()).toBe(201);
      expect(body.success).toBe(true);
      expect(body.feeding.id).toBeTruthy();
    });

    await test.step("Get feedings through backend API", async () => {
      const response = await apiClient.feedings.listBySnakeId(snakeId);
      const body = await response.json();

      expect(response.status()).toBe(200);
      expect(body.success).toBe(true);
      expect(body.data.length).toBeGreaterThan(0);
      expect(body.weightAssessment).toMatchObject({
        status: expect.any(String),
        message: expect.any(String),
      });
    });
  });
});
