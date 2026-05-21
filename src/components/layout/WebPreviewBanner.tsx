import { getRuntimeLabel, isTauriRuntime } from "../../lib/runtime";

export function WebPreviewBanner() {
  if (isTauriRuntime()) {
    return null;
  }

  return (
    <div
      aria-label="Web preview notice"
      className="web-preview-banner"
      role="status"
    >
      <span className="web-preview-banner__label">{getRuntimeLabel()}</span>
      <span>
        Exports and writes to disk are disabled. Open the desktop app to use
        them.
      </span>
    </div>
  );
}
