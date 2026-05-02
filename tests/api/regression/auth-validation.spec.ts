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
  test("protected resources reject missing token with 401 @regression @security", async ({
    calculationsClient,
    feedingsClient,
    snakeProfilesClient,
  }) => {
    await test.step("Verify snake profiles require authentication", async () => {
      const profileResponse = await snakeProfilesClient.list();
      expect(profileResponse.status()).toBe(401);
    });

    await test.step("Verify calculation requires authentication", async () => {
      const calculateResponse = await calculationsClient.calculate(
        buildCalculationInput("not-owned-snake-id"),
      );
      expect(calculateResponse.status()).toBe(401);
    });

    await test.step("Verify feeding history requires authentication", async () => {
      const feedingsResponse = await feedingsClient.listBySnakeId(
        "not-owned-snake-id",
      );
      expect(feedingsResponse.status()).toBe(401);
    });
  });

  test("profile validation returns 400 for missing fields and invalid weight @regression @security", async ({
    apiClient,
    cleanup,
  }) => {
    void cleanup;

    await test.step("Reject profile creation with missing required fields", async () => {
      const missingResponse = await apiClient.snakeProfiles.create({});
      const missingBody = await missingResponse.json();

      expect(missingResponse.status()).toBe(400);
      expect(missingBody.details).toEqual(expect.any(Array));
    });

    await test.step("Reject profile creation with invalid weight", async () => {
      const invalidWeightResponse = await apiClient.snakeProfiles.create(
        buildSnakeProfile({ current_weight_g: 20 }),
      );
      const invalidWeightBody = await invalidWeightResponse.json();

      expect(invalidWeightResponse.status()).toBe(400);
      expect(invalidWeightBody.details).toContain("Waga jest zbyt niska");
    });
  });

  test("calculate returns 200 for valid data and 400 for missing data @regression @security", async ({
    apiClient,
    cleanup,
  }) => {
    void cleanup;
    let profileId = "";

    await test.step("Create profile for calculation regression", async () => {
      const profile = await createSnakeProfile(apiClient.snakeProfiles);
      profileId = profile.id;
    });

    await test.step("Calculate feeding for valid profile data", async () => {
      await calculateFeeding(apiClient.calculations, profileId);
    });

    await test.step("Reject calculation with missing data", async () => {
      const invalidResponse = await apiClient.calculations.calculate({});
      const invalidBody = await invalidResponse.json();

      expect(invalidResponse.status()).toBe(400);
      expect(invalidBody.error).toEqual(expect.any(String));
    });
  });

  test("feeding supports success and refused statuses @regression", async ({
    apiClient,
    cleanup,
  }) => {
    void cleanup;
    let profileId = "";

    await test.step("Create profile for feeding status regression", async () => {
      const profile = await createSnakeProfile(apiClient.snakeProfiles);
      profileId = profile.id;
    });

    await test.step("Save successful feeding status", async () => {
      const successResponse = await apiClient.feedings.create(
        buildFeeding({ snake_id: profileId, status: "success" }),
      );
      const successBody = await successResponse.json();

      expect(successResponse.status()).toBe(201);
      expect(successBody.success).toBe(true);
      expect(successBody.feeding.status).toBe("success");
    });

    await test.step("Save refused feeding status", async () => {
      const refusedResponse = await apiClient.feedings.create(
        buildFeeding({ snake_id: profileId, status: "refused" }),
      );
      const refusedBody = await refusedResponse.json();

      expect(refusedResponse.status()).toBe(201);
      expect(refusedBody.success).toBe(true);
      expect(refusedBody.feeding.status).toBe("refused");
    });
  });
});
