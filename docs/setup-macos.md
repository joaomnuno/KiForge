# macOS Development Setup

## Prerequisites

Based on the official Tauri prerequisites page:

1. Install Xcode Command Line Tools for desktop-only development:

```bash
xcode-select --install
```

2. Install Rust:

```bash
curl --proto '=https' --tlsv1.2 https://sh.rustup.rs -sSf | sh
```

3. Install Bun (the project's package manager and JavaScript runtime):

```bash
curl -fsSL https://bun.sh/install | bash
```

4. Confirm the toolchain is available:

```bash
bun --version
cargo --version
rustc --version
```

## Project bootstrap

```bash
bun install
bun run lint
bun run test
bun run dev
```

Run the native app:

```bash
bun run tauri:dev
```

Build a macOS bundle:

```bash
bun run tauri:build
```

## Notes

- If code signing or notarization is required later, configure Apple certificates and secrets in the release workflow.
- Full iOS support is out of scope for this MVP.
