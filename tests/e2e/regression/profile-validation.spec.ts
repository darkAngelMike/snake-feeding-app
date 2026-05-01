import { test, expect } from "../../fixtures/test-fixtures";
import { buildSnakeProfile } from "../../data/builders";
import { authenticatePageWithSupabase } from "../../services/auth.client";

test.describe("UI profile validation regression", () => {
  test("profile form shows only missing fields and validates weight range @regression", async ({
    authUser,
    cleanup,
    page,
  }) => {
    void cleanup;
    const profile = buildSnakeProfile();

    await test.step("Authenticate browser context and open profile form", async () => {
      await authenticatePageWithSupabase(page, authUser.session);
      await page.goto("/");
    });

    await test.step("Submitting an empty form lists all missing profile fields", async () => {
      await page.getByTestId("profile-button-save").click();
      await expect(
        page.getByText(
          "Uzupełnij imię węża, wagę węża, etap życia i kondycję węża.",
        ),
      ).toBeVisible();
    });

    await test.step("Submitting with only condition missing lists only condition", async () => {
      await page.getByTestId("profile-input-name").fill(profile.name);
      await page
        .getByTestId("profile-input-weight")
        .fill(String(profile.current_weight_g));
      await page
        .getByTestId("profile-select-life-stage")
        .selectOption(profile.life_stage);
      await page.getByTestId("profile-button-save").click();

      await expect(page.getByText("Wybierz kondycję węża.")).toBeVisible();
    });

    await test.step("Weight below 50 g is rejected", async () => {
      await page.getByTestId("profile-select-condition").selectOption("normal");
      await page.getByTestId("profile-input-weight").fill("20");
      await page.getByTestId("profile-button-save").click();

      await expect(page.getByText("Waga jest zbyt niska")).toBeVisible();
    });

    await test.step("Weight above 5000 g is rejected", async () => {
      await page.getByTestId("profile-input-weight").fill("5001");
      await page.getByTestId("profile-button-save").click();

      await expect(
        page.getByText(
          "Waga przekracza realistyczny zakres dla pytona królewskiego",
        ),
      ).toBeVisible();
    });
  });
});
