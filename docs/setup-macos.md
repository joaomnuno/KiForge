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

3. Confirm the toolchain is available:

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

Build a macOS bundle:

```bash
npm run tauri:build
```

## Notes

- If code signing or notarization is required later, configure Apple certificates and secrets in the release workflow.
- Full iOS support is out of scope for this MVP.
