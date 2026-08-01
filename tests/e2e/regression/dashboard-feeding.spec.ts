import { test, expect } from "../../fixtures/test-fixtures";
import { buildFeeding } from "../../data/builders";
import { DashboardPage } from "../../pages/dashboard.page";
import { FeedingFormPage } from "../../pages/feeding-form.page";
import { HistoryPage } from "../../pages/history.page";
import { authenticatePageWithSupabase } from "../../services/auth.client";

// Testy regresyjne zachowania interfejsu pulpitu oraz formularza karmień
test.describe("UI E2E - Pulpit i rejestracja karmienia (Regresja)", () => {
  test("Zapisanie karmienia aktualizuje interfejs i utrzymuje widoczny status wagi @regression", async ({
    authUser,
    page,
    testProfile,
  }) => {
    await test.step("Krok 1: Autentykacja w przeglądarce i otwarcie pulpitu", async () => {
      await authenticatePageWithSupabase(page, authUser.session);
      await page.goto("/");
    });

    const dashboardPage = new DashboardPage(page);
    const feedingFormPage = new FeedingFormPage(page);
    const historyPage = new HistoryPage(page);

    await test.step("Krok 2: Weryfikacja widoczności profilu oraz karty statusu masy ciała na pulpicie", async () => {
      await dashboardPage.expectLoaded(testProfile.name);
      await expect(page.getByTestId("dashboard-status-weight")).toBeVisible();
    });

    const feeding = await test.step("Krok 3: Rejestracja nowego karmienia z poziomu formularza UI", async () => {
      await feedingFormPage.open();
      const feedingData = buildFeeding({ snake_id: testProfile.id });

      await feedingFormPage.saveFeeding({
        feedingDate: feedingData.feeding_date,
        snakeWeightG: feedingData.snake_weight_g,
        mealWeightG: feedingData.meal_weight_g,
      });

      await expect(
        page.getByText("Karmienie zapisane w historii."),
      ).toBeVisible();

      return feedingData;
    });

    await test.step("Krok 4: Przejście do historii i weryfikacja widoczności zapisanego posiłku", async () => {
      await feedingFormPage.openHistory();
      await historyPage.expectFeedingVisible(feeding.meal_weight_g);
    });

    await test.step("Krok 5: Powrót na pulpit i upewnienie się, że status wagi pozostał poprawnie odświeżony", async () => {
      await page.getByRole("button", { name: "Przegląd" }).click();
      await expect(page.getByTestId("dashboard-status-weight")).toBeVisible();
    });
  });
});
