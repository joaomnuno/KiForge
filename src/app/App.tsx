import { HashRouter, Navigate, Route, Routes } from "react-router-dom";
import { WebPreviewBanner } from "../components/layout/WebPreviewBanner";
import { ProjectsPage } from "../features/projects/ProjectsPage";
import { NewProjectPage } from "../features/projects/NewProjectPage";
import { ComponentsPage } from "../features/components/ComponentsPage";
import { ConnectionsPage } from "../features/connections/ConnectionsPage";
import { LibraryPage } from "../features/library/LibraryPage";
import { TemplatesPage } from "../features/templates/TemplatesPage";
import { SettingsPage } from "../features/settings/SettingsPage";
import { ProjectShell } from "../features/workspace/ProjectShell";
import { ProjectOverviewPage } from "../features/workspace/ProjectOverviewPage";
import { useProjectBootstrap } from "../features/projects/use-project-bootstrap";

export function App() {
  useProjectBootstrap();

  return (
    <HashRouter>
      <div className="app-root">
        <WebPreviewBanner />
        <Routes>
          <Route path="/" element={<Navigate to="/projects" replace />} />
          <Route path="/projects" element={<ProjectsPage />} />
          <Route path="/projects/new" element={<NewProjectPage />} />
          <Route path="/templates" element={<TemplatesPage />} />
          <Route path="/library" element={<LibraryPage />} />
          <Route path="/settings" element={<SettingsPage />} />
          <Route element={<ProjectShell />}>
            <Route
              path="/workspace"
              element={<Navigate to="/workspace/overview" replace />}
            />
            <Route
              path="/workspace/overview"
              element={<ProjectOverviewPage />}
            />
            <Route path="/workspace/components" element={<ComponentsPage />} />
            <Route
              path="/workspace/connections"
              element={<ConnectionsPage />}
            />
          </Route>
        </Routes>
      </div>
    </HashRouter>
  );
}
