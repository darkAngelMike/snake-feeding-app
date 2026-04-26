import type { Page } from "@playwright/test";
import { expect } from "@playwright/test";

export class HistoryPage {
  constructor(private readonly page: Page) {}

  async open() {
    await this.page.getByRole("button", { name: "Przegląd" }).click();
    await this.page.getByRole("button", { name: "Historia karmień" }).click();
  }

  async expectFeedingVisible(mealWeightG: number) {
    await expect(this.page.getByText(`${mealWeightG} g pokarmu`)).toBeVisible();
  }
}
