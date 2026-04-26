import { test } from "../fixtures/test-fixtures";
import { buildFeeding } from "../data/builders";
import { DashboardPage } from "../pages/dashboard.page";
import { FeedingFormPage } from "../pages/feeding-form.page";
import { HistoryPage } from "../pages/history.page";
import { authenticatePageWithSupabase } from "../services/auth.client";

test.describe("UI E2E smoke", () => {
  test("authenticated user can calculate, save feeding and see history @smoke", async ({
    authUser,
    page,
    testProfile,
  }) => {
    await test.step("Authenticate browser context through Supabase session", async () => {
      await authenticatePageWithSupabase(page, authUser.session);
      await page.goto("/");
    });

    const dashboardPage = new DashboardPage(page);
    const feedingFormPage = new FeedingFormPage(page);
    const historyPage = new HistoryPage(page);

    await test.step("Verify dashboard loaded for API-created profile", async () => {
      await dashboardPage.expectLoaded(testProfile.name);
    });

    await test.step("Calculate feeding and verify result", async () => {
      await dashboardPage.calculateFeeding();
      await dashboardPage.expectNextFeedingDateVisible();
      await dashboardPage.expectTimingBadgeVisible();
    });

    await test.step("Save feeding from UI", async () => {
      await feedingFormPage.open();
      const feeding = buildFeeding({ snake_id: testProfile.id });

      await feedingFormPage.saveFeeding({
        feedingDate: feeding.feeding_date,
        snakeWeightG: feeding.snake_weight_g,
        mealWeightG: feeding.meal_weight_g,
      });
      await feedingFormPage.openHistory();
    });

    await test.step("Verify saved feeding is visible in history", async () => {
      await historyPage.expectFeedingVisible(100);
    });
  });
});
