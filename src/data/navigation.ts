import type { AppNavigationItem } from "../types/domain";

export const appNavigation: readonly AppNavigationItem[] = [
  { key: "projects", label: "Projects", href: "/projects" },
  { key: "templates", label: "Templates", href: "/templates" },
  { key: "library", label: "Library", href: "/workspace/components" },
  { key: "devices", label: "Devices", href: "/workspace/connections" },
  { key: "settings", label: "Settings", href: "/settings" }
];
