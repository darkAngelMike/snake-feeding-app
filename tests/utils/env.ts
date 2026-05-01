export function getRequiredEnv(name: string): string {
  const value = process.env[name];

  if (!value) {
    throw new Error(
      `Missing required environment variable: ${name}. Copy .env.example to .env and provide the value for your local or test environment.`,
    );
  }

  return value;
}

export function getOptionalEnv(name: string, fallback: string): string {
  return process.env[name] || fallback;
}
