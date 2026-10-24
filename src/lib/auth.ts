import "server-only";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export async function getAuthenticatedContext() {
  const supabase = await createServerSupabaseClient();
  if (!supabase) return { supabase: null, user: null };
  const { data: { user } } = await supabase.auth.getUser();
  return { supabase, user };
}