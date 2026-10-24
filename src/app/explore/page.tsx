import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, ArrowRight, Search } from "lucide-react";
import { ProjectCard } from "@/components/ProjectCard";
import { getProjects } from "@/lib/projects";
import { PROJECT_CATEGORIES } from "@/lib/projects/constants";

export const metadata: Metadata = { title: "Explore projects" };

type ExploreParams = Promise<{ q?: string; category?: string; page?: string }>;

export default async function ExplorePage({ searchParams }: { searchParams: ExploreParams }) {
  const params = await searchParams;
  const query = params.q?.trim() ?? "";
  const category = params.category ?? "";
  const page = Math.max(1, Number.parseInt(params.page ?? "1", 10) || 1);
  const { projects, totalCount, available } = await getProjects({ query, category, page, limit: 18 });
  const totalPages = Math.max(1, Math.ceil(totalCount / 18));
  const hrefForPage = (targetPage: number) => {
    const next = new URLSearchParams();
    if (query) next.set("q", query);
    if (category) next.set("category", category);
    if (targetPage > 1) next.set("page", String(targetPage));
    const search = next.toString();
    return `/explore${search ? `?${search}` : ""}`;
  };

  return <section className="page-width app-page explore-page">
    <div className="page-title-row"><div><p className="eyebrow">THE COMMUNITY LIBRARY</p><h1>Explore projects</h1><p className="page-lead">Find practical work, ideas, and resources shared by the community.</p></div><Link className="button button-primary" href="/projects/new">Share a project <ArrowRight size={15} aria-hidden="true" /></Link></div>
    <form action="/explore" className="explore-filters">
      <div className="search-field"><Search size={18} aria-hidden="true" /><label className="visually-hidden" htmlFor="explore-search">Search title and description</label><input id="explore-search" name="q" defaultValue={query} placeholder="Search title or description" /></div>
      <label className="visually-hidden" htmlFor="category-filter">Filter by category</label><select id="category-filter" name="category" defaultValue={category}><option value="">All categories</option>{PROJECT_CATEGORIES.map((item) => <option key={item} value={item}>{item}</option>)}</select>
      <button className="button button-primary" type="submit">Search</button>
    </form>
    <div className="results-heading"><p>{totalCount === 1 ? "1 project" : `${totalCount} projects`}{query ? ` matching “${query}”` : ""}</p><span>Newest first</span></div>
    {projects.length ? <div className="project-grid">{projects.map((project) => <ProjectCard key={project.id} project={project} />)}</div> : <div className="empty-state explore-empty"><h2>{!available ? "Project data is not available yet." : query || category ? "No projects match these filters." : "No projects have been published yet."}</h2><p>{!available ? "Connect Supabase and apply the database migration to enable the project library." : query || category ? "Try a different search or broaden the category selection." : "When the community shares its first work, it will appear here."}</p>{(query || category) && <Link className="button button-secondary" href="/explore">Clear filters</Link>}</div>}
    {totalPages > 1 && <nav className="pagination" aria-label="Project pages">{page > 1 ? <Link href={hrefForPage(page - 1)}><ArrowLeft size={15} aria-hidden="true" /> Previous</Link> : <span />}<span>Page {page} of {totalPages}</span>{page < totalPages ? <Link href={hrefForPage(page + 1)}>Next <ArrowRight size={15} aria-hidden="true" /></Link> : <span />}</nav>}
  </section>;
}