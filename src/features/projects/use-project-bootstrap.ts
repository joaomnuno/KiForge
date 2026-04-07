import { useEffect } from "react";
import { useWorkspaceStore } from "./project-store";

export function useProjectBootstrap() {
  const initialize = useWorkspaceStore((state) => state.initialize);

  useEffect(() => {
    void initialize();
  }, [initialize]);
}
