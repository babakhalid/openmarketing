import { ArrowUp, Check, ChevronDown, Clapperboard, FilePlus2, Plus, Square, X } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { shortModel } from "../lib/session";
import type { CommandInfo, ModelInfo } from "../lib/types";

const THINKING = ["low", "medium", "high", "xhigh", "max"];
const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

function Popover({ open, onClose, children, align = "right", className = "" }: { open: boolean; onClose: () => void; children: React.ReactNode; align?: "left" | "right"; className?: string }) {
	if (!open) return null;
	return (
		<>
			<div className="menu-backdrop" onClick={onClose} />
			<div className={`menu ${align === "left" ? "menu-left" : ""} ${className}`}>{children}</div>
		</>
	);
}

export function Composer({
	busy,
	disabled,
	videoMode,
	setVideoMode,
	commands,
	models,
	model,
	thinking,
	onSend,
	onStop,
	onAttach,
	onModel,
	onThinking,
	draft,
	setDraft,
	placeholder,
}: {
	busy: boolean;
	disabled: boolean;
	videoMode: boolean;
	setVideoMode: (on: boolean) => void;
	commands: CommandInfo[];
	models: ModelInfo[];
	model?: { provider: string; id: string };
	thinking?: string;
	onSend: (text: string) => void;
	onStop: () => void;
	onAttach: (files: File[]) => void;
	onModel: (spec: string) => void;
	onThinking: (level: string) => void;
	draft: string;
	setDraft: (text: string) => void;
	placeholder: string;
}) {
	const area = useRef<HTMLTextAreaElement>(null);
	const file = useRef<HTMLInputElement>(null);
	const [selected, setSelected] = useState(0);
	const [plusOpen, setPlusOpen] = useState(false);
	const [modelOpen, setModelOpen] = useState(false);

	useEffect(() => {
		const el = area.current;
		if (!el) return;
		el.style.height = "0px";
		el.style.height = `${Math.min(240, el.scrollHeight)}px`;
	}, [draft]);

	const slash = draft.startsWith("/") && !draft.includes(" ") ? draft.slice(1).toLowerCase() : undefined;
	const suggestions = useMemo(() => {
		if (slash === undefined) return [];
		const ranked = commands.filter((c) => c.name.toLowerCase().includes(slash));
		ranked.sort((a, b) => Number(b.name === "video") - Number(a.name === "video") || Number(b.name.startsWith(slash)) - Number(a.name.startsWith(slash)));
		return ranked.slice(0, 7);
	}, [slash, commands]);

	const submit = () => {
		const text = draft.trim();
		if (!text || disabled) return;
		onSend(videoMode && !text.startsWith("/") ? `/video ${text}` : text);
		setDraft("");
	};

	// current provider's models first, then the rest
	const modelSpecs = useMemo(() => {
		const specs = models.map((m) => ({ spec: `${m.provider}/${m.id}`, provider: m.provider, id: m.id }));
		return specs.sort((a, b) => Number(b.provider === model?.provider) - Number(a.provider === model?.provider));
	}, [models, model?.provider]);
	const currentSpec = model ? `${model.provider}/${model.id}` : "";

	return (
		<div className={`composer ${busy ? "busy" : ""}`}>
			{suggestions.length ? (
				<div className="slash-menu">
					{suggestions.map((c, i) => (
						<button key={c.name} className={i === selected ? "sel" : ""} onMouseEnter={() => setSelected(i)} onClick={() => setDraft(`/${c.name} `)}>
							<span className="mono">/{c.name}</span>
							<span className="dim">{c.description}</span>
						</button>
					))}
				</div>
			) : null}
			<textarea
				ref={area}
				value={draft}
				placeholder={placeholder}
				onChange={(e) => {
					setDraft(e.target.value);
					setSelected(0);
				}}
				onKeyDown={(e) => {
					if (suggestions.length && (e.key === "ArrowDown" || e.key === "ArrowUp")) {
						e.preventDefault();
						setSelected((s) => (s + (e.key === "ArrowDown" ? 1 : suggestions.length - 1)) % suggestions.length);
						return;
					}
					if (suggestions.length && (e.key === "Tab" || (e.key === "Enter" && !e.shiftKey && draft === `/${slash}` && suggestions[selected].name !== slash))) {
						e.preventDefault();
						setDraft(`/${suggestions[selected].name} `);
						return;
					}
					if (e.key === "Enter" && !e.shiftKey) {
						e.preventDefault();
						submit();
					}
				}}
			/>
			<div className="composer-bar">
				<div className="menu-wrap">
					<button className="round-btn" title="Add" onClick={() => setPlusOpen(!plusOpen)}>
						<Plus size={16} />
					</button>
					<Popover open={plusOpen} onClose={() => setPlusOpen(false)} align="left">
						<button
							onClick={() => {
								setPlusOpen(false);
								file.current?.click();
							}}
						>
							<span className="menu-row">
								<FilePlus2 size={14} /> Add reference videos…
							</span>
						</button>
						<button
							onClick={() => {
								setPlusOpen(false);
								setVideoMode(!videoMode);
							}}
						>
							<span className="menu-row">
								<Clapperboard size={14} /> Video mode
							</span>
							{videoMode ? <Check size={13} /> : null}
						</button>
					</Popover>
				</div>
				<input
					ref={file}
					type="file"
					accept="video/*"
					multiple
					hidden
					onChange={(e) => {
						onAttach([...(e.target.files ?? [])]);
						e.target.value = "";
					}}
				/>
				{videoMode ? (
					<span className="mode-chip">
						<Clapperboard size={13} />
						Video
						<button title="Leave video mode" onClick={() => setVideoMode(false)}>
							<X size={12} />
						</button>
					</span>
				) : null}
				<span className="spacer" />
				<div className="menu-wrap">
					<button className="model-btn" onClick={() => setModelOpen(!modelOpen)} disabled={!modelSpecs.length}>
						{model ? `${shortModel(model.id)} ${cap(thinking ?? "medium")}` : "Model"}
						<ChevronDown size={13} />
					</button>
					<Popover open={modelOpen} onClose={() => setModelOpen(false)} className="model-menu">
						<div className="menu-label">Thinking</div>
						<div className="seg">
							{THINKING.map((level) => (
								<button key={level} className={level === (thinking ?? "medium") ? "on" : ""} onClick={() => onThinking(level)}>
									{cap(level)}
								</button>
							))}
						</div>
						<div className="menu-label">Model</div>
						{modelSpecs.map((m) => (
							<button
								key={m.spec}
								onClick={() => {
									setModelOpen(false);
									onModel(m.spec);
								}}
							>
								<span className="menu-row">
									{shortModel(m.id)}
									<span className="dim">{m.provider}</span>
								</span>
								{m.spec === currentSpec ? <Check size={13} /> : null}
							</button>
						))}
					</Popover>
				</div>
				{busy ? (
					<button className="send stop" onClick={onStop} title="Stop">
						<Square size={11} fill="currentColor" />
					</button>
				) : (
					<button className="send" onClick={submit} disabled={!draft.trim() || disabled} title="Send (Enter)">
						<ArrowUp size={16} />
					</button>
				)}
			</div>
		</div>
	);
}
