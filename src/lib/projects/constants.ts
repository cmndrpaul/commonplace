export const PROJECT_CATEGORIES = [
  "School project",
  "Programming",
  "Research",
  "Design",
  "Engineering",
  "Other",
] as const;

export type ProjectCategory = (typeof PROJECT_CATEGORIES)[number];