import { ChevronDown, Clapperboard, Ellipsis, FilePlus2, FolderOpen, GitBranch, Laptop, PanelLeft, PanelRight, Plus, ScanSearch } from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ChatLog } from "./components/ChatLog";
import { decisionFor } from "./components/DecisionCard";
import { Composer } from "./components/Composer";
import { Inspector } from "./components/Inspector";
import { AccountsPanel, LoginFlow, accountLabel, type LoginState } from "./components/Accounts";
import { CustomizeModal, UiRequestModal, Viewer } from "./components/Overlays";
import { Sidebar, type GettingStartedStep } from "./components/Sidebar";
import type { FixAction } from "./lib/errors";
import { emptySession, itemsFromHistory, reduceEvent, shortModel } from "./lib/session";
import type { AuthOverview, Item, ModelInfo, ProviderStatus, Session, SessionEntry, WorkspaceInfo } from "./lib/types";

const api = window.om;

const tilde = (p: string) => p.replace(/^\/Users\/[^/]+/, "~");

export default function App() {
	const [recent, setRecent] = useState<string[]>([]);
	const [active, setActive] = useState<string>();
	const [sessions, setSessions] = useState<Record<string, Session>>({});
	const [infos, setInfos] = useState<Record<string, WorkspaceInfo>>({});
	const [runtime, setRuntime] = useState<{ cliPath?: string; nodePath?: string }>();
	const [draft, setDraft] = useState("");
	const [videoMode, setVideoMode] = useState(true);
	const [viewer, setViewer] = useState<string>();
	const [inspectorOpen, setInspectorOpen] = useState(false);
	const [sidebarOpen, setSidebarOpen] = useState(true);
	const [customizeOpen, setCustomizeOpen] = useState(false);
	const [moreOpen, setMoreOpen] = useState(false);
	const [userName, setUserName] = useState("");
	// workspace navigation history for the sidebar back/forward arrows
	const [history, setHistory] = useState<{ stack: string[]; index: number }>({ stack: [], index: -1 });
	const [pickerOpen, setPickerOpen] = useState(false);
	const [focusTab, setFocusTab] = useState<"outputs" | "references" | "branding">();
	const [theme, setTheme] = useState<"dark" | "light">(() => (document.documentElement.dataset.theme === "light" ? "light" : "dark"));
	useEffect(() => {
		document.documentElement.dataset.theme = theme;
		try {
			localStorage.setItem("ma-theme", theme);
		} catch {
			/* storage unavailable: theme still applies for this session */
		}
	}, [theme]);
	const [auth, setAuth] = useState<AuthOverview>();
	const [login, setLogin] = useState<LoginState>();
	const loginId = useRef<string | undefined>(undefined);
	// screenshot mode: `--login <provider>:pick` answers the first select prompt to reach the browser step
	const autoPick = useRef(false);
	const [sessionLists, setSessionLists] = useState<Record<string, SessionEntry[]>>({});
	const [forceOnboarding, setForceOnboarding] = useState(false);
	const refreshTimers = useRef<Record<string, number>>({});
	const autoPrompt = useRef<string | undefined>(undefined);
	// a failed prompt to send again, silently, once the agent reconnects after a sign-in
	const resumePrompt = useRef<string | undefined>(undefined);

	const session = active ? sessions[active] : undefined;
	const info = active ? infos[active] : undefined;

	const patch = useCallback((cwd: string, fn: (s: Session) => Session) => {
		setSessions((all) => ({ ...all, [cwd]: fn(all[cwd] ?? emptySession(cwd)) }));
	}, []);

	const refreshInfo = useCallback((cwd: string, delay = 250) => {
		window.clearTimeout(refreshTimers.current[cwd]);
		refreshTimers.current[cwd] = window.setTimeout(() => {
			api.describeWorkspace(cwd).then((d) => setInfos((all) => ({ ...all, [cwd]: d })));
		}, delay);
	}, []);

	const loadAuth = useCallback(async () => {
		const response = await api.bridge("auth_status").catch(() => undefined);
		if (response?.ok) setAuth(response.data);
	}, []);

	const loadSessions = useCallback(async (cwd: string) => {
		const response = await api.bridge("sessions", { cwd }).catch(() => undefined);
		if (response?.ok) setSessionLists((all) => ({ ...all, [cwd]: response.data }));
	}, []);

	const connect = useCallback(
		async (cwd: string, fromHistory = false) => {
			if (!fromHistory)
				setHistory((h) => (h.stack[h.index] === cwd ? h : { stack: [...h.stack.slice(0, h.index + 1), cwd], index: h.index + 1 }));
			setActive(cwd);
			refreshInfo(cwd, 0);
			let alreadyConnected = false;
			setSessions((all) => {
				alreadyConnected = Boolean(all[cwd]?.connected || all[cwd]?.connecting);
				return alreadyConnected ? all : { ...all, [cwd]: { ...(all[cwd] ?? emptySession(cwd)), connecting: true, error: undefined } };
			});
			if (alreadyConnected) return;
			try {
				const opened = await api.openWorkspace(cwd);
				patch(cwd, (s) => ({
					...s,
					connected: true,
					connecting: false,
					model: opened.state?.model,
					thinking: opened.state?.thinkingLevel,
					busy: Boolean(opened.state?.isStreaming),
					commands: opened.commands ?? [],
					models: opened.models ?? [],
					items: s.items.length ? s.items : itemsFromHistory(opened.messages ?? []),
					sessionFile: opened.state?.sessionFile,
				}));
				loadSessions(cwd);
				if (autoPrompt.current) {
					const text = autoPrompt.current;
					autoPrompt.current = undefined;
					patch(cwd, (s) => ({ ...s, items: [...s.items, { kind: "user", id: `u${Date.now()}`, text }] }));
					api.command(cwd, { type: "prompt", message: text });
				}
				if (resumePrompt.current) {
					const text = resumePrompt.current;
					resumePrompt.current = undefined;
					api.command(cwd, { type: "prompt", message: text });
				}
			} catch (error) {
				patch(cwd, (s) => ({ ...s, connecting: false, error: (error as Error).message }));
			}
		},
		[patch, refreshInfo, loadSessions],
	);

	// boot: restore workspaces, or replay a recorded run (screenshot / design mode)
	useEffect(() => {
		(async () => {
			const state = await api.getState();
			setRuntime(state.runtime);
			setUserName(state.user ?? "");
			autoPrompt.current = state.autoPrompt;
			if (state.tab) {
				setFocusTab(state.tab);
				setInspectorOpen(true);
			}
			if (state.view) setViewer(state.view);
			if (state.theme) setTheme(state.theme);
			if (state.customize) setCustomizeOpen(true);
			setRecent(state.recent);
			if (state.onboarding) setForceOnboarding(true);
			loadAuth().then(async () => {
				// verification runs: start a sign-in on load (screenshot mode only)
				if (!state.login) return;
				const [providerId, pick] = state.login.split(":");
				autoPick.current = pick === "pick";
				const response = await api.bridge("auth_status");
				const provider = response.data?.providers?.find((p: ProviderStatus) => p.id === providerId);
				if (provider) startLogin(provider, provider.oauth ? "oauth" : "api_key");
			});
			const fixture = await api.devFixture();
			if (fixture?.cwd) {
				let s: Session = emptySession(fixture.cwd);
				if (fixture.prompt) s.items = [{ kind: "user", id: "u0", text: fixture.prompt }];
				let t = Date.now() - fixture.events.length * 400;
				for (const event of fixture.events) s = reduceEvent(s, event, (t += 400));
				s = { ...s, connected: true, model: { provider: "anthropic", id: "claude-opus-5-5" }, thinking: "high" };
				setRecent((r) => [fixture.cwd!, ...r.filter((p) => p !== fixture.cwd)]);
				setSessions({ [fixture.cwd]: s });
				setActive(fixture.cwd);
				refreshInfo(fixture.cwd, 0);
				return;
			}
			if (state.last) connect(state.last);
		})();
	}, [connect, refreshInfo, loadAuth]);

	useEffect(() => {
		const offEvent = api.onEvent(({ cwd, event }) => {
			setSessions((all) => ({ ...all, [cwd]: reduceEvent(all[cwd] ?? emptySession(cwd), event) }));
			if (event.type === "tool_execution_end" || event.type === "agent_end") refreshInfo(cwd);
			if (event.type === "agent_end") loadSessions(cwd);
		});
		const offBridge = api.onBridgeEvent((message) => {
			loginId.current = message.loginId;
			if (message.type === "login_prompt" && autoPick.current && message.prompt.type === "select" && message.prompt.options?.length) {
				autoPick.current = false;
				api.bridge("prompt_response", { promptId: message.promptId, value: message.prompt.options[0].id });
				return;
			}
			setLogin((current) => {
				if (!current) return current;
				if (message.type === "login_prompt") return { ...current, prompt: { promptId: message.promptId, prompt: message.prompt } };
				const e = message.event;
				if (e.type === "auth_url") return { ...current, url: e.url, instructions: e.instructions };
				if (e.type === "device_code") return { ...current, device: { uri: e.verificationUri ?? "", code: e.userCode ?? "" } };
				if (e.message) return { ...current, progress: [...current.progress, e.message] };
				return current;
			});
		});
		const offExit = api.onExit(({ cwd, stderr, code }) => {
			patch(cwd, (s) => ({ ...s, connected: false, busy: false, error: code ? `Agent stopped (exit ${code}). ${stderr.split("\n").slice(-3).join(" ")}` : undefined }));
		});
		return () => {
			offEvent();
			offExit();
			offBridge();
		};
	}, [patch, refreshInfo, loadSessions]);

	useEffect(() => {
		const onKey = (e: KeyboardEvent) => {
			if (e.metaKey && e.key.toLowerCase() === "n") {
				e.preventDefault();
				newChat(true);
			}
		};
		window.addEventListener("keydown", onKey);
		return () => window.removeEventListener("keydown", onKey);
	});

	const addWorkspace = async () => {
		const cwd = await api.pickWorkspace();
		if (!cwd) return;
		setRecent((r) => [cwd, ...r.filter((p) => p !== cwd)]);
		connect(cwd);
	};

	const send = async (text: string) => {
		if (!active) {
			await addWorkspace();
			return;
		}
		const cwd = active;
		patch(cwd, (s) => ({ ...s, items: [...s.items, { kind: "user", id: `u${Date.now()}`, text }] }));
		try {
			await api.command(cwd, { type: "prompt", message: text, ...(session?.busy ? { streamingBehavior: "followUp" } : {}) });
		} catch (error) {
			patch(cwd, (s) => ({ ...s, items: [...s.items, { kind: "notice", id: `e${Date.now()}`, level: "error", text: (error as Error).message }] }));
		}
	};

	const newChat = async (video: boolean) => {
		setVideoMode(video);
		setDraft("");
		if (!active) return;
		await api.command(active, { type: "new_session" }).catch(() => undefined);
		const state = await api.command(active, { type: "get_state" }).catch(() => undefined);
		patch(active, (s) => ({ ...s, items: [], cost: 0, contextTokens: 0, busy: false, sessionFile: state?.sessionFile }));
		loadSessions(active);
	};

	// reopen a past conversation in the live agent and rebuild its log
	const resumeSession = async (cwd: string, path: string) => {
		if (cwd !== active) await connect(cwd);
		if (sessions[cwd]?.busy) return;
		await api.command(cwd, { type: "switch_session", sessionPath: path });
		const [messages, state] = await Promise.all([api.command(cwd, { type: "get_messages" }), api.command(cwd, { type: "get_state" })]);
		patch(cwd, (s) => ({ ...s, items: itemsFromHistory(messages?.messages ?? messages ?? []), sessionFile: state?.sessionFile ?? path, cost: 0, busy: false }));
	};

	// account changes restart running agents in the main process; reconnect the visible one
	const afterAccountChange = async () => {
		await loadAuth();
		setSessions((all) => Object.fromEntries(Object.entries(all).map(([cwd, s]) => [cwd, { ...s, connected: false, connecting: false }])));
		if (active) setTimeout(() => connect(active), 50);
	};

	const startLogin = async (provider: ProviderStatus, method: "oauth" | "api_key", resume?: string) => {
		setLogin({ provider, method, phase: "running", progress: [] });
		const response = await api.bridge("login", { providerId: provider.id, method }).catch((error: Error) => ({ ok: false, error: error.message, cancelled: false }));
		if (response.cancelled) {
			setLogin(undefined);
			return false;
		}
		setLogin((current) => (current ? { ...current, prompt: undefined, phase: response.ok ? "done" : "error", error: response.error } : current));
		if (response.ok) {
			resumePrompt.current = resume;
			afterAccountChange();
		}
		return Boolean(response.ok);
	};

	// The model a problem card offers instead: Opus first, otherwise the best model from another provider.
	const alternativeFor = (failed?: string): ModelInfo | undefined => {
		const models = [...(session?.models ?? []), ...(session?.model ? [session.model] : [])].filter((m) => m.provider !== failed);
		return models.find((m) => m.id === "claude-opus-5-5") ?? models.find((m) => /opus/.test(m.id)) ?? models.find((m) => m.provider === "anthropic") ?? models[0];
	};

	// One-click ways out of a failed turn. Every fix that can continue the work re-sends the prompt
	// that failed, so the person never has to retype it.
	const fixProblem = async (item: Extract<Item, { kind: "problem" }>, action: FixAction) => {
		if (!active) return;
		const cwd = active;
		const items = sessions[cwd]?.items ?? [];
		const at = items.findIndex((i) => i.id === item.id);
		const prompt = (items.slice(0, at).reverse().find((i) => i.kind === "user") as { text: string } | undefined)?.text;
		const resolve = (note: string) => patch(cwd, (s) => ({ ...s, items: s.items.map((i) => (i.id === item.id ? { ...item, resolved: note } : i)) }));
		const resend = () => prompt && api.command(cwd, { type: "prompt", message: prompt });

		if (action === "login") {
			const provider = auth?.providers.find((p) => p.id === item.problem.provider);
			if (!provider) return;
			if (await startLogin(provider, provider.oauth ? "oauth" : "api_key", prompt)) resolve(`signed in again${prompt ? ", picking up your request" : ""}`);
		} else if (action === "switch") {
			const next = alternativeFor(item.problem.provider);
			if (!next) return;
			const model = await api.command(cwd, { type: "set_model", provider: next.provider, modelId: next.id });
			patch(cwd, (s) => ({ ...s, model: model ?? next }));
			resolve(`switched to ${shortModel(next.id)}${prompt ? " and re-sent your request" : ""}`);
			await resend();
		} else if (action === "retry") {
			resolve("retried");
			await resend();
		} else {
			resolve("started a new chat");
			await newChat(videoMode);
		}
	};

	const logout = async (provider: ProviderStatus) => {
		await api.bridge("logout", { providerId: provider.id });
		afterAccountChange();
	};

	const importFiles = async (files: File[]) => {
		if (!active || !files.length) return;
		const copied = await api.importReferences(active, files.map((f) => api.pathForFile(f)));
		refreshInfo(active, 0);
		if (copied.length) patch(active, (s) => ({ ...s, items: [...s.items, { kind: "notice", id: `i${Date.now()}`, level: "info", text: `Added ${copied.length} reference video${copied.length > 1 ? "s" : ""} to references/` }] }));
	};

	const respondUi = async (response: Record<string, unknown>) => {
		if (!active) return;
		await api.respondToUi(active, response);
		patch(active, (s) => ({ ...s, uiRequests: s.uiRequests.filter((r) => r.id !== response.id) }));
	};

	const connectedAccounts = (auth?.providers ?? []).filter((p) => p.connected);
	const needsOnboarding = forceOnboarding || (auth !== undefined && connectedAccounts.length === 0);

	const statuses = useMemo(() => Object.entries(session?.statuses ?? {}).filter(([, v]) => v && v.length < 40), [session?.statuses]);
	const hasLog = Boolean(session?.items.length);
	const lastProblem = [...(session?.items ?? [])].reverse().find((i) => i.kind === "problem");
	const alternative = alternativeFor(lastProblem?.kind === "problem" ? lastProblem.problem.provider : undefined);
	const alternativeLabel = alternative ? shortModel(alternative.id) : undefined;

	const composer = (
		<Composer
			busy={Boolean(session?.busy)}
			disabled={Boolean(active && !session?.connected)}
			videoMode={videoMode}
			setVideoMode={setVideoMode}
			commands={session?.commands ?? []}
			models={session?.models ?? []}
			model={session?.model}
			thinking={session?.thinking}
			draft={draft}
			setDraft={setDraft}
			placeholder={!active ? "Open a folder to start" : videoMode ? "Describe the video you want" : "Ask anything"}
			onSend={send}
			onStop={() => active && api.command(active, { type: "abort" })}
			onAttach={importFiles}
			onModel={async (spec) => {
				if (!active) return;
				const [provider, ...rest] = spec.split("/");
				const model = await api.command(active, { type: "set_model", provider, modelId: rest.join("/") });
				patch(active, (s) => ({ ...s, model: model ?? { provider, id: rest.join("/") } }));
			}}
			onThinking={async (level) => {
				if (!active) return;
				await api.command(active, { type: "set_thinking_level", level });
				patch(active, (s) => ({ ...s, thinking: level }));
			}}
		/>
	);

	const steps: GettingStartedStep[] = [
		{ label: "Open a folder for the agent to work in", done: Boolean(active), action: "Open Folder", run: () => addWorkspace() },
		{
			label: "Add reference videos to references/",
			done: Boolean(info?.references.length),
			action: "Add References",
			run: () => {
				setInspectorOpen(true);
				setFocusTab("references");
			},
		},
		{
			label: "Make your first video",
			done: Boolean(info?.latest),
			action: "Start a Video",
			run: () => {
				setVideoMode(true);
				setDraft("Analyse my references, then make a 20 second vertical ad. Brief: ");
			},
		},
	];

	const go = (delta: number) => {
		const index = history.index + delta;
		const cwd = history.stack[index];
		if (!cwd) return;
		setHistory({ ...history, index });
		connect(cwd, true);
	};

	const contextRow = (
		<div className="ctx-row">
			<div className="menu-wrap">
				<button className="ctx-btn" onClick={() => setPickerOpen(!pickerOpen)}>
					<span>{active ? tilde(active) : "Choose a folder"}</span>
					<ChevronDown size={13} />
				</button>
				{pickerOpen ? (
					<>
						<div className="menu-backdrop" onClick={() => setPickerOpen(false)} />
						<div className="menu menu-left menu-down wide">
							<div className="menu-label">Recent</div>
							{recent.map((cwd) => (
								<button
									key={cwd}
									onClick={() => {
										setPickerOpen(false);
										connect(cwd);
									}}
								>
									<span className="menu-row">
										<FolderOpen size={14} />
										{tilde(cwd)}
									</span>
								</button>
							))}
							<button
								className="menu-add"
								onClick={() => {
									setPickerOpen(false);
									addWorkspace();
								}}
							>
								<span className="menu-row">
									<Plus size={14} /> Open Folder…
								</span>
							</button>
						</div>
					</>
				) : null}
			</div>
			{info?.branch ? (
				<span className="ctx-btn static">
					<GitBranch size={13} />
					{info.branch}
					<ChevronDown size={13} />
				</span>
			) : null}
			<span className="ctx-btn static">
				<Laptop size={13} />
				This Mac
				<ChevronDown size={13} />
			</span>
		</div>
	);

	const topActions = (
		<div className="top-actions no-drag">
			{statuses.map(([k, v]) => (
				<span key={k} className="tb-status">
					{v}
				</span>
			))}
			{session?.cost ? <span className="tb-dim">${session.cost.toFixed(2)}</span> : null}
			<div className="menu-wrap">
				<button className="icon-btn" title="More" onClick={() => setMoreOpen(!moreOpen)}>
					<Ellipsis size={16} />
				</button>
				{moreOpen ? (
					<>
						<div className="menu-backdrop" onClick={() => setMoreOpen(false)} />
						<div className="menu menu-down">
							<button
								onClick={() => {
									setMoreOpen(false);
									newChat(true);
								}}
							>
								<span className="menu-row">
									<Clapperboard size={14} /> New Video
								</span>
							</button>
							{info?.latest ? (
								<button
									onClick={() => {
										setMoreOpen(false);
										setViewer(info.latest!.video);
									}}
								>
									<span className="menu-row">
										<ScanSearch size={14} /> Open Latest Video
									</span>
								</button>
							) : null}
							<button
								onClick={() => {
									setMoreOpen(false);
									setCustomizeOpen(true);
								}}
							>
								<span className="menu-row">
									<PanelLeft size={14} /> Customize…
								</span>
							</button>
						</div>
					</>
				) : null}
			</div>
			{active ? (
				<button className={`icon-btn ${inspectorOpen ? "on" : ""}`} title="Toggle workspace panel" onClick={() => setInspectorOpen(!inspectorOpen)}>
					<PanelRight size={16} />
				</button>
			) : null}
		</div>
	);

	return (
		<div className={`app ${sidebarOpen ? "" : "no-sidebar"} ${inspectorOpen && active ? "with-inspector" : ""}`}>
			{sidebarOpen ? (
				<Sidebar
					recent={recent}
					active={active}
					sessions={sessions}
					info={info}
					userName={userName || "OpenMarketing"}
					mode={videoMode ? "video" : "chat"}
					steps={steps}
					accounts={connectedAccounts}
					sessionLists={sessionLists}
					activeSessionFile={session?.sessionFile}
					onResume={resumeSession}
					onSelect={(cwd) => connect(cwd)}
					onAdd={addWorkspace}
					onForget={async (cwd) => {
						const state = await api.forgetWorkspace(cwd);
						setRecent(state.recent);
						if (cwd === active) setActive(undefined);
					}}
					onNewVideo={() => newChat(true)}
					onNewChat={() => newChat(false)}
					onAutomations={() => {
						newChat(false);
						setDraft("/loop ");
					}}
					onCustomize={() => setCustomizeOpen(true)}
					onCollapse={() => setSidebarOpen(false)}
					onBack={() => go(-1)}
					onForward={() => go(1)}
					canBack={history.index > 0}
					canForward={history.index < history.stack.length - 1}
				/>
			) : null}

			<main className="main">
				<header className="topbar drag">
					{!sidebarOpen ? (
						<button className="icon-btn no-drag collapsed-toggle" title="Show sidebar" onClick={() => setSidebarOpen(true)}>
							<PanelLeft size={16} />
						</button>
					) : null}
					{hasLog && active ? (
						<>
							<span className="tb-name">{active.split("/").pop()}</span>
							{session?.busy ? (
								<span className="tb-live">
									<span className="tally" />
									Working
								</span>
							) : null}
						</>
					) : null}
					<span className="spacer" />
					{topActions}
				</header>

				{session?.error ? <div className="banner">{session.error}</div> : null}
				{session?.connecting ? <div className="banner soft">Starting the agent in {tilde(active ?? "")}…</div> : null}

				{needsOnboarding ? (
					<div className="onboarding">
						<div className="onb-inner">
							<div className="onb-mark">OM</div>
							<h1>Welcome to OpenMarketing</h1>
							<p className="dim">Connect a model provider to start. Sign in with a subscription account or paste an API key — the same credentials the CLI uses.</p>
							<AccountsPanel providers={auth?.providers ?? []} onLogin={startLogin} onLogout={logout} />
							{connectedAccounts.length ? (
								<button className="pill-white onb-continue" onClick={() => setForceOnboarding(false)}>
									Continue
								</button>
							) : (
								<div className="onb-foot dim">You can change providers any time from Customize.</div>
							)}
						</div>
					</div>
				) : hasLog ? (
					<>
						<ChatLog items={session!.items} cwd={active!} busy={Boolean(session?.busy)} onOpen={setViewer} alternative={alternativeLabel} onFix={fixProblem} requests={session!.uiRequests} onRespond={respondUi} />
						<div className="dock">{composer}</div>
					</>
				) : (
					<div className="home">
						<div className="home-center">
							{contextRow}
							{composer}
							<div className="home-actions">
								{active && info?.latest ? (
									<button className="pill-white" onClick={() => setViewer(info.latest!.video)}>
										<Clapperboard size={15} />
										Open Latest Video
									</button>
								) : active && info?.references.length ? (
									<button
										className="pill-white"
										onClick={() => {
											setVideoMode(true);
											setDraft(`Analyse the ${info.references.length} reference video${info.references.length > 1 ? "s" : ""} in references/, build branding/brand.html, then propose the first video.`);
										}}
									>
										<ScanSearch size={15} />
										Analyse {info.references.length} Reference{info.references.length > 1 ? "s" : ""}
									</button>
								) : active ? (
									<button
										className="pill-white"
										onClick={() => {
											setInspectorOpen(true);
											setFocusTab("references");
										}}
									>
										<FilePlus2 size={15} />
										Add Reference Videos
									</button>
								) : (
									<button className="pill-white" onClick={addWorkspace}>
										<FolderOpen size={15} />
										Open a Folder
									</button>
								)}
							</div>
						</div>
						<div className="home-tip">
							<span className="tip-icons">
								<span className="tip-icon">
									<FolderOpen size={15} />
								</span>
								<span className="tip-dots">···</span>
								<span className="tip-icon">
									<Clapperboard size={15} />
								</span>
							</span>
							<span>
								<b>Drop reference videos into references/</b>
								<span className="dim">The agent studies them, writes the brand page, then cuts and QA-checks the video.</span>
							</span>
						</div>
					</div>
				)}
			</main>

			{inspectorOpen && active ? <Inspector info={info} onOpen={setViewer} onImport={importFiles} onReveal={(p) => api.reveal(p)} onAsk={send} focusTab={focusTab} /> : null}

			{session?.uiRequests[0] && !decisionFor(session.uiRequests[0], session.items) ? <UiRequestModal request={session.uiRequests[0]} onRespond={respondUi} /> : null}
			{viewer ? <Viewer path={viewer} cwd={active ?? ""} onClose={() => setViewer(undefined)} onReveal={(p) => api.reveal(p)} onAsk={send} /> : null}
			{customizeOpen ? (
				<CustomizeModal
					theme={theme}
					setTheme={setTheme}
					model={session?.model}
					thinking={session?.thinking}
					runtime={runtime}
					cwd={active}
					onReveal={(p) => api.openPath(p)}
					onClose={() => setCustomizeOpen(false)}
					accounts={<AccountsPanel providers={auth?.providers ?? []} onLogin={startLogin} onLogout={logout} compact />}
					connected={connectedAccounts.map((p) => ({
						id: p.id,
						name: p.name,
						detail: accountLabel(p),
						kind: p.credential === "oauth" ? "subscription" : p.credential === "api_key" ? "api key" : (p.source ?? "connected"),
					}))}
					defaultModel={auth?.current}
					models={session?.models ?? []}
					onDefaultModel={async (spec) => {
						await api.bridge("set_default", { spec });
						afterAccountChange();
					}}
				/>
			) : null}
			{login ? (
				<LoginFlow
					state={login}
					onAnswer={(promptId, value) => {
						api.bridge("prompt_response", { promptId, value });
						setLogin((c) => (c ? { ...c, prompt: undefined } : c));
					}}
					onCancel={() => {
						if (login.prompt) api.bridge("prompt_response", { promptId: login.prompt.promptId, cancelled: true });
						if (loginId.current) api.bridge("cancel_login", { loginId: loginId.current });
						setLogin(undefined);
					}}
					onClose={() => setLogin(undefined)}
				/>
			) : null}
		</div>
	);
}
