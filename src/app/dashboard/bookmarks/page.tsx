import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { ProjectCard } from "@/components/ProjectCard";
import { getAuthenticatedContext } from "@/lib/auth";
import { getProjects } from "@/lib/projects";

export const metadata: Metadata = { title: "Bookmarked projects" };

export default async function BookmarksPage() {
  const { supabase, user } = await getAuthenticatedContext();
  if (!user) redirect("/auth/login");
  const { data: saved } = await supabase!.from("bookmarks").select("project_id, created_at").eq("user_id", user.id).order("created_at", { ascending: false });
  const ids = saved?.map((item) => item.project_id) ?? [];
  const { projects } = ids.length ? await getProjects({ projectIds: ids, limit: 100 }) : { projects: [] };
  const order = new Map(ids.map((id, index) => [id, index]));
  projects.sort((left, right) => (order.get(left.id) ?? 0) - (order.get(right.id) ?? 0));

  return <section className="page-width app-page"><div className="back-link-row"><Link href="/dashboard">← Dashboard</Link></div><div className="page-title-row"><div><p className="eyebrow">YOUR READING LIST</p><h1>Bookmarked projects</h1><p className="page-lead">Useful work you saved for another time.</p></div></div>
    {projects.length ? <div className="project-grid">{projects.map((project) => <ProjectCard key={project.id} project={project} />)}</div> : <div className="empty-state dashboard-empty"><h2>Your saved projects will live here.</h2><p>Bookmark a published project to keep it close.</p><Link className="button button-secondary" href="/explore">Explore projects</Link></div>}
  </section>;
}