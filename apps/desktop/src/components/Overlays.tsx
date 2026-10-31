import { Moon, ShieldQuestion, Sun, X } from "lucide-react";
import { useEffect, useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import type { UiRequest } from "../lib/types";
import { mediaUrl } from "../lib/util";
import { BrandPreview } from "./BrandPreview";

// Approval / input requests coming from extensions (confirm before upload, pick an option…)
export function UiRequestModal({ request, onRespond }: { request: UiRequest; onRespond: (response: Record<string, unknown>) => void }) {
	const [value, setValue] = useState(request.prefill ?? "");
	return (
		<div className="overlay overlay-top">
			<div className="modal">
				<div className="modal-head">
					<ShieldQuestion size={16} />
					<span>{request.title}</span>
				</div>
				{request.message ? <p className="modal-msg">{request.message}</p> : null}
				{request.method === "select" ? (
					<div className="modal-options">
						{request.options?.map((option) => (
							<button key={option} onClick={() => onRespond({ id: request.id, value: option })}>
								{option}
							</button>
						))}
					</div>
				) : null}
				{request.method === "input" || request.method === "editor" ? (
					request.method === "editor" ? (
						<textarea className="modal-input tall" value={value} onChange={(e) => setValue(e.target.value)} autoFocus />
					) : (
						<input className="modal-input" value={value} placeholder={request.placeholder} onChange={(e) => setValue(e.target.value)} autoFocus onKeyDown={(e) => e.key === "Enter" && onRespond({ id: request.id, value })} />
					)
				) : null}
				<div className="modal-actions">
					<button className="ghost-btn" onClick={() => onRespond({ id: request.id, ...(request.method === "confirm" ? { confirmed: false } : { cancelled: true }) })}>
						{request.method === "confirm" ? "Deny" : "Cancel"}
					</button>
					{request.method === "confirm" ? (
						<button className="solid-btn" onClick={() => onRespond({ id: request.id, confirmed: true })}>
							Approve
						</button>
					) : null}
					{request.method === "input" || request.method === "editor" ? (
						<button className="solid-btn" onClick={() => onRespond({ id: request.id, value })}>
							Submit
						</button>
					) : null}
				</div>
			</div>
		</div>
	);
}

const IMAGE = /\.(png|jpe?g|webp|gif)$/i;
const VIDEO = /\.(mp4|mov|m4v|webm)$/i;
const HTML = /\.html?$/i;

export function Viewer({ path, cwd, onClose, onReveal, onAsk }: { path: string; cwd: string; onClose: () => void; onReveal: (path: string) => void; onAsk: (prompt: string) => void }) {
	const [text, setText] = useState<string>();
	useEffect(() => {
		if (!IMAGE.test(path) && !VIDEO.test(path) && !HTML.test(path)) window.om.readFile(path).then((t) => setText(t ?? "Cannot preview this file."));
		const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
		window.addEventListener("keydown", onKey);
		return () => window.removeEventListener("keydown", onKey);
	}, [path, onClose]);
	return (
		<div className="overlay" onClick={onClose}>
			<div className="viewer" onClick={(e) => e.stopPropagation()}>
				<div className="viewer-head">
					<span className="mono">{path.replace(/^\/Users\/[^/]+/, "~")}</span>
					<button className="link" onClick={() => onReveal(path)}>
						reveal in Finder
					</button>
					<button className="icon-btn" onClick={onClose}>
						<X size={15} />
					</button>
				</div>
				<div className={`viewer-body ${HTML.test(path) ? "page" : ""}`}>
					{HTML.test(path) ? (
						<BrandPreview
							path={path}
							cwd={cwd}
							onAsk={(prompt) => {
								onAsk(prompt);
								onClose();
							}}
						/>
					) : null}
					{IMAGE.test(path) ? <img src={mediaUrl(path)} alt="" /> : null}
					{VIDEO.test(path) ? <video src={mediaUrl(path)} controls autoPlay /> : null}
					{text !== undefined ? (
						path.endsWith(".md") ? (
							<div className="md-view">
								<ReactMarkdown remarkPlugins={[remarkGfm]}>{text}</ReactMarkdown>
							</div>
						) : (
							<pre className="mono-block">{text}</pre>
						)
					) : null}
				</div>
			</div>
		</div>
	);
}

// Settings in the Cursor style: grouped rows with the control on the right.
export function CustomizeModal({
	theme,
	setTheme,
	model,
	thinking,
	runtime,
	cwd,
	onReveal,
	onClose,
	accounts,
	connected,
	defaultModel,
	models,
	onDefaultModel,
}: {
	theme: "dark" | "light";
	setTheme: (theme: "dark" | "light") => void;
	model?: { provider: string; id: string };
	thinking?: string;
	runtime?: { cliPath?: string; nodePath?: string };
	cwd?: string;
	onReveal: (path: string) => void;
	onClose: () => void;
	accounts: React.ReactNode;
	connected: { id: string; name: string; detail: string; kind: string }[];
	defaultModel?: string;
	models: { provider: string; id: string }[];
	onDefaultModel: (spec: string) => void;
}) {
	useEffect(() => {
		const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
		window.addEventListener("keydown", onKey);
		return () => window.removeEventListener("keydown", onKey);
	}, [onClose]);
	const tilde = (p?: string) => (p ?? "—").replace(/^\/Users\/[^/]+/, "~");
	return (
		<div className="overlay" onClick={onClose}>
			<div className="settings" onClick={(e) => e.stopPropagation()}>
				<div className="settings-head">
					<span>Customize</span>
					<button className="icon-btn" onClick={onClose}>
						<X size={15} />
					</button>
				</div>
				<div className="settings-group">
					<div className="settings-title">Appearance</div>
					<div className="settings-row">
						<div>
							<div>Theme</div>
							<div className="dim">Dark is the default; light applies everywhere.</div>
						</div>
						<div className="seg">
							<button className={theme === "dark" ? "on" : ""} onClick={() => setTheme("dark")}>
								<Moon size={13} /> Dark
							</button>
							<button className={theme === "light" ? "on" : ""} onClick={() => setTheme("light")}>
								<Sun size={13} /> Light
							</button>
						</div>
					</div>
				</div>
				<div className="settings-group">
					<div className="settings-title">Connected accounts</div>
					{connected.length ? (
						connected.map((c) => (
							<div key={c.id} className="settings-row">
								<div className="acct-inline">
									<i />
									<div>
										<div>{c.name}</div>
										<div className="dim">{c.detail}</div>
									</div>
								</div>
								<span className="mono dim">{c.kind}</span>
							</div>
						))
					) : (
						<div className="settings-row">
							<div className="dim">No model account connected yet — sign in below.</div>
						</div>
					)}
				</div>
				<div className="settings-group">
					<div className="settings-title">All providers</div>
					{accounts}
				</div>
				<div className="settings-group">
					<div className="settings-title">Agent</div>
					<div className="settings-row">
						<div>
							<div>Default model</div>
							<div className="dim">Used by new sessions in every workspace.</div>
						</div>
						{models.length ? (
							<select className="settings-select" value={defaultModel ?? ""} onChange={(e) => onDefaultModel(e.target.value)}>
								{defaultModel && !models.some((m) => `${m.provider}/${m.id}` === defaultModel) ? <option value={defaultModel}>{defaultModel}</option> : null}
								{models.map((m) => (
									<option key={`${m.provider}/${m.id}`} value={`${m.provider}/${m.id}`}>
										{m.provider}/{m.id}
									</option>
								))}
							</select>
						) : (
							<span className="mono dim">{defaultModel ?? "—"}</span>
						)}
					</div>
					<div className="settings-row">
						<div>Current session</div>
						<span className="mono dim">{model ? `${model.provider}/${model.id}` : "connect a workspace"}</span>
					</div>
					<div className="settings-row">
						<div>Thinking</div>
						<span className="mono dim">{thinking ?? "medium"}</span>
					</div>
				</div>
				<div className="settings-group">
					<div className="settings-title">Runtime</div>
					<div className="settings-row">
						<div>CLI</div>
						<span className="mono dim">{tilde(runtime?.cliPath)}</span>
					</div>
					<div className="settings-row">
						<div>Node</div>
						<span className="mono dim">{tilde(runtime?.nodePath)}</span>
					</div>
					{cwd ? (
						<div className="settings-row">
							<div>Workspace</div>
							<button className="link mono" onClick={() => onReveal(cwd)}>
								{tilde(cwd)}
							</button>
						</div>
					) : null}
				</div>
			</div>
		</div>
	);
}
