# VS Code Controls

Unofficial Elgato Stream Deck plugin for **Visual Studio Code on Windows** (also Code Insiders and VSCodium). Version 3.1.0.0.

33 animated keys for commands, files, search, terminal, Git, run/debug, Copilot Chat and editing, plus Open Project, Custom Shortcut and Custom Command. The keys appear automatically when VS Code is in front (with Windows Toolkit), and **Back** returns to your main keys.

![Animated keys](docs/images/deck.gif)

## Install in three steps

1. Download **VSCodeControls-Installer-3.1.0.0.zip** from [Releases](https://github.com/nikhilgs817/streamdeck_vscode/releases/latest).
2. Right-click the ZIP, choose **Extract All**, and open the extracted folder.
3. Double-click **Install-VSCodeControls.cmd**. Wait for the success message; Stream Deck restarts automatically.

No Git, Node.js or build commands are needed. Windows Toolkit is included for automatic app switching. The installer verifies files, backs up your setup, keeps your layouts and settings, and rolls back a failed update. [Full installation, update and recovery guide](docs/INSTALL.md).

## The keys

**Page 1 (VS Code):** Back · Commands · Go to File · Search · Terminal / Explorer · Git · Commit · Push · Copilot Chat / Run · Debug · Stop · Save All · More

**Page 2 (More):** Main · Format · Quick Fix · Rename · Definition / Problems · Comment · Split · Sidebar · Panel / Pull · New Term · Extensions · Zen · Close

![Page 2](docs/images/page-1.png)

Also in the action list: Open Project…, Custom Shortcut… and Custom Command….

| Key | Sends |
|---|---|
| Commands, Go to File, Search | Ctrl+Shift+P, Ctrl+P, Ctrl+Shift+F |
| Terminal, New Term | View: Toggle Terminal, Terminal: Create New Terminal |
| Explorer, Git | Ctrl+Shift+E, Ctrl+Shift+G |
| Commit, Push, Pull | Git: Commit, Git: Push, Git: Pull (Command Palette) |
| Copilot Chat, Quick Fix, Panel, Extensions | Ctrl+Alt+I, Ctrl+., Ctrl+J, Ctrl+Shift+X |
| Run, Debug, Stop | Ctrl+F5, F5, Shift+F5 |
| Format, Save All | Shift+Alt+F, File: Save All |
| Sidebar, Split, Comment | Ctrl+B, Ctrl+\\, Ctrl+/ |
| Definition, Rename, Problems | F12, F2, Ctrl+Shift+M |
| Zen, Close | View: Toggle Zen Mode, Ctrl+W |
| Open Project… | Opens a folder (tap / double-tap / hold = monitor 1 / 2 / 3) and shows these keys |
| Custom Shortcut… / Custom Command… | Any shortcut (e.g. `Ctrl+K Ctrl+S`) / any palette command (e.g. `Git: Sync`) |

Every key first brings VS Code to the front and **sends nothing if VS Code is not in front**; it also stops if focus moves away during a multi-step command. VS Code must be running (Open Project starts it).

## Appearance

![Styles](docs/images/styles.png)

**Glass** is the default: frosted dark keys, a soft rim light, Title Case labels and an animated icon on every key (the commit dot pulses, push/pull arrows lift, the breakpoint badge pulses, the terminal cursor blinks, the split line slides). Pick another look for one key, or press **Use this look on all keys** in any key's settings to restyle the whole deck.

| Style | Look |
|---|---|
| **Glass** (default) | Frosted dark glass, a quiet glow and Title Case labels |
| **VS Code Dark** | Charcoal panels, VS Code blue accents, bold Segoe UI labels |
| **VS Code Light** | Light editor panels with the same icons |
| **Vivid** | White icons on a bright gradient |
| **Neon** | Coloured icons with a glowing edge on dark glass (formerly Colourful) |
| **Mono** | Monochrome icons with a single colour dot |
| **Pro** | Restrained slate keys with a thin accent strip |

Under **Look** you can also pick any of 40+ colour themes or two colours of your own, Full, Glow only, Icon only or Still animation at four speeds, glow strength, a press ripple, the label case and your own label (up to 18 letters) or picture. Keys go still while Windows **Animation effects** is off. The design is shared with [Windows Toolkit](https://github.com/nikhilgs817/windows_toolkit).

## Build and verify

```sh
npm ci
npm run build
npx tsc --noEmit
npm test
npm run validate
npm run pack
npm run build:installer
npm run test:installer   # Windows only
```

## Known limits

- Shortcuts are VS Code's defaults. If you changed a keybinding, use Custom Shortcut or Custom Command.
- Copilot Chat needs the GitHub Copilot Chat extension.
- Managed PCs that run PowerShell in Constrained Language Mode can stop the keys.

MIT license. Unofficial plugin; not affiliated with or endorsed by Microsoft. Visual Studio Code is a trademark of Microsoft Corporation. The icons are original artwork.
