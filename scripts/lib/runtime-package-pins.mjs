// The bundled Pi host is @earendil-works/* 1.x. Pin extension releases built for that host
// (they declare @earendil-works peers) so packaging cannot silently drift. alpha-hub stays on
// 0.1.3 because 0.1.4+ requires Node >= 22.22.
export const BUNDLED_RUNTIME_PACKAGE_VERSIONS = Object.freeze({
	"@companion-ai/alpha-hub": "0.1.3",
	"pi-subagents": "0.84.0",
	"pi-btw": "0.8.0",
	"pi-docparser": "4.0.0",
	"pi-web-access": "0.46.0",
	"pi-markdown-preview": "0.26.0",
	"@walterra/pi-charts": "0.0.6",
	"pi-mermaid": "0.3.0",
	"@aliou/pi-processes": "0.13.3",
	"pi-zotero": "0.1.0",
	"pi-schedule-prompt": "0.4.1",
	"@samfp/pi-memory": "1.6.1",
	"@tmustier/pi-ralph-wiggum": "0.2.4",
});

export function parseRuntimePackageName(spec) {
	const match = spec.match(/^(@?[^@]+(?:\/[^@]+)?)(?:@.+)?$/);
	return match?.[1] ?? spec;
}

export function pinBundledRuntimePackageSpec(spec) {
	const name = parseRuntimePackageName(spec);
	if (spec !== name) {
		// Respect an explicit version supplied by a user or release process.
		return spec;
	}

	const version = BUNDLED_RUNTIME_PACKAGE_VERSIONS[name];
	return version ? `${name}@${version}` : spec;
}

export function pinBundledRuntimePackageSpecs(specs) {
	return Array.from(new Set(specs.map(pinBundledRuntimePackageSpec)));
}
