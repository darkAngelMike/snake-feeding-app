import type { APIRequestContext } from "@playwright/test";
import { BaseApiClient } from "./base-api.client";

export class AdminClient extends BaseApiClient {
  constructor(request: APIRequestContext) {
    super(request);
  }

  cleanup(adminSecret = process.env.ADMIN_CLEANUP_SECRET || "") {
    return this.post("/admin/cleanup", undefined, {
      "x-admin-secret": adminSecret,
    });
  }
}
