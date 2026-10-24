import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowDownToLine, ArrowLeft, Bookmark, Heart, Pencil, ExternalLink } from "lucide-react";
import { addComment, deleteProject, toggleBookmark, toggleLike } from "@/app/projects/actions";
import { CommentControls } from "@/components/CommentControls";
import { ConfirmDeleteButton } from "@/components/ConfirmDeleteButton";
import { getProjectDetails } from "@/lib/projects";

type ProjectPageProps = { params: Promise<{ id: string }> };

export async function generateMetadata({ params }: ProjectPageProps): Promise<Metadata> {
  const { id } = await params;
  const details = await getProjectDetails(id);
  return { title: details?.project.title ?? "Project" };
}

export default async function ProjectDetailPage({ params, searchParams }: ProjectPageProps & { searchParams: Promise<{ comment?: string }> }) {
  const { id } = await params;
  const query = await searchParams;
  const details = await getProjectDetails(id);
  if (!details) notFound();
  const { project } = details;

  return <article className="page-width app-page detail-page">
    <Link className="back-link" href="/explore"><ArrowLeft size={15} aria-hidden="true" /> Back to projects</Link>
    <div className="detail-heading"><div><span className="project-category detail-category">{project.category}</span><h1>{project.title}</h1><p className="detail-byline">By {details.author.username ? <Link href={`/users/${details.author.username}`}>{details.author.name}</Link> : details.author.name} <span>·</span> <time dateTime={project.created_at}>{new Intl.DateTimeFormat("en", { month: "long", day: "numeric", year: "numeric" }).format(new Date(project.created_at))}</time>{project.status === "draft" && <span className="status-label status-draft">Draft</span>}</p></div>
      <div className="detail-actions">{details.isOwner && <><Link className="button button-secondary" href={`/projects/${project.id}/edit`}><Pencil size={15} aria-hidden="true" /> Edit</Link><ConfirmDeleteButton action={deleteProject.bind(null, project.id)} /></>}
        {project.status === "published" && <><form action={toggleLike.bind(null, project.id)}><button className={`button button-secondary icon-action${details.liked ? " is-active" : ""}`} type="submit" aria-label={details.liked ? "Unlike project" : "Like project"}><Heart size={16} aria-hidden="true" /> {details.likeCount}</button></form>
        <form action={toggleBookmark.bind(null, project.id)}><button className={`button button-secondary icon-action${details.bookmarked ? " is-active" : ""}`} type="submit" aria-label={details.bookmarked ? "Remove bookmark" : "Bookmark project"}><Bookmark size={16} aria-hidden="true" /></button></form></>}
      </div>
    </div>
    {details.thumbnailUrl && <div className="detail-image"><Image src={details.thumbnailUrl} alt={`Thumbnail for ${project.title}`} fill sizes="(max-width: 900px) 100vw, 900px" unoptimized priority /></div>}
    <div className="detail-content-grid"><div className="detail-description"><h2>About this project</h2><p>{project.description}</p><div className="detail-resource-links">{details.downloadUrl && <a className="button button-primary" href={details.downloadUrl} download><ArrowDownToLine size={16} aria-hidden="true" /> Download project file</a>}{project.project_url && <a className="button button-secondary" href={project.project_url} target="_blank" rel="noopener noreferrer">Open project link <ExternalLink size={15} aria-hidden="true" /></a>}</div></div>
      <aside className="author-aside"><p className="eyebrow">SHARED BY</p><strong>{details.author.name}</strong>{details.author.username && <Link href={`/users/${details.author.username}`}>@{details.author.username}</Link>}<span>Community contributor</span></aside>
    </div>
    <section className="comments-section" aria-labelledby="comments-heading"><div className="section-heading"><div><p className="eyebrow">COMMUNITY NOTES</p><h2 id="comments-heading">Comments <span>({details.comments.length})</span></h2></div></div>
      {query.comment && <p className="form-error" role="alert">{query.comment === "invalid" ? "Comments must be between 1 and 2,000 characters." : "The comment could not be saved. Make sure you are signed in and try again."}</p>}
      {project.status === "published" ? <form className="comment-form" action={addComment.bind(null, project.id)}><label className="visually-hidden" htmlFor="comment-body">Write a comment</label><textarea id="comment-body" name="body" maxLength={2000} rows={3} placeholder="Share a thoughtful question or response…" required /><button className="button button-primary" type="submit">Post comment</button></form> : <p className="comments-empty">Comments open after this project is published.</p>}
      {details.comments.length ? <div className="comment-list">{details.comments.map((comment) => <article className="comment-item" key={comment.id}><div className="comment-meta"><strong>{comment.authorName}</strong><time dateTime={comment.created_at}>{new Intl.DateTimeFormat("en", { month: "short", day: "numeric", year: "numeric" }).format(new Date(comment.created_at))}</time></div><p>{comment.body}</p>{details.viewerId === comment.user_id && <CommentControls projectId={project.id} commentId={comment.id} body={comment.body} />}</article>)}</div> : project.status === "published" ? <p className="comments-empty">No comments yet. Start a constructive conversation.</p> : null}
    </section>
  </article>;
}