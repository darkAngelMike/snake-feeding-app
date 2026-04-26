import { test as base, expect, request } from "@playwright/test";
import { AdminClient } from "../services/admin.client";
import { CalculationsClient } from "../services/calculations.client";
import { FeedingsClient } from "../services/feedings.client";
import { SnakeProfilesClient } from "../services/snake-profiles.client";

type ApiClients = {
  adminClient: AdminClient;
  calculationsClient: CalculationsClient;
  feedingsClient: FeedingsClient;
  snakeProfilesClient: SnakeProfilesClient;
};

export const test = base.extend<ApiClients>({
  adminClient: async ({ playwright }, use) => {
    const context = await request.newContext({
      baseURL: process.env.API_BASE_URL || "http://localhost:3000",
    });
    await use(new AdminClient(context));
    await context.dispose();
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
});

export { expect };
