import * as allure from "allure-js-commons";
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

// Testy regresyjne autoryzacji oraz walidacji pól danych wejściowych API
test.describe("API - Walidacja i autoryzacja (Regresja)", () => {
  test.beforeEach(async () => {
    await allure.parentSuite("Testy API");
    await allure.suite("Regresja");
    await allure.subSuite("Walidacja Danych Wejściowych");
    await allure.epic("Bezpieczeństwo i Walidacja API");
    await allure.feature("Autentykacja i Formularze");
  });

  test("Chronione zasoby odrzucają żądania bez tokena autoryzacji (status 401) @regression @security", async ({
    calculationsClient,
    feedingsClient,
    snakeProfilesClient,
  }) => {
    await allure.story("Wymóg tokena Bearer dla chronionych punktów końcowych");

    await test.step("Weryfikacja wymogu autoryzacji dla listy profili węży", async () => {
      const profileResponse = await snakeProfilesClient.list();
      expect(profileResponse.status()).toBe(401);
    });

    await test.step("Weryfikacja wymogu autoryzacji dla kalkulatora karmienia", async () => {
      const calculateResponse = await calculationsClient.calculate(
        buildCalculationInput("not-owned-snake-id"),
      );
      expect(calculateResponse.status()).toBe(401);
    });

    await test.step("Weryfikacja wymogu autoryzacji dla historii karmień", async () => {
      const feedingsResponse = await feedingsClient.listBySnakeId(
        "not-owned-snake-id",
      );
      expect(feedingsResponse.status()).toBe(401);
    });
  });

  test("Formularz profilu odrzuca brakujące pola oraz nieprawidłową wagę węża (status 400) @regression @security", async ({
    apiClient,
    cleanup,
  }) => {
    void cleanup;
    await allure.story("Walidacja zakresu wagi (50-5000g) i wymaganych pól profilu");

    await test.step("Odrzucenie tworzenia profilu przy braku wymaganych pól", async () => {
      const missingResponse = await apiClient.snakeProfiles.create({});
      const missingBody = await missingResponse.json();

      expect(missingResponse.status()).toBe(400);
      expect(missingBody.details).toEqual(expect.any(Array));
    });

    await test.step("Odrzucenie tworzenia profilu przy wadze poniżej dopuszczalnego progu 50g", async () => {
      const invalidWeightResponse = await apiClient.snakeProfiles.create(
        buildSnakeProfile({ current_weight_g: 20 }),
      );
      const invalidWeightBody = await invalidWeightResponse.json();

      expect(invalidWeightResponse.status()).toBe(400);
      expect(invalidWeightBody.details).toContain("Waga jest zbyt niska");
    });
  });

  test("Kalkulator żywieniowy zwraca 200 dla poprawnych danych i 400 przy braku danych @regression @security", async ({
    apiClient,
    cleanup,
  }) => {
    void cleanup;
    let profileId = "";
    await allure.story("Obliczanie planu żywieniowego dla poprawnych i błędnych danych");

    await test.step("Utworzenie profilu bazowego do testu kalkulacji", async () => {
      const profile = await createSnakeProfile(apiClient.snakeProfiles);
      profileId = profile.id;
    });

    await test.step("Wyliczenie optymalnego posiłku dla poprawnych danych węża", async () => {
      await calculateFeeding(apiClient.calculations, profileId);
    });

    await test.step("Odrzucenie kalkulacji przy pustym korpusie żądania", async () => {
      const invalidResponse = await apiClient.calculations.calculate({});
      const invalidBody = await invalidResponse.json();

      expect(invalidResponse.status()).toBe(400);
      expect(invalidBody.error).toEqual(expect.any(String));
    });
  });

  test("Zapis karmienia obsługuje statusy zjedzonego oraz odrzuconego posiłku @regression", async ({
    apiClient,
    cleanup,
  }) => {
    void cleanup;
    let profileId = "";
    await allure.story("Obsługa statusów karmienia: zjedzone (success) oraz odmowa (refused)");

    await test.step("Utworzenie profilu węża do rejestracji karmień", async () => {
      const profile = await createSnakeProfile(apiClient.snakeProfiles);
      profileId = profile.id;
    });

    await test.step("Zapisanie udanego karmienia (status: success)", async () => {
      const successResponse = await apiClient.feedings.create(
        buildFeeding({ snake_id: profileId, status: "success" }),
      );
      const successBody = await successResponse.json();

      expect(successResponse.status()).toBe(201);
      expect(successBody.success).toBe(true);
      expect(successBody.feeding.status).toBe("success");
    });

    await test.step("Zapisanie odmowy przyjęcia pokarmu (status: refused)", async () => {
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
