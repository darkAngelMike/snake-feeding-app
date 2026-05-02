import type { APIRequestContext } from "@playwright/test";
import { BaseApiClient, type JsonBody } from "./base-api.client";

export class CalculationsClient extends BaseApiClient {
  constructor(request: APIRequestContext, token?: string) {
    super(request, token);
  }

  withToken(token: string) {
    return new CalculationsClient(this.request, token);
  }

  calculate(body: JsonBody, extraHeaders?: Record<string, string>) {
    return this.post("/calculate", body, extraHeaders);
  }
}
