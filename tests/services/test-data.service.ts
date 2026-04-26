import { expect } from "@playwright/test";
import {
  buildCalculationInput,
  buildFeeding,
  buildSnakeProfile,
} from "../data/builders";
import type { CalculationsClient } from "./calculations.client";
import type { FeedingsClient } from "./feedings.client";
import type { SnakeProfilesClient } from "./snake-profiles.client";

export type SnakeProfileResponse = {
  id: string;
  name: string;
  current_weight_g: number;
  life_stage: string;
  body_condition: string;
  last_successful_feeding_date: string;
};

export async function createSnakeProfile(
  snakeProfilesClient: SnakeProfilesClient,
  overrides = {},
): Promise<SnakeProfileResponse> {
  const response = await snakeProfilesClient.create(
    buildSnakeProfile(overrides),
  );
  const body = await response.json();

  expect(response.status()).toBe(201);
  expect(body.success).toBe(true);
  expect(body.data.id).toEqual(expect.any(String));

  return body.data;
}

export async function createFeeding(
  feedingsClient: FeedingsClient,
  snakeId: string,
  overrides = {},
) {
  const response = await feedingsClient.create(
    buildFeeding({
      snake_id: snakeId,
      ...overrides,
    }),
  );
  const body = await response.json();

  expect(response.status()).toBe(201);
  expect(body.success).toBe(true);

  return body.feeding;
}

export async function calculateFeeding(
  calculationsClient: CalculationsClient,
  snakeId: string,
) {
  const response = await calculationsClient.calculate(
    buildCalculationInput(snakeId),
  );
  const body = await response.json();

  expect(response.status()).toBe(200);
  expect(body.result.nextFeedingDate).toEqual(expect.any(String));

  return body;
}
