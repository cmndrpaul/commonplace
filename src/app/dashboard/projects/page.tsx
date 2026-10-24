import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowRight, Plus } from "lucide-react";
import { deleteProject } from "@/app/projects/actions";
import { getAuthenticatedContext } from "@/lib/auth";
import { ConfirmDeleteButton } from "@/components/ConfirmDeleteButton";

export const metadata: Metadata = { title: "My projects" };

export default async function MyProjectsPage() {
  const { supabase, user } = await getAuthenticatedContext();
  if (!user) redirect("/auth/login");
  const { data: projects } = await supabase!.from("projects").select("id, title, category, status, created_at").eq("user_id", user.id).order("created_at", { ascending: false });

  return <section className="page-width app-page"><div className="back-link-row"><Link href="/dashboard">← Dashboard</Link></div><div className="page-title-row"><div><p className="eyebrow">YOUR WORKSPACE</p><h1>My projects</h1><p className="page-lead">Keep track of drafts and published work.</p></div><Link className="button button-primary" href="/projects/new"><Plus size={16} aria-hidden="true" /> New project</Link></div>
    {projects?.length ? <div className="simple-project-list">{projects.map((project) => <div className="simple-project-row" key={project.id}><Link className="simple-project-main" href={`/projects/${project.id}`}><span><strong>{project.title}</strong><small>{project.category} · {new Intl.DateTimeFormat("en", { month: "short", day: "numeric", year: "numeric" }).format(new Date(project.created_at))}</small></span><span className={`status-label status-${project.status}`}>{project.status}</span></Link><Link className="row-edit-link" href={`/projects/${project.id}/edit`}>Edit</Link><ConfirmDeleteButton compact action={deleteProject.bind(null, project.id)} /></div>)}</div> : <div className="empty-state dashboard-empty"><h2>No projects yet.</h2><p>Your drafts and published projects will appear here.</p><Link className="button button-primary" href="/projects/new">Create a project <ArrowRight size={15} aria-hidden="true" /></Link></div>}
  </section>;
}