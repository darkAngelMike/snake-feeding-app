import { test, expect } from "../../fixtures/test-fixtures";
import { buildFeeding, buildQaUser } from "../../data/builders";
import { createSnakeProfile } from "../../services/test-data.service";

// Testy izolacji danych użytkowników oraz weryfikacja zasad Row Level Security (RLS)
test.describe("API - Izolacja danych i ochrona własności (RLS)", () => {
  test("Użytkownik B nie ma dostępu do profilu ani historii karmień węża należącego do Użytkownika A @regression @security", async ({
    apiClient,
    authUser,
    authClient,
    cleanup,
    feedingsClient,
    snakeProfilesClient,
    testRunId,
  }) => {
    void cleanup;
    let userAProfileId = "";

    await test.step("Utworzenie profilu węża przypisanego do Użytkownika A", async () => {
      const userAProfile = await createSnakeProfile(apiClient.snakeProfiles);
      userAProfileId = userAProfile.id;
    });

    const userB = await test.step("Rejestracja i zalogowanie drugiego użytkownika (Użytkownik B)", async () => {
      const user = buildQaUser(testRunId);
      const session = await authClient.createUserAndLogin(user);

      return {
        profiles: snakeProfilesClient.withToken(session.access_token),
        feedings: feedingsClient.withToken(session.access_token),
      };
    });

    await test.step("Weryfikacja odrzucenia próby odczytu profilu Użytkownika A przez Użytkownika B (status 403)", async () => {
      const profileResponse = await userB.profiles.getById(userAProfileId);
      const profileBody = await profileResponse.json();

      expect(profileResponse.status()).toBe(403);
      expect(profileBody.error).toEqual(expect.any(String));
    });

    await test.step("Weryfikacja odrzucenia próby dodania karmienia dla węża Użytkownika A przez Użytkownika B (status 403)", async () => {
      const feedingResponse = await userB.feedings.create(
        buildFeeding({ snake_id: userAProfileId }),
      );
      const feedingBody = await feedingResponse.json();

      expect(feedingResponse.status()).toBe(403);
      expect(feedingBody.error).toEqual(expect.any(String));
    });

    await test.step("Weryfikacja ignorowania próby podszycia się za pomocą nagłówków X-User-Id oraz X-Role (status 403)", async () => {
      const spoofedProfileResponse = await userB.profiles.getById(
        userAProfileId,
        {
          "X-User-Id": authUser.session.user.id,
          "X-Role": "admin",
        },
      );
      const spoofedProfileBody = await spoofedProfileResponse.json();

      expect(spoofedProfileResponse.status()).toBe(403);
      expect(spoofedProfileBody.error).toEqual(expect.any(String));
    });
  });
});
