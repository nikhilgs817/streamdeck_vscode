import { action, type Action, type KeyDownEvent } from "@elgato/streamdeck";
import { DailyAction, LaunchAction, log, type Appearance, type FolderSettings } from "../../../shared/base.js";
import { ps, type PsResult } from "../../../shared/ps.js";
import type { IconSource } from "../../../shared/realicon.js";
import { PROCESSES, backToMain, showKeys, showPage } from "./deck.js";

/** One step sent to VS Code: k = SendKeys keys, t = literal text, w = wait (ms). */
export type Step = { k?: string; t?: string; w?: number };
type KeySettings = Appearance & { shortcut?: string; command?: string };

/** Runs a VS Code command from the Command Palette (layout-independent, works for any command). */
export const palette = (command: string): Step[] => [{ k: "^+p" }, { w: 260 }, { t: command }, { w: 260 }, { k: "{ENTER}" }];

/** VS Code keys: id (UUID suffix) → what to send. Shortcuts are VS Code's defaults. */
export const COMMANDS: Record<string, { name: string; tip: string; steps: Step[] }> = {
	palette: { name: "Command Palette", tip: "Ctrl+Shift+P", steps: [{ k: "^+p" }] },
	quickopen: { name: "Go to File", tip: "Quick Open (Ctrl+P)", steps: [{ k: "^p" }] },
	search: { name: "Search in Files", tip: "Ctrl+Shift+F", steps: [{ k: "^+f" }] },
	terminal: { name: "Toggle Terminal", tip: "Show or hide the terminal", steps: palette("View: Toggle Terminal") },
	explorer: { name: "Explorer", tip: "Ctrl+Shift+E", steps: [{ k: "^+e" }] },
	scm: { name: "Source Control", tip: "Ctrl+Shift+G", steps: [{ k: "^+g" }] },
	commit: { name: "Git Commit", tip: "Git: Commit", steps: palette("Git: Commit") },
	push: { name: "Git Push", tip: "Git: Push", steps: palette("Git: Push") },
	pull: { name: "Git Pull", tip: "Git: Pull", steps: palette("Git: Pull") },
	newterm: { name: "New Terminal", tip: "Terminal: Create New Terminal", steps: palette("Terminal: Create New Terminal") },
	run: { name: "Run", tip: "Run without debugging (Ctrl+F5)", steps: [{ k: "^{F5}" }] },
	debug: { name: "Debug / Continue", tip: "Start debugging or continue (F5)", steps: [{ k: "{F5}" }] },
	stop: { name: "Stop", tip: "Stop debugging (Shift+F5)", steps: [{ k: "+{F5}" }] },
	format: { name: "Format Document", tip: "Shift+Alt+F", steps: [{ k: "+%f" }] },
	saveall: { name: "Save All", tip: "File: Save All", steps: palette("File: Save All") },
	sidebar: { name: "Toggle Sidebar", tip: "Ctrl+B", steps: [{ k: "^b" }] },
	split: { name: "Split Editor", tip: "Ctrl+\\", steps: [{ k: "^\\" }] },
	comment: { name: "Toggle Comment", tip: "Ctrl+/", steps: [{ k: "^/" }] },
	definition: { name: "Go to Definition", tip: "F12", steps: [{ k: "{F12}" }] },
	rename: { name: "Rename Symbol", tip: "F2", steps: [{ k: "{F2}" }] },
	problems: { name: "Problems", tip: "Ctrl+Shift+M", steps: [{ k: "^+m" }] },
	zen: { name: "Zen Mode", tip: "View: Toggle Zen Mode", steps: palette("View: Toggle Zen Mode") },
	close: { name: "Close Editor", tip: "Ctrl+W", steps: [{ k: "^w" }] },
	copilot: { name: "Copilot Chat", tip: "Open the chat view (Ctrl+Alt+I)", steps: [{ k: "^%i" }] },
	quickfix: { name: "Quick Fix", tip: "Quick fixes and refactorings (Ctrl+.)", steps: [{ k: "^." }] },
	panel: { name: "Toggle Panel", tip: "Show or hide the bottom panel (Ctrl+J)", steps: [{ k: "^j" }] },
	extensions: { name: "Extensions", tip: "Ctrl+Shift+X", steps: [{ k: "^+x" }] },
};

const NAMED: Record<string, string> = {
	enter: "{ENTER}", return: "{ENTER}", esc: "{ESC}", escape: "{ESC}", tab: "{TAB}", space: " ", backspace: "{BACKSPACE}",
	delete: "{DELETE}", del: "{DELETE}", insert: "{INSERT}", home: "{HOME}", end: "{END}", pageup: "{PGUP}", pgup: "{PGUP}",
	pagedown: "{PGDN}", pgdn: "{PGDN}", up: "{UP}", down: "{DOWN}", left: "{LEFT}", right: "{RIGHT}",
	plus: "{+}", "+": "{+}", "^": "{^}", "%": "{%}", "~": "{~}", "(": "{(}", ")": "{)}", "{": "{{}", "}": "{}}", "[": "{[}", "]": "{]}",
};

/**
 * "Ctrl+Shift+P" → "^+p"; chords separated by spaces: "Ctrl+K Ctrl+S" → "^k^s".
 * Returns undefined when the text can't be understood.
 */
export function shortcutToSendKeys(text: string): string | undefined {
	const chords = text.trim().split(/\s+/).filter(Boolean);
	if (!chords.length) return undefined;
	let out = "";
	for (const chord of chords) {
		const parts = chord.split(/\+(?=.)/).map((p) => p.trim()).filter(Boolean);
		let mods = "";
		let key: string | undefined;
		for (const raw of parts) {
			const p = raw.toLowerCase();
			if (p === "ctrl" || p === "control") mods += "^";
			else if (p === "shift") mods += "+";
			else if (p === "alt") mods += "%";
			else if (key !== undefined) return undefined;
			else if (/^f([1-9]|1[0-9]|2[0-4])$/.test(p)) key = `{${p.toUpperCase()}}`;
			else if (NAMED[p]) key = NAMED[p];
			else if (p.length === 1) key = p;
			else return undefined;
		}
		if (key === undefined) return undefined;
		out += mods + key;
	}
	return out;
}

/** Sends steps to VS Code (bringing it to the front first). */
export function sendToCode(steps: Step[]): Promise<PsResult> {
	return ps.run("sendto", [PROCESSES.join("|"), JSON.stringify(steps)]);
}

abstract class VsKey extends DailyAction<KeySettings> {
	protected abstract steps(s: KeySettings): Step[] | string;
	override async onKeyDown(ev: KeyDownEvent<KeySettings>): Promise<void> {
		const steps = this.steps(ev.payload.settings);
		if (typeof steps === "string") {
			await this.feedback(ev.action, { status: "miss", message: steps });
			return;
		}
		const r = await sendToCode(steps);
		await this.feedback(ev.action, r, false);
	}
}

/** Fixed command keys. */
abstract class CommandKey extends VsKey {
	protected abstract readonly id: string;
	protected override steps(): Step[] {
		return COMMANDS[this.id].steps;
	}
}

// ---- Back --------------------------------------------------------------------------------------

@action({ UUID: "com.dailyops.vscode.v2.back" })
export class BackKey extends DailyAction<Appearance> {
	protected readonly kind = "vsc-back";
	override async onKeyDown(ev: KeyDownEvent<Appearance>): Promise<void> {
		await backToMain(ev.action.device.id);
	}
}

// ---- Command keys (one class per key; Stream Deck needs a UUID per action) ----------------------

@action({ UUID: "com.dailyops.vscode.v2.palette" }) export class PaletteKey extends CommandKey { protected readonly kind = "vsc-palette"; protected readonly id = "palette"; }
@action({ UUID: "com.dailyops.vscode.v2.quickopen" }) export class QuickOpenKey extends CommandKey { protected readonly kind = "vsc-quickopen"; protected readonly id = "quickopen"; }
@action({ UUID: "com.dailyops.vscode.v2.search" }) export class SearchKey extends CommandKey { protected readonly kind = "vsc-search"; protected readonly id = "search"; }
@action({ UUID: "com.dailyops.vscode.v2.terminal" }) export class TerminalKey extends CommandKey { protected readonly kind = "vsc-terminal"; protected readonly id = "terminal"; }
@action({ UUID: "com.dailyops.vscode.v2.explorer" }) export class ExplorerKey extends CommandKey { protected readonly kind = "vsc-explorer"; protected readonly id = "explorer"; }
@action({ UUID: "com.dailyops.vscode.v2.scm" }) export class ScmKey extends CommandKey { protected readonly kind = "vsc-scm"; protected readonly id = "scm"; }
@action({ UUID: "com.dailyops.vscode.v2.commit" }) export class CommitKey extends CommandKey { protected readonly kind = "vsc-commit"; protected readonly id = "commit"; }
@action({ UUID: "com.dailyops.vscode.v2.push" }) export class PushKey extends CommandKey { protected readonly kind = "vsc-push"; protected readonly id = "push"; }
@action({ UUID: "com.dailyops.vscode.v2.pull" }) export class PullKey extends CommandKey { protected readonly kind = "vsc-pull"; protected readonly id = "pull"; }
@action({ UUID: "com.dailyops.vscode.v2.newterm" }) export class NewTermKey extends CommandKey { protected readonly kind = "vsc-newterm"; protected readonly id = "newterm"; }
@action({ UUID: "com.dailyops.vscode.v2.run" }) export class RunKey extends CommandKey { protected readonly kind = "vsc-run"; protected readonly id = "run"; }
@action({ UUID: "com.dailyops.vscode.v2.debug" }) export class DebugKey extends CommandKey { protected readonly kind = "vsc-debug"; protected readonly id = "debug"; }
@action({ UUID: "com.dailyops.vscode.v2.stop" }) export class StopKey extends CommandKey { protected readonly kind = "vsc-stop"; protected readonly id = "stop"; }
@action({ UUID: "com.dailyops.vscode.v2.format" }) export class FormatKey extends CommandKey { protected readonly kind = "vsc-format"; protected readonly id = "format"; }
@action({ UUID: "com.dailyops.vscode.v2.saveall" }) export class SaveAllKey extends CommandKey { protected readonly kind = "vsc-saveall"; protected readonly id = "saveall"; }
@action({ UUID: "com.dailyops.vscode.v2.sidebar" }) export class SidebarKey extends CommandKey { protected readonly kind = "vsc-sidebar"; protected readonly id = "sidebar"; }
@action({ UUID: "com.dailyops.vscode.v2.split" }) export class SplitKey extends CommandKey { protected readonly kind = "vsc-split"; protected readonly id = "split"; }
@action({ UUID: "com.dailyops.vscode.v2.comment" }) export class CommentKey extends CommandKey { protected readonly kind = "vsc-comment"; protected readonly id = "comment"; }
@action({ UUID: "com.dailyops.vscode.v2.definition" }) export class DefinitionKey extends CommandKey { protected readonly kind = "vsc-definition"; protected readonly id = "definition"; }
@action({ UUID: "com.dailyops.vscode.v2.rename" }) export class RenameKey extends CommandKey { protected readonly kind = "vsc-rename"; protected readonly id = "rename"; }
@action({ UUID: "com.dailyops.vscode.v2.problems" }) export class ProblemsKey extends CommandKey { protected readonly kind = "vsc-problems"; protected readonly id = "problems"; }
@action({ UUID: "com.dailyops.vscode.v2.zen" }) export class ZenKey extends CommandKey { protected readonly kind = "vsc-zen"; protected readonly id = "zen"; }
@action({ UUID: "com.dailyops.vscode.v2.close" }) export class CloseKey extends CommandKey { protected readonly kind = "vsc-close"; protected readonly id = "close"; }

@action({ UUID: "com.dailyops.vscode.v2.copilot" }) export class CopilotKey extends CommandKey { protected readonly kind = "vsc-copilot"; protected readonly id = "copilot"; }
@action({ UUID: "com.dailyops.vscode.v2.quickfix" }) export class QuickFixKey extends CommandKey { protected readonly kind = "vsc-quickfix"; protected readonly id = "quickfix"; }
@action({ UUID: "com.dailyops.vscode.v2.panel" }) export class PanelKey extends CommandKey { protected readonly kind = "vsc-panel"; protected readonly id = "panel"; }
@action({ UUID: "com.dailyops.vscode.v2.extensions" }) export class ExtensionsKey extends CommandKey { protected readonly kind = "vsc-extensions"; protected readonly id = "extensions"; }

// ---- Page keys (More / Main) -------------------------------------------------------------------

@action({ UUID: "com.dailyops.vscode.v2.more" })
export class MoreKey extends DailyAction<Appearance> {
	protected readonly kind = "vsc-more";
	override async onKeyDown(ev: KeyDownEvent<Appearance>): Promise<void> { await showPage(ev.action.device.id, 1); }
}
@action({ UUID: "com.dailyops.vscode.v2.main" })
export class MainKey extends DailyAction<Appearance> {
	protected readonly kind = "vsc-main";
	override async onKeyDown(ev: KeyDownEvent<Appearance>): Promise<void> { await showPage(ev.action.device.id, 0); }
}

// ---- Custom keys -------------------------------------------------------------------------------

/** Any VS Code keyboard shortcut, typed like "Ctrl+Shift+P" or "Ctrl+K Ctrl+S". */
@action({ UUID: "com.dailyops.vscode.v2.shortcut" })
export class ShortcutKey extends VsKey {
	protected readonly kind = "vsc-shortcut";
	protected override dynamicLabel(s: KeySettings): string | undefined {
		return s.shortcut?.trim() || undefined;
	}
	protected override steps(s: KeySettings): Step[] | string {
		if (!s.shortcut?.trim()) return "No shortcut set — open this key's settings.";
		const k = shortcutToSendKeys(s.shortcut);
		return k ? [{ k }] : `Couldn't understand the shortcut "${s.shortcut}".`;
	}
}

/** Any Command Palette command, e.g. "Git: Sync" or "Docker: Compose Up". */
@action({ UUID: "com.dailyops.vscode.v2.command" })
export class CommandPaletteKey extends VsKey {
	protected readonly kind = "vsc-command";
	protected override dynamicLabel(s: KeySettings): string | undefined {
		const c = s.command?.trim();
		return c ? c.replace(/^.*?:\s*/, "") : undefined;
	}
	protected override steps(s: KeySettings): Step[] | string {
		const c = s.command?.trim();
		return c ? palette(c) : "No command set — open this key's settings.";
	}
}

// ---- Open Project ------------------------------------------------------------------------------

const CODE_EXE = [
	"%LOCALAPPDATA%\\Programs\\Microsoft VS Code\\Code.exe",
	"%ProgramFiles%\\Microsoft VS Code\\Code.exe",
	"%LOCALAPPDATA%\\Programs\\Microsoft VS Code Insiders\\Code - Insiders.exe",
];

/** Cleans a folder path for the Code.exe command line: no quotes or shell metacharacters, no trailing slash (a trailing "\\" would escape the closing quote). */
export function projectFolder(raw: string | undefined): string | undefined {
	const folder = raw?.trim().replace(/^"(.*)"$/, "$1").replace(/[\\/]+$/, "");
	if (!folder || /["&|<>^%\r\n]/.test(folder.replace(/%[A-Za-z_][A-Za-z0-9_]*%/g, ""))) return undefined;
	return /^[A-Za-z]:$/.test(folder) ? folder + "\\" + "." : folder;
}

/** Opens a project folder in VS Code (tap / double-tap / hold = monitor 1 / 2 / 3) and shows the VS Code keys. */
@action({ UUID: "com.dailyops.vscode.v2.project" })
export class ProjectKey extends LaunchAction<FolderSettings> {
	protected readonly kind = "vsc-project";
	override realSource(s: FolderSettings): IconSource | undefined {
		const p = s.folderPath?.trim();
		return p ? { type: "shell", candidates: [p] } : undefined;
	}
	protected override dynamicLabel(s: FolderSettings): string | undefined {
		const p = s.folderPath?.trim().replace(/[\\/]+$/, "");
		return p ? p.split(/[\\/]/).pop() : undefined;
	}
	protected async launch(s: FolderSettings): Promise<PsResult> {
		const folder = projectFolder(s.folderPath);
		if (!folder) return { status: "miss", message: s.folderPath?.trim() ? "That folder path has characters VS Code links can't use (quotes or & | < > ^)." : "No project folder set — open this key's settings." };
		let r: PsResult = { status: "miss", message: "VS Code not found in its usual folders. Install it for the current user or system-wide." };
		// Code.exe is started directly with one quoted argument; there is no cmd.exe fallback, so the path can't run commands.
		for (const exe of CODE_EXE) {
			r = await ps.run("path", [exe, `"${folder}"`]);
			if (r.status !== "miss") break;
		}
		return r;
	}
	protected override async afterLaunch(action: Action<FolderSettings>): Promise<void> {
		await showKeys(action.device.id);
	}
}

export const ALL_KEYS = [
	BackKey, PaletteKey, QuickOpenKey, SearchKey, TerminalKey, ExplorerKey, ScmKey, CommitKey, PushKey, PullKey, NewTermKey,
	RunKey, DebugKey, StopKey, FormatKey, SaveAllKey, SidebarKey, SplitKey, CommentKey, DefinitionKey, RenameKey, ProblemsKey,
	ZenKey, CloseKey, ShortcutKey, CommandPaletteKey, ProjectKey, CopilotKey, QuickFixKey, PanelKey, ExtensionsKey, MoreKey, MainKey,
];
void log;
