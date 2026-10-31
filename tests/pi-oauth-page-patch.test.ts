import test from "node:test";
import assert from "node:assert/strict";

import {
	PI_OAUTH_PAGE_PATCH_MARKER,
	oauthErrorHtml,
	oauthSuccessHtml,
	patchPiOAuthPageSource,
} from "../scripts/lib/pi-oauth-page-patch.mjs";

const UPSTREAM_OAUTH_PAGE = [
	"export function oauthSuccessHtml(message) { return message; }",
	"export function oauthErrorHtml(message, details) { return `${message}${details}`; }",
	"",
].join("\n");

test("OpenMarketing OAuth success page is branded, local, responsive, and accessible", () => {
	const html = oauthSuccessHtml("Anthropic authorization complete");

	assert.match(html, /MARKETING<br \/>AGENTS/);
	assert.match(html, /MKT·OS \/ AUTH GATEWAY/);
	assert.match(html, /Secure local callback/i);
	assert.match(html, /AUTH\/COMPLETE/);
	assert.match(html, /Connection secured/);
	assert.match(html, /role="status"/);
	assert.match(html, /min-height: 100dvh/);
	assert.match(html, /prefers-reduced-motion: reduce/);
	assert.match(html, /Content-Security-Policy/);
	assert.doesNotMatch(html, /fonts\.googleapis\.com|<script/i);
});

test("OpenMarketing OAuth pages escape provider output and keep errors collapsed", () => {
	const success = oauthSuccessHtml('<script>alert("bad")</script>');
	const error = oauthErrorHtml("Provider rejected <request>", 'token="secret" & failed');

	assert.doesNotMatch(success, /<script>alert/);
	assert.match(success, /&lt;script&gt;alert\(&quot;bad&quot;\)&lt;\/script&gt;/);
	assert.match(error, /AUTH\/FAILED/);
	assert.match(error, /role="alert"/);
	assert.match(error, /<details class="technical-details">/);
	assert.doesNotMatch(error, /<details[^>]* open/);
	assert.match(error, /Provider rejected &lt;request&gt;/);
	assert.match(error, /token=&quot;secret&quot; &amp; failed/);
});

test("patchPiOAuthPageSource produces an executable self-contained Pi module", async () => {
	const patched = patchPiOAuthPageSource(UPSTREAM_OAUTH_PAGE);
	const moduleUrl = `data:text/javascript;base64,${Buffer.from(patched).toString("base64")}`;
	const module = await import(moduleUrl) as {
		oauthSuccessHtml(message: string): string;
		oauthErrorHtml(message: string, details?: string): string;
	};

	assert.match(patched, new RegExp(PI_OAUTH_PAGE_PATCH_MARKER));
	assert.match(module.oauthSuccessHtml("Connected"), /Connection secured/);
	assert.match(module.oauthErrorHtml("Denied", "No grant"), /Connection not completed/);
	assert.equal(patchPiOAuthPageSource(patched), patched);
});

test("patchPiOAuthPageSource leaves an unknown upstream module untouched", () => {
	const input = "export const unrelated = true;\n";
	assert.equal(patchPiOAuthPageSource(input), input);
});
