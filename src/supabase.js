import { createClient } from "@supabase/supabase-js";

const url = import.meta.env.VITE_SUPABASE_URL;
const key = import.meta.env.VITE_SUPABASE_ANON_KEY;
export const supabase = url && key ? createClient(url, key) : null;

export function loginOptions() {
  return {
    shouldCreateUser: false,
    emailRedirectTo: `${window.location.origin}${window.location.pathname}`,
  };
}
