import { HashRouter, Navigate, Route, Routes } from "react-router-dom";
import { ProjectsPage } from "../features/projects/ProjectsPage";
import { NewProjectPage } from "../features/projects/NewProjectPage";
import { ComponentsPage } from "../features/components/ComponentsPage";
import { ConnectionsPage } from "../features/connections/ConnectionsPage";

export function App() {
  return (
    <HashRouter>
      <Routes>
        <Route path="/" element={<Navigate to="/projects" replace />} />
        <Route path="/projects" element={<ProjectsPage />} />
        <Route path="/projects/new" element={<NewProjectPage />} />
        <Route path="/workspace/components" element={<ComponentsPage />} />
        <Route path="/workspace/connections" element={<ConnectionsPage />} />
      </Routes>
    </HashRouter>
  );
}
