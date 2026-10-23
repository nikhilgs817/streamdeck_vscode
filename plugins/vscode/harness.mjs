// Simulated Stream Deck for Daily Ops – VS Code v2: deck switching (deep link, focus, back, close) and key commands.
import { spawn } from "node:child_process";
import { appendFileSync, existsSync, readFileSync, rmSync, mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { WebSocketServer } from "ws";

const here = dirname(fileURLToPath(import.meta.url));
const sd = join(here, "com.dailyops.vscode.v2.sdPlugin");
const manifest = JSON.parse(readFileSync(join(sd, "manifest.json"), "utf8"));
const runDir = mkdtempSync(join(tmpdir(), "dailyops-vscode-test-"));
const LOG = join(runDir, "dryrun.jsonl");
const EVENTS = join(runDir, "events.txt");
rmSync(LOG, { force: true });
rmSync(EVENTS, { force: true });

const wss = new WebSocketServer({ port: 0 });
const port = wss.address().port;
const sent = [];
let sock;
wss.on("connection", (s) => {
	sock = s;
	s.on("message", (d) => sent.push(JSON.parse(d.toString())));
});
const send = (m) => sock.send(JSON.stringify(m));
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const waitFor = async (pred, ms = 8000) => {
	const t = Date.now();
	while (Date.now() - t < ms) {
		const hit = sent.find(pred);
		if (hit) return hit;
		await sleep(20);
	}
	throw new Error("timeout");
};
const dry = () => (existsSync(LOG) ? readFileSync(LOG, "utf8").trim().split("\n").filter(Boolean).map((l) => JSON.parse(l)) : []);
const focus = (name) => appendFileSync(EVENTS, `fg\t${name}\n`);
const switches = () => sent.filter((m) => m.event === "switchToProfile");

const info = {
	application: { font: "Segoe UI", language: "en", platform: "windows", platformVersion: "10.0.22631", version: "7.1.0.21000" },
	colors: {},
	devicePixelRatio: 2,
	devices: [{ id: "DEV1", name: "Stream Deck", size: { columns: 5, rows: 3 }, type: 0 }],
	plugin: { uuid: "com.dailyops.vscode.v2", version: "2.0.0.0" },
};
const proc = spawn(process.execPath, [join(sd, "bin/plugin.js"), "-port", String(port), "-pluginUUID", "com.dailyops.vscode.v2", "-registerEvent", "registerPlugin", "-info", JSON.stringify(info)], {
	cwd: sd,
	env: { ...process.env, DAILYOPS_DRYRUN: "1", DAILYOPS_DRYRUN_LOG: LOG, DAILYOPS_DRYRUN_EVENTS: EVENTS },
	stdio: ["ignore", "pipe", "pipe"],
});
let out = "";
proc.stdout.on("data", (d) => (out += d));
proc.stderr.on("data", (d) => (out += d));

let pass = 0, fail = 0;
const check = (name, ok, extra = "") => {
	ok ? pass++ : fail++;
	console.log(`${ok ? "PASS" : "FAIL"}  ${name}${extra ? "  — " + extra : ""}`);
};

/** Pretend Stream Deck put our whole layout on screen (or took it away). */
const LAYOUT = ["back", "palette", "quickopen", "search", "terminal", "explorer", "scm", "commit", "push", "newterm", "run", "debug", "stop", "format", "saveall"];
const appear = () => LAYOUT.forEach((id, i) => send({ event: "willAppear", action: `com.dailyops.vscode.v2.${id}`, context: `c-${id}`, device: "DEV1", payload: { settings: {}, coordinates: { column: i % 5, row: Math.floor(i / 5) }, controller: "Keypad", isInMultiAction: false, state: 0 } }));
const disappear = () => LAYOUT.forEach((id, i) => send({ event: "willDisappear", action: `com.dailyops.vscode.v2.${id}`, context: `c-${id}`, device: "DEV1", payload: { settings: {}, coordinates: { column: i % 5, row: Math.floor(i / 5) }, controller: "Keypad", isInMultiAction: false, state: 0 } }));
const key = (id, settings = {}) => {
	const p = { settings, coordinates: { column: 0, row: 0 }, isInMultiAction: false, state: 0 };
	send({ event: "keyDown", action: `com.dailyops.vscode.v2.${id}`, context: `c-${id}`, device: "DEV1", payload: p });
	setTimeout(() => send({ event: "keyUp", action: `com.dailyops.vscode.v2.${id}`, context: `c-${id}`, device: "DEV1", payload: p }), 40);
};

try {
	await waitFor((m) => m.event === "registerPlugin");
	check("plugin registers", true);
	send({ event: "deviceDidConnect", device: "DEV1", deviceInfo: { name: "Stream Deck", size: { columns: 5, rows: 3 }, type: 0 } });
	check("manifest bundles the VS Code layout", manifest.Profiles?.[0]?.Name === "profiles/VS Code" && existsSync(join(sd, "profiles/VS Code.streamDeckProfile")));
	await sleep(300);
	check("starts watching window focus", dry().some((c) => c.command === "watchfg"));

	// 1) Hand-off from Daily Ops (deep link)
	send({ event: "didReceiveDeepLink", payload: { url: "/show?device=DEV1&streamdeck=hidden" } });
	const sw = await waitFor((m) => m.event === "switchToProfile");
	check("deep link /show → switches DEV1 to the VS Code keys", sw.device === "DEV1" && sw.payload?.profile === "profiles/VS Code", JSON.stringify(sw));
	appear();
	await sleep(350);
	for (const id of LAYOUT) {
		const frames = sent.filter((m) => m.event === "setImage" && m.context === `c-${id}`).slice(-3).map((m) => decodeURIComponent(m.payload.image));
		check(`${id}: app-themed artwork animates while visible`, frames.length >= 2 && frames.every(svg => svg.includes('data-app-design="vscode"')) && new Set(frames).size >= 2);
	}

	// 2) Keys send the right things to VS Code
	const n0 = dry().length;
	key("palette");
	await sleep(150);
	let c = dry().slice(n0).find((x) => x.command === "sendto");
	check("Command Palette → Ctrl+Shift+P to VS Code", c && c.args[0].split("|").includes("Code") && JSON.parse(c.args[1])[0].k === "^+p");
	const n1 = dry().length;
	key("push");
	await sleep(150);
	c = dry().slice(n1).find((x) => x.command === "sendto");
	const steps = c ? JSON.parse(c.args[1]) : [];
	check("Git Push → runs 'Git: Push' from the Command Palette", steps.some((s) => s.t === "Git: Push") && steps.at(-1).k === "{ENTER}");
	const n2 = dry().length;
	send({ event: "willAppear", action: "com.dailyops.vscode.v2.shortcut", context: "c-shortcut", device: "DEV1", payload: { settings: { shortcut: "Ctrl+K Ctrl+S" }, coordinates: { column: 0, row: 0 }, controller: "Keypad", isInMultiAction: false, state: 0 } });
	await sleep(100);
	key("shortcut", { shortcut: "Ctrl+K Ctrl+S" });
	await sleep(150);
	c = dry().slice(n2).find((x) => x.command === "sendto");
	check("Custom Shortcut 'Ctrl+K Ctrl+S' → ^k^s", c && JSON.parse(c.args[1])[0].k === "^k^s", c?.args[1]);
	send({ event: "willAppear", action: "com.dailyops.vscode.v2.command", context: "c-command", device: "DEV1", payload: { settings: { command: "Git: Sync" }, coordinates: { column: 0, row: 0 }, controller: "Keypad", isInMultiAction: false, state: 0 } });
	await sleep(100);
	const n3 = dry().length;
	key("command", { command: "Git: Sync" });
	await sleep(150);
	c = dry().slice(n3).find((x) => x.command === "sendto");
	check("Custom Command 'Git: Sync' → palette", c && JSON.parse(c.args[1]).some((s) => s.t === "Git: Sync"));
	const lbl = [...sent].reverse().find((m) => m.event === "setImage" && m.context === "c-command");
	check("Custom Command key is labelled from the command", lbl && /sync/i.test(decodeURIComponent(lbl.payload.image)));

	// 3) Back key → previous (main) keys
	let before = switches().length;
	key("back");
	await sleep(200);
	let s2 = switches().slice(before);
	check("Back → switches to the previous (main) keys", s2.length === 1 && s2[0].device === "DEV1" && !s2[0].payload?.profile, JSON.stringify(s2));
	disappear();
	await sleep(400);

	// 4) Follow focus
	before = switches().length;
	focus("Code");
	await sleep(800);
	s2 = switches().slice(before);
	check("VS Code comes to the front → VS Code keys", s2.length === 1 && s2[0].payload?.profile === "profiles/VS Code");
	appear();
	await sleep(100);
	before = switches().length;
	focus("StreamDeck"); // clicking the Stream Deck app must not count
	await sleep(700);
	check("Stream Deck app taking focus is ignored", switches().length === before);
	focus("chrome");
	await sleep(150);
	focus("Code"); // quick Alt-Tab flick and back
	await sleep(800);
	check("a quick flick to another window and back doesn't switch", switches().length === before);
	focus("chrome");
	await sleep(800);
	s2 = switches().slice(before);
	check("another app in front → main keys", s2.length === 1 && !s2[0].payload?.profile);
	disappear();
	await sleep(400);

	// 5) Turn off follow-focus
	send({ event: "didReceiveGlobalSettings", payload: { settings: { autoFollow: false } } });
	await sleep(100);
	before = switches().length;
	focus("Code");
	await sleep(800);
	check("follow focus off → no automatic switching", switches().length === before);
	send({ event: "didReceiveGlobalSettings", payload: { settings: { autoFollow: true } } });
	await sleep(100);

	// 6) VS Code closes → main keys
	focus("explorer");
	await sleep(700);
	send({ event: "didReceiveDeepLink", payload: { url: "/show?device=DEV1&streamdeck=hidden" } });
	await sleep(200);
	appear();
	await sleep(100);
	before = switches().length;
	send({ event: "applicationDidTerminate", payload: { application: "Code.exe" } });
	await sleep(300);
	s2 = switches().slice(before);
	check("VS Code closes → main keys", s2.length === 1 && !s2[0].payload?.profile);
	disappear();
	await sleep(400);

	// 7) Open Project: launches Code.exe with the folder, then shows the keys
	send({ event: "willAppear", action: "com.dailyops.vscode.v2.project", context: "c-project", device: "DEV1", payload: { settings: { folderPath: "C:\\src\\infra" }, coordinates: { column: 0, row: 0 }, controller: "Keypad", isInMultiAction: false, state: 0 } });
	await sleep(200);
	const n4 = dry().length;
	before = switches().length;
	key("project", { folderPath: "C:\\src\\infra" });
	await sleep(900);
	const pc = dry().slice(n4);
	check("Open Project → VS Code with the folder", pc.some((x) => x.command === "path" && x.args[1] === '"C:\\src\\infra"'));
	check("Open Project never falls back to cmd.exe", !pc.some((x) => x.command === "cmd"));
	check("Open Project → then shows the VS Code keys", switches().slice(before).some((m) => m.payload?.profile === "profiles/VS Code"));
	const pl = [...sent].reverse().find((m) => m.event === "setImage" && m.context === "c-project");
	check("Open Project key is labelled with the folder name", pl && /infra/i.test(decodeURIComponent(pl.payload.image)));

	// 8) Daily Ops' Apps page is open → focus changes don't take over that deck
	disappear();
	focus("explorer");
	await sleep(800);
	send({ event: "didReceiveDeepLink", payload: { url: "/hold?device=DEV1&streamdeck=hidden" } });
	await sleep(100);
	before = switches().length;
	focus("Code");
	await sleep(800);
	check("Apps page open (hold) → VS Code in front doesn't switch keys", switches().length === before);
	focus("explorer");
	await sleep(800);
	send({ event: "didReceiveDeepLink", payload: { url: "/release?device=DEV1&streamdeck=hidden" } });
	await sleep(100);
	before = switches().length;
	focus("Code");
	await sleep(800);
	check("after release → follow focus works again", switches().length === before + 1);
} catch (e) {
	check("harness", false, e.message);
} finally {
	proc.kill();
	wss.close();
	console.log(`\n${pass} passed, ${fail} failed`);
	if (fail) console.log("--- plugin output ---\n" + out.slice(-3000));
	process.exit(fail ? 1 : 0);
}
