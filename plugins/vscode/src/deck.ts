import streamDeck from "@elgato/streamdeck";
import { globals } from "../../../shared/base.js";
import { ps } from "../../../shared/ps.js";
import { connectCompanion, type CompanionConnection } from "../../../shared/companion-routing.js";
import { existsSync } from "node:fs";
import { dirname, join } from "node:path";

const log = streamDeck.logger.createScope("deck");

/** Name of the bundled key layout — must match the manifest's Profiles[].Name exactly. */
export const PROFILE = "profiles/VS Code";
/** Process names that count as "VS Code is in front". */
export const PROCESSES = ["Code", "Code - Insiders", "VSCodium"];
/** Windows that briefly take focus without the user really leaving VS Code. */
const TRANSIENT = new Set(["", "StreamDeck", "ShellExperienceHost", "SearchHost", "StartMenuExperienceHost", "LockApp", "Idle", "TextInputHost"]);
/** How long a newly focused app must stay in front before the keys follow it. */
export const FOCUS_SETTLE_MS = 450;

const isCode = (name: string) => PROCESSES.some((p) => p.toLowerCase() === name.toLowerCase());
const autoFollow = () => globals.autoFollow !== false;
const returnOnClose = () => globals.returnOnClose !== false;

/** Devices currently showing our layout because we switched them. */
const switched = new Set<string>();
/** Devices where Daily Ops' Apps page is open: focus changes don't take the deck over there. */
const held = new Set<string>();
/** Our keys visible per device (lets us notice when the user navigates away by hand). */
const visible = new Map<string, number>();
let bridge: CompanionConnection | undefined;
const toolkitInstalled = () => process.env.DAILYOPS_DRYRUN !== "1" && existsSync(join(dirname(process.argv[1] || ""), "../../com.dailyops.v2.sdPlugin"));

function deviceIds(): string[] {
	const all = Array.from(streamDeck.devices);
	const connected = all.filter((d) => d.isConnected);
	return (connected.length ? connected : all).map((d) => d.id);
}

/** Switch the deck(s) to the VS Code keys. */
async function localShow(deviceId?: string): Promise<void> {
	for (const id of deviceId ? [deviceId] : deviceIds()) {
		await streamDeck.profiles.switchToProfile(id, PROFILE);
		switched.add(id);
		log.info(`showing VS Code keys on ${id}`);
	}
}

/** Return the deck(s) to whatever was showing before (the main keys). */
async function localBack(deviceId?: string): Promise<void> {
	const ids = deviceId ? [deviceId] : [...switched];
	for (const id of ids) {
		await streamDeck.profiles.switchToProfile(id);
		switched.delete(id);
		log.info(`back to main keys on ${id}`);
	}
}

/** Shows page `page` (0 = first) of the VS Code keys on one device. */
export async function showPage(deviceId: string, page: number): Promise<void> {
	await streamDeck.profiles.switchToProfile(deviceId, PROFILE, page);
	switched.add(deviceId);
}
export async function showKeys(deviceId?: string): Promise<void> {
	if (bridge?.connected) await bridge.request("show", deviceId); else await localShow(deviceId);
}
export async function backToMain(deviceId?: string): Promise<void> {
	if (bridge?.connected) await bridge.request("back", deviceId); else await localBack(deviceId);
}

export function isShowing(deviceId?: string): boolean {
	return deviceId ? switched.has(deviceId) : switched.size > 0;
}

/** Wires up everything that moves the deck between the main keys and the VS Code keys. */
export function initDeck(): void {
	if (process.env.DAILYOPS_DRYRUN !== "1" || process.env.DAILYOPS_COMPANION_PIPE) {
		bridge = connectCompanion({ uuid: "com.dailyops.vscode.v2", enabled: autoFollow, invoke: (command, device) => command === "show" ? localShow(device) : localBack(device) });
		streamDeck.settings.onDidReceiveGlobalSettings(() => bridge?.update());
	}
	// 1) Daily Ops (or anything) asks us to show our keys: streamdeck://plugins/message/<uuid>/show?device=<id>
	streamDeck.system.onDidReceiveDeepLink((ev) => {
		const path = ev.url.path.replace(/\/+$/, "");
		const device = ev.url.queryParameters.get("device") ?? undefined;
		if (path === "/show") {
			if (device) held.delete(device);
			void showKeys(device);
		} else if (path === "/back") void backToMain(device);
		else if (path === "/hold" && device) held.add(device);
		else if (path === "/release" && device) held.delete(device);
	});

	// 2) Follow focus: VS Code in front → VS Code keys; another app in front → main keys.
	let pending: NodeJS.Timeout | undefined;
	let current = "";
	ps.onEvent((e) => {
		if (e.type !== "fg") return;
		if (bridge?.connected || toolkitInstalled()) return;
		const name = e.data;
		if (TRANSIENT.has(name)) return;
		clearTimeout(pending);
		pending = setTimeout(() => {
			if (name === current) return;
			current = name;
			if (!autoFollow()) return;
			if (isCode(name)) {
				for (const id of deviceIds()) if (!switched.has(id) && !held.has(id)) void showKeys(id);
			} else if (isShowing()) {
				void backToMain();
			}
		}, FOCUS_SETTLE_MS);
	});
	void ps.run("watchfg").then((r) => r.status !== "ok" && log.warn(`focus watching unavailable: ${r.message}`));

	// 3) VS Code closed → main keys.
	streamDeck.system.onApplicationDidTerminate((ev) => {
		const app = ev.application.replace(/\.exe$/i, "");
		if (isCode(app) && returnOnClose() && isShowing()) void backToMain();
	});

	// Keep track of whether our layout is really on screen (the user may leave it by hand).
	streamDeck.actions.onWillAppear((ev) => { visible.set(ev.action.device.id, (visible.get(ev.action.device.id) ?? 0) + 1); bridge?.setVisible(ev.action.device.id, true); });
	streamDeck.actions.onWillDisappear((ev) => {
		const id = ev.action.device.id;
		const n = Math.max(0, (visible.get(id) ?? 1) - 1);
		visible.set(id, n);
		if (n === 0) setTimeout(() => { if ((visible.get(id) ?? 0) === 0) { switched.delete(id); bridge?.setVisible(id, false); } }, 300);
	});
}
