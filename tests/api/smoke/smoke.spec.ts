import { test, expect } from "../../fixtures/test-fixtures";
import {
  buildCalculationInput,
  buildFeeding,
  buildSnakeProfile,
} from "../../data/builders";

// Paczka testów dymnych (Smoke) weryfikujących podstawowy przepływ API
test.describe("API - Testy dymne (Smoke)", () => {
  test("Ścieżka krytyczna: autentykacja, tworzenie profilu węża, kalkulacja karmienia, zapis posiłku oraz pobranie historii @smoke", async ({
    apiClient,
    cleanup,
    snakeProfilesClient,
  }) => {
    void cleanup;

    await test.step("Krok 1: Weryfikacja odrzucenia zapytania bez tokena autoryzacji (odpowiedź 401 JSON)", async () => {
      // Próba pobrania listy profili bez nagłówka Bearer token
      const response = await snakeProfilesClient.list();
      const body = await response.json();

      expect(response.status()).toBe(401);
      expect(body).toMatchObject({
        error: expect.any(String),
      });
    });

    let snakeId = "";

    await test.step("Krok 2: Utworzenie nowego profilu węża przez API", async () => {
      // Wysłanie żądania utworzenia bazowego profilu pytona królewskiego
      const response = await apiClient.snakeProfiles.create({
        ...buildSnakeProfile(),
      });
      const body = await response.json();

      expect(response.status()).toBe(201);
      expect(body.success).toBe(true);
      expect(body.data.id).toEqual(expect.any(String));

      snakeId = body.data.id;
    });

    await test.step("Krok 3: Wyliczenie rekomendacji kolejnego karmienia", async () => {
      // Przekazanie identyfikatora węża oraz parametrów do kalkulatora żywieniowego
      const response = await apiClient.calculations.calculate(
        buildCalculationInput(snakeId),
      );
      const body = await response.json();

      expect(response.status()).toBe(200);
      expect(body.result.nextFeedingDate).toEqual(expect.any(String));
    });

    await test.step("Krok 4: Zarejestrowanie udanego posiłku w dzienniku karmienia", async () => {
      // Zapisanie wpisu o podanym pokarmie i wadze węża
      const response = await apiClient.feedings.create(
        buildFeeding({ snake_id: snakeId }),
      );
      const body = await response.json();

      expect(response.status()).toBe(201);
      expect(body.success).toBe(true);
      expect(body.feeding.id).toBeTruthy();
    });

    await test.step("Krok 5: Pobranie historii karmienia i automatycznej oceny trendu masy ciała", async () => {
      // Pobranie listy wpisów karmienia dla węża oraz weryfikacja kalkulacji trendu wagi
      const response = await apiClient.feedings.listBySnakeId(snakeId);
      const body = await response.json();

      expect(response.status()).toBe(200);
      expect(body.success).toBe(true);
      expect(body.data.length).toBeGreaterThan(0);
      expect(body.weightAssessment).toMatchObject({
        status: expect.any(String),
        message: expect.any(String),
      });
    });
  });
});
