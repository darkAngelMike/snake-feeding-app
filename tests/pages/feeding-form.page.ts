import type { Page } from "@playwright/test";

export class FeedingFormPage {
  constructor(private readonly page: Page) {}

  async open() {
    await this.page.getByRole("button", { name: "Dodaj wpis" }).click();
  }

  async saveFeeding(data: {
    feedingDate: string;
    snakeWeightG: number;
    mealWeightG: number;
  }) {
    await this.page.getByLabel("Data karmienia").fill(data.feedingDate);
    await this.page.getByLabel("Aktualna waga węża (g)").fill(String(data.snakeWeightG));
    await this.page.getByLabel("Waga pokarmu (g)").fill(String(data.mealWeightG));
    await this.page.getByRole("button", { name: "Zapisz karmienie" }).click();
  }
}
