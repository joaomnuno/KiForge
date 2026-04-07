declare global {
  interface Window {
    __TAURI_INTERNALS__?: unknown;
  }
}

export function isTauriRuntime() {
  return typeof window !== "undefined" && "__TAURI_INTERNALS__" in window;
}

export function getRuntimeLabel() {
  return isTauriRuntime() ? "Tauri shell" : "Web preview";
}
