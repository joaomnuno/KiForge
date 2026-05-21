import { Link } from "react-router-dom";
import { getRuntimeLabel } from "../../lib/runtime";
import { AccountMenu } from "./AccountMenu";

interface TopToolbarProps {
  searchPlaceholder?: string;
  searchValue?: string;
  onSearchChange?: (value: string) => void;
}

const unsupportedSearchPlaceholder =
  "Search is per-page; only Projects supports it today.";

export function TopToolbar({
  searchPlaceholder,
  searchValue,
  onSearchChange
}: TopToolbarProps) {
  const searchEnabled = onSearchChange !== undefined;

  return (
    <header className="topbar">
      <div className="topbar__group">
        <span className="topbar__brand">KiForge</span>
        <label className="topbar__search">
          <span className="topbar__search-icon">⌕</span>
          <input
            className="topbar__search-input"
            type="search"
            aria-label={
              searchEnabled ? "Search projects" : "Search unavailable"
            }
            onChange={
              searchEnabled
                ? (event) => onSearchChange(event.target.value)
                : undefined
            }
            placeholder={
              searchEnabled ? searchPlaceholder : unsupportedSearchPlaceholder
            }
            readOnly={!searchEnabled}
            value={searchEnabled ? (searchValue ?? "") : ""}
          />
        </label>
      </div>

      <div className="topbar__meta">
        <span className="runtime-pill">{getRuntimeLabel()}</span>
        <Link className="button button--primary" to="/projects/new">
          New Project
        </Link>
        <AccountMenu />
      </div>
    </header>
  );
}
