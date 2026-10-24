import Link from "next/link";
import { ArrowRight, BookOpen, Code2, FlaskConical, Lightbulb, Search } from "lucide-react";
import { ProjectCard } from "@/components/ProjectCard";
import { getProjects } from "@/lib/projects";
import { PROJECT_CATEGORIES } from "@/lib/projects/constants";

export default async function Home() {
  const { projects, configured, available } = await getProjects({ limit: 6 });

  return (
    <div className="site-shell">
      <section className="home-intro page-width">
        <div className="intro-copy">
          <p className="eyebrow"><span className="eyebrow-mark" /> A community for work worth sharing</p>
          <h1>Good ideas grow when they&apos;re shared.</h1>
          <p className="intro-description">Explore practical projects from students, makers, and researchers. Find inspiration, learn from the process, and share what you&apos;ve built.</p>
          <div className="intro-actions">
            <Link className="button button-primary" href="/explore">Explore projects <ArrowRight size={16} aria-hidden="true" /></Link>
            <Link className="button button-secondary" href="/projects/new">Share a project</Link>
          </div>
        </div>
        <div className="intro-index" aria-label="Explore project disciplines">
          <div className="index-topline"><span>OPEN INDEX</span><span>01 / 04</span></div>
          <Link href="/explore?category=School%20project"><BookOpen size={18} aria-hidden="true" /><span>School projects</span><ArrowRight size={15} aria-hidden="true" /></Link>
          <Link href="/explore?category=Programming"><Code2 size={18} aria-hidden="true" /><span>Programming</span><ArrowRight size={15} aria-hidden="true" /></Link>
          <Link href="/explore?category=Research"><FlaskConical size={18} aria-hidden="true" /><span>Research</span><ArrowRight size={15} aria-hidden="true" /></Link>
          <Link href="/explore?category=Other"><Lightbulb size={18} aria-hidden="true" /><span>Ideas &amp; more</span><ArrowRight size={15} aria-hidden="true" /></Link>
          <span className="index-note">A shared library, made by the community.</span>
        </div>
      </section>

      <section className="directory-section" aria-labelledby="recent-heading" id="categories">
        <div className="page-width">
          <div className="section-heading">
            <div><p className="eyebrow">THE PROJECT LIBRARY</p><h2 id="recent-heading">Recently shared</h2></div>
            <Link className="text-link" href="/explore">Browse all projects <ArrowRight size={15} aria-hidden="true" /></Link>
          </div>
          <form action="/explore" className="home-search">
            <Search size={19} aria-hidden="true" />
            <label className="visually-hidden" htmlFor="home-search">Search projects</label>
            <input id="home-search" name="q" placeholder="Search projects, topics, or ideas" />
            <button className="button button-primary" type="submit">Search</button>
          </form>
          <div className="category-row" aria-label="Browse by category">
            {PROJECT_CATEGORIES.map((category) => <Link className="category-chip" href={`/explore?category=${encodeURIComponent(category)}`} key={category}>{category}</Link>)}
          </div>
          {projects.length > 0 ? (
            <div className="project-grid">{projects.map((project) => <ProjectCard key={project.id} project={project} />)}</div>
          ) : (
            <div className="empty-state">
              <div className="empty-icon"><BookOpen size={22} aria-hidden="true" /></div>
              <h3>{!configured ? "The project library is being set up." : available ? "The library is ready for its first project." : "The project library needs setup."}</h3>
              <p>{!configured ? "Once the Supabase project is connected, published work will appear here. You can still explore the platform or prepare a project to share." : available ? "Be the first to share something useful with the community." : "Apply the Supabase database migration and confirm the project configuration to load published work."}</p>
              <Link className="button button-secondary" href="/projects/new">Share a project <ArrowRight size={15} aria-hidden="true" /></Link>
            </div>
          )}
        </div>
      </section>

      <section className="how-section page-width" aria-labelledby="how-heading">
        <div className="how-heading"><p className="eyebrow">BUILT FOR SHARING</p><h2 id="how-heading">A useful project deserves a longer life.</h2></div>
        <div className="how-steps">
          <div><span>01</span><h3>Make something</h3><p>Build a class project, a tool, a study, or an idea you want to take further.</p></div>
          <div><span>02</span><h3>Share the process</h3><p>Publish the details and files that help someone understand and learn from it.</p></div>
          <div><span>03</span><h3>Pass it forward</h3><p>Discover work from others, ask questions, and make the next version better.</p></div>
        </div>
      </section>
    </div>
  );
}
