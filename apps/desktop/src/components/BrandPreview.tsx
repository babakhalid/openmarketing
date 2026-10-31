import { ArrowUp, Expand, MousePointerClick, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { inspectUrl } from "../lib/util";

export type PickedElement = { selector: string; tag: string; text: string; html: string };

// Live preview of a branding HTML page. "Pick" mode lets the user point at an element and
// hand it to the agent with an instruction; the page reloads when the agent rewrites the file.
export function BrandPreview({
	path,
	version,
	cwd,
	onAsk,
	pages,
	onSelectPage,
	onExpand,
}: {
	path: string;
	version?: number;
	cwd: string;
	onAsk: (prompt: string) => void;
	pages?: { path: string; name: string }[];
	onSelectPage?: (path: string) => void;
	onExpand?: () => void;
}) {
	const frame = useRef<HTMLIFrameElement>(null);
	const [picking, setPicking] = useState(false);
	const [picked, setPicked] = useState<PickedElement>();
	const [instruction, setInstruction] = useState("");
	const relPath = path.startsWith(cwd + "/") ? path.slice(cwd.length + 1) : path;

	useEffect(() => {
		const onMessage = (event: MessageEvent) => {
			if (event.source !== frame.current?.contentWindow || event.data?.type !== "ma:picked") return;
			setPicked(event.data as PickedElement);
			setPicking(false);
		};
		window.addEventListener("message", onMessage);
		return () => window.removeEventListener("message", onMessage);
	}, []);

	useEffect(() => {
		frame.current?.contentWindow?.postMessage({ type: "ma:pick", on: picking }, "*");
	}, [picking]);

	const submit = () => {
		const text = instruction.trim();
		if (!text) return;
		const target = picked ? `\nTarget element: \`${picked.selector}\` (<${picked.tag}>${picked.text ? ` "${picked.text.slice(0, 120)}"` : ""}).\nCurrent markup:\n\`\`\`html\n${picked.html}\n\`\`\`` : "";
		onAsk(
			`Update ${relPath} (the brand reference page).${target}\nChange requested: ${text}\nEdit the file in place, keep its tokens (:root variables and the brand-tokens JSON) consistent, and treat it as the visual reference for every storyboard and render that follows.`,
		);
		setInstruction("");
		setPicked(undefined);
	};

	return (
		<>
			<div className="brand-toolbar">
				{pages && pages.length > 1 ? (
					<select value={path} onChange={(e) => onSelectPage?.(e.target.value)}>
						{pages.map((page) => (
							<option key={page.path} value={page.path}>
								{page.path.slice(cwd.length + 1)}
							</option>
						))}
					</select>
				) : (
					<span className="row-title mono">{relPath}</span>
				)}
				<button className={`tool-pill ${picking ? "on" : ""}`} onClick={() => setPicking(!picking)} title="Point at an element and ask the agent to change it">
					<MousePointerClick size={13} />
					{picking ? "Picking…" : "Edit with agent"}
				</button>
				{onExpand ? (
					<button className="icon-btn" onClick={onExpand} title="Open large">
						<Expand size={14} />
					</button>
				) : null}
			</div>
			<div className={`brand-stage ${picking ? "picking" : ""}`}>
				<iframe
					ref={frame}
					key={`${path}:${version ?? 0}`}
					src={inspectUrl(path, version)}
					sandbox="allow-scripts"
					title="Brand page"
					onLoad={() => frame.current?.contentWindow?.postMessage({ type: "ma:pick", on: picking }, "*")}
				/>
				{picked || picking ? (
					<div className="brand-ask">
						<div className="target">
							{picked ? (
								<>
									Editing <b>{picked.selector || picked.tag}</b>
									{picked.text ? ` · “${picked.text.slice(0, 60)}”` : ""}
								</>
							) : (
								"Click any element in the page to target it"
							)}
						</div>
						<form
							onSubmit={(e) => {
								e.preventDefault();
								submit();
							}}
						>
							<input autoFocus value={instruction} onChange={(e) => setInstruction(e.target.value)} placeholder={picked ? "Tell the agent what to change…" : "Or describe a change to the whole page…"} />
							<button type="submit" className="send" disabled={!instruction.trim()}>
								<ArrowUp size={15} />
							</button>
							<button
								type="button"
								className="x"
								onClick={() => {
									setPicked(undefined);
									setPicking(false);
								}}
							>
								<X size={14} />
							</button>
						</form>
					</div>
				) : null}
			</div>
		</>
	);
}
