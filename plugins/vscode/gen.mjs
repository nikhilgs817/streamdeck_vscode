// Generates manifest.json, images and the bundled key layout ("VS Code" profile) for Daily Ops – VS Code v2.
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { readFileSync } from "node:fs";
import { PRESET_ICONS, setAppDesign } from "../../shared/icons.js";
import { buildProfile, copyUi, writeActionImages, writePluginIcons, writer } from "../../tools/common.mjs";

const here = dirname(fileURLToPath(import.meta.url));
const UUID = "com.dailyops.vscode.v2";
const NAME = "VS Code Controls";
const VERSION = "2.4.0.0";
const sd = join(here, `${UUID}.sdPlugin`);
const PROFILE = "profiles/VS Code"; // must match deck.ts PROFILE
const DESIGN=JSON.parse(readFileSync(join(here,'../../app-design.json'),'utf8'));
setAppDesign(DESIGN);
for(const [kind,preset] of Object.entries(PRESET_ICONS))if(kind.startsWith('vsc-'))preset.style='app';

/** id, list name, tooltip — order = order in the Stream Deck action list. */
const ACTIONS = [
	["back", "Back to Main Keys", "Returns to your main keys. Settings: follow VS Code focus, return when VS Code closes."],
	["project", "Open Project…", "Opens a folder in VS Code (tap / double-tap / hold = monitor 1 / 2 / 3) and shows these keys."],
	["palette", "Command Palette", "Ctrl+Shift+P"],
	["quickopen", "Go to File", "Quick Open (Ctrl+P)"],
	["search", "Search in Files", "Ctrl+Shift+F"],
	["terminal", "Toggle Terminal", "Show or hide the terminal panel"],
	["newterm", "New Terminal", "Terminal: Create New Terminal"],
	["explorer", "Explorer", "Ctrl+Shift+E"],
	["scm", "Source Control", "Ctrl+Shift+G"],
	["commit", "Git Commit", "Git: Commit"],
	["push", "Git Push", "Git: Push"],
	["pull", "Git Pull", "Git: Pull"],
	["run", "Run", "Run without debugging (Ctrl+F5)"],
	["debug", "Debug / Continue", "F5"],
	["stop", "Stop", "Stop debugging (Shift+F5)"],
	["format", "Format Document", "Shift+Alt+F"],
	["saveall", "Save All", "File: Save All"],
	["sidebar", "Toggle Sidebar", "Ctrl+B"],
	["split", "Split Editor", "Ctrl+\\"],
	["comment", "Toggle Comment", "Ctrl+/"],
	["definition", "Go to Definition", "F12"],
	["rename", "Rename Symbol", "F2"],
	["problems", "Problems", "Ctrl+Shift+M"],
	["zen", "Zen Mode", "View: Toggle Zen Mode"],
	["close", "Close Editor", "Ctrl+W"],
	["shortcut", "Custom Shortcut…", "Any VS Code keyboard shortcut, e.g. Ctrl+K Ctrl+S"],
	["command", "Custom Command…", "Any Command Palette command, e.g. Git: Sync"],
];

/** Default layout for a 15-key Stream Deck (5 × 3), "column,row". */
const LAYOUT = {
	"0,0": "back", "1,0": "palette", "2,0": "quickopen", "3,0": "search", "4,0": "terminal",
	"0,1": "explorer", "1,1": "scm", "2,1": "commit", "3,1": "push", "4,1": "newterm",
	"0,2": "run", "1,2": "debug", "2,2": "stop", "3,2": "format", "4,2": "saveall",
};

const write = writer(sd);
writeActionImages(sd, ACTIONS.map(([id]) => ({ id, kind: `vsc-${id}` })));
writePluginIcons(sd, { glyph: "code", theme: "azure", style: "app" });
write('app-design.json', JSON.stringify(DESIGN));
copyUi(sd);
write('ui/companion.js','window.DailyOpsDesign='+JSON.stringify(DESIGN)+';window.DailyOpsIcons.setAppDesign(window.DailyOpsDesign);for(const [kind,preset] of Object.entries(window.DailyOpsIcons.PRESET_ICONS))if(kind.startsWith("vsc-"))preset.style="app";');

buildProfile({ sd, uuid: UUID, pluginName: NAME, version: VERSION, profile: PROFILE, title: "VS Code", layout: LAYOUT, actions: ACTIONS });

const manifest = {
	$schema: "https://schemas.elgato.com/streamdeck/plugins/manifest.json",
	Name: NAME,
	Version: VERSION,
	Author: "Daily Ops",
	Description: "VS Code keys for Stream Deck: commands, git, run/debug and more. Opens with Daily Ops v2 and follows VS Code focus — the keys appear when VS Code is in front and go back when you leave.",
	UUID,
	Icon: "imgs/plugin/icon",
	Category: NAME,
	CategoryIcon: "imgs/plugin/category",
	CodePath: "bin/plugin.js",
	PropertyInspectorPath: "ui/pi.html",
	SDKVersion: 2,
	Software: { MinimumVersion: "7.1" },
	OS: [{ Platform: "windows", MinimumVersion: "10" }],
	Nodejs: { Version: "20" },
	ApplicationsToMonitor: { windows: ["Code.exe", "Code - Insiders.exe", "VSCodium.exe"] },
	Profiles: [{ Name: PROFILE, DeviceType: 0, Readonly: false, DontAutoSwitchWhenInstalled: true, AutoInstall: true }],
	Actions: ACTIONS.map(([id, name, tip]) => ({
		Name: name,
		UUID: `${UUID}.${id}`,
		Icon: `imgs/actions/${id}`,
		Tooltip: tip,
		Controllers: ["Keypad"],
		States: [{ Image: `imgs/keys/${id}`, ShowTitle: false, TitleAlignment: "bottom" }],
	})),
};
write("manifest.json", JSON.stringify(manifest, null, "\t") + "\n");
console.log(`Generated ${NAME}: ${ACTIONS.length} actions + layout "${PROFILE}"`);
