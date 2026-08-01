import { test } from "../../fixtures/test-fixtures";
import { buildFeeding } from "../../data/builders";
import { DashboardPage } from "../../pages/dashboard.page";
import { FeedingFormPage } from "../../pages/feeding-form.page";
import { HistoryPage } from "../../pages/history.page";
import { authenticatePageWithSupabase } from "../../services/auth.client";

// Testy E2E interfejsu użytkownika w przeglądarce (Ścieżka Krytyczna)
test.describe("UI E2E - Przeglądarkowe testy dymne (Smoke)", () => {
  test("Zalogowany opiekun może obliczyć termin, zarejestrować karmienie i zobaczyć wpis w historii @smoke", async ({
    authUser,
    page,
    testProfile,
  }) => {
    await test.step("Krok 1: Logowanie użytkownika w kontekście przeglądarki przez sesję Supabase", async () => {
      await authenticatePageWithSupabase(page, authUser.session);
      await page.goto("/");
    });

    const dashboardPage = new DashboardPage(page);
    const feedingFormPage = new FeedingFormPage(page);
    const historyPage = new HistoryPage(page);

    await test.step("Krok 2: Weryfikacja załadowania pulpitu z imieniem węża utworzonego w bazie", async () => {
      await dashboardPage.expectLoaded(testProfile.name);
    });

    await test.step("Krok 3: Wyliczenie rekomendacji żywieniowej i weryfikacja wyświetlenia sugerowanej daty", async () => {
      await dashboardPage.calculateFeeding();
      await dashboardPage.expectNextFeedingDateVisible();
      await dashboardPage.expectTimingBadgeVisible();
    });

    await test.step("Krok 4: Wypełnienie i zapisanie formularza nowego karmienia w interfejsie", async () => {
      await feedingFormPage.open();
      const feeding = buildFeeding({ snake_id: testProfile.id });

      await feedingFormPage.saveFeeding({
        feedingDate: feeding.feeding_date,
        snakeWeightG: feeding.snake_weight_g,
        mealWeightG: feeding.meal_weight_g,
      });
      await feedingFormPage.openHistory();
    });

    await test.step("Krok 5: Weryfikacja obecności nowego karmienia na osi czasu w historii", async () => {
      await historyPage.expectFeedingVisible(100);
    });
  });
});
