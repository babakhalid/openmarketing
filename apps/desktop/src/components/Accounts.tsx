import { ArrowUpRight, Check, ChevronDown, Copy, KeyRound, Search, X } from "lucide-react";
import { useMemo, useState } from "react";
import type { AuthPromptShape, ProviderStatus } from "../lib/types";

const FEATURED = ["anthropic", "openai-codex", "openai", "google", "github-copilot", "openrouter"];

const SOURCE: Record<string, string> = {
	stored: "Signed in",
	environment: "Environment variable",
	runtime: "Session key",
	models_json_key: "models.json",
	models_json_command: "models.json",
	fallback: "Fallback",
};

export function accountLabel(p: ProviderStatus) {
	if (p.credential === "oauth") return p.oauthName ?? `${p.name} account`;
	if (p.credential === "api_key") return `${p.name} · API key`;
	return `${p.name} · ${SOURCE[p.source ?? ""] ?? "connected"}`;
}

function ProviderRow({ p, onLogin, onLogout }: { p: ProviderStatus; onLogin: (p: ProviderStatus, method: "oauth" | "api_key") => void; onLogout: (p: ProviderStatus) => void }) {
	return (
		<div className={`acct-row ${p.connected ? "on" : ""}`}>
			<span className="acct-mark">{p.name.slice(0, 1).toUpperCase()}</span>
			<span className="acct-text">
				<span className="acct-name">{p.name}</span>
				<span className="acct-sub">
					{p.connected ? (
						<>
							<Check size={12} /> {p.credential === "oauth" ? (p.oauthName ?? "Account") : p.credential === "api_key" ? "API key" : (SOURCE[p.source ?? ""] ?? "Connected")}
						</>
					) : p.oauth ? (
						(p.oauthName ?? "Sign in with your account")
					) : (
						`API key${p.envVar ? ` · or ${p.envVar}` : ""}`
					)}
				</span>
			</span>
			{p.connected ? (
				p.credential ? (
					<button className="acct-btn ghost" onClick={() => onLogout(p)}>
						Disconnect
					</button>
				) : (
					<span className="acct-note">from {p.source === "environment" ? "env" : p.source}</span>
				)
			) : (
				<span className="acct-actions">
					{p.oauth ? (
						<button className="acct-btn solid" onClick={() => onLogin(p, "oauth")}>
							Sign in
						</button>
					) : null}
					{p.apiKey ? (
						<button className={`acct-btn ${p.oauth ? "ghost" : "solid"}`} onClick={() => onLogin(p, "api_key")}>
							<KeyRound size={13} /> API key
						</button>
					) : null}
				</span>
			)}
		</div>
	);
}

export function AccountsPanel({
	providers,
	onLogin,
	onLogout,
	compact = false,
}: {
	providers: ProviderStatus[];
	onLogin: (p: ProviderStatus, method: "oauth" | "api_key") => void;
	onLogout: (p: ProviderStatus) => void;
	compact?: boolean;
}) {
	const [more, setMore] = useState(false);
	const [query, setQuery] = useState("");
	const featured = FEATURED.map((id) => providers.find((p) => p.id === id)).filter(Boolean) as ProviderStatus[];
	const connectedOthers = providers.filter((p) => p.connected && !FEATURED.includes(p.id));
	const rest = useMemo(
		() => providers.filter((p) => !FEATURED.includes(p.id) && !p.connected && (!query || `${p.name} ${p.id}`.toLowerCase().includes(query.toLowerCase()))),
		[providers, query],
	);
	return (
		<div className={`accounts ${compact ? "compact" : ""}`}>
			<div className="acct-list">
				{[...featured, ...connectedOthers].map((p) => (
					<ProviderRow key={p.id} p={p} onLogin={onLogin} onLogout={onLogout} />
				))}
			</div>
			<button className="acct-more" onClick={() => setMore(!more)}>
				<ChevronDown size={14} className={more ? "open" : ""} />
				{more ? "Fewer providers" : `More providers (${providers.length - featured.length - connectedOthers.length})`}
			</button>
			{more ? (
				<>
					<div className="side-search acct-search">
						<Search size={13} />
						<input autoFocus value={query} placeholder="Search providers" onChange={(e) => setQuery(e.target.value)} />
					</div>
					<div className="acct-list">
						{rest.map((p) => (
							<ProviderRow key={p.id} p={p} onLogin={onLogin} onLogout={onLogout} />
						))}
					</div>
				</>
			) : null}
		</div>
	);
}

export type LoginState = {
	provider: ProviderStatus;
	method: "oauth" | "api_key";
	phase: "running" | "done" | "error";
	error?: string;
	url?: string;
	instructions?: string;
	device?: { uri: string; code: string };
	progress: string[];
	prompt?: { promptId: string; prompt: AuthPromptShape };
};

// Pi's login steps as one calm sheet: the browser step is primary; pasting a code is a
// collapsed fallback (the localhost callback normally completes on its own).
export function LoginFlow({ state, onAnswer, onCancel, onClose }: { state: LoginState; onAnswer: (promptId: string, value: string) => void; onCancel: () => void; onClose: () => void }) {
	const [value, setValue] = useState("");
	const [copied, setCopied] = useState(false);
	const [manualOpen, setManualOpen] = useState(false);
	const prompt = state.prompt?.prompt;
	const browserFlow = Boolean(state.url || state.device);
	// with a browser flow, a manual-code prompt is only the fallback for another device
	const fallbackPrompt = browserFlow && prompt?.type === "manual_code";
	const mainPrompt = prompt && !fallbackPrompt ? prompt : undefined;
	let host = "";
	try {
		host = state.url ? new URL(state.url).host : "";
	} catch {
		host = "";
	}
	const submit = () => {
		if (!state.prompt || (!value.trim() && prompt?.type !== "text")) return;
		onAnswer(state.prompt.promptId, value.trim());
		setValue("");
	};
	const input = (placeholder: string) => (
		<form
			className="login-input"
			onSubmit={(e) => {
				e.preventDefault();
				submit();
			}}
		>
			<input autoFocus type={prompt?.type === "secret" ? "password" : "text"} value={value} placeholder={placeholder} onChange={(e) => setValue(e.target.value)} />
			<button type="submit" className="solid-btn" disabled={!value.trim() && prompt?.type !== "text"}>
				{prompt?.type === "secret" ? "Save" : "Continue"}
			</button>
		</form>
	);

	return (
		<div className="overlay overlay-top">
			<div className="login-sheet">
				<div className="login-head">
					<span className="acct-mark lg">{state.provider.name.slice(0, 1).toUpperCase()}</span>
					<div className="login-head-text">
						<div className="login-title">{state.method === "oauth" ? `Sign in to ${state.provider.name}` : `Connect ${state.provider.name}`}</div>
						<div className="dim">{state.method === "oauth" ? (state.provider.oauthName ?? "Account login") : "API key · stored in the credential store shared with the CLI"}</div>
					</div>
					<button className="icon-btn" onClick={state.phase === "running" ? onCancel : onClose} title="Close">
						<X size={15} />
					</button>
				</div>

				{state.phase === "done" ? (
					<div className="login-done">
						<span className="done-mark">
							<Check size={20} />
						</span>
						<div className="login-title">Connected to {state.provider.name}</div>
						<div className="dim">Its models are now available in every workspace.</div>
						<button className="pill-white" onClick={onClose}>
							Done
						</button>
					</div>
				) : (
					<div className="login-body">
						{state.url ? (
							<section className="login-card">
								<div className="login-card-title">Continue in your browser</div>
								<div className="dim">We opened {host || "the sign-in page"} in your browser. Approve access there — this window updates by itself.</div>
								<div className="login-link">
									<span className="link-host">{host || state.url}</span>
									<span className="spacer" />
									<button
										className="link-btn"
										onClick={() => {
											navigator.clipboard.writeText(state.url!);
											setCopied(true);
											setTimeout(() => setCopied(false), 1600);
										}}
									>
										{copied ? <Check size={13} /> : <Copy size={13} />}
										{copied ? "Copied" : "Copy link"}
									</button>
									<button className="link-btn" onClick={() => window.om.openExternal(state.url!)}>
										<ArrowUpRight size={13} />
										Open
									</button>
								</div>
							</section>
						) : null}

						{state.device ? (
							<section className="login-card">
								<div className="login-card-title">Enter this code</div>
								<div className="device-code mono">{state.device.code}</div>
								<button className="link-btn" onClick={() => window.om.openExternal(state.device!.uri)}>
									<ArrowUpRight size={13} />
									{state.device.uri.replace(/^https?:\/\//, "")}
								</button>
							</section>
						) : null}

						{mainPrompt ? (
							<section className="login-card">
								<div className="login-card-title">{mainPrompt.message.replace(/:\s*$/, "")}</div>
								{mainPrompt.type === "select" ? (
									<div className="login-options">
										{mainPrompt.options?.map((o) => (
											<button key={o.id} onClick={() => onAnswer(state.prompt!.promptId, o.id)}>
												<span>{o.label}</span>
												{o.description ? <span className="dim">{o.description}</span> : null}
											</button>
										))}
									</div>
								) : (
									input(mainPrompt.placeholder ?? (mainPrompt.type === "secret" ? "Paste your API key" : ""))
								)}
								{mainPrompt.type === "secret" && state.provider.envVar ? <div className="dim small">Or set {state.provider.envVar} in your shell instead of storing a key.</div> : null}
							</section>
						) : null}

						{state.phase === "running" && !mainPrompt ? (
							<div className="login-wait">
								<span className="ws-busy" />
								{state.progress.at(-1) ?? (browserFlow ? "Waiting for you to approve in the browser…" : "Starting…")}
							</div>
						) : null}

						{fallbackPrompt ? (
							<div className="login-fallback">
								<button className="fallback-toggle" onClick={() => setManualOpen(!manualOpen)}>
									<ChevronDown size={14} className={manualOpen ? "open" : ""} />
									Browser on another device? Paste the code
								</button>
								{manualOpen ? input(prompt?.placeholder ?? "Paste the redirect URL or code") : null}
							</div>
						) : null}

						{state.phase === "error" ? <div className="login-error">{state.error}</div> : null}

						<div className="login-actions">
							{state.phase === "running" ? (
								<button className="ghost-btn" onClick={onCancel}>
									Cancel
								</button>
							) : (
								<button className="ghost-btn" onClick={onClose}>
									Close
								</button>
							)}
						</div>
					</div>
				)}
			</div>
		</div>
	);
}
