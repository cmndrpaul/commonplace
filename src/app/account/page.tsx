import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { updateProfile } from "@/app/account/actions";
import { getAuthenticatedContext } from "@/lib/auth";

export const metadata: Metadata = { title: "Account settings" };

type AccountParams = Promise<{ saved?: string; error?: string }>;

export default async function AccountPage({ searchParams }: { searchParams: AccountParams }) {
  const { supabase, user } = await getAuthenticatedContext();
  if (!user) redirect("/auth/login");
  const { data: profile } = await supabase!.from("profiles").select("username, display_name, bio").eq("id", user.id).maybeSingle();
  const params = await searchParams;
  return <section className="page-width app-page settings-page"><p className="eyebrow">YOUR ACCOUNT</p><h1>Profile settings</h1><p className="page-lead">Manage the public details shown with your projects.</p>
    {params.saved && <p className="form-notice" role="status">Profile changes saved.</p>}{params.error && <p className="form-error" role="alert">{params.error === "invalid" ? "Check the name, username, and bio limits." : "Your changes could not be saved. The username may already be in use."}</p>}
    <form className="project-form" action={updateProfile}><label className="field-label" htmlFor="displayName">Display name<input className="form-control" id="displayName" name="displayName" minLength={2} maxLength={80} defaultValue={profile?.display_name ?? ""} required /></label><label className="field-label" htmlFor="username">Username<input className="form-control" id="username" name="username" pattern="[a-z0-9_]{3,30}" minLength={3} maxLength={30} defaultValue={profile?.username ?? ""} required /><span className="field-help">Your public profile address uses this username.</span></label><label className="field-label" htmlFor="bio">Short bio <span className="optional-label">Optional · max 500 characters</span><textarea className="form-control form-textarea" id="bio" name="bio" rows={5} maxLength={500} defaultValue={profile?.bio ?? ""} /></label><p className="account-email">Email address <strong>{user.email}</strong><span>Email changes are managed through Supabase Auth.</span></p><button className="button button-primary" type="submit">Save profile</button></form>
  </section>;
}