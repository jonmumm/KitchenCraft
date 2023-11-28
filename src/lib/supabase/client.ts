import { env } from "@/env.public";
import { createBrowserClient } from "@supabase/ssr";
import { Database } from "../database.types";

export const createClient = () =>
  createBrowserClient<Database>(env.SUPABASE_URL, env.SUPABASE_ANON_KEY);
