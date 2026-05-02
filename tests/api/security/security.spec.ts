import { test, expect } from "../../fixtures/test-fixtures";
import { buildCalculationInput } from "../../data/builders";

test.describe("API security checks", () => {
  test("rejects invalid JWT token with 401 JSON @security", async ({
    snakeProfilesClient,
  }) => {
    const response = await snakeProfilesClient
      .withToken("invalid.jwt.token")
      .list();
    const body = await response.json();

    expect(response.status()).toBe(401);
    expect(body.error).toEqual(expect.any(String));
  });

  test("blocks future feeding calculation date with business validation @security", async ({
    apiClient,
    cleanup,
    testProfile,
  }) => {
    void cleanup;
    const response = await apiClient.calculations.calculate({
      ...buildCalculationInput(testProfile.id),
      last_successful_feeding_date: dateDaysFromNow(1),
    });
    const body = await response.json();

    expect(response.status()).toBe(400);
    expect(body.error).toContain("nie może być w przyszłości");
  });

  test("observes repeated authenticated requests without requiring rate limiting @security", async ({
    apiClient,
  }, testInfo) => {
    const responses = [];

    for (let index = 0; index < 5; index += 1) {
      responses.push(await apiClient.snakeProfiles.list());
    }

    const statuses = responses.map((response) => response.status());
    const rateLimitObserved = statuses.includes(429);

    testInfo.annotations.push({
      type: "rate-limit-observation",
      description: `statuses=${statuses.join(",")}; observed429=${rateLimitObserved}`,
    });

    expect(statuses.every((status) => status === 200 || status === 429)).toBe(
      true,
    );
  });
});

function dateDaysFromNow(days: number) {
  const date = new Date();
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString().slice(0, 10);
}
