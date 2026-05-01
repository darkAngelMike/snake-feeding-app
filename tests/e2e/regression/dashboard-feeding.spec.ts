import { test, expect } from "../../fixtures/test-fixtures";
import { buildFeeding } from "../../data/builders";
import { DashboardPage } from "../../pages/dashboard.page";
import { FeedingFormPage } from "../../pages/feeding-form.page";
import { HistoryPage } from "../../pages/history.page";
import { authenticatePageWithSupabase } from "../../services/auth.client";

test.describe("UI dashboard and feeding regression", () => {
  test("saving feeding updates UI and keeps weight status visible @regression", async ({
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

    await test.step("Verify dashboard and weight status are visible", async () => {
      await dashboardPage.expectLoaded(testProfile.name);
      await expect(page.getByTestId("dashboard-status-weight")).toBeVisible();
    });

    const feeding = await test.step("Save feeding from UI", async () => {
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

    await test.step("Verify saved feeding is visible in history", async () => {
      await feedingFormPage.openHistory();
      await historyPage.expectFeedingVisible(feeding.meal_weight_g);
    });

    await test.step("Return to dashboard and verify weight status remains visible", async () => {
      await page.getByRole("button", { name: "Przegląd" }).click();
      await expect(page.getByTestId("dashboard-status-weight")).toBeVisible();
    });
  });
});
