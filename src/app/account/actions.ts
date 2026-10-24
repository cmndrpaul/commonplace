"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getAuthenticatedContext } from "@/lib/auth";

export async function updateProfile(formData: FormData) {
  const displayName = String(formData.get("displayName") ?? "").trim();
  const username = String(formData.get("username") ?? "").trim().toLowerCase();
  const bio = String(formData.get("bio") ?? "").trim();
  if (displayName.length < 2 || displayName.length > 80 || !/^[a-z0-9_]{3,30}$/.test(username) || bio.length > 500) redirect("/account?error=invalid");
  const { supabase, user } = await getAuthenticatedContext();
  if (!supabase || !user) redirect("/auth/login");
  const { error } = await supabase.from("profiles").update({ display_name: displayName, username, bio }).eq("id", user.id);
  if (error) redirect("/account?error=save");
  await supabase.auth.updateUser({ data: { ...user.user_metadata, display_name: displayName, username } });
  revalidatePath("/account");
  revalidatePath("/dashboard");
  revalidatePath(`/users/${username}`);
  redirect("/account?saved=1");
}