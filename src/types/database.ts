import type { ProjectCategory } from "@/lib/projects/constants";

type Table<Row, Insert, Update> = {
  Row: Row;
  Insert: Insert;
  Update: Update;
  Relationships: [];
};

type ProfileRow = { id: string; username: string; display_name: string; bio: string; avatar_path: string | null; created_at: string; updated_at: string };
type ProjectRow = { id: string; user_id: string; title: string; description: string; search_document: string; category: ProjectCategory; status: "draft" | "published"; thumbnail_path: string | null; file_path: string | null; project_url: string | null; created_at: string; updated_at: string };
type CommentRow = { id: string; project_id: string; user_id: string; body: string; created_at: string; updated_at: string };
type ReactionRow = { id: string; project_id: string; user_id: string; created_at: string };

export type Database = {
  public: {
    Tables: {
      profiles: Table<ProfileRow, Pick<ProfileRow, "id" | "username" | "display_name"> & Partial<Pick<ProfileRow, "bio" | "avatar_path" | "created_at" | "updated_at">>, Partial<Omit<ProfileRow, "id" | "created_at">>>;
      projects: Table<ProjectRow, Pick<ProjectRow, "user_id" | "title" | "description" | "category"> & Partial<Omit<ProjectRow, "id" | "user_id" | "title" | "description" | "category">>, Partial<Omit<ProjectRow, "id" | "user_id" | "created_at">>>;
      comments: Table<CommentRow, Pick<CommentRow, "project_id" | "user_id" | "body"> & Partial<Pick<CommentRow, "id" | "created_at" | "updated_at">>, Partial<Pick<CommentRow, "body" | "updated_at">>>;
      likes: Table<ReactionRow, Pick<ReactionRow, "project_id" | "user_id"> & Partial<Pick<ReactionRow, "id" | "created_at">>, never>;
      bookmarks: Table<ReactionRow, Pick<ReactionRow, "project_id" | "user_id"> & Partial<Pick<ReactionRow, "id" | "created_at">>, never>;
    };
    Views: {
      project_like_counts: { Row: { project_id: string; like_count: number }; Relationships: [] };
    };
    Functions: Record<never, never>;
    Enums: { project_category: ProjectCategory; project_status: "draft" | "published" };
    CompositeTypes: Record<never, never>;
  };
};