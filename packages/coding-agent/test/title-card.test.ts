import { describe, expect, it } from "bun:test";
import {
	keepTitleCard,
	parseCardReply,
	parseCardTitleReply,
	splitCardTitle,
} from "@oh-my-pi/pi-coding-agent/utils/title-card";

describe("parseCardTitleReply", () => {
	const reply = '<title emoji="🧪">Fix the flaky park tests that fail under parallel runs</title>';

	it("heads the title with the emoji unless the style is boring", () => {
		expect(parseCardTitleReply(reply, "emoji")).toBe("🧪 Fix the flaky park tests that fail under parallel runs");
		expect(parseCardTitleReply(reply, "boring")).toBe("Fix the flaky park tests that fail under parallel runs");
	});

	it.each([
		["a decline", "<title/>"],
		["a decline with attributes", '<title emoji="🧪" />'],
		["a reply without a tag", "I'll start by reading the park tests."],
		["an unclosed tag", '<title emoji="🧪">Fix flaky park tests'],
		["a title the normalizer rejects", '<title emoji="🧪">..</title>'],
	])("names no title for %s", (_case, reply) => {
		expect(parseCardTitleReply(reply, "emoji")).toBeNull();
	});

	it.each([
		["no emoji", "<title>Fix flaky tests</title>"],
		["an emoji attribute that is not an emoji", '<title emoji="flask">Fix flaky tests</title>'],
		["a keycap emoji, which starts with ASCII", '<title emoji="#️⃣">Fix flaky tests</title>'],
		["two emoji", '<title emoji="🧪🧪">Fix flaky tests</title>'],
	])("keeps a plain title for %s", (_case, reply) => {
		expect(parseCardTitleReply(reply, "emoji")).toBe("Fix flaky tests");
	});

	it("repairs an emoji missing its variation selector", () => {
		expect(parseCardTitleReply('<title emoji="🗄">Create seed data</title>', "emoji")).toBe("🗄️ Create seed data");
	});

	it("reads the line card form inside a plain tag, but not an ordinary title with a colon", () => {
		expect(parseCardTitleReply("<title>🗄️ Exclude z3 from bun test</title>", "emoji")).toBe(
			"🗄️ Exclude z3 from bun test",
		);
		expect(parseCardTitleReply("<title>Fix: the parser</title>", "emoji")).toBe("Fix: the parser");
	});

	it("reconciles the title's casing against the user's message", () => {
		expect(
			parseCardTitleReply('<title emoji="🦀">Port tinyvmm to arm64</title>', "emoji", "port TinyVMM to arm64"),
		).toBe("🦀 Port TinyVMM to arm64");
	});
});

describe("splitCardTitle", () => {
	it("takes apart a title headed by an emoji", () => {
		expect(splitCardTitle("🧪 Fix flaky park tests")).toEqual({ icon: "🧪", title: "Fix flaky park tests" });
	});

	it.each([
		["a plain title", "Fix flaky park tests"],
		["a first word in a non-Latin script", "修复 flaky park tests"],
		["an emoji alone", "🧪"],
	])("leaves %s whole", (_case, title) => {
		expect(splitCardTitle(title)).toBeUndefined();
	});
});

describe("parseCardReply", () => {
	it("takes the emoji that opens the reply and ignores the rest", () => {
		expect(parseCardReply("🧪 Fix", "emoji")).toEqual({ icon: "🧪" });
		expect(parseCardReply("🗄 Cache", "emoji")).toEqual({ icon: "🗄️" });
	});

	it.each([
		["no emoji", "Fix"],
		["a word before the emoji", "Card 🧪"],
		["two emoji", "🧪🧪 Fix"],
	])("names no card for %s", (_case, reply) => {
		expect(parseCardReply(reply, "emoji")).toBeUndefined();
	});

	it("names no card when the style is boring", () => {
		expect(parseCardReply("🧪 Fix", "boring")).toBeUndefined();
	});
});

describe("keepTitleCard", () => {
	it("heads the new title with the current emoji, replacing one the new title brings", () => {
		expect(keepTitleCard("🧪 Fix cache writes", "Repair cache")).toBe("🧪 Repair cache");
		expect(keepTitleCard("🧪 Fix cache writes", "🔥 Repair cache")).toBe("🧪 Repair cache");
	});

	it("leaves the new title alone when the current title has no emoji", () => {
		expect(keepTitleCard("Fix cache writes", "🔥 Repair cache")).toBe("🔥 Repair cache");
		expect(keepTitleCard(undefined, "Repair cache")).toBe("Repair cache");
	});
});
