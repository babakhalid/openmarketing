import type { Problem } from "./errors";

export type ToolStatus = "preparing" | "running" | "done" | "error";

export type ToolResult = {
	content?: { type: string; text?: string; data?: string; mimeType?: string }[];
	details?: any;
};

export type Item =
	| { kind: "user"; id: string; text: string }
	| { kind: "text"; id: string; text: string; streaming: boolean }
	| { kind: "thinking"; id: string; text: string; streaming: boolean; startedAt: number; endedAt?: number }
	| {
			kind: "tool";
			id: string;
			name: string;
			args: any;
			status: ToolStatus;
			partial?: ToolResult;
			result?: ToolResult;
			startedAt: number;
			endedAt?: number;
	  }
	| { kind: "notice"; id: string; level: "info" | "warning" | "error"; text: string }
	| { kind: "problem"; id: string; problem: Problem; resolved?: string };

export type ModelInfo = { provider: string; id: string; contextWindow?: number; reasoning?: boolean };
export type CommandInfo = { name: string; description?: string; source?: string };

export type UiRequest = {
	id: string;
	method: "select" | "confirm" | "input" | "editor";
	title: string;
	message?: string;
	options?: string[];
	placeholder?: string;
	prefill?: string;
};

export type Session = {
	cwd: string;
	connected: boolean;
	connecting: boolean;
	busy: boolean;
	error?: string;
	items: Item[];
	model?: { provider: string; id: string };
	thinking?: string;
	models: ModelInfo[];
	commands: CommandInfo[];
	cost: number;
	contextTokens: number;
	statuses: Record<string, string>;
	uiRequests: UiRequest[];
	runStartedAt?: number;
	sessionFile?: string;
};

export type ProviderStatus = {
	id: string;
	name: string;
	oauthName?: string;
	oauth: boolean;
	apiKey: boolean;
	envVar?: string;
	connected: boolean;
	source?: string;
	credential?: string;
};
export type AuthOverview = { providers: ProviderStatus[]; current?: string; recommended?: string };
export type SessionEntry = { path: string; id: string; name?: string; created: string; modified: string; messageCount: number; title: string };
export type AuthPromptShape = { type: "select" | "secret" | "text" | "manual_code"; message: string; placeholder?: string; options?: { id: string; label: string; description?: string }[] };
export type BridgeMessage =
	| { type: "login_event"; loginId: string; event: { type: string; url?: string; instructions?: string; verificationUri?: string; userCode?: string; message?: string } }
	| { type: "login_prompt"; loginId: string; promptId: string; prompt: AuthPromptShape };

export type WorkspaceInfo = {
	cwd: string;
	name: string;
	branch?: string;
	hasWorkspace: boolean;
	references: { name: string; path: string; size: number; mtime: number }[];
	analyses: { slug: string; dir: string; hookStrip?: string; hasBreakdown: boolean; duration?: number; cutsPerMinute?: number; lufs?: number }[];
	branding: { name: string; path: string; size: number; mtime: number }[];
	pages: { name: string; path: string; size: number; mtime: number }[];
	renders: { slug: string; videos: { name: string; path: string; size: number }[]; cover?: string; verdict?: string; mtime: number }[];
	latest?: { video: string; cover?: string; info?: any; mtime: number };
};

export type OmApi = {
	getState(): Promise<{ recent: string[]; last?: string; runtime: { nodePath?: string; cliPath?: string }; user?: string; screenshot: boolean; autoPrompt?: string; tab?: "outputs" | "references" | "branding"; view?: string; theme?: "dark" | "light"; customize?: boolean; onboarding?: boolean; login?: string }>;
	pickWorkspace(): Promise<string | undefined>;
	openWorkspace(cwd: string): Promise<{ state: any; commands: CommandInfo[]; models: ModelInfo[]; messages: any[] }>;
	forgetWorkspace(cwd: string): Promise<{ recent: string[]; last?: string }>;
	describeWorkspace(cwd: string): Promise<WorkspaceInfo>;
	importReferences(cwd: string, paths: string[]): Promise<string[]>;
	command(cwd: string, command: Record<string, unknown>): Promise<any>;
	respondToUi(cwd: string, response: Record<string, unknown>): Promise<void>;
	readFile(path: string): Promise<string | undefined>;
	reveal(path: string): Promise<void>;
	openPath(path: string): Promise<string>;
	pathForFile(file: File): string;
	devFixture(): Promise<{ cwd?: string; prompt?: string; events: any[] } | undefined>;
	bridge(type: string, payload?: Record<string, unknown>): Promise<{ ok: boolean; error?: string; cancelled?: boolean; data?: any }>;
	openExternal(url: string): Promise<void>;
	onBridgeEvent(listener: (message: BridgeMessage) => void): () => void;
	onEvent(listener: (payload: { cwd: string; event: any }) => void): () => void;
	onExit(listener: (payload: { cwd: string; code: number | null; stderr: string }) => void): () => void;
};

declare global {
	interface Window {
		om: OmApi;
	}
}
