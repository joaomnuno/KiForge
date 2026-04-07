type TauriWindow = Window & {
  __TAURI_INTERNALS__?: unknown;
};

export function isTauriRuntime() {
  if (typeof window === "undefined") {
    return false;
  }

  return Boolean((window as TauriWindow).__TAURI_INTERNALS__);
}

export function getRuntimeLabel() {
  return isTauriRuntime() ? "Tauri shell" : "Web preview";
}
