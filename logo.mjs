// Futuristic OpenMarketing lockup: a geometric OM monogram paired with a
// compact telemetry-style wordmark. The widest row is 48 columns, leaving
// comfortable space in a standard 80-column terminal and the in-app frame.
export const OPENMARKETING_ASCII_LOGO = [
	" ██████╗ ███╗   ███╗   O P E N",
	"██╔═══██╗████╗ ████║   M A R K E T I N G  //  OS",
	"██║   ██║██╔████╔██║   ─────────────────────────",
	"██║   ██║██║╚██╔╝██║   AI MARKETING SYSTEM",
	"╚██████╔╝██║ ╚═╝ ██║   FOR TECHNICAL FOUNDERS",
	" ╚═════╝ ╚═╝     ╚═╝   SYS/01 · HUMAN-GUIDED",
];

// Inline and dependency-free so the localhost OAuth callback works without
// remote fonts, images, or scripts. Page-level styling lives in the dedicated
// OAuth patch rather than leaking out of the mark itself.
export const OPENMARKETING_AUTH_MARK_HTML = `<svg class="auth-mark" viewBox="0 0 120 120" role="img" aria-label="OpenMarketing OM slash mark" xmlns="http://www.w3.org/2000/svg">
  <path class="auth-mark-frame" d="M14 4h88l14 14v84l-14 14H14L4 106V14L14 4Z" />
  <path class="auth-mark-letter" d="M19 60a14 20 0 1 0 28 0a14 20 0 1 0-28 0M58 80V40l15 21 15-21v40" />
  <path class="auth-mark-slash" d="m96 82 12-44" />
</svg>`;
