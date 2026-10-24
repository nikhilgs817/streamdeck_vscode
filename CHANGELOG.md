# Changelog

## 2.5.1

- Shared artwork library update (no change to keys).

## 2.5.0

- Bigger, bolder key labels (+1 pt, extra-bold Segoe UI).
- **Fixed:** multi-step keys (Toggle Terminal, New Terminal, Git Commit/Push/Pull, Save All, Zen Mode, Custom Command) failed on Windows PowerShell 5.1 ("Cannot convert System.Object[] to System.Int32").
- **Safer keys:** the plugin now checks that VS Code is really in front before every step and stops if focus moves; nothing is typed into another window.
- **Open Project:** Code.exe is started directly with one argument (no cmd.exe fallback); paths with quotes or shell characters are refused and a trailing `\` no longer breaks the path.
- **New keys:** Copilot Chat (Ctrl+Alt+I), Quick Fix (Ctrl+.), Toggle Panel (Ctrl+J), Extensions (Ctrl+Shift+X), More and Main. 33 actions; all existing action IDs kept.
- **New look:** VS Code Dark (default) with charcoal panels, VS Code blue accents, modern line icons and bold Segoe UI labels; every icon has its own animation, the icon gently moves and an accent light travels round the key. VS Code Light, Colourful, Vivid and Pro use the same icons.
- **Two-page layout:** page 1 has the everyday keys, **More** opens page 2.
- Installer: asks before installing Stream Deck through Windows Package Manager, waits up to 60 s for the plugin to start, keeps working when WMI is restricted, runs every rollback step independently and pins the package checksum.
- Reliability: the background helper restarts after a stuck command, and its crash budget resets after healthy replies.

## 2.4.1

- Added a double-click Windows installer with prerequisite checks, package verification, local backups, preserved profiles/settings and automatic rollback.
- Included the pinned Windows Daily Toolkit dependency for automatic app switching. Compatible or newer installed versions are kept.
- Added a connected-runtime startup receipt and isolated installer tests.
- Added installation, update, troubleshooting and recovery documentation.
- Switched the development bundler to official Rollup WASM for restricted Windows environments.
