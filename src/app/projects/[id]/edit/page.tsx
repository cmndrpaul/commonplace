import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { ProjectForm, type EditableProject } from "@/components/ProjectForm";
import { getAuthenticatedContext } from "@/lib/auth";
import { getSupabasePublicConfig } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "Edit project" };

export default async function EditProjectPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { supabase, user } = await getAuthenticatedContext();
  if (!user || !supabase) redirect("/auth/login");
  const { data } = await supabase.from("projects").select("id, title, description, category, status, project_url, file_path, thumbnail_path").eq("id", id).eq("user_id", user.id).maybeSingle();
  if (!data) notFound();
  return <section className="page-width app-page form-page"><div className="back-link-row"><Link href={`/projects/${id}`}>← Back to project</Link></div><div className="form-page-heading"><p className="eyebrow">YOUR PROJECT</p><h1>Edit project</h1></div><ProjectForm project={data as EditableProject} configured={Boolean(getSupabasePublicConfig())} /></section>;
}