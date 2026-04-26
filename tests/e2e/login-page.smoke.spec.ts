import { test } from "../fixtures/test-fixtures";
import { LoginPage } from "../pages/login.page";

test.describe("Login page smoke", () => {
  test("login page loads with primary auth controls @smoke", async ({ page }) => {
    const loginPage = new LoginPage(page);

    await test.step("Open login page", async () => {
      await loginPage.goto();
    });

    await test.step("Verify auth form is visible", async () => {
      await loginPage.expectLoaded();
    });
  });
});
