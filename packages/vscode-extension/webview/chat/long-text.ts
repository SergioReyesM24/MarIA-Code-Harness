/**
 * Long text folded out of the way: a paste over the limits becomes a card in the composer, and a
 * sent prompt over them folds in its bubble. The limits are `ompCustom.longPasteLines` (lines) and
 * `ompCustom.longPasteChars` (characters, so one very long line folds too); the host sends them to
 * the webview (`settings`), and they apply to pastes and prompts from then on.
 */

const DEFAULT_LONG_TEXT_LINES = 200;
const DEFAULT_LONG_TEXT_CHARS = 200;

let lineLimit = DEFAULT_LONG_TEXT_LINES;
let charLimit = DEFAULT_LONG_TEXT_CHARS;

/** Set by the host's `settings` update; `0` turns that limit off. */
export function setLongTextLimits(lines: number, chars: number): void {
	lineLimit = lines;
	charLimit = chars;
}

/** Lines of `text`, not counting the newlines at its end. */
export function countLines(text: string): number {
	return text.replace(/\n+$/, "").split("\n").length;
}

/** Whether `text` has more lines or more characters than its limit, so it folds. */
export function isLongText(text: string): boolean {
	if (lineLimit > 0 && countLines(text) > lineLimit) return true;
	return charLimit > 0 && text.length > charLimit;
}
