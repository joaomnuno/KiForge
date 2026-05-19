# Linux Development Setup

## Prerequisites

For Debian/Ubuntu-based systems, the official Tauri prerequisites include:

```bash
sudo apt update
sudo apt install libwebkit2gtk-4.1-dev \
  build-essential \
  curl \
  wget \
  file \
  libxdo-dev \
  libssl-dev \
  libayatana-appindicator3-dev \
  librsvg2-dev
```

Install Rust:

```bash
curl --proto '=https' --tlsv1.2 https://sh.rustup.rs -sSf | sh
```

Install Bun (the project's package manager and JavaScript runtime):

```bash
curl -fsSL https://bun.sh/install | bash
```

Confirm the toolchain:

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

Build desktop bundles:

```bash
bun run tauri:build
```

## Notes

- Package names vary by distribution; use the Tauri prerequisites page for Fedora, Arch, openSUSE, Alpine, and others.
- AppImage and `.deb` packaging should be validated in CI, not only on local developer machines.
