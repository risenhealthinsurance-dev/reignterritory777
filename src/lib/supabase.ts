import { createClient } from "@supabase/supabase-js";
import { readPublicRuntimeConfig } from "./runtimeConfig";

export const publicRuntimeConfig = readPublicRuntimeConfig(import.meta.env);

export const supabase = publicRuntimeConfig
  ? createClient(publicRuntimeConfig.supabaseUrl, publicRuntimeConfig.supabaseAnonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
      },
    })
  : null;
