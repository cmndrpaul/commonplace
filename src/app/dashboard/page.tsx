import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowRight, Bookmark, FolderKanban, Plus } from "lucide-react";
import { getAuthenticatedContext } from "@/lib/auth";

export const metadata = { title: "Dashboard" };

export default async function DashboardPage() {
  const { supabase, user } = await getAuthenticatedContext();
  if (!user) redirect("/auth/login");
  const { data: projects } = await supabase!.from("projects").select("id, title, category, status, created_at").eq("user_id", user.id).order("created_at", { ascending: false }).limit(5);
  const name = user.user_metadata.display_name || "there";

  return <section className="page-width app-page"><div className="page-title-row"><div><p className="eyebrow">YOUR WORKSPACE</p><h1>Good to see you, {name}.</h1><p className="page-lead">Manage your projects and saved work.</p></div><Link className="button button-primary" href="/projects/new"><Plus size={16} aria-hidden="true" /> Create project</Link></div>
    <div className="dashboard-links"><Link href="/dashboard/projects"><FolderKanban size={19} aria-hidden="true" /><span><strong>My projects</strong><small>Drafts and published work</small></span><ArrowRight size={16} aria-hidden="true" /></Link><Link href="/dashboard/bookmarks"><Bookmark size={19} aria-hidden="true" /><span><strong>Bookmarks</strong><small>Projects you saved for later</small></span><ArrowRight size={16} aria-hidden="true" /></Link><Link href="/account"><FolderKanban size={19} aria-hidden="true" /><span><strong>Account settings</strong><small>Update your public profile</small></span><ArrowRight size={16} aria-hidden="true" /></Link></div>
    <div className="section-heading dashboard-section-heading"><div><p className="eyebrow">YOUR LATEST WORK</p><h2>Recent projects</h2></div><Link className="text-link" href="/dashboard/projects">View all <ArrowRight size={15} aria-hidden="true" /></Link></div>
    {projects?.length ? <div className="simple-project-list">{projects.map((project) => <Link className="simple-project-row" href={`/projects/${project.id}`} key={project.id}><span><strong>{project.title}</strong><small>{project.category} · {new Intl.DateTimeFormat("en", { month: "short", day: "numeric", year: "numeric" }).format(new Date(project.created_at))}</small></span><span className={`status-label status-${project.status}`}>{project.status}</span><ArrowRight size={16} aria-hidden="true" /></Link>)}</div> : <div className="empty-state dashboard-empty"><div className="empty-icon"><FolderKanban size={22} aria-hidden="true" /></div><h3>Your projects will show up here.</h3><p>Start with a project you&apos;re proud of, or save useful work from the community.</p><Link className="button button-secondary" href="/projects/new">Create your first project <ArrowRight size={15} aria-hidden="true" /></Link></div>}
  </section>;
}