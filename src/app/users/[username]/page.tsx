import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowRight } from "lucide-react";
import { ProjectCard } from "@/components/ProjectCard";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { getProjects } from "@/lib/projects";

type ProfilePageProps = { params: Promise<{ username: string }> };

export async function generateMetadata({ params }: ProfilePageProps): Promise<Metadata> {
  const { username } = await params;
  return { title: `@${username}` };
}

export default async function PublicProfilePage({ params }: ProfilePageProps) {
  const { username } = await params;
  const supabase = await createServerSupabaseClient();
  if (!supabase) notFound();
  const { data: profile } = await supabase.from("profiles").select("id, username, display_name, bio, created_at").eq("username", username.toLowerCase()).maybeSingle();
  if (!profile) notFound();
  const { projects } = await getProjects({ userId: profile.id, limit: 24 });

  return <section className="page-width app-page profile-page"><div className="profile-intro"><div className="profile-avatar" aria-hidden="true">{profile.display_name.slice(0, 1).toUpperCase()}</div><div><p className="eyebrow">COMMUNITY CONTRIBUTOR</p><h1>{profile.display_name}</h1><p className="profile-handle">@{profile.username}</p>{profile.bio && <p className="profile-bio">{profile.bio}</p>}<p className="profile-since">Sharing since {new Intl.DateTimeFormat("en", { month: "long", year: "numeric" }).format(new Date(profile.created_at))}</p></div></div>
    <div className="section-heading profile-project-heading"><div><p className="eyebrow">PUBLIC WORK</p><h2>Projects</h2></div><span>{projects.length} shown</span></div>
    {projects.length ? <div className="project-grid">{projects.map((project) => <ProjectCard key={project.id} project={project} />)}</div> : <div className="empty-state explore-empty"><h2>No published projects yet.</h2><p>When this contributor shares public work, it will appear here.</p><Link className="text-link" href="/explore">Explore the library <ArrowRight size={15} aria-hidden="true" /></Link></div>}
  </section>;
}