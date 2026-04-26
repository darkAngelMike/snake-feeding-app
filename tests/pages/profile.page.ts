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
    await this.page.getByLabel("Imię węża").fill(profile.name);
    await this.page.getByLabel("Waga węża (g)").fill(String(profile.current_weight_g));
    await this.page
      .getByLabel("Data ostatniego udanego karmienia")
      .fill(profile.last_successful_feeding_date);
    await this.page.getByLabel("Etap życia").selectOption(profile.life_stage);
    await this.page.getByLabel("Kondycja").selectOption(profile.body_condition);
    await this.page.getByRole("button", { name: "Zapisz profil" }).click();
  }
}
