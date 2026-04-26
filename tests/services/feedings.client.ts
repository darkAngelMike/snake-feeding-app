import type { APIRequestContext } from "@playwright/test";
import { BaseApiClient, type JsonBody } from "./base-api.client";

export class FeedingsClient extends BaseApiClient {
  constructor(request: APIRequestContext, token?: string) {
    super(request, token);
  }

  withToken(token: string) {
    return new FeedingsClient(this.request, token);
  }

  listBySnakeId(snakeId: string) {
    return this.get(`/feedings?snake_id=${encodeURIComponent(snakeId)}`);
  }

  create(body: JsonBody) {
    return this.post("/feedings", body);
  }
}
