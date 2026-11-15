/**
 * Right-click menu for the transcript's file references and web links. The
 * webview's native menu only copies the current text selection, and a right
 * click on a link selects nothing, so its Copy would do nothing.
 */
import { h } from "../dom";
import { parseFileRef } from "./content";

const EDGE_PX = 4;

interface LinkCopy {
	label: string;
	text: string;
}

/** What copying `link` should put on the clipboard; undefined for in-page anchors. */
function copyOf(link: HTMLElement): LinkCopy | undefined {
	if (link.dataset.file) return { label: "Copiar ruta", text: parseFileRef(link.dataset.file).path };
	const href = link.dataset.href;
	if (!href || href.startsWith("#")) return undefined;
	if (/^https?:\/\//i.test(href)) return { label: "Copiar enlace", text: href };
	return { label: "Copiar ruta", text: parseFileRef(href).path };
}

export function installLinkContextMenu(): void {
	let menu: HTMLElement | undefined;
	const close = () => {
		menu?.remove();
		menu = undefined;
	};

	document.addEventListener("contextmenu", event => {
		close();
		const link = (event.target as Element).closest<HTMLElement>("[data-file], [data-href]");
		if (!link) return;
		// A selection that holds the link keeps the native menu, whose Copy copies that selection.
		const selection = getSelection();
		if (selection && !selection.isCollapsed && selection.containsNode(link, true)) return;
		const copy = copyOf(link);
		if (!copy) return;
		event.preventDefault();

		const item = h("button", { type: "button", className: "link-menu-item", role: "menuitem" }, copy.label);
		item.addEventListener("click", () => {
			close();
			void navigator.clipboard.writeText(copy.text);
		});
		menu = h("div", { className: "link-menu", role: "menu" }, item);
		document.body.append(menu);
		const left = Math.min(event.clientX, window.innerWidth - menu.offsetWidth - EDGE_PX);
		const top = Math.min(event.clientY, window.innerHeight - menu.offsetHeight - EDGE_PX);
		menu.style.left = `${Math.max(EDGE_PX, left)}px`;
		menu.style.top = `${Math.max(EDGE_PX, top)}px`;
		item.focus();
	});
	document.addEventListener(
		"mousedown",
		event => {
			if (menu && !menu.contains(event.target as Node)) close();
		},
		true,
	);
	document.addEventListener("keydown", event => {
		if (menu && event.key === "Escape") {
			event.preventDefault();
			close();
		}
	});
	document.addEventListener("scroll", close, true);
	window.addEventListener("blur", close);
	window.addEventListener("resize", close);
}
