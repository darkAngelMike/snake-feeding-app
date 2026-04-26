import { test, expect } from "../../fixtures/test-fixtures";
import { buildFeeding, buildQaUser } from "../../data/builders";
import { createSnakeProfile } from "../../services/test-data.service";

test.describe("API ownership and RLS regression", () => {
  test("user B cannot read user A profile or create feeding for user A snake @regression", async ({
    apiClient,
    authClient,
    cleanup,
    feedingsClient,
    snakeProfilesClient,
  }) => {
    void cleanup;
    const userAProfile = await createSnakeProfile(apiClient.snakeProfiles);

    const userB = buildQaUser();
    const userBSession = await authClient.createUserAndLogin(userB);
    const userBProfiles = snakeProfilesClient.withToken(
      userBSession.access_token,
    );
    const userBFeedings = feedingsClient.withToken(userBSession.access_token);

    const profileResponse = await userBProfiles.getById(userAProfile.id);
    const profileBody = await profileResponse.json();

    expect(profileResponse.status()).toBe(403);
    expect(profileBody.error).toEqual(expect.any(String));

    const feedingResponse = await userBFeedings.create(
      buildFeeding({ snake_id: userAProfile.id }),
    );
    const feedingBody = await feedingResponse.json();

    expect(feedingResponse.status()).toBe(403);
    expect(feedingBody.error).toEqual(expect.any(String));
  });
});
