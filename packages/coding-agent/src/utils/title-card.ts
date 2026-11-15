/**
 * Card-form session titles: `<emoji> <title>` (`🧪 Fix flaky park tests that
 * fail only when run in parallel`). The card is part of the title string
 * itself, so everything that shows a session title (terminal title, the
 * `/resume` picker, listings) shows it; {@link splitCardTitle} takes one apart
 * where a piece is needed. A regenerated title keeps the session's card
 * ({@link keepTitleCard}); a title named without one can get a card of its own
 * from a card reply ({@link parseCardReply}).
 */
import type { TitleIcons } from "./title-settings";
import { normalizeGeneratedTitle } from "../tiny/text";

/** The card that heads a card-form title. */
export interface TitleCard {
	/** One emoji. */
	icon: string;
}

/** The pieces of a card-form title. */
export interface CardTitleParts extends TitleCard {
	/** The title without its card. */
	title: string;
}

/** The first `<title …/>` or `<title …>text</title>` tag in a reply. */
const TITLE_TAG = /<title(\s[^>]*?)?\s*(?:\/>|>([\s\S]*?)<\/title>)/i;
const TITLE_ATTR = /(\w+)\s*=\s*(?:"([^"]*)"|'([^']*)')/g;
/** One RGI emoji: ZWJ sequences, modifiers, flags and variation selectors included. */
const RGI_EMOJI = /^\p{RGI_Emoji}$/v;
/** The card form, `<emoji> <title>`. */
const CARD_LINE = /^(\S+) (\S.*)$/u;
/** Tern reads at most 8 characters as the icon. */
const MAX_ICON_CODEPOINTS = 8;

/** Whether `icon` reads as a card icon to Tern: 1-8 characters, none of them ASCII. */
function isCardIcon(icon: string): boolean {
	let codepoints = 0;
	for (const char of icon) {
		if (char.charCodeAt(0) < 0x80 || ++codepoints > MAX_ICON_CODEPOINTS) return false;
	}
	return codepoints > 0;
}

/**
 * One emoji as the card's icon, else `undefined`. An emoji the model left
 * unqualified (`🗄` for `🗄️`) gets its variation selector back; keycaps (`#️⃣`)
 * are refused because Tern reads an icon as non-ASCII characters only.
 */
function cardEmoji(value: string | undefined): string | undefined {
	const emoji = value?.trim();
	if (!emoji) return undefined;
	const qualified = RGI_EMOJI.test(emoji) ? emoji : RGI_EMOJI.test(`${emoji}\uFE0F`) ? `${emoji}\uFE0F` : undefined;
	return qualified && isCardIcon(qualified) ? qualified : undefined;
}

/** `title` headed by `card`: `🧪 Fix flaky park tests`. */
export function formatCardTitle(card: TitleCard, title: string): string {
	return `${card.icon} ${title}`;
}

/**
 * The session title a reply in the card form names:
 * `<title emoji="🧪">Fix flaky park tests that fail only when run in parallel</title>`
 * becomes `🧪 Fix flaky park tests that fail only when run in parallel`. `boring`
 * keeps the plain title.
 *
 * Returns `null` when the reply names no title: `<title/>` (the model declined),
 * no tag at all, or a title {@link normalizeGeneratedTitle} rejects. A missing or
 * invalid emoji leaves a plain title. A plain `<title>` holding the line form
 * (`🧪 Fix flaky park tests`) keeps its card as well.
 *
 * @param sourceText The user's message, to reconcile the title's casing against.
 */
export function parseCardTitleReply(reply: string, icons: TitleIcons, sourceText?: string): string | null {
	const tag = TITLE_TAG.exec(reply);
	if (!tag || tag[2] === undefined) return null;
	const attrs: Record<string, string> = {};
	for (const match of (tag[1] ?? "").matchAll(TITLE_ATTR)) {
		attrs[match[1]!.toLowerCase()] = match[2] ?? match[3] ?? "";
	}
	let text = tag[2].replace(/\s+/g, " ").trim();
	let emoji = cardEmoji(attrs.emoji);
	if (attrs.emoji === undefined) {
		const line = splitCardTitle(text);
		if (line) {
			emoji = cardEmoji(line.icon);
			text = line.title;
		}
	}
	const title = normalizeGeneratedTitle(text, sourceText);
	if (!title) return null;
	return emoji && icons !== "boring" ? formatCardTitle({ icon: emoji }, title) : title;
}

/**
 * The card a card reply names: the emoji that opens the text of a title model's
 * `<title>` when asked to card an existing title (`🧪`, optionally followed by a
 * word of the title, which is ignored).
 *
 * Returns `undefined` under `boring`, and when the reply does not open with one
 * emoji.
 */
export function parseCardReply(reply: string, icons: TitleIcons): TitleCard | undefined {
	if (icons === "boring") return undefined;
	const icon = cardEmoji(reply.trim().split(/\s+/)[0]);
	return icon ? { icon } : undefined;
}

/**
 * The pieces of a session title in the card form `<emoji> <title>`, or
 * `undefined` for a plain title (`Fix the parser` has no emoji, so it stays whole).
 */
export function splitCardTitle(title: string): CardTitleParts | undefined {
	const line = CARD_LINE.exec(title);
	if (!line || !cardEmoji(line[1])) return undefined;
	return { icon: line[1]!, title: line[2]! };
}

/**
 * `title` headed by the card of the session's `current` title, if it has one.
 * The title model names no card when it regenerates a session's title (replan
 * refresh, argument-less `/rename`), and a card terminal indexes the session by
 * its card, so the card carries over. A card the new title brings anyway (a
 * custom `TITLE_SYSTEM.md`, a model ignoring the prompt) yields to the current
 * one rather than nesting under it.
 */
export function keepTitleCard(current: string | undefined, title: string): string {
	const card = current ? splitCardTitle(current) : undefined;
	return card ? formatCardTitle(card, splitCardTitle(title)?.title ?? title) : title;
}
