import { createClient } from "@supabase/supabase-js";

const url = import.meta.env.VITE_SUPABASE_URL;
const key = import.meta.env.VITE_SUPABASE_ANON_KEY;
export const supabase = url && key ? createClient(url, key) : null;

// Supabase Auth uses an e-mail internally; the UI exposes the agreed team name.
export const ADMIN_EMAIL = "admin@idealab.local";
