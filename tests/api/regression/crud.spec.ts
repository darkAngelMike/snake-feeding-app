import * as allure from "allure-js-commons";
import { test, expect } from "../../fixtures/test-fixtures";
import { buildFeeding, buildSnakeProfile } from "../../data/builders";

// Testy regresyjne pełnego cyklu CRUD (DELETE i PATCH profili oraz karmień)
test.describe("API - Pełny cykl CRUD i bezpieczeństwo operacji edycji i usuwania", () => {
  test.beforeEach(async () => {
    await allure.parentSuite("Testy API");
    await allure.suite("Regresja");
    await allure.subSuite("Operacje Usunięcia i Edycji");
    await allure.epic("Zarządzanie Danymi Hodowli");
    await allure.feature("Pełny Cykl CRUD API");
    await allure.story("Edycja i usuwanie profili oraz wpisów karmienia");
  });

  test("Użytkownik może zaktualizować i usunąć własny profil węża oraz wpis karmienia @regression", async ({
    apiClient,
    cleanup,
  }) => {
    void cleanup;
    let snakeId = "";
    let feedingId = "";

    await test.step("Krok 1: Utworzenie nowego profilu węża", async () => {
      const response = await apiClient.snakeProfiles.create({
        ...buildSnakeProfile({ name: "Python CRUD" }),
      });
      const body = await response.json();
      expect(response.status()).toBe(201);
      snakeId = body.data.id;
    });

    await test.step("Krok 2: Zaktualizowanie profilu węża (PATCH /snake-profiles/:id)", async () => {
      const response = await apiClient.snakeProfiles.update(snakeId, {
        name: "Python Zaktualizowany",
        current_weight_g: 1250,
      });
      const body = await response.json();
      expect(response.status()).toBe(200);
      expect(body.data.name).toBe("Python Zaktualizowany");
      expect(body.data.current_weight_g).toBe(1250);
    });

    await test.step("Krok 3: Dodanie wpisu karmienia dla węża", async () => {
      const response = await apiClient.feedings.create(
        buildFeeding({ snake_id: snakeId, meal_weight_g: 100 }),
      );
      const body = await response.json();
      expect(response.status()).toBe(201);
      feedingId = String(body.feeding.id);
    });

    await test.step("Krok 4: Usunięcie wpisu karmienia przez API (DELETE /feedings/:id)", async () => {
      const response = await apiClient.feedings.delete(feedingId);
      const body = await response.json();
      expect(response.status()).toBe(200);
      expect(body.success).toBe(true);
    });

    await test.step("Krok 5: Usunięcie profilu węża przez API (DELETE /snake-profiles/:id)", async () => {
      const response = await apiClient.snakeProfiles.delete(snakeId);
      const body = await response.json();
      expect(response.status()).toBe(200);
      expect(body.success).toBe(true);
    });
  });
});
