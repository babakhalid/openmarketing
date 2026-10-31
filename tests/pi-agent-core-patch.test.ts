import test from "node:test";
import assert from "node:assert/strict";

import { patchPiAgentCoreSource } from "../scripts/lib/pi-agent-core-patch.mjs";

const SOURCE = `
async function prepareToolCall(currentContext, assistantMessage, toolCall, config, signal) {
    const tool = currentContext.tools?.find((t) => t.name === toolCall.name);
    if (!tool) {
        return {
            kind: "immediate",
            result: createErrorToolResult(\`Tool \${toolCall.name} not found\`),
            isError: true,
        };
    }
    try {
        const preparedToolCall = prepareToolCallArguments(tool, toolCall);
        const validatedArgs = validateToolArguments(tool, preparedToolCall);
        if (config.beforeToolCall) {
            const beforeResult = await config.beforeToolCall({
                assistantMessage,
                toolCall,
                args: validatedArgs,
                context: currentContext,
            }, signal);
        }
        return {
            kind: "prepared",
            toolCall,
            tool,
            args: validatedArgs,
        };
    }
    catch (error) {
        return {
            kind: "immediate",
            result: createErrorToolResult(error instanceof Error ? error.message : String(error)),
            isError: true,
        };
    }
}
`;

test("patchPiAgentCoreSource maps google search aliases to web_search", () => {
	const patched = patchPiAgentCoreSource(SOURCE);

	assert.match(patched, /function normalizeOpenMarketingToolAlias/);
	assert.match(patched, /\["google:search", "web_search"\]/);
	assert.match(patched, /const effectiveToolCall = normalizeOpenMarketingToolAlias\(toolCall, currentContext\.tools\)/);
	assert.match(patched, /t\.name === effectiveToolCall\.name/);
	assert.match(patched, /prepareToolCallArguments\(tool, effectiveToolCall\)/);
	assert.match(patched, /toolCall: preparedToolCall/);
});

test("patchPiAgentCoreSource is idempotent", () => {
	const once = patchPiAgentCoreSource(SOURCE);
	const twice = patchPiAgentCoreSource(once);
	assert.equal(twice, once);
});

test("patchPiAgentCoreSource maps search aliases on the Pi 1.x prepareToolCall signature", () => {
	const piOneSource = SOURCE.replace(
		"async function prepareToolCall(currentContext, assistantMessage, toolCall, config, signal) {\n    const tool = currentContext.tools?.find((t) => t.name === toolCall.name);",
		"async function prepareToolCall(currentContext, assistantMessage, toolCall, config, signal, tools = currentContext.tools ?? []) {\n    const tool = tools.find((t) => t.name === toolCall.name);",
	);
	assert.notEqual(piOneSource, SOURCE);

	const patched = patchPiAgentCoreSource(piOneSource);

	assert.match(patched, /const effectiveToolCall = normalizeOpenMarketingToolAlias\(toolCall, tools\);/);
	assert.match(patched, /const tool = tools\.find\(\(t\) => t\.name === effectiveToolCall\.name\);/);
	assert.match(patched, /prepareToolCallArguments\(tool, effectiveToolCall\)/);
	assert.equal(patchPiAgentCoreSource(patched), patched);
});
