import streamDeck from "@elgato/streamdeck";
import type { JsonObject, JsonValue } from "@elgato/utils";
import { REGISTRY, globals } from "../../../shared/base.js";
import { ps } from "../../../shared/ps.js";
import { initDeck } from "./deck.js";
import { ALL_KEYS } from "./keys.js";
import { readFileSync } from "node:fs";
import { PRESET_ICONS, setAppDesign } from "../../../shared/icons.js";

setAppDesign(JSON.parse(readFileSync(new URL('../app-design.json',import.meta.url),'utf8')));
for(const [kind,preset] of Object.entries(PRESET_ICONS))if(kind.startsWith('vsc-'))preset.style='app';

streamDeck.logger.setLevel("info");
const log = streamDeck.logger.createScope("plugin");

for (const K of ALL_KEYS) streamDeck.actions.registerAction(new K());

/** Settings panel ➜ plugin messages (same protocol as Daily Ops, so the panel code is shared). */
streamDeck.ui.onSendToPlugin<{ event?: string; settings?: JsonObject; order?: string }>(async (ev) => {
	const event = ev.payload?.event;
	if (event === "getMonitors") {
		const o = ev.payload.order;
		const r = await ps.run("monitors", [o === "left" || o === "primary" ? o : "windows"]);
		let list: JsonValue = [];
		try {
			if (r.status === "ok") list = JSON.parse(r.message) as JsonValue;
		} catch {
			/* ignore */
		}
		await streamDeck.ui.sendToPropertyInspector({ event: "monitors", ok: r.status === "ok", error: r.status === "ok" ? "" : r.message, list });
		return;
	}
	if (event === "getIcon" || event === "refreshIcon") {
		const inst = REGISTRY.get(ev.action.manifestId);
		if (!inst) return;
		const settings = ev.payload.settings ?? ((await ev.action.getSettings()) as JsonObject);
		if (event === "refreshIcon") await inst.refreshIcon(settings);
		const rendered = await inst.imageFinal(settings);
		await streamDeck.ui.sendToPropertyInspector({ event: "icon", ...rendered, token: JSON.stringify(settings) });
	}
});

ps.start();
void ps.run("warm", [], 60_000).then((r) => log.info(`warm-up: ${r.status} ${r.message}`));
streamDeck.settings.onDidReceiveGlobalSettings((ev) => Object.assign(globals, ev.settings));
initDeck();

await streamDeck.connect();
try {
	Object.assign(globals, await streamDeck.settings.getGlobalSettings());
} catch (e) {
	log.warn(`global settings: ${(e as Error).message}`);
}
