<p align="center">
  <img src="../assets/pocketrisu-banner-1024.png" alt="PocketRisu Alter — Self-hosted AI Roleplay Chat Platform" width="900" />
</p>

<h1 align="center">PocketRisu Alter</h1>

<p align="center">
  <a href="../README.md">한국어</a> | <strong>English</strong>
</p>

<p align="center">
  <a href="../LICENSE">
    <img alt="License: GPL-3.0" src="https://img.shields.io/badge/license-GPL--3.0-blue" />
  </a>
  <a href="https://nodejs.org/">
    <img alt="Node" src="https://img.shields.io/badge/node-%E2%89%A522.12-brightgreen" />
  </a>
</p>

PocketRisu Alter is a modified fork of [PocketRisu](https://github.com/PocketRisu/PocketRisu) — a self-hosted AI roleplay chat platform you run on your PC or personal server and access from PC, tablet, and smartphone through a web browser.

Based on PocketRisu v1.7.3 (commit `9eeccfd2`, June 8 2026). This is a nightly build with experimental features and UI changes on top.

> **Warning:** This repository is an unstable nightly build. Features may break or change. Backup your data before use.

<p align="center">
  <table>
    <tr>
      <td align="center"><img src="../assets/screenshots/screenshot-pc-chat.png" alt="PC chat" height="420" /></td>
      <td align="center"><img src="../assets/screenshots/screenshot-mobile-chat.png" alt="Mobile chat" height="420" /></td>
    </tr>
    <tr>
      <td align="center"><b>PC</b></td>
      <td align="center"><b>Mobile</b></td>
    </tr>
  </table>
</p>

## Supported Run Methods

PocketRisu Alter supports Docker and source-based server execution only.

- [Installation guide](../docs/en/install.md)
- [RisuAI data migration guide](../docs/en/migration.md)
- [Remote access guide](../docs/en/remote.md)

Docker uses a separate volume (`pocketrisu_alter_save`) from PocketRisu/PocketRisu NodeOnly by default. Edit `docker-compose.yml` `volumes` to share storage.

## Key Differences from PocketRisu

- **Text streaming stability**: Adjusted streaming output refresh rates to reduce mobile rendering lag
- **Server-side API calls**: Supported OpenAI-compatible requests run as server jobs; continues processing even if browser disconnects
- **Theme and color changes**: Alter-specific design tokens, color schemes, chat bubble and settings page styles
- **Model preset enhancements**: Backend execution indicator, image/system/role capability toggles, compatibility handling
- **UI adjustments**: Refined sidebar, chat list, model profile browser, mobile header layouts and interactions
- **Multi-Agent RP (MARP)**: Backend-integrated multi-agent roleplay pipeline using parallel AI agents for richer interactions. Ported from [MARP](https://github.com/Sallos725/MARP) by Sallos

## Features

Core features follow PocketRisu. See [PocketRisu](https://github.com/PocketRisu/PocketRisu) for details on supported AI providers, characters/chats, lorebooks, presets, plugins, backup/restore, and more.

## RisuAI Compatibility

PocketRisu Alter can import RisuAI/PocketRisu family data:

- RisuRealm character downloads
- Character cards (`.charx`, `.risum`, `.risup`, etc.)
- Modules, lorebooks, presets
- Backup files (`.bin`)

See the [migration guide](../docs/en/migration.md) for details.

## License

[GPL-3.0](../LICENSE)
