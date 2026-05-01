import type { Page } from "@playwright/test";

export class FeedingFormPage {
  constructor(private readonly page: Page) {}

  async open() {
    await this.page
      .getByRole("button", { name: "Dodaj wpis", exact: true })
      .click();
  }

  async saveFeeding(data: {
    feedingDate: string;
    snakeWeightG: number;
    mealWeightG: number;
  }) {
    await this.page.getByTestId("feeding-input-date").fill(data.feedingDate);
    await this.page
      .getByTestId("feeding-input-weight")
      .fill(String(data.snakeWeightG));
    await this.page
      .getByTestId("feeding-input-meal")
      .fill(String(data.mealWeightG));
    await this.page.getByTestId("feeding-button-save").click();
  }

  async openHistory() {
    await this.page.getByTestId("feeding-button-history").click();
  }
}
