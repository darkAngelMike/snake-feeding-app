import type { APIRequestContext } from "@playwright/test";
import { BaseApiClient, type JsonBody } from "./base-api.client";

export class SnakeProfilesClient extends BaseApiClient {
  constructor(request: APIRequestContext, token?: string) {
    super(request, token);
  }

  withToken(token: string) {
    return new SnakeProfilesClient(this.request, token);
  }

  list(extraHeaders?: Record<string, string>) {
    return this.get("/snake-profiles", extraHeaders);
  }

  getById(id: string, extraHeaders?: Record<string, string>) {
    return this.get(`/snake-profiles/${id}`, extraHeaders);
  }

  create(body: JsonBody, extraHeaders?: Record<string, string>) {
    return this.post("/snake-profiles", body, extraHeaders);
  }

  update(id: string, body: JsonBody) {
    return this.patch(`/snake-profiles/${id}`, body);
  }
}
