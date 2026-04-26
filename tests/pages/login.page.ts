import type { Locator, Page } from "@playwright/test";
import { expect } from "@playwright/test";

export class LoginPage {
  readonly page: Page;
  readonly usernameInput: Locator;
  readonly passwordInput: Locator;
  readonly loginButton: Locator;
  readonly registerButton: Locator;

  constructor(page: Page) {
    this.page = page;
    this.usernameInput = page.getByLabel("Nazwa użytkownika");
    this.passwordInput = page.getByLabel("Hasło");
    this.loginButton = page.getByRole("button", { name: "Zaloguj" });
    this.registerButton = page.getByRole("button", { name: "Zarejestruj" });
  }

  async goto() {
    await this.page.goto("/");
  }

  async expectLoaded() {
    await expect(this.page.getByRole("heading", { name: "SerpentTrack" })).toBeVisible();
    await expect(
      this.page.getByRole("heading", { name: "Zaloguj się lub utwórz konto" }),
    ).toBeVisible();
    await expect(this.usernameInput).toBeVisible();
    await expect(this.passwordInput).toBeVisible();
  }

  async login(nick: string, password: string) {
    await this.usernameInput.fill(nick);
    await this.passwordInput.fill(password);
    await this.loginButton.click();
  }
}
