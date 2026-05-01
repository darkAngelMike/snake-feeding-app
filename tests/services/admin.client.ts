import type { APIRequestContext } from "@playwright/test";
import { BaseApiClient } from "./base-api.client";

export class AdminClient extends BaseApiClient {
  constructor(request: APIRequestContext) {
    super(request);
  }

  cleanup(
    userEmailPrefix: string,
    adminSecret = process.env.ADMIN_CLEANUP_SECRET || "",
  ) {
    return this.post(
      "/admin/cleanup",
      { userEmailPrefix },
      {
        "x-admin-secret": adminSecret,
      },
    );
  }
}
