import type { APIRequestContext, APIResponse } from "@playwright/test";

export type JsonBody = Record<string, unknown>;

export class BaseApiClient {
  protected readonly request: APIRequestContext;
  private readonly token?: string;

  constructor(request: APIRequestContext, token?: string) {
    this.request = request;
    this.token = token;
  }

  protected headers(extraHeaders: Record<string, string> = {}) {
    return {
      "Content-Type": "application/json",
      ...extraHeaders,
      ...(this.token ? { Authorization: `Bearer ${this.token}` } : {}),
    };
  }

  protected get(path: string, extraHeaders?: Record<string, string>) {
    return this.request.get(path, {
      headers: this.headers(extraHeaders),
    });
  }

  protected post(
    path: string,
    body?: JsonBody,
    extraHeaders?: Record<string, string>,
  ): Promise<APIResponse> {
    return this.request.post(path, {
      data: body,
      headers: this.headers(extraHeaders),
    });
  }

  protected patch(path: string, body: JsonBody): Promise<APIResponse> {
    return this.request.patch(path, {
      data: body,
      headers: this.headers(),
    });
  }

  protected delete(
    path: string,
    extraHeaders?: Record<string, string>,
  ): Promise<APIResponse> {
    return this.request.delete(path, {
      headers: this.headers(extraHeaders),
    });
  }
}
