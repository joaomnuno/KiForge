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

Confirm the toolchain:

```bash
node --version
npm --version
cargo --version
rustc --version
```

## Project bootstrap

```bash
npm install
npm run lint
npm run test
npm run dev
```

Run the native app:

```bash
npm run tauri:dev
```

Build desktop bundles:

```bash
npm run tauri:build
```

## Notes

- Package names vary by distribution; use the Tauri prerequisites page for Fedora, Arch, openSUSE, Alpine, and others.
- AppImage and `.deb` packaging should be validated in CI, not only on local developer machines.
