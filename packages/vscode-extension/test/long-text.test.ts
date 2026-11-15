import { describe, expect, test } from "bun:test";
import { countLines, isLongText, setLongTextLimits } from "../webview/chat/long-text";

describe("long text folding", () => {
	test("counts lines without the newlines at the end, so a trailing newline is not a line", () => {
		expect(countLines("a\nb\n")).toBe(2);
		expect(countLines("a\nb\n\n\n")).toBe(2);
		expect(countLines("single line")).toBe(1);
	});

	test("folds only text with more lines than the line limit", () => {
		setLongTextLimits(200, 0);
		const exactly = Array.from({ length: 200 }, (_, i) => `line ${i}`).join("\n");
		expect(isLongText(exactly)).toBe(false);
		expect(isLongText(`${exactly}\nextra`)).toBe(true);
		setLongTextLimits(200, 200);
	});

	test("folds one very long line by its characters, so a few lines are not a way around the limit", () => {
		setLongTextLimits(200, 200);
		expect(isLongText("x".repeat(200))).toBe(false);
		expect(isLongText("x".repeat(201))).toBe(true);
	});

	test("a limit of 0 turns that limit off", () => {
		setLongTextLimits(0, 0);
		expect(isLongText(Array.from({ length: 5_000 }, () => "y").join("\n") + "x".repeat(50_000))).toBe(false);
		setLongTextLimits(200, 200);
	});
});
