/**
 * Automatic session-title settings: which generator names a session, whether
 * an emoji heads it, and whether a todo replan refreshes it.
 */
import { register } from "../config/registry";

/** The `title.icons` styles. */
export const TITLE_ICONS = ["emoji", "boring"] as const;
/** Whether a session title is headed by an emoji: see {@link cfgTitleIcons}. */
export type TitleIcons = (typeof TITLE_ICONS)[number];

export const cfgTitleIcons = register({
	id: "title.icons",
	type: "enum",
	values: TITLE_ICONS,
	default: "emoji",
	ui: {
		tab: "appearance",
		group: "Display",
		label: "Title Icons",
		description: "Emoji that heads new generated or /rename session titles",
		options: [
			{ value: "emoji", label: "Emoji", description: "One emoji before the title (default)" },
			{ value: "boring", label: "Boring", description: "Plain title: no emoji" },
		],
	},
});

export const cfgTitleGenerator = register({
	id: "title.generator",
	type: "enum",
	values: ["fork", "tiny"] as const,
	default: "fork",
	ui: {
		tab: "tasks",
		group: "Modes",
		label: "Title Generator",
		description: "What names an untitled session from the user's messages",
		options: [
			{
				value: "fork",
				label: "Fork",
				description:
					"A side turn of the reply on the session's model: reads its prompt cache, adds the emoji (default)",
			},
			{ value: "tiny", label: "Tiny", description: "The title model role only; plain titles without an emoji" },
		],
	},
});

export const cfgTitleRefreshOnReplan = register({
	id: "title.refreshOnReplan",
	type: "boolean",
	default: true,
	ui: {
		tab: "tasks",
		group: "Modes",
		label: "Refresh Title on Replan",
		description: "Refresh generated session titles after todo init replans unless the title was set by the user",
	},
});
