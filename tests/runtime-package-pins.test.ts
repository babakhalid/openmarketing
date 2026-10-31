import test from "node:test";
import assert from "node:assert/strict";

import {
	BUNDLED_RUNTIME_PACKAGE_VERSIONS,
	parseRuntimePackageName,
	pinBundledRuntimePackageSpec,
	pinBundledRuntimePackageSpecs,
} from "../scripts/lib/runtime-package-pins.mjs";

test("runtime package pins keep bundled extensions on the earendil-works Pi 1.x line", () => {
	assert.equal(pinBundledRuntimePackageSpec("pi-subagents"), "pi-subagents@0.84.0");
	assert.equal(pinBundledRuntimePackageSpec("@aliou/pi-processes"), "@aliou/pi-processes@0.13.3");
	assert.equal(BUNDLED_RUNTIME_PACKAGE_VERSIONS["pi-web-access"], "0.46.0");
});

test("runtime package pins preserve explicit versions and unknown packages", () => {
	assert.equal(pinBundledRuntimePackageSpec("pi-subagents@0.11.11"), "pi-subagents@0.11.11");
	assert.equal(pinBundledRuntimePackageSpec("custom-extension"), "custom-extension");
	assert.equal(parseRuntimePackageName("@scope/package@1.2.3"), "@scope/package");
});

test("runtime package pins deduplicate the resolved install list", () => {
	assert.deepEqual(
		pinBundledRuntimePackageSpecs(["pi-subagents", "pi-subagents@0.84.0", "pi-web-access"]),
		["pi-subagents@0.84.0", "pi-web-access@0.46.0"],
	);
});
