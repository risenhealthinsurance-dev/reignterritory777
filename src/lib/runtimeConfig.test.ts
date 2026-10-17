import { describe, expect, it } from "vitest";
import { isAuthBypassEnabled, readPublicRuntimeConfig } from "./runtimeConfig";

describe("isAuthBypassEnabled", () => {
  it("works without Supabase credentials in local test mode", () => {
    expect(isAuthBypassEnabled({ VITE_AUTH_BYPASS: "true" })).toBe(true);
    expect(isAuthBypassEnabled({ VITE_AUTH_BYPASS: "false" })).toBe(false);
  });
});

describe("readPublicRuntimeConfig", () => {
  it("returns null when public Supabase configuration is absent", () => {
    expect(readPublicRuntimeConfig({})).toBeNull();
  });

  it("accepts only a valid Supabase URL and publishable browser key", () => {
    expect(
      readPublicRuntimeConfig({
        VITE_SUPABASE_URL: "https://territory-test.supabase.co",
        VITE_SUPABASE_ANON_KEY: "public-anon-key",
        OPENAI_API_KEY: "must-never-be-read",
      }),
    ).toEqual({
      supabaseUrl: "https://territory-test.supabase.co",
      supabaseAnonKey: "public-anon-key",
      authBypass: false,
    });
  });

  it("enables auth bypass only when the explicit test flag is true", () => {
    expect(
      readPublicRuntimeConfig({
        VITE_SUPABASE_URL: "https://territory-test.supabase.co",
        VITE_SUPABASE_ANON_KEY: "public-anon-key",
        VITE_AUTH_BYPASS: "true",
      })?.authBypass,
    ).toBe(true);
  });

  it("rejects malformed or non-https configuration", () => {
    expect(
      readPublicRuntimeConfig({
        VITE_SUPABASE_URL: "http://territory-test.supabase.co",
        VITE_SUPABASE_ANON_KEY: "public-anon-key",
      }),
    ).toBeNull();
  });
});
