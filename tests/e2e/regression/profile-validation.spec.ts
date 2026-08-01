import { test, expect } from "../../fixtures/test-fixtures";
import { buildSnakeProfile } from "../../data/builders";
import { authenticatePageWithSupabase } from "../../services/auth.client";

// Testy regresyjne walidacji komórek formularza profilu węża
test.describe("UI E2E - Walidacja formularza profilu węża (Regresja)", () => {
  test("Formularz profilu wskazuje tylko brakujące pola oraz weryfikuje dopuszczalny zakres wagi (50-5000 g) @regression", async ({
    authUser,
    cleanup,
    page,
  }) => {
    void cleanup;
    const profile = buildSnakeProfile();

    await test.step("Krok 1: Autentykacja użytkownika i przejście do formularza profilu", async () => {
      await authenticatePageWithSupabase(page, authUser.session);
      await page.goto("/");
    });

    await test.step("Krok 2: Próba zapisu pustego formularza wypisuje wszystkie brakujące pola profilu", async () => {
      await page.getByTestId("profile-button-save").click();
      await expect(
        page.getByText(
          "Uzupełnij imię węża, wagę węża, etap życia i kondycję węża.",
        ),
      ).toBeVisible();
    });

    await test.step("Krok 3: Wypełnienie części pól wskazuje precyzyjnie tylko brakującą kondycję", async () => {
      await page.getByTestId("profile-input-name").fill(profile.name);
      await page
        .getByTestId("profile-input-weight")
        .fill(String(profile.current_weight_g));
      await page
        .getByTestId("profile-select-life-stage")
        .selectOption(profile.life_stage);
      await page.getByTestId("profile-button-save").click();

      await expect(page.getByText("Wybierz kondycję węża.")).toBeVisible();
    });

    await test.step("Krok 4: Weryfikacja odrzucenia wagi poniżej 50 g przez komunikat błędu", async () => {
      await page.getByTestId("profile-select-condition").selectOption("normal");
      await page.getByTestId("profile-input-weight").fill("20");
      await page.getByTestId("profile-button-save").click();

      await expect(page.getByText("Waga jest zbyt niska")).toBeVisible();
    });

    await test.step("Krok 5: Weryfikacja odrzucenia wagi powyżej 5000 g przez komunikat błędu", async () => {
      await page.getByTestId("profile-input-weight").fill("5001");
      await page.getByTestId("profile-button-save").click();

      await expect(
        page.getByText(
          "Waga przekracza realistyczny zakres dla pytona królewskiego",
        ),
      ).toBeVisible();
    });
  });
});
