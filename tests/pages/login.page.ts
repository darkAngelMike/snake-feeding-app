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
    this.usernameInput = page.getByTestId("login-input-username");
    this.passwordInput = page.getByTestId("login-input-password");
    this.loginButton = page.getByTestId("login-button-submit");
    this.registerButton = page.getByTestId("login-button-register");
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
