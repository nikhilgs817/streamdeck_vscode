# VS Code Controls

Windows Stream Deck companion, version 2.4.1.0. Includes 27 editor actions, configurable shortcuts and commands, project launching, automatic focus switching and Back.

The installer includes Windows Daily Toolkit for direct switching with other app companions. Existing action IDs and the editable VS Code profile are preserved. The default App theme follows the editor's charcoal panels, blue accent and status-bar motion. Pro, Colourful and Vivid looks, 29 colours and six-second/12 fps animation are available on every key.

## Install in three steps

1. Download **VSCodeControls-Installer-2.4.1.0.zip** from [Releases](https://github.com/nikhilgs817/streamdeck_vscode/releases/latest).
2. Right-click the ZIP, choose **Extract All**, and open the extracted folder.
3. Double-click **Install-VSCodeControls.cmd**. Wait for the installation success message; Stream Deck restarts automatically.

No Git, Node.js or build commands are required. Windows Daily Toolkit is included for automatic app switching. The installer verifies files, backs up your setup, preserves existing layouts/settings and rolls back failed updates. [Full installation, update and recovery guide](docs/INSTALL.md).

## Build

![Animated editor keys](docs/images/deck.gif)

```sh
npm ci
npm run build
npx tsc --noEmit
npm test
npm run validate
npm run pack
npm run build:installer
npm run test:installer
```

The packaged `.streamDeckPlugin` remains available as a manual alternative; accept its editable VS Code profile when offered. Select VS Code with Toolkit Open App, or focus the editor. Back returns to the main keys.

MIT license. Unofficial plugin; not affiliated with Microsoft.

The build uses the official Rollup WASM package to avoid native parser dependencies on restricted Windows PCs.
