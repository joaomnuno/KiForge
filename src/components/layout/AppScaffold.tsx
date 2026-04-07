import type { ReactNode } from "react";
import { appNavigation } from "../../data/mockData";
import { AppSidebar } from "./AppSidebar";
import { TopToolbar } from "./TopToolbar";
import { ProjectStrip } from "./ProjectStrip";

interface AppScaffoldProps {
  activeNav: string;
  searchPlaceholder: string;
  projectStrip?: {
    name: string;
    controller: string;
    status: string;
    voltageDomain: string;
  };
  inspector?: ReactNode;
  children: ReactNode;
}

export function AppScaffold({
  activeNav,
  searchPlaceholder,
  projectStrip,
  inspector,
  children
}: AppScaffoldProps) {
  return (
    <div className="shell">
      <AppSidebar items={appNavigation} activeKey={activeNav} />
      <div className="shell__content">
        <TopToolbar searchPlaceholder={searchPlaceholder} />
        {projectStrip ? <ProjectStrip {...projectStrip} /> : null}
        <div
          className={
            inspector ? "workspace workspace--with-inspector" : "workspace"
          }
        >
          <main className="workspace__main">{children}</main>
          {inspector ? <aside className="workspace__inspector">{inspector}</aside> : null}
        </div>
      </div>
    </div>
  );
}
