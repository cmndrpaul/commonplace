import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { ProjectForm } from "@/components/ProjectForm";
import { getAuthenticatedContext } from "@/lib/auth";
import { getSupabasePublicConfig } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "Share a project" };

export default async function NewProjectPage() {
  const { user } = await getAuthenticatedContext();
  if (!user) redirect("/auth/login?next=%2Fprojects%2Fnew");
  return <section className="page-width app-page form-page"><div className="back-link-row"><Link href="/dashboard">← Dashboard</Link></div><div className="form-page-heading"><p className="eyebrow">SHARE YOUR WORK</p><h1>New project</h1><p className="page-lead">Give the community enough context to understand and learn from what you made.</p></div><ProjectForm configured={Boolean(getSupabasePublicConfig())} /></section>;
}