import { test, expect } from "../fixtures/test-fixtures";

test.describe("API auth smoke", () => {
  test("protected snake profiles endpoint returns 401 JSON without token @smoke", async ({
    snakeProfilesClient,
  }) => {
    await test.step("Call protected endpoint without Authorization header", async () => {
      const response = await snakeProfilesClient.list();
      const body = await response.json();

      expect(response.status()).toBe(401);
      expect(body).toMatchObject({
        error: expect.any(String),
      });
    });
  });
});
