const LAST_EXPORT_DIR_STORAGE_KEY = "kiforge.last-export-dir.v1";

function getStorage(): Storage | null {
  if (typeof window === "undefined") return null;
  return window.localStorage;
}

export function getLastExportDestination(): string | null {
  return getStorage()?.getItem(LAST_EXPORT_DIR_STORAGE_KEY) ?? null;
}

export function rememberExportDestination(dir: string): void {
  getStorage()?.setItem(LAST_EXPORT_DIR_STORAGE_KEY, dir);
}

/**
 * Open the native OS folder picker. Returns the absolute path the user
 * selected, or `null` if they cancelled. The previous selection is used
 * as the default starting directory.
 */
export async function pickExportDestination(
  defaultPath?: string
): Promise<string | null> {
  const { open } = await import("@tauri-apps/plugin-dialog");
  const selection = await open({
    directory: true,
    multiple: false,
    title: "Choose where to write the KiCad bundle",
    defaultPath: defaultPath ?? getLastExportDestination() ?? undefined
  });
  if (typeof selection !== "string") {
    return null;
  }
  return selection;
}
