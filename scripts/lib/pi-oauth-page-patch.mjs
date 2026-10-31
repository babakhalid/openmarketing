import { OPENMARKETING_AUTH_MARK_HTML } from "../../logo.mjs";

export const PI_OAUTH_PAGE_PATCH_MARKER = "openmarketing:oauth-page:v1";

function escapeHtml(value) {
	return String(value)
		.replaceAll("&", "&amp;")
		.replaceAll("<", "&lt;")
		.replaceAll(">", "&gt;")
		.replaceAll('"', "&quot;")
		.replaceAll("'", "&#39;");
}

function renderOpenMarketingOAuthPage(options) {
	const isSuccess = options.kind === "success";
	const title = isSuccess ? "Authentication complete · OpenMarketing" : "Authentication failed · OpenMarketing";
	const heading = isSuccess ? "Connection secured" : "Connection not completed";
	const statusCode = isSuccess ? "AUTH/COMPLETE" : "AUTH/FAILED";
	const statusRole = isSuccess ? "status" : "alert";
	const liveMode = isSuccess ? "polite" : "assertive";
	const nextTitle = isSuccess ? "Return to your terminal" : "Retry from your terminal";
	const nextMessage = isSuccess
		? "OpenMarketing will continue setup automatically."
		: "Run the provider login again or choose a different model provider.";
	const details = options.details
		? `<details class="technical-details">
          <summary>View technical details</summary>
          <pre>${escapeHtml(options.details)}</pre>
        </details>`
		: "";

	return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <meta name="referrer" content="no-referrer" />
  <meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src 'unsafe-inline'; img-src data:; base-uri 'none'; form-action 'none'" />
  <title>${escapeHtml(title)}</title>
  <style>
    :root {
      color-scheme: dark;
      --page: #0a0f15;
      --panel: #0e151e;
      --panel-strong: #121b26;
      --line: #273342;
      --line-soft: #1d2835;
      --text: #edf4fb;
      --muted: #91a0b2;
      --quiet: #657489;
      --accent: #67d9eb;
      --accent-soft: #17343d;
      --sans: ui-sans-serif, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
      --mono: "SFMono-Regular", Consolas, "Liberation Mono", Menlo, monospace;
    }
    body[data-state="error"] {
      --accent: #f38b8b;
      --accent-soft: #3a2228;
    }
    * { box-sizing: border-box; }
    html, body { min-height: 100%; }
    body {
      min-height: 100dvh;
      margin: 0;
      display: grid;
      place-items: center;
      padding: 32px;
      background: var(--page);
      color: var(--text);
      font-family: var(--sans);
      -webkit-font-smoothing: antialiased;
    }
    .auth-shell {
      position: relative;
      width: min(940px, 100%);
      min-height: 540px;
      display: grid;
      grid-template-columns: minmax(260px, .82fr) minmax(0, 1.45fr);
      overflow: hidden;
      border: 1px solid var(--line);
      border-radius: 18px;
      background: var(--panel);
      box-shadow: 0 30px 90px rgba(3, 9, 16, .48);
      animation: auth-enter 260ms ease-out both;
    }
    .auth-shell::before {
      content: "";
      position: absolute;
      z-index: 2;
      inset: 0 0 auto;
      height: 2px;
      background: var(--accent);
    }
    .brand-panel {
      min-width: 0;
      display: flex;
      flex-direction: column;
      justify-content: space-between;
      padding: 42px 36px 34px;
      border-right: 1px solid var(--line);
      background: var(--panel-strong);
    }
    .brand-lockup {
      display: flex;
      align-items: center;
      gap: 17px;
    }
    .auth-mark {
      flex: 0 0 auto;
      width: 58px;
      height: 58px;
      color: var(--text);
    }
    .auth-mark-frame {
      fill: none;
      stroke: var(--line);
      stroke-width: 4;
    }
    .auth-mark-letter,
    .auth-mark-slash {
      fill: none;
      stroke: currentColor;
      stroke-width: 5;
      stroke-linecap: square;
      stroke-linejoin: miter;
    }
    .auth-mark-slash {
      color: var(--accent);
      stroke-width: 6;
    }
    .brand-name {
      max-width: 150px;
      font-family: var(--mono);
      font-size: 13px;
      font-weight: 700;
      line-height: 1.45;
      letter-spacing: .14em;
    }
    .brand-system {
      margin-top: 5px;
      color: var(--quiet);
      font-family: var(--mono);
      font-size: 10px;
      letter-spacing: .1em;
    }
    .auth-route {
      margin: 44px 0 auto;
      padding-top: 28px;
      border-top: 1px solid var(--line-soft);
    }
    .route-label {
      color: var(--quiet);
      font-family: var(--mono);
      font-size: 10px;
      letter-spacing: .12em;
      text-transform: uppercase;
    }
    .route-value {
      margin: 11px 0 0;
      font-family: var(--mono);
      font-size: 12px;
      line-height: 1.65;
      color: var(--muted);
    }
    .route-value span { color: var(--accent); }
    .local-trust {
      display: flex;
      align-items: center;
      gap: 10px;
      color: var(--muted);
      font-family: var(--mono);
      font-size: 10px;
      letter-spacing: .08em;
      text-transform: uppercase;
    }
    .trust-indicator {
      width: 9px;
      height: 9px;
      border: 2px solid var(--accent);
      transform: rotate(45deg);
    }
    .status-panel {
      min-width: 0;
      display: flex;
      flex-direction: column;
      justify-content: center;
      padding: 64px clamp(38px, 7vw, 82px) 38px;
    }
    .status-code {
      display: flex;
      align-items: center;
      gap: 10px;
      margin-bottom: 24px;
      color: var(--accent);
      font-family: var(--mono);
      font-size: 11px;
      font-weight: 700;
      letter-spacing: .13em;
    }
    .status-dot {
      width: 7px;
      height: 7px;
      border-radius: 50%;
      background: var(--accent);
    }
    h1 {
      max-width: 560px;
      margin: 0;
      font-size: clamp(38px, 6vw, 62px);
      font-weight: 620;
      letter-spacing: -.045em;
      line-height: .98;
      text-wrap: balance;
    }
    .provider-message {
      max-width: 560px;
      margin: 25px 0 0;
      color: var(--muted);
      font-size: 15px;
      line-height: 1.75;
      overflow-wrap: anywhere;
    }
    .next-step {
      max-width: 580px;
      display: grid;
      grid-template-columns: auto 1fr;
      gap: 16px;
      margin-top: 34px;
      padding: 19px 20px;
      border: 1px solid var(--line);
      border-left: 2px solid var(--accent);
      background: var(--panel-strong);
    }
    .step-index {
      color: var(--accent);
      font-family: var(--mono);
      font-size: 11px;
      line-height: 1.7;
    }
    .next-step strong {
      display: block;
      font-size: 14px;
      font-weight: 650;
    }
    .next-step p {
      margin: 5px 0 0;
      color: var(--muted);
      font-size: 13px;
      line-height: 1.55;
    }
    .technical-details {
      max-width: 580px;
      margin-top: 18px;
      border-top: 1px solid var(--line-soft);
    }
    .technical-details summary {
      padding: 15px 0;
      color: var(--muted);
      cursor: pointer;
      font-family: var(--mono);
      font-size: 11px;
      letter-spacing: .04em;
    }
    .technical-details summary:hover,
    .technical-details summary:focus-visible { color: var(--text); }
    .technical-details pre {
      max-height: 170px;
      margin: 0;
      overflow: auto;
      padding: 15px;
      border: 1px solid var(--line);
      background: var(--page);
      color: var(--muted);
      font: 11px/1.6 var(--mono);
      white-space: pre-wrap;
      overflow-wrap: anywhere;
    }
    .status-footer {
      display: flex;
      justify-content: space-between;
      gap: 16px;
      margin-top: auto;
      padding-top: 48px;
      color: var(--quiet);
      font-family: var(--mono);
      font-size: 10px;
      letter-spacing: .05em;
    }
    .status-footer strong { color: var(--accent); }
    @keyframes auth-enter {
      from { opacity: 0; transform: translateY(10px); }
      to { opacity: 1; transform: translateY(0); }
    }
    @media (max-width: 720px) {
      body { padding: 16px; place-items: start center; }
      .auth-shell {
        min-height: calc(100dvh - 32px);
        grid-template-columns: 1fr;
        border-radius: 14px;
      }
      .brand-panel {
        min-height: 210px;
        padding: 30px 28px 24px;
        border-right: 0;
        border-bottom: 1px solid var(--line);
      }
      .auth-route { margin-top: 32px; padding-top: 20px; }
      .route-value { margin-bottom: 28px; }
      .status-panel { padding: 46px 28px 30px; }
      h1 { font-size: clamp(38px, 12vw, 54px); }
      .status-footer { padding-top: 40px; flex-direction: column; }
    }
    @media (prefers-reduced-motion: reduce) {
      .auth-shell { animation: none; }
    }
  </style>
</head>
<body data-state="${isSuccess ? "success" : "error"}">
  <main class="auth-shell">
    <aside class="brand-panel" aria-label="OpenMarketing authentication gateway">
      <div>
        <div class="brand-lockup">
          ${OPENMARKETING_AUTH_MARK_HTML}
          <div>
            <div class="brand-name">MARKETING<br />AGENTS</div>
            <div class="brand-system">MKT·OS / AUTH GATEWAY</div>
          </div>
        </div>
        <div class="auth-route">
          <div class="route-label">Handshake route</div>
          <p class="route-value"><span>PROVIDER</span> → LOCALHOST<br />LOCALHOST → MKT·OS</p>
        </div>
      </div>
      <div class="local-trust"><span class="trust-indicator" aria-hidden="true"></span>Secure local callback</div>
    </aside>
    <section class="status-panel" role="${statusRole}" aria-live="${liveMode}">
      <div class="status-code"><span class="status-dot" aria-hidden="true"></span>${statusCode}</div>
      <h1>${heading}</h1>
      <p class="provider-message">${escapeHtml(options.message)}</p>
      <div class="next-step">
        <span class="step-index">01</span>
        <div>
          <strong>${nextTitle}</strong>
          <p>${nextMessage}</p>
        </div>
      </div>
      ${details}
      <footer class="status-footer">
        <span><strong>MA/</strong> IDENTITY LINK</span>
        <span>Authentication handled locally</span>
      </footer>
    </section>
  </main>
</body>
</html>`;
}

export function oauthSuccessHtml(message) {
	return renderOpenMarketingOAuthPage({ kind: "success", message });
}

export function oauthErrorHtml(message, details) {
	return renderOpenMarketingOAuthPage({ kind: "error", message, details });
}

function createPatchedModuleSource() {
	return [
		`// ${PI_OAUTH_PAGE_PATCH_MARKER}`,
		`const OPENMARKETING_AUTH_MARK_HTML = ${JSON.stringify(OPENMARKETING_AUTH_MARK_HTML)};`,
		escapeHtml.toString(),
		renderOpenMarketingOAuthPage.toString(),
		`export ${oauthSuccessHtml.toString()}`,
		`export ${oauthErrorHtml.toString()}`,
	].join("\n\n") + "\n";
}

export function patchPiOAuthPageSource(source) {
	if (source.includes(PI_OAUTH_PAGE_PATCH_MARKER)) {
		return source;
	}

	const hasExpectedExports = source.includes("oauthSuccessHtml") && source.includes("oauthErrorHtml");
	if (!hasExpectedExports) {
		return source;
	}

	return createPatchedModuleSource();
}
