import { test, expect } from "../../fixtures/test-fixtures";
import { buildFeeding, buildQaUser } from "../../data/builders";
import { createSnakeProfile } from "../../services/test-data.service";

test.describe("API ownership and RLS regression", () => {
  test("user B cannot read user A profile or create feeding for user A snake @regression @security", async ({
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

    await test.step("Create profile owned by user A", async () => {
      const userAProfile = await createSnakeProfile(apiClient.snakeProfiles);
      userAProfileId = userAProfile.id;
    });

    const userB = await test.step("Create and authenticate user B", async () => {
      const user = buildQaUser(testRunId);
      const session = await authClient.createUserAndLogin(user);

      return {
        profiles: snakeProfilesClient.withToken(session.access_token),
        feedings: feedingsClient.withToken(session.access_token),
      };
    });

    await test.step("Verify user B cannot read user A profile", async () => {
      const profileResponse = await userB.profiles.getById(userAProfileId);
      const profileBody = await profileResponse.json();

      expect(profileResponse.status()).toBe(403);
      expect(profileBody.error).toEqual(expect.any(String));
    });

    await test.step("Verify user B cannot create feeding for user A snake", async () => {
      const feedingResponse = await userB.feedings.create(
        buildFeeding({ snake_id: userAProfileId }),
      );
      const feedingBody = await feedingResponse.json();

      expect(feedingResponse.status()).toBe(403);
      expect(feedingBody.error).toEqual(expect.any(String));
    });

    await test.step("Verify spoofed user and role headers are ignored", async () => {
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
