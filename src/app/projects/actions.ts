"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { PROJECT_CATEGORIES, type ProjectCategory } from "@/lib/projects/constants";
import { getAuthenticatedContext } from "@/lib/auth";

export type ProjectActionResult = { error?: string; projectId?: string };

function readProjectFields(formData: FormData) {
  const title = String(formData.get("title") ?? "").trim();
  const description = String(formData.get("description") ?? "").trim();
  const category = String(formData.get("category") ?? "");
  const projectUrl = String(formData.get("projectUrl") ?? "").trim();
  const status = String(formData.get("status") ?? "published");
  const filePath = String(formData.get("filePath") ?? "").trim() || null;
  const thumbnailPath = String(formData.get("thumbnailPath") ?? "").trim() || null;
  if (title.length < 5 || title.length > 120) return { error: "Title must be between 5 and 120 characters." };
  if (description.length < 30 || description.length > 5000) return { error: "Description must be between 30 and 5,000 characters." };
  if (!PROJECT_CATEGORIES.includes(category as ProjectCategory)) return { error: "Choose a project category." };
  if (projectUrl && (!/^https?:\/\//i.test(projectUrl) || projectUrl.length > 2048)) return { error: "Enter a valid http or https project link." };
  if (status !== "draft" && status !== "published") return { error: "Choose whether to save a draft or publish." };
  return { title, description, category: category as ProjectCategory, projectUrl: projectUrl || null, status: status as "draft" | "published", filePath, thumbnailPath };
}

async function pathsBelongToUser(paths: Array<string | null>, userId: string, supabase: NonNullable<Awaited<ReturnType<typeof getAuthenticatedContext>>["supabase"]>) {
  for (const path of paths.filter((value): value is string => Boolean(value))) {
    const [ownerId, filename, extra] = path.split("/");
    if (ownerId !== userId || !filename || extra) return false;
    const { data, error } = await supabase.storage.from("project-assets").list(userId, { search: filename, limit: 100 });
    if (error || !data?.some((item) => item.name === filename)) return false;
  }
  return true;
}

export async function createProject(formData: FormData): Promise<ProjectActionResult> {
  const fields = readProjectFields(formData);
  if ("error" in fields) return fields;
  const { supabase, user } = await getAuthenticatedContext();
  if (!supabase || !user) return { error: "Sign in before creating a project." };
  if (!await pathsBelongToUser([fields.filePath, fields.thumbnailPath], user.id, supabase)) return { error: "The uploaded file could not be verified. Please upload it again." };

  const { data, error } = await supabase.from("projects").insert({
    user_id: user.id,
    title: fields.title,
    description: fields.description,
    category: fields.category,
    project_url: fields.projectUrl,
    status: fields.status,
    file_path: fields.filePath,
    thumbnail_path: fields.thumbnailPath,
  }).select("id").single();
  if (error || !data) return { error: "The project could not be saved. Check your connection and try again." };
  revalidatePath("/");
  revalidatePath("/explore");
  revalidatePath("/dashboard");
  return { projectId: data.id };
}

export async function updateProject(projectId: string, formData: FormData): Promise<ProjectActionResult> {
  const fields = readProjectFields(formData);
  if ("error" in fields) return fields;
  const { supabase, user } = await getAuthenticatedContext();
  if (!supabase || !user) return { error: "Sign in before editing a project." };
  if (!await pathsBelongToUser([fields.filePath, fields.thumbnailPath], user.id, supabase)) return { error: "The selected file could not be verified." };
  const { data: previous } = await supabase.from("projects").select("file_path, thumbnail_path").eq("id", projectId).eq("user_id", user.id).maybeSingle();
  if (!previous) return { error: "The project could not be updated. It may no longer be available." };

  const { data, error } = await supabase.from("projects").update({
    title: fields.title,
    description: fields.description,
    category: fields.category,
    project_url: fields.projectUrl,
    status: fields.status,
    file_path: fields.filePath,
    thumbnail_path: fields.thumbnailPath,
  }).eq("id", projectId).eq("user_id", user.id).select("id").maybeSingle();
  if (error || !data) return { error: "The project could not be updated. It may no longer be available." };
  const replacedPaths = [previous.file_path !== fields.filePath ? previous.file_path : null, previous.thumbnail_path !== fields.thumbnailPath ? previous.thumbnail_path : null].filter((path): path is string => Boolean(path));
  if (replacedPaths.length) await supabase.storage.from("project-assets").remove(replacedPaths);
  revalidatePath("/");
  revalidatePath("/explore");
  revalidatePath(`/projects/${projectId}`);
  revalidatePath("/dashboard");
  return { projectId: data.id };
}

export async function deleteProject(projectId: string) {
  const { supabase, user } = await getAuthenticatedContext();
  if (!supabase || !user) redirect("/auth/login");
  const { data: project } = await supabase.from("projects").select("file_path, thumbnail_path").eq("id", projectId).eq("user_id", user.id).maybeSingle();
  if (!project) redirect("/dashboard/projects");
  const { error } = await supabase.from("projects").delete().eq("id", projectId).eq("user_id", user.id);
  if (error) redirect(`/projects/${projectId}?error=delete`);
  const assetPaths = [project.file_path, project.thumbnail_path].filter((path): path is string => Boolean(path));
  if (assetPaths.length) await supabase.storage.from("project-assets").remove(assetPaths);
  revalidatePath("/");
  revalidatePath("/explore");
  revalidatePath("/dashboard");
  redirect("/dashboard/projects?deleted=1");
}

export async function toggleLike(projectId: string) {
  const { supabase, user } = await getAuthenticatedContext();
  if (!supabase || !user) redirect("/auth/login");
  const { data: existing } = await supabase.from("likes").select("id").eq("project_id", projectId).eq("user_id", user.id).maybeSingle();
  if (existing) await supabase.from("likes").delete().eq("id", existing.id).eq("user_id", user.id);
  else await supabase.from("likes").insert({ project_id: projectId, user_id: user.id });
  revalidatePath(`/projects/${projectId}`);
}

export async function toggleBookmark(projectId: string) {
  const { supabase, user } = await getAuthenticatedContext();
  if (!supabase || !user) redirect("/auth/login");
  const { data: existing } = await supabase.from("bookmarks").select("id").eq("project_id", projectId).eq("user_id", user.id).maybeSingle();
  if (existing) await supabase.from("bookmarks").delete().eq("id", existing.id).eq("user_id", user.id);
  else await supabase.from("bookmarks").insert({ project_id: projectId, user_id: user.id });
  revalidatePath(`/projects/${projectId}`);
  revalidatePath("/dashboard/bookmarks");
}

export async function addComment(projectId: string, formData: FormData) {
  const body = String(formData.get("body") ?? "").trim();
  if (body.length < 1 || body.length > 2000) return;
  const { supabase, user } = await getAuthenticatedContext();
  if (!supabase || !user) redirect("/auth/login");
  const { error } = await supabase.from("comments").insert({ project_id: projectId, user_id: user.id, body });
  if (error) redirect(`/projects/${projectId}?comment=error`);
  revalidatePath(`/projects/${projectId}`);
}

export async function updateComment(projectId: string, commentId: string, formData: FormData) {
  const body = String(formData.get("body") ?? "").trim();
  if (body.length < 1 || body.length > 2000) redirect(`/projects/${projectId}?comment=invalid`);
  const { supabase, user } = await getAuthenticatedContext();
  if (!supabase || !user) redirect("/auth/login");
  const { error } = await supabase.from("comments").update({ body }).eq("id", commentId).eq("user_id", user.id);
  if (error) redirect(`/projects/${projectId}?comment=error`);
  revalidatePath(`/projects/${projectId}`);
}

export async function deleteComment(projectId: string, commentId: string) {
  const { supabase, user } = await getAuthenticatedContext();
  if (!supabase || !user) redirect("/auth/login");
  const { error } = await supabase.from("comments").delete().eq("id", commentId).eq("user_id", user.id);
  if (error) redirect(`/projects/${projectId}?comment=error`);
  revalidatePath(`/projects/${projectId}`);
}