import { Link } from "react-router-dom";
import { getRuntimeLabel } from "../../lib/runtime";

interface TopToolbarProps {
  searchPlaceholder: string;
}

export function TopToolbar({ searchPlaceholder }: TopToolbarProps) {
  return (
    <header className="topbar">
      <div className="topbar__group">
        <span className="topbar__brand">KiForge</span>
        <label className="topbar__search">
          <span className="topbar__search-icon">⌕</span>
          <input
            className="topbar__search-input"
            type="search"
            placeholder={searchPlaceholder}
          />
        </label>
      </div>

      <div className="topbar__meta">
        <span className="runtime-pill">{getRuntimeLabel()}</span>
        <Link className="button button--primary" to="/projects/new">
          New Project
        </Link>
        <div className="avatar">JN</div>
      </div>
    </header>
  );
}
