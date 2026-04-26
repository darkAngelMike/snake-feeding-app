import type { Page } from "@playwright/test";
import { expect } from "@playwright/test";

export class DashboardPage {
  constructor(private readonly page: Page) {}

  async expectLoaded(profileName: string) {
    await expect(this.page.getByRole("heading", { name: profileName })).toBeVisible();
    await expect(this.page.getByText("Aktualny stan węża")).toBeVisible();
    await expect(this.page.getByText("Plan żywienia")).toBeVisible();
  }

  async calculateFeeding() {
    await this.page.getByTestId("dashboard-button-calculate").click();
  }

  async expectTimingBadgeVisible() {
    await expect(this.page.getByTestId("dashboard-days-left")).toBeVisible();
  }

  async expectNextFeedingDateVisible() {
    await expect(
      this.page.getByTestId("dashboard-next-feeding-date"),
    ).toBeVisible();
  }
}
