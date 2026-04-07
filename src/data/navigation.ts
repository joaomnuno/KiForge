import type { AppNavigationItem } from "../types/domain";

export const appNavigation: readonly AppNavigationItem[] = [
  { key: "projects", label: "Projects", href: "/projects" },
  { key: "templates", label: "Templates", href: "/projects" },
  { key: "library", label: "Library", href: "/workspace/components" },
  { key: "devices", label: "Devices", href: "/workspace/components" },
  { key: "settings", label: "Settings", href: "/projects" }
];
