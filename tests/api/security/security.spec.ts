import * as allure from "allure-js-commons";
import { test, expect } from "../../fixtures/test-fixtures";
import { buildCalculationInput } from "../../data/builders";

// Testy bezpieczeństwa i walidacji zasad biznesowych API
test.describe("API - Testy bezpieczeństwa", () => {
  test.beforeEach(async () => {
    await allure.parentSuite("Testy API");
    await allure.suite("Security");
    await allure.subSuite("Weryfikacja Tokenów i Reguł");
    await allure.epic("Bezpieczeństwo i Walidacja API");
    await allure.feature("Testy Bezpieczeństwa API");
  });

  test("Odrzuca nieprawidłowy token JWT zwrotnym błędem JSON i statusem 401 @security", async ({
    snakeProfilesClient,
  }) => {
    await allure.story("Odrzucanie błędnych tokenów JWT");

    await test.step("Weryfikacja odrzucenia zapytania z unieważnionym lub błędnym ciągiem JWT", async () => {
      const response = await snakeProfilesClient
        .withToken("invalid.jwt.token")
        .list();
      const body = await response.json();

      expect(response.status()).toBe(401);
      expect(body.error).toEqual(expect.any(String));
    });
  });

  test("Udostępnia surowy plik JSON specyfikacji OpenAPI do pobrania dla Postmana @security", async ({
    request,
  }) => {
    await allure.story("Pobieranie surowej specyfikacji OpenAPI JSON");

    await test.step("Weryfikacja pobierania pliku snake-feeding-api.json (status 200 OK)", async () => {
      const response = await request.get("/api-docs.json");
      expect(response.status()).toBe(200);

      const disposition = response.headers()["content-disposition"] || "";
      expect(disposition).toContain('attachment; filename="snake-feeding-api.json"');

      const body = await response.json();
      expect(body.openapi).toBe("3.0.0");
      expect(body.info.title).toBe("Snake Feeding API");
    });
  });

  test("Blokuje wyliczenie karmienia z datą z przyszłości (walidacja reguły biznesowej) @security", async ({
    apiClient,
    cleanup,
    testProfile,
  }) => {
    void cleanup;
    await allure.story("Zakaz wyliczania karmień dla dat w przyszłości");

    await test.step("Weryfikacja blokady kalkulacji przy dacie ostatniego karmienia w przyszłości (status 400)", async () => {
      const response = await apiClient.calculations.calculate({
        ...buildCalculationInput(testProfile.id),
        last_successful_feeding_date: dateDaysFromNow(1),
      });
      const body = await response.json();

      expect(response.status()).toBe(400);
      expect(body.error).toContain("nie może być w przyszłości");
    });
  });

  test("Weryfikuje bezpieczne przetwarzanie powtarzalnych zapytań bez wymagania blokady limitu @security", async ({
    apiClient,
  }, testInfo) => {
    await allure.story("Obserwacja częstotliwości zapytań (Rate Limit)");

    await test.step("Wysłanie serii 5 zapytań z autoryzacją i analiza kodów odpowiedzi", async () => {
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
});

function dateDaysFromNow(days: number) {
  const date = new Date();
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString().slice(0, 10);
}
