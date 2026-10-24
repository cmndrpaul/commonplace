"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import { createProject, updateProject, type ProjectActionResult } from "@/app/projects/actions";
import { PROJECT_CATEGORIES } from "@/lib/projects/constants";

export type EditableProject = {
  id: string;
  title: string;
  description: string;
  category: string;
  status: "draft" | "published";
  project_url: string | null;
  file_path: string | null;
  thumbnail_path: string | null;
};

const projectFiles: Record<string, string> = {
  pdf: "application/pdf",
  zip: "application/zip",
  docx: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  pptx: "application/vnd.openxmlformats-officedocument.presentationml.presentation",
  png: "image/png",
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
};

function fileIsAllowed(file: File, allowed: Record<string, string>, maxBytes: number) {
  const extension = file.name.split(".").pop()?.toLowerCase() ?? "";
  return Boolean(allowed[extension] && file.type === allowed[extension] && file.size > 0 && file.size <= maxBytes);
}

async function uploadProjectAsset(file: File, kind: "project" | "thumbnail") {
  const formData = new FormData();
  formData.set("file", file);
  formData.set("kind", kind);
  const response = await fetch("/api/uploads", { method: "POST", body: formData });
  const result = await response.json() as { path?: string; error?: string };
  if (!response.ok || !result.path) throw new Error(result.error || "The upload failed.");
  return result.path;
}

export function ProjectForm({ project, configured }: { project?: EditableProject; configured: boolean }) {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    if (!configured) { setError("Connect Supabase before submitting a project."); return; }
    const form = event.currentTarget;
    if (!form.reportValidity()) return;
    setPending(true);
    const uploadedPaths: string[] = [];
    let saved = false;
    const storageClient = createSupabaseBrowserClient();

    try {
      const supabase = storageClient;
      if (!supabase) { setError("Supabase is not configured."); return; }
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { setError("Your session has expired. Sign in again to continue."); return; }

      const formData = new FormData(form);
      const fileInput = form.elements.namedItem("projectFile") as HTMLInputElement | null;
      const thumbnailInput = form.elements.namedItem("thumbnail") as HTMLInputElement | null;
      const projectFile = fileInput?.files?.[0];
      const thumbnail = thumbnailInput?.files?.[0];
      let filePath = project?.file_path ?? "";
      let thumbnailPath = project?.thumbnail_path ?? "";

      if (projectFile) {
        if (!fileIsAllowed(projectFile, projectFiles, 4 * 1024 * 1024)) { setError("Choose a PDF, ZIP, DOCX, PPTX, PNG, or JPG file no larger than 4 MB."); return; }
        filePath = await uploadProjectAsset(projectFile, "project");
        uploadedPaths.push(filePath);
      }
      if (thumbnail) {
        if (!fileIsAllowed(thumbnail, { png: "image/png", jpg: "image/jpeg", jpeg: "image/jpeg" }, 5 * 1024 * 1024)) { setError("Choose a PNG or JPG thumbnail no larger than 5 MB."); return; }
        thumbnailPath = await uploadProjectAsset(thumbnail, "thumbnail");
        uploadedPaths.push(thumbnailPath);
      }

      formData.set("filePath", filePath);
      formData.set("thumbnailPath", thumbnailPath);
      const result: ProjectActionResult = project ? await updateProject(project.id, formData) : await createProject(formData);
      if (result.error) { setError(result.error); return; }
      if (result.projectId) { saved = true; router.push(formData.get("status") === "draft" ? "/dashboard/projects" : `/projects/${result.projectId}`); }
    } catch {
      setError("Something went wrong while saving. Your project was not confirmed as saved; please try again.");
    } finally {
      if (!saved && uploadedPaths.length) await storageClient?.storage.from("project-assets").remove(uploadedPaths);
      setPending(false);
    }
  }

  return <form className="project-form" onSubmit={handleSubmit}>
    <label className="field-label" htmlFor="title">Project title<input className="form-control" id="title" name="title" minLength={5} maxLength={120} defaultValue={project?.title} required /></label>
    <label className="field-label" htmlFor="description">Description<textarea className="form-control form-textarea" id="description" name="description" minLength={30} maxLength={5000} rows={7} defaultValue={project?.description} required /><span className="field-help">Explain what it does, how it was made, and what someone can learn from it.</span></label>
    <div className="form-grid-two">
      <label className="field-label" htmlFor="category">Category<select className="form-control" id="category" name="category" defaultValue={project?.category ?? ""} required><option value="" disabled>Select a category</option>{PROJECT_CATEGORIES.map((category) => <option key={category} value={category}>{category}</option>)}</select></label>
      <label className="field-label" htmlFor="projectUrl">Project link <span className="optional-label">Optional</span><input className="form-control" id="projectUrl" name="projectUrl" type="url" maxLength={2048} placeholder="https://" defaultValue={project?.project_url ?? ""} /></label>
    </div>
    <div className="form-grid-two">
      <label className="field-label" htmlFor="projectFile">Project file <span className="optional-label">Optional · max 20 MB</span><input className="form-control file-control" id="projectFile" name="projectFile" type="file" accept=".pdf,.zip,.docx,.pptx,.png,.jpg,.jpeg" /><span className="field-help">{project?.file_path ? "A file is already attached; choose a replacement or leave blank." : "PDF, ZIP, DOCX, PPTX, PNG, or JPG."}</span></label>
      <label className="field-label" htmlFor="thumbnail">Thumbnail <span className="optional-label">Optional · max 5 MB</span><input className="form-control file-control" id="thumbnail" name="thumbnail" type="file" accept=".png,.jpg,.jpeg,image/png,image/jpeg" /><span className="field-help">PNG or JPG image.</span></label>
    </div>
    <label className="field-label" htmlFor="status">Visibility<select className="form-control" id="status" name="status" defaultValue={project?.status ?? "published"}><option value="published">Publish project</option><option value="draft">Save as draft</option></select><span className="field-help">Drafts are only visible to you.</span></label>
    {error && <p className="form-error" role="alert">{error}</p>}
    {!configured && <p className="form-notice" role="status">Add your Supabase project URL and public key to enable project submissions.</p>}
    <div className="form-actions"><button className="button button-primary" type="submit" disabled={pending || !configured}>{pending ? "Saving project…" : project ? "Save changes" : "Submit project"}</button><button className="button button-secondary" type="button" disabled={pending} onClick={() => router.back()}>Cancel</button></div>
  </form>;
}