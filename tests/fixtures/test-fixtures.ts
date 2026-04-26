import { test as base, expect, request } from "@playwright/test";
import { buildQaUser } from "../data/builders";
import { AdminClient } from "../services/admin.client";
import { AuthClient, type AuthSession, type TestUser } from "../services/auth.client";
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
  testProfile: SnakeProfileResponse;
};

export const test = base.extend<ApiClients>({
  adminClient: async ({ playwright }, use) => {
    const context = await request.newContext({
      baseURL: process.env.API_BASE_URL || "http://localhost:3000",
    });
    await use(new AdminClient(context));
    await context.dispose();
  },

  authClient: async ({ request }, use) => {
    await use(new AuthClient(request));
  },

  cleanup: [
    async ({ adminClient }, use) => {
      if (process.env.ADMIN_CLEANUP_SECRET) {
        await adminClient.cleanup();
      }

      await use();

      if (process.env.ADMIN_CLEANUP_SECRET) {
        await adminClient.cleanup();
      }
    },
    { auto: false },
  ],

  authUser: async ({ authClient, cleanup }, use) => {
    void cleanup;
    const user = buildQaUser();
    const session = await authClient.createUserAndLogin(user);

    await use({
      ...user,
      session,
    });
  },

  calculationsClient: async ({ request }, use) => {
    await use(new CalculationsClient(request));
  },

  feedingsClient: async ({ request }, use) => {
    await use(new FeedingsClient(request));
  },

  snakeProfilesClient: async ({ request }, use) => {
    await use(new SnakeProfilesClient(request));
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
