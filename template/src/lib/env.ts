import 'server-only';

export type CrafterEnvironment = 'production' | 'development';

/** `CRAFTER_ENV`: `development` targets the Crafter development APIs, anything else production. */
export function crafterEnvironment(): CrafterEnvironment {
  return process.env.CRAFTER_ENV?.trim() === 'development' ? 'development' : 'production';
}

function read(name: string): string | undefined {
  const value = process.env[name]?.trim();
  return value ? value : undefined;
}

export class MissingEnvError extends Error {
  constructor(public readonly variable: string) {
    super(`Missing environment variable ${variable}. Copy .env.example to .env.local and fill it in.`);
    this.name = 'MissingEnvError';
  }
}

export function requireEnv(name: string): string {
  const value = read(name);
  if (!value) throw new MissingEnvError(name);
  return value;
}

export function optionalEnv(name: string): string | undefined {
  return read(name);
}

/** Variables the storefront needs before it can render the catalog and start a checkout. */
export const REQUIRED_ENV = [
  'CRAFTER_STORE_ID',
  'NEXT_PUBLIC_CRAFTER_PUBLISHABLE_KEY',
  'CRAFTER_SECRET_KEY',
] as const;

export function missingEnv(): string[] {
  return REQUIRED_ENV.filter((name) => !read(name));
}
