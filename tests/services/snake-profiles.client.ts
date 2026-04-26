import type { APIRequestContext } from "@playwright/test";
import { BaseApiClient, type JsonBody } from "./base-api.client";

export class SnakeProfilesClient extends BaseApiClient {
  constructor(request: APIRequestContext, token?: string) {
    super(request, token);
  }

  withToken(token: string) {
    return new SnakeProfilesClient(this.request, token);
  }

  list() {
    return this.get("/snake-profiles");
  }

  getById(id: string) {
    return this.get(`/snake-profiles/${id}`);
  }

  create(body: JsonBody) {
    return this.post("/snake-profiles", body);
  }

  update(id: string, body: JsonBody) {
    return this.patch(`/snake-profiles/${id}`, body);
  }
}
