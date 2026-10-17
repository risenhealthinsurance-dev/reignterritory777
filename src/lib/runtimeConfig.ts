import { z } from "zod";

const publicRuntimeConfigSchema = z.object({
  VITE_SUPABASE_URL: z.string().url().startsWith("https://"),
  VITE_SUPABASE_ANON_KEY: z.string().min(1),
});

export interface PublicRuntimeConfig {
  supabaseUrl: string;
  supabaseAnonKey: string;
  authBypass: boolean;
}

export function isAuthBypassEnabled(env: Record<string, unknown>): boolean {
  return env.VITE_AUTH_BYPASS === "true";
}

export function readPublicRuntimeConfig(env: Record<string, unknown>): PublicRuntimeConfig | null {
  const parsed = publicRuntimeConfigSchema.safeParse(env);
  if (!parsed.success) return null;
  return {
    supabaseUrl: parsed.data.VITE_SUPABASE_URL,
    supabaseAnonKey: parsed.data.VITE_SUPABASE_ANON_KEY,
    authBypass: isAuthBypassEnabled(env),
  };
}
