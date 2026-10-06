import { describe, expect, it } from "vitest";
import { readPublicRuntimeConfig } from "./runtimeConfig";

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
    });
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
