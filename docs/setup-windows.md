# Windows Development Setup

KiForge targets Tauri v2 desktop builds on Windows, macOS, and Linux. For Windows development, install the native requirements first, then install the JavaScript dependencies.

## Prerequisites

Based on the official Tauri prerequisites page:

1. Install Microsoft C++ Build Tools and enable `Desktop development with C++`.
2. Ensure Microsoft Edge WebView2 is installed.
3. Install Rust with the MSVC toolchain. The official docs recommend `stable-msvc`.
4. Restart your terminal after installation so `cargo` and `rustc` are available.

## Suggested commands

PowerShell:

```powershell
winget install --id Rustlang.Rustup
rustup default stable-msvc
powershell -c "irm bun.sh/install.ps1 | iex"
bun --version
cargo --version
```

## Project bootstrap

From the repository root:

```powershell
bun install
bun run lint
bun run test
bun run dev
```

Start the Tauri shell after Rust is available:

```powershell
bun run tauri:dev
```

Create a production desktop build:

```powershell
bun run tauri:build
```

## Notes

- MSI packaging may require the Windows `VBSCRIPT` optional feature if installer generation fails.
- Keep the repository on a local NTFS path for the best tooling compatibility.
