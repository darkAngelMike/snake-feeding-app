import type { Page } from "@playwright/test";

export class ProfilePage {
  constructor(private readonly page: Page) {}

  async createProfile(profile: {
    name: string;
    current_weight_g: number;
    last_successful_feeding_date: string;
    life_stage: string;
    body_condition: string;
  }) {
    await this.page.getByTestId("profile-input-name").fill(profile.name);
    await this.page
      .getByTestId("profile-input-weight")
      .fill(String(profile.current_weight_g));
    await this.page
      .getByLabel("Data ostatniego udanego karmienia")
      .fill(profile.last_successful_feeding_date);
    await this.page
      .getByTestId("profile-select-life-stage")
      .selectOption(profile.life_stage);
    await this.page
      .getByTestId("profile-select-condition")
      .selectOption(profile.body_condition);
    await this.page.getByTestId("profile-button-save").click();
  }
}
