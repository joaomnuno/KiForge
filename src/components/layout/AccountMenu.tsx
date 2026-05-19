import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useSettingsStore } from "../../features/settings/settings-store";

function getInitials(displayName: string) {
  const parts = displayName.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) {
    return "?";
  }

  if (parts.length === 1) {
    return parts[0].slice(0, 2).toUpperCase();
  }

  return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
}

export function AccountMenu() {
  const navigate = useNavigate();
  const displayName = useSettingsStore((state) => state.displayName);
  const email = useSettingsStore((state) => state.email);
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    function handlePointerDown(event: MouseEvent) {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setIsOpen(false);
      }
    }

    document.addEventListener("mousedown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen]);

  function go(path: string) {
    setIsOpen(false);
    navigate(path);
  }

  return (
    <div className="account-menu" ref={containerRef}>
      <button
        aria-expanded={isOpen}
        aria-haspopup="menu"
        aria-label="Account menu"
        className="avatar avatar--button"
        onClick={() => setIsOpen((value) => !value)}
        type="button"
      >
        {getInitials(displayName)}
      </button>

      {isOpen ? (
        <div className="account-menu__panel" role="menu">
          <div className="account-menu__header">
            <strong>{displayName}</strong>
            <span>{email}</span>
          </div>

          <div className="account-menu__group">
            <button
              className="account-menu__item"
              onClick={() => go("/settings")}
              role="menuitem"
              type="button"
            >
              Preferences
            </button>
            <button
              className="account-menu__item"
              onClick={() => go("/templates")}
              role="menuitem"
              type="button"
            >
              Browse templates
            </button>
            <button
              className="account-menu__item"
              onClick={() => go("/projects/new")}
              role="menuitem"
              type="button"
            >
              New project
            </button>
          </div>

          <div className="account-menu__group account-menu__group--last">
            <button
              className="account-menu__item account-menu__item--muted"
              onClick={() => {
                setIsOpen(false);
                window.alert(
                  "KiForge runs locally. Sign-out is not required for offline use."
                );
              }}
              role="menuitem"
              type="button"
            >
              Sign out
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
