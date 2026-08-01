import * as allure from "allure-js-commons";
import { test, expect } from "../../fixtures/test-fixtures";
import { buildFeeding, dateDaysAgo } from "../../data/builders";
import { createSnakeProfile } from "../../services/test-data.service";

// Testy algorytmu oceny trendu masy ciała węża na podstawie historii posiłków
test.describe("API - Ocena trendu wagi węża", () => {
  test.beforeEach(async () => {
    await allure.parentSuite("Testy API");
    await allure.suite("Regresja");
    await allure.subSuite("Kondycja i Trend Wagi");
    await allure.epic("Algorytmy i Analityka");
    await allure.feature("Ocena Trendu Masy Ciała");
  });

  test("Zwraca status 'Brak danych' (unknown), gdy wąż nie posiada jeszcze historii karmień @regression", async ({
    apiClient,
    cleanup,
  }) => {
    void cleanup;
    let profileId = "";
    await allure.story("Domyślny status wagi dla nowego węża");

    await test.step("Utworzenie nowego profilu węża bez żadnych zarejestrowanych posiłków", async () => {
      const profile = await createSnakeProfile(apiClient.snakeProfiles);
      profileId = profile.id;
    });

    await test.step("Weryfikacja domyślnego statusu wagi 'unknown' przy braku wpisów w historii", async () => {
      const response = await apiClient.feedings.listBySnakeId(profileId);
      const body = await response.json();

      expect(response.status()).toBe(200);
      expect(body.data).toHaveLength(0);
      expect(body.weightAssessment.status).toBe("unknown");
    });
  });

  test("Wykrywa szybki przyrost masy ciała (rapid_gain) po serii kolejnych karmień @regression", async ({
    apiClient,
    cleanup,
  }) => {
    void cleanup;
    let profileId = "";
    await allure.story("Algorytm ostrzegania o nagłym przyroście wagi (rapid_gain)");

    await test.step("Utworzenie profilu węża do symulacji przyrostu masy", async () => {
      const profile = await createSnakeProfile(apiClient.snakeProfiles);
      profileId = profile.id;
    });

    await test.step("Rejestracja kolejnych karmień z rosnącą wagą węża (980g -> 1000g -> 1120g)", async () => {
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

    await test.step("Weryfikacja wygenerowania ostrzeżenia o szybkim przyroście masy (status: rapid_gain, severity: warning)", async () => {
      const response = await apiClient.feedings.listBySnakeId(profileId);
      const body = await response.json();

      expect(response.status()).toBe(200);
      expect(body.data.length).toBeGreaterThanOrEqual(3);
      expect(body.weightAssessment.status).toBe("rapid_gain");
      expect(body.weightAssessment.severity).toBe("warning");
    });
  });
});
