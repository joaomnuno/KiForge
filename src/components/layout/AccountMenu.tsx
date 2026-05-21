import { useNavigate } from "react-router-dom";
import { useSettingsStore } from "../../features/settings/settings-store";
import {
  DropdownMenu,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator
} from "../ui/DropdownMenu";

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

  function go(path: string) {
    navigate(path);
  }

  return (
    <DropdownMenu
      trigger={
        <button
          aria-label="Account menu"
          className="avatar avatar--button"
          type="button"
        >
          {getInitials(displayName)}
        </button>
      }
    >
      <DropdownMenuLabel className="account-menu__header">
        <strong>{displayName}</strong>
        <span>{email}</span>
      </DropdownMenuLabel>
      <DropdownMenuItem onSelect={() => go("/settings")}>
        Preferences
      </DropdownMenuItem>
      <DropdownMenuItem onSelect={() => go("/templates")}>
        Browse templates
      </DropdownMenuItem>
      <DropdownMenuItem onSelect={() => go("/projects/new")}>
        New project
      </DropdownMenuItem>
      <DropdownMenuSeparator />
      <DropdownMenuItem
        className="account-menu__item--muted"
        onSelect={() => {
          window.alert(
            "KiForge runs locally. Sign-out is not required for offline use."
          );
        }}
      >
        Sign out
      </DropdownMenuItem>
    </DropdownMenu>
  );
}
