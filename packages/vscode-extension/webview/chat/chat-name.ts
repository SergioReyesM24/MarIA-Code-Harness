/**
 * "Ponle nombre a este chat" under the empty chat's greeting: the user names
 * the session before the first prompt. The name goes to omp as a user title
 * (`renameSession` → `set_session_name`), and omp never generates a title for
 * a session the user already named. Once named, the button shows the name and
 * clicking it edits it again.
 */
import type { ChatRequest } from "../../src/protocol";
import { h } from "../dom";
import { icon } from "../icons";
import { setTooltip } from "../tooltip";

type Post = (request: ChatRequest) => void;

export class ChatName {
	readonly element = h("div", { className: "chat-name", hidden: true });
	#button = h("button", { type: "button", className: "chat-name-button" });
	#input = h("input", {
		type: "text",
		className: "chat-name-input",
		ariaLabel: "Nombre del chat",
		placeholder: "p. ej. Migrar el login a OAuth",
	});
	#name = "";
	/** Cleared before the field leaves the DOM: removing a focused field fires `blur`, which must not save a cancelled edit. */
	#editing = false;

	constructor(private readonly post: Post) {
		this.#button.addEventListener("click", () => this.#startEdit());
		this.#input.addEventListener("keydown", event => {
			if (event.isComposing) return;
			if (event.key === "Enter") {
				event.preventDefault();
				this.#finishEdit(true);
			} else if (event.key === "Escape") {
				event.preventDefault();
				event.stopPropagation();
				this.#finishEdit(false);
			}
		});
		this.#input.addEventListener("blur", () => this.#finishEdit(true));
		this.#render();
	}

	/** The open session's name (omp's `state`); shown unless the user is typing a new one. */
	set(name: string | undefined): void {
		this.element.hidden = false;
		if (!this.#editing) {
			this.#name = name ?? "";
			this.#render();
		}
	}

	#startEdit(): void {
		this.#editing = true;
		this.#input.value = this.#name;
		this.element.replaceChildren(this.#input);
		this.#input.focus();
		this.#input.select();
	}

	/** Enter or leaving the field names the chat (an empty or unchanged name does nothing); Escape cancels. */
	#finishEdit(save: boolean): void {
		if (!this.#editing) return;
		this.#editing = false;
		const name = this.#input.value.trim();
		if (save && name && name !== this.#name) {
			// Shown at once; omp's refreshed state follows.
			this.#name = name;
			this.post({ type: "renameSession", name });
		}
		this.#render();
	}

	#render(): void {
		const named = this.#name !== "";
		this.#button.classList.toggle("named", named);
		this.#button.replaceChildren(
			icon("pencil"),
			h("span", { className: "chat-name-label" }, named ? this.#name : "Ponle nombre a este chat"),
		);
		setTooltip(
			this.#button,
			named ? "Cambiar el nombre del chat" : "Dale tú el nombre: así MarIA Code no lo deduce de tu primer mensaje",
		);
		this.element.replaceChildren(this.#button);
	}
}
