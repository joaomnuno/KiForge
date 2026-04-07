import { Link } from "react-router-dom";
import clsx from "clsx";

interface SidebarItem {
  key: string;
  label: string;
  href: string;
}

interface AppSidebarProps {
  items: readonly SidebarItem[];
  activeKey: string;
}

export function AppSidebar({ items, activeKey }: AppSidebarProps) {
  return (
    <aside className="sidebar">
      <div className="sidebar__brand">
        <div className="sidebar__brand-mark">KF</div>
        <div>
          <p className="sidebar__headline">KiForge</p>
          <p className="sidebar__caption">Hardware planning workspace</p>
        </div>
      </div>

      <nav className="sidebar__nav" aria-label="Primary navigation">
        {items.map((item) => (
          <Link
            key={item.key}
            className={clsx("nav-link", {
              "nav-link--active": item.key === activeKey
            })}
            to={item.href}
          >
            {item.label}
          </Link>
        ))}
      </nav>

      <div className="sidebar__footer">
        <p className="sidebar__caption">MVP scaffold</p>
        <p className="sidebar__support">Native target: Windows, macOS, Linux</p>
      </div>
    </aside>
  );
}
