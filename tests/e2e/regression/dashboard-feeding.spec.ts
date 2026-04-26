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
    await authenticatePageWithSupabase(page, authUser.session);
    await page.goto("/");

    const dashboardPage = new DashboardPage(page);
    const feedingFormPage = new FeedingFormPage(page);
    const historyPage = new HistoryPage(page);

    await dashboardPage.expectLoaded(testProfile.name);
    await expect(page.getByTestId("dashboard-status-weight")).toBeVisible();

    await feedingFormPage.open();
    const feeding = buildFeeding({ snake_id: testProfile.id });

    await feedingFormPage.saveFeeding({
      feedingDate: feeding.feeding_date,
      snakeWeightG: feeding.snake_weight_g,
      mealWeightG: feeding.meal_weight_g,
    });

    await expect(page.getByText("Karmienie zapisane w historii.")).toBeVisible();

    await feedingFormPage.openHistory();
    await historyPage.expectFeedingVisible(feeding.meal_weight_g);

    await page.getByRole("button", { name: "Przegląd" }).click();
    await expect(page.getByTestId("dashboard-status-weight")).toBeVisible();
  });
});
