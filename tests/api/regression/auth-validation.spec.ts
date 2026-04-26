import { test, expect } from "../../fixtures/test-fixtures";
import {
  buildCalculationInput,
  buildFeeding,
  buildSnakeProfile,
} from "../../data/builders";
import {
  calculateFeeding,
  createSnakeProfile,
} from "../../services/test-data.service";

test.describe("API auth and validation regression", () => {
  test("protected resources reject missing token with 401 @regression", async ({
    calculationsClient,
    feedingsClient,
    snakeProfilesClient,
  }) => {
    const profileResponse = await snakeProfilesClient.list();
    expect(profileResponse.status()).toBe(401);

    const calculateResponse = await calculationsClient.calculate(
      buildCalculationInput("not-owned-snake-id"),
    );
    expect(calculateResponse.status()).toBe(401);

    const feedingsResponse = await feedingsClient.listBySnakeId(
      "not-owned-snake-id",
    );
    expect(feedingsResponse.status()).toBe(401);
  });

  test("profile validation returns 400 for missing fields and invalid weight @regression", async ({
    apiClient,
    cleanup,
  }) => {
    void cleanup;

    const missingResponse = await apiClient.snakeProfiles.create({});
    const missingBody = await missingResponse.json();

    expect(missingResponse.status()).toBe(400);
    expect(missingBody.details).toEqual(expect.any(Array));

    const invalidWeightResponse = await apiClient.snakeProfiles.create(
      buildSnakeProfile({ current_weight_g: 20 }),
    );
    const invalidWeightBody = await invalidWeightResponse.json();

    expect(invalidWeightResponse.status()).toBe(400);
    expect(invalidWeightBody.details).toContain("Waga jest zbyt niska");
  });

  test("calculate returns 200 for valid data and 400 for missing data @regression", async ({
    apiClient,
    cleanup,
  }) => {
    void cleanup;
    const profile = await createSnakeProfile(apiClient.snakeProfiles);

    await calculateFeeding(apiClient.calculations, profile.id);

    const invalidResponse = await apiClient.calculations.calculate({});
    const invalidBody = await invalidResponse.json();

    expect(invalidResponse.status()).toBe(400);
    expect(invalidBody.error).toEqual(expect.any(String));
  });

  test("feeding supports success and refused statuses @regression", async ({
    apiClient,
    cleanup,
  }) => {
    void cleanup;
    const profile = await createSnakeProfile(apiClient.snakeProfiles);

    const successResponse = await apiClient.feedings.create(
      buildFeeding({ snake_id: profile.id, status: "success" }),
    );
    const successBody = await successResponse.json();

    expect(successResponse.status()).toBe(201);
    expect(successBody.success).toBe(true);
    expect(successBody.feeding.status).toBe("success");

    const refusedResponse = await apiClient.feedings.create(
      buildFeeding({ snake_id: profile.id, status: "refused" }),
    );
    const refusedBody = await refusedResponse.json();

    expect(refusedResponse.status()).toBe(201);
    expect(refusedBody.success).toBe(true);
    expect(refusedBody.feeding.status).toBe("refused");
  });
});
