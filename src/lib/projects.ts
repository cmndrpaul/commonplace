import "server-only";
import { cache } from "react";
import { createServerSupabaseClient, getSupabasePublicConfig } from "@/lib/supabase/server";
import type { ProjectCategory } from "@/lib/projects/constants";
import { PROJECT_CATEGORIES } from "@/lib/projects/constants";

export type ProjectSummary = {
  id: string;
  title: string;
  description: string;
  category: string;
  createdAt: string;
  thumbnailUrl: string | null;
  authorName: string | null;
  likeCount: number;
};

export async function getProjects(options: { query?: string; category?: string; limit?: number; page?: number; userId?: string; projectIds?: string[] } = {}) {
  const configured = Boolean(getSupabasePublicConfig());
  const supabase = await createServerSupabaseClient();
  if (!supabase) return { projects: [] as ProjectSummary[], configured, available: false, totalCount: 0 };

  const limit = options.limit ?? 24;
  const page = Math.max(1, options.page ?? 1);
  let request = supabase.from("projects").select("id, title, description, category, created_at, thumbnail_path, user_id", { count: "exact" }).eq("status", "published").order("created_at", { ascending: false }).range((page - 1) * limit, page * limit - 1);
  if (options.userId) request = request.eq("user_id", options.userId);
  if (options.projectIds) request = request.in("id", options.projectIds);
  if (options.category && PROJECT_CATEGORIES.includes(options.category as ProjectCategory)) request = request.eq("category", options.category as ProjectCategory);
  const query = options.query?.trim().replace(/[%,.()]/g, " ").replace(/\s+/g, " ").slice(0, 80);
  if (query) request = request.textSearch("search_document", query, { type: "websearch", config: "english" });

  const { data, error, count } = await request;
  if (error) return { projects: [] as ProjectSummary[], configured, available: false, totalCount: 0 };
  if (!data?.length) return { projects: [] as ProjectSummary[], configured, available: true, totalCount: count ?? 0 };

  const userIds = [...new Set(data.map((project) => project.user_id))];
  const [{ data: profiles }, { data: likeCounts }] = await Promise.all([
    supabase.from("profiles").select("id, display_name, username").in("id", userIds),
    supabase.from("project_like_counts").select("project_id, like_count").in("project_id", data.map((project) => project.id)),
  ]);
  const names = new Map(profiles?.map((profile) => [profile.id, profile.display_name || profile.username]) ?? []);
  const likes = new Map(likeCounts?.map((item) => [item.project_id, item.like_count]) ?? []);

  const projects = await Promise.all(data.map(async (project) => {
    const { data: image } = project.thumbnail_path ? await supabase.storage.from("project-assets").createSignedUrl(project.thumbnail_path, 600) : { data: null };
    return { id: project.id, title: project.title, description: project.description, category: project.category, createdAt: project.created_at, thumbnailUrl: image?.signedUrl ?? null, authorName: names.get(project.user_id) ?? null, likeCount: likes.get(project.id) ?? 0 };
  }));
  return { configured, available: true, projects, totalCount: count ?? projects.length };
}

export const getProjectDetails = cache(async (projectId: string) => {
  const supabase = await createServerSupabaseClient();
  if (!supabase) return null;
  const [{ data: project }, { data: comments }, { data: { user } }] = await Promise.all([
    supabase.from("projects").select("id, user_id, title, description, category, status, thumbnail_path, file_path, project_url, created_at, author:profiles!projects_user_id_fkey(username, display_name)").eq("id", projectId).maybeSingle(),
    supabase.from("comments").select("id, user_id, body, created_at, author:profiles!comments_user_id_fkey(username, display_name)").eq("project_id", projectId).order("created_at", { ascending: false }).limit(50),
    supabase.auth.getUser(),
  ]);
  if (!project) return null;

  const [{ data: likeCount }, { data: thumbnail }, { data: download }, { data: liked }, { data: bookmarked }] = await Promise.all([
    supabase.from("project_like_counts").select("like_count").eq("project_id", projectId).maybeSingle(),
    project.thumbnail_path ? supabase.storage.from("project-assets").createSignedUrl(project.thumbnail_path, 600) : Promise.resolve({ data: null }),
    project.file_path ? supabase.storage.from("project-assets").createSignedUrl(project.file_path, 300) : Promise.resolve({ data: null }),
    user ? supabase.from("likes").select("id").eq("project_id", projectId).eq("user_id", user.id).maybeSingle() : Promise.resolve({ data: null }),
    user ? supabase.from("bookmarks").select("id").eq("project_id", projectId).eq("user_id", user.id).maybeSingle() : Promise.resolve({ data: null }),
  ]);

  return {
    project,
    author: { name: project.author?.display_name ?? "Community member", username: project.author?.username ?? null },
    thumbnailUrl: thumbnail?.signedUrl ?? null,
    downloadUrl: download?.signedUrl ?? null,
    likeCount: likeCount?.like_count ?? 0,
    liked: Boolean(liked),
    bookmarked: Boolean(bookmarked),
    isOwner: user?.id === project.user_id,
    viewerId: user?.id ?? null,
    comments: comments?.map((comment) => ({ ...comment, authorName: comment.author?.display_name || comment.author?.username || "Community member" })) ?? [],
  };
});