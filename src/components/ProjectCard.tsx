import Image from "next/image";
import Link from "next/link";
import { ArrowUpRight, FolderKanban, Heart } from "lucide-react";
import type { ProjectSummary } from "@/lib/projects";

export function ProjectCard({ project }: { project: ProjectSummary }) {
  const date = new Intl.DateTimeFormat("en", { month: "short", day: "numeric", year: "numeric" }).format(new Date(project.createdAt));

  return (
    <article className="project-card">
      <Link className="project-image" href={`/projects/${project.id}`} aria-label={`View ${project.title}`}>
        {project.thumbnailUrl ? <Image src={project.thumbnailUrl} alt="" fill sizes="(max-width: 700px) 100vw, (max-width: 1100px) 50vw, 33vw" unoptimized /> : <span className="project-image-placeholder"><FolderKanban size={30} aria-hidden="true" /></span>}
        <span className="project-category">{project.category}</span><ArrowUpRight className="project-open" size={18} aria-hidden="true" />
      </Link>
      <div className="project-card-content">
        <h3><Link href={`/projects/${project.id}`}>{project.title}</Link></h3>
        <p>{project.description}</p>
        <div className="project-byline"><span>{project.authorName || "Community member"}</span><span className="project-meta-end">{project.likeCount > 0 && <span className="project-like-count"><Heart size={12} aria-hidden="true" /> {project.likeCount}</span>}<time dateTime={project.createdAt}>{date}</time></span></div>
      </div>
    </article>
  );
}