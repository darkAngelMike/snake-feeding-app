import { test, expect } from "../../fixtures/test-fixtures";
import { buildFeeding, dateDaysAgo } from "../../data/builders";
import { createSnakeProfile } from "../../services/test-data.service";

test.describe("API weight assessment edge cases", () => {
  test("returns unknown when there is no feeding history @regression", async ({
    apiClient,
    cleanup,
  }) => {
    void cleanup;
    let profileId = "";

    await test.step("Create profile without feeding history", async () => {
      const profile = await createSnakeProfile(apiClient.snakeProfiles);
      profileId = profile.id;
    });

    await test.step("Verify weight assessment is unknown without history", async () => {
      const response = await apiClient.feedings.listBySnakeId(profileId);
      const body = await response.json();

      expect(response.status()).toBe(200);
      expect(body.data).toHaveLength(0);
      expect(body.weightAssessment.status).toBe("unknown");
    });
  });

  test("detects rapid gain after multiple consecutive feedings @regression", async ({
    apiClient,
    cleanup,
  }) => {
    void cleanup;
    let profileId = "";

    await test.step("Create profile for weight trend history", async () => {
      const profile = await createSnakeProfile(apiClient.snakeProfiles);
      profileId = profile.id;
    });

    await test.step("Save consecutive feedings with rapid weight gain", async () => {
      const feedings = [
        buildFeeding({
          snake_id: profileId,
          feeding_date: dateDaysAgo(3),
          snake_weight_g: 980,
        }),
        buildFeeding({
          snake_id: profileId,
          feeding_date: dateDaysAgo(2),
          snake_weight_g: 1000,
        }),
        buildFeeding({
          snake_id: profileId,
          feeding_date: dateDaysAgo(1),
          snake_weight_g: 1120,
        }),
      ];

      for (const feeding of feedings) {
        const response = await apiClient.feedings.create(feeding);
        expect(response.status()).toBe(201);
      }
    });

    await test.step("Verify rapid gain weight assessment", async () => {
      const response = await apiClient.feedings.listBySnakeId(profileId);
      const body = await response.json();

      expect(response.status()).toBe(200);
      expect(body.data.length).toBeGreaterThanOrEqual(3);
      expect(body.weightAssessment.status).toBe("rapid_gain");
      expect(body.weightAssessment.severity).toBe("warning");
    });
  });
});
