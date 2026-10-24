import { deleteComment, updateComment } from "@/app/projects/actions";

export function CommentControls({ projectId, commentId, body }: { projectId: string; commentId: string; body: string }) {
  return <details className="comment-controls"><summary>Manage</summary><div><form action={updateComment.bind(null, projectId, commentId)}><label className="visually-hidden" htmlFor={`edit-comment-${commentId}`}>Edit your comment</label><textarea id={`edit-comment-${commentId}`} name="body" maxLength={2000} defaultValue={body} required /><button type="submit">Save edit</button></form><form action={deleteComment.bind(null, projectId, commentId)}><button type="submit">Delete comment</button></form></div></details>;
}