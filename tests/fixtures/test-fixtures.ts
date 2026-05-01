import { test as base, expect, request } from "@playwright/test";
import { buildQaEmailPrefix, buildQaUser } from "../data/builders";
import { AdminClient } from "../services/admin.client";
import {
  AuthClient,
  type AuthSession,
  type TestUser,
} from "../services/auth.client";
import { CalculationsClient } from "../services/calculations.client";
import { FeedingsClient } from "../services/feedings.client";
import { SnakeProfilesClient } from "../services/snake-profiles.client";
import {
  createSnakeProfile,
  type SnakeProfileResponse,
} from "../services/test-data.service";

type ApiClients = {
  adminClient: AdminClient;
  authClient: AuthClient;
  authUser: TestUser & { session: AuthSession };
  apiClient: {
    calculations: CalculationsClient;
    feedings: FeedingsClient;
    snakeProfiles: SnakeProfilesClient;
  };
  calculationsClient: CalculationsClient;
  cleanup: void;
  feedingsClient: FeedingsClient;
  snakeProfilesClient: SnakeProfilesClient;
  testRunId: string;
  testUserEmailPrefix: string;
  testProfile: SnakeProfileResponse;
};

const apiBaseURL = process.env.API_BASE_URL || "http://localhost:3000";

export const test = base.extend<ApiClients>({
  adminClient: async ({}, use) => {
    const context = await request.newContext({
      baseURL: apiBaseURL,
    });
    await use(new AdminClient(context));
    await context.dispose();
  },

  authClient: async ({ request }, use) => {
    await use(new AuthClient(request));
  },

  cleanup: [
    async ({ adminClient, testUserEmailPrefix }, use) => {
      const cleanupEnabled =
        process.env.NODE_ENV === "test" ||
        process.env.ALLOW_TEST_CLEANUP === "true";

      await use();

      if (process.env.ADMIN_CLEANUP_SECRET && cleanupEnabled) {
        const response = await adminClient.cleanup(testUserEmailPrefix);
        expect(response.status()).toBe(200);
      }
    },
    { auto: false },
  ],

  testRunId: async ({}, use, testInfo) => {
    const safeTitle = testInfo.titlePath.join("_");
    await use(
      `p${testInfo.project.name}_w${testInfo.workerIndex}_${safeTitle}`,
    );
  },

  testUserEmailPrefix: async ({ testRunId }, use) => {
    await use(buildQaEmailPrefix(testRunId));
  },

  authUser: async ({ authClient, cleanup, testRunId }, use) => {
    void cleanup;
    const user = buildQaUser(testRunId);
    const session = await authClient.createUserAndLogin(user);

    await use({
      ...user,
      session,
    });
  },

  calculationsClient: async ({}, use) => {
    const context = await request.newContext({
      baseURL: apiBaseURL,
    });
    await use(new CalculationsClient(context));
    await context.dispose();
  },

  feedingsClient: async ({}, use) => {
    const context = await request.newContext({
      baseURL: apiBaseURL,
    });
    await use(new FeedingsClient(context));
    await context.dispose();
  },

  snakeProfilesClient: async ({}, use) => {
    const context = await request.newContext({
      baseURL: apiBaseURL,
    });
    await use(new SnakeProfilesClient(context));
    await context.dispose();
  },

  apiClient: async (
    { authUser, calculationsClient, feedingsClient, snakeProfilesClient },
    use,
  ) => {
    const token = authUser.session.access_token;

    await use({
      calculations: calculationsClient.withToken(token),
      feedings: feedingsClient.withToken(token),
      snakeProfiles: snakeProfilesClient.withToken(token),
    });
  },

  testProfile: async ({ apiClient }, use) => {
    const profile = await createSnakeProfile(apiClient.snakeProfiles);

    await use(profile);
  },
});

export { expect };
