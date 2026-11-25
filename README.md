# VS Code Controls

Unofficial Elgato Stream Deck plugin for **Visual Studio Code on Windows** (also Code Insiders and VSCodium). Version 3.1.0.0.

33 animated keys for commands, files, search, terminal, Git, run/debug, Copilot Chat and editing, plus Open Project, Custom Shortcut and Custom Command. The keys appear automatically when VS Code is in front (with Windows Toolkit), and **Back** returns to your main keys.

![Animated keys](docs/images/deck.gif)

## Install in three steps

1. Download **VSCodeControls-Installer-3.1.0.0.zip** from [Releases](https://github.com/nikhilgs817/streamdeck_vscode/releases/latest).
2. Right-click the ZIP, choose **Extract All**, and open the extracted folder.
3. Double-click **Install-VSCodeControls.cmd**. Wait for the success message; Stream Deck restarts automatically.

No Git, Node.js or build commands are needed. Windows Toolkit is included for automatic app switching. The installer verifies files, backs up your setup, keeps your layouts and settings, and rolls back a failed update. [Full installation, update and recovery guide](docs/INSTALL.md).

## New in 3.1: Design System 4

| What | Details |
|---|---|
| **Glass is the new default** | Frosted dark keys, a soft rim light and Title Case labels. VS Code Dark, VS Code Light, Vivid, Neon (formerly Colourful) and Pro are still here, plus the new **Mono** look. |
| **Custom colours** | Pick any two colours for a key instead of a theme. |
| **Motion styles** | Full, Glow only, Icon only or Still, at Slow, Calm, Normal or Fast. |
| **Glow and ripple** | Subtle, Normal or Bold glow, and a short ripple when you press a key (can be turned off per key). |
| **Labels** | Up to 18 letters, fitted to the key, in Auto, Title Case or UPPER CASE. |
| **Whole deck at once** | **Use this look on all keys** restyles every key of the plugin. |
| **Respects Windows** | Keys stop moving when Windows **Animation effects** is off (you can opt out). |

The design is shared with [Windows Toolkit](https://github.com/nikhilgs817/windows_toolkit) 3.1, so all your plugins can look the same.

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

Select a key in Stream Deck and open **Look**:

| Setting | Choices |
|---|---|
| **Style** | Glass (default), VS Code Dark, VS Code Light, Vivid, Neon, Mono or Pro |
| **Label** | Your own text (up to 18 letters, fitted to the key), Auto case / Title Case / UPPER CASE, or **Hide** |
| **Picture** | **Use my own picture…** (PNG, JPEG, GIF, SVG, WebP or BMP). **Remove picture** goes back to the drawn icon |
| **Animation** | Full, Glow only, Icon only or Still, at Slow, Calm (default), Normal or Fast |
| **Glow** | Subtle, Normal or Bold, plus **Ripple when pressed** |
| **Colour** | 42 colour themes, or two colours of your own with **Use these colours** (**Back to theme** undoes it). VS Code Dark uses VS Code's own colours |
| **Icon** | Swap the drawing for any of 90+ icons |

**Use this look on all keys** copies the style, animation, glow, label case and ripple to every key of this plugin, including keys on pages you can't see. Colours, icons and labels stay as they are. Change any key afterwards to give it its own look; **Reset look** (under the preview) returns a key to the defaults. Keys stay still while Windows **Settings › Accessibility › Visual effects › Animation effects** is off, unless you untick **Keep keys still when Windows animations are off**.

## Troubleshooting

- **Nothing happens when I press a key.** Every key brings VS Code to the front first and sends nothing if VS Code isn't in front (or focus moves away during a multi-step command). VS Code must be running; Open Project starts it.
- **A key does the wrong thing.** The keys use VS Code's default keybindings. If you changed one, put a **Custom Shortcut…** or **Custom Command…** key there instead (for example `Git: Sync`).
- **The keys don't appear when I open VS Code.** Automatic switching needs Windows Toolkit 2.6 or later (the installer adds it), the bundled **VS Code** profile, and **Follow focus** ticked in the **Back** key's settings. You can always pick the profile yourself from Stream Deck's profile list.
- **After Back, the app keys don't come back right away.** That's on purpose: they return the next time you leave the app and come back to it.
- **The keys don't move.** Windows **Animation effects** is off, or the key's **Animation** is set to Still. Turn either back on, or untick **Keep keys still when Windows animations are off**.
- **One key looks different after "Use this look on all keys".** Colours, icons, labels and pictures are kept on purpose. Select the key and choose **Reset look** to start it fresh.
- **Managed or locked-down PC.** If PowerShell runs in Constrained Language Mode or hidden PowerShell is blocked, the shortcut keys can't send keys.
- **Logs** are in `%APPDATA%\Elgato\StreamDeck\Plugins\com.windowstoolkit.vscode.sdPlugin\logs`. Installer problems are covered in the [installation guide](docs/INSTALL.md#if-installation-does-not-finish).

## Data and connections

Everything runs on your PC. Keys send keyboard shortcuts or Command Palette commands to the VS Code window, and Open Project starts VS Code with the folder you chose. The plugin makes no network requests and never reads your code or files.

Automatic app switching uses a local named pipe shared with Windows Toolkit; it carries only which plugin should show its keys, never app content or credentials. There is no telemetry. The installer downloads the matching public release from GitHub only when its package isn't already in the folder; backups and logs stay on your PC.

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
