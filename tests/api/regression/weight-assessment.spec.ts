import { test, expect } from "../../fixtures/test-fixtures";
import { buildFeeding, dateDaysAgo } from "../../data/builders";
import { createSnakeProfile } from "../../services/test-data.service";

test.describe("API weight assessment edge cases", () => {
  test("returns unknown when there is no feeding history @regression", async ({
    apiClient,
    cleanup,
  }) => {
    void cleanup;
    const profile = await createSnakeProfile(apiClient.snakeProfiles);

    const response = await apiClient.feedings.listBySnakeId(profile.id);
    const body = await response.json();

    expect(response.status()).toBe(200);
    expect(body.data).toHaveLength(0);
    expect(body.weightAssessment.status).toBe("unknown");
  });

  test("detects rapid gain after multiple consecutive feedings @regression", async ({
    apiClient,
    cleanup,
  }) => {
    void cleanup;
    const profile = await createSnakeProfile(apiClient.snakeProfiles);

    const feedings = [
      buildFeeding({
        snake_id: profile.id,
        feeding_date: dateDaysAgo(3),
        snake_weight_g: 980,
      }),
      buildFeeding({
        snake_id: profile.id,
        feeding_date: dateDaysAgo(2),
        snake_weight_g: 1000,
      }),
      buildFeeding({
        snake_id: profile.id,
        feeding_date: dateDaysAgo(1),
        snake_weight_g: 1120,
      }),
    ];

    for (const feeding of feedings) {
      const response = await apiClient.feedings.create(feeding);
      expect(response.status()).toBe(201);
    }

    const response = await apiClient.feedings.listBySnakeId(profile.id);
    const body = await response.json();

    expect(response.status()).toBe(200);
    expect(body.data.length).toBeGreaterThanOrEqual(3);
    expect(body.weightAssessment.status).toBe("rapid_gain");
    expect(body.weightAssessment.severity).toBe("warning");
  });
});
