"use server";

import { redirect } from "next/navigation";
import type { AuthFormState } from "@/app/auth/types";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export async function signIn(_previousState: AuthFormState, formData: FormData): Promise<AuthFormState> {
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const password = String(formData.get("password") ?? "");
  const requestedPath = String(formData.get("next") ?? "");
  if (!email || !password || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return { error: "Enter a valid email and password." };

  const supabase = await createServerSupabaseClient();
  if (!supabase) return { error: "Sign-in is unavailable until the Supabase environment is configured." };
  const { error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) return { error: "We could not sign you in with those details. Check them and try again." };
  redirect(requestedPath.startsWith("/") && !requestedPath.startsWith("//") ? requestedPath : "/dashboard");
}

export async function signUp(_previousState: AuthFormState, formData: FormData): Promise<AuthFormState> {
  const displayName = String(formData.get("displayName") ?? "").trim();
  const username = String(formData.get("username") ?? "").trim().toLowerCase();
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const password = String(formData.get("password") ?? "");
  if (displayName.length < 2 || displayName.length > 80) return { error: "Your name must be between 2 and 80 characters." };
  if (!/^[a-z0-9_]{3,30}$/.test(username)) return { error: "Choose a username with 3–30 lowercase letters, numbers, or underscores." };
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return { error: "Enter a valid email address." };
  if (password.length < 10) return { error: "Use a password with at least 10 characters." };

  const supabase = await createServerSupabaseClient();
  if (!supabase) return { error: "Registration is unavailable until the Supabase environment is configured." };
  const { error } = await supabase.auth.signUp({ email, password, options: { data: { display_name: displayName, username } } });
  if (error) return { error: "We could not create the account. Try another email or username." };
  redirect("/auth/login?registered=1");
}

export async function signOut() {
  const supabase = await createServerSupabaseClient();
  if (supabase) await supabase.auth.signOut();
  redirect("/");
}