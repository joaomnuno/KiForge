import type { AppNavigationItem } from "../types/domain";

export const appNavigation: readonly AppNavigationItem[] = [
  { key: "projects", label: "Projects", href: "/projects" },
  { key: "templates", label: "Templates", href: "/templates" },
  { key: "library", label: "Library", href: "/library" },
  { key: "settings", label: "Settings", href: "/settings" }
];
