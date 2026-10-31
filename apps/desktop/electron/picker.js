// Injected into branding HTML previews (media://inspect/...). Lets the user point at an
// element and hand it to the agent. Talks to the app only through postMessage.
(() => {
	let picking = false;
	const box = document.createElement("div");
	box.setAttribute("data-ma-picker", "");
	box.style.cssText = "position:fixed;pointer-events:none;z-index:2147483647;display:none;border:1.5px solid #17171C;background:rgba(23,23,28,.06);border-radius:4px;transition:all .06s ease-out";
	const tag = document.createElement("div");
	tag.style.cssText = "position:absolute;left:-1.5px;top:-22px;padding:2px 7px;border-radius:9999px;background:#17171C;color:#FAFAFA;font:11px ui-monospace,monospace;white-space:nowrap";
	box.appendChild(tag);
	const mount = () => document.body && document.body.appendChild(box);
	document.readyState === "loading" ? document.addEventListener("DOMContentLoaded", mount) : mount();

	const selectorOf = (el) => {
		const parts = [];
		for (let node = el; node && node.nodeType === 1 && parts.length < 5 && node !== document.body; node = node.parentElement) {
			let part = node.tagName.toLowerCase();
			if (node.id) {
				parts.unshift(`${part}#${node.id}`);
				break;
			}
			const cls = [...node.classList].filter((c) => !c.startsWith("ma-")).slice(0, 2);
			if (cls.length) part += "." + cls.join(".");
			const siblings = node.parentElement ? [...node.parentElement.children].filter((c) => c.tagName === node.tagName) : [];
			if (siblings.length > 1) part += `:nth-of-type(${siblings.indexOf(node) + 1})`;
			parts.unshift(part);
		}
		return parts.join(" > ");
	};

	window.addEventListener("message", (event) => {
		if (event.data && event.data.type === "ma:pick") {
			picking = Boolean(event.data.on);
			box.style.display = "none";
			document.documentElement.style.cursor = picking ? "crosshair" : "";
		}
	});
	document.addEventListener(
		"mousemove",
		(event) => {
			if (!picking || event.target === box) return;
			const rect = event.target.getBoundingClientRect();
			Object.assign(box.style, { display: "block", left: `${rect.left}px`, top: `${rect.top}px`, width: `${rect.width}px`, height: `${rect.height}px` });
			tag.textContent = event.target.tagName.toLowerCase() + (event.target.classList[0] ? `.${event.target.classList[0]}` : "");
		},
		true,
	);
	document.addEventListener(
		"click",
		(event) => {
			if (!picking) return;
			event.preventDefault();
			event.stopPropagation();
			const el = event.target;
			window.parent.postMessage(
				{ type: "ma:picked", selector: selectorOf(el), tag: el.tagName.toLowerCase(), text: (el.innerText || el.getAttribute("alt") || "").trim().slice(0, 240), html: el.outerHTML.slice(0, 800) },
				"*",
			);
		},
		true,
	);
})();
