import type { HTMLAttributes, ReactNode } from "react";
import clsx from "clsx";
import "./Panel.css";

interface PanelProps extends HTMLAttributes<HTMLDivElement> {
  eyebrow?: string;
  title?: string;
  description?: string;
  headerActions?: ReactNode;
}

export function Panel({
  eyebrow,
  title,
  description,
  headerActions,
  className,
  children,
  ...props
}: PanelProps) {
  return (
    <section className={clsx("panel", className)} {...props}>
      {(eyebrow || title || description || headerActions) && (
        <header className="panel__header">
          <div>
            {eyebrow ? <p className="panel__eyebrow">{eyebrow}</p> : null}
            {title ? <h2 className="panel__title">{title}</h2> : null}
            {description ? (
              <p className="panel__description">{description}</p>
            ) : null}
          </div>
          {headerActions ? <div>{headerActions}</div> : null}
        </header>
      )}
      <div className="panel__body">{children}</div>
    </section>
  );
}
