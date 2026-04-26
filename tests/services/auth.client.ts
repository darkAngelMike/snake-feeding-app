import type { APIRequestContext, Page } from "@playwright/test";
import { getRequiredEnv } from "../utils/env";

export type TestUser = {
  nick: string;
  email: string;
  password: string;
};

export type AuthSession = {
  access_token: string;
  refresh_token: string;
  expires_in: number;
  expires_at?: number;
  token_type: string;
  user: {
    id: string;
    email?: string;
  };
};

export class AuthClient {
  constructor(private readonly request: APIRequestContext) {}

  async signUp(user: TestUser) {
    const response = await this.request.post(`${getSupabaseUrl()}/auth/v1/signup`, {
      data: {
        email: user.email,
        password: user.password,
      },
      headers: authHeaders(),
    });

    if (!response.ok()) {
      throw new Error(`Supabase signup failed with ${response.status()}`);
    }

    return response;
  }

  async login(user: TestUser): Promise<AuthSession> {
    const response = await this.request.post(
      `${getSupabaseUrl()}/auth/v1/token?grant_type=password`,
      {
        data: {
          email: user.email,
          password: user.password,
        },
        headers: authHeaders(),
      },
    );

    if (!response.ok()) {
      throw new Error(`Supabase login failed with ${response.status()}`);
    }

    return response.json();
  }

  async createUserAndLogin(user: TestUser): Promise<AuthSession> {
    await this.signUp(user);
    return this.login(user);
  }
}

export async function authenticatePageWithSupabase(
  page: Page,
  session: AuthSession,
) {
  const storageKey = getSupabaseStorageKey();
  const expiresAt =
    session.expires_at || Math.floor(Date.now() / 1000) + session.expires_in;

  await page.addInitScript(
    ({ key, value }) => {
      window.localStorage.setItem(key, JSON.stringify(value));
    },
    {
      key: storageKey,
      value: {
        access_token: session.access_token,
        refresh_token: session.refresh_token,
        expires_in: session.expires_in,
        expires_at: expiresAt,
        token_type: session.token_type,
        user: session.user,
      },
    },
  );
}

function authHeaders() {
  const anonKey = getRequiredEnv("SUPABASE_ANON_KEY");

  return {
    apikey: anonKey,
    Authorization: `Bearer ${anonKey}`,
    "Content-Type": "application/json",
  };
}

function getSupabaseUrl() {
  return getRequiredEnv("SUPABASE_URL").replace(/\/$/, "");
}

function getSupabaseStorageKey() {
  const host = new URL(getSupabaseUrl()).host;
  const projectRef = host.split(".")[0];

  return `sb-${projectRef}-auth-token`;
}
