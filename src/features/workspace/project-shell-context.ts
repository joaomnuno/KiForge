import { useOutletContext } from "react-router-dom";
import type { ReactNode } from "react";

export interface ProjectShellContext {
  /** Mount inspector content in the project shell's right-side slot. Pass `null` to clear. */
  setInspector: (node: ReactNode | null) => void;
}

/**
 * Hook for workspace routes (Outlet children) to read the shell context.
 * Returns a stable `setInspector` reference safe to use inside useEffect.
 */
export function useProjectShell(): ProjectShellContext {
  return useOutletContext<ProjectShellContext>();
}
