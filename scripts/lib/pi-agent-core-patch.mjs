const HELPER = `
function normalizeOpenMarketingSearchToolArguments(args) {
    if (!args || typeof args !== "object" || Array.isArray(args)) {
        return args;
    }
    const normalized = { ...args };
    if (Array.isArray(normalized.queries) || typeof normalized.query === "string") {
        return normalized;
    }
    if (Array.isArray(normalized.q)) {
        normalized.queries = normalized.q;
        delete normalized.q;
        return normalized;
    }
    if (typeof normalized.q === "string") {
        normalized.query = normalized.q;
        delete normalized.q;
    }
    return normalized;
}

function normalizeOpenMarketingToolAlias(toolCall, tools) {
    const aliases = new Map([
        ["google:search", "web_search"],
        ["google_search", "web_search"],
        ["google.search", "web_search"],
        ["search_google", "web_search"],
    ]);
    const targetName = aliases.get(toolCall.name);
    if (!targetName || !tools?.some((tool) => tool.name === targetName)) {
        return toolCall;
    }
    return {
        ...toolCall,
        name: targetName,
        arguments: normalizeOpenMarketingSearchToolArguments(toolCall.arguments),
    };
}
`;

export function patchPiAgentCoreSource(source) {
	const normalizedSource = source
		.replaceAll("normalizeAdsAgentsSearchToolArguments", "normalizeOpenMarketingSearchToolArguments")
		.replaceAll("normalizeAdsAgentsToolAlias", "normalizeOpenMarketingToolAlias");
	if (normalizedSource.includes("function normalizeOpenMarketingToolAlias(")) {
		return normalizedSource;
	}

	// Pi <= 0.7x reads tools from currentContext; Pi 1.x passes them as a trailing parameter.
	const variants = [
		{
			start: "async function prepareToolCall(currentContext, assistantMessage, toolCall, config, signal) {\n",
			lookup: "    const tool = currentContext.tools?.find((t) => t.name === toolCall.name);",
			patchedLookup:
				"    const effectiveToolCall = normalizeOpenMarketingToolAlias(toolCall, currentContext.tools);\n    const tool = currentContext.tools?.find((t) => t.name === effectiveToolCall.name);",
		},
		{
			start: "async function prepareToolCall(currentContext, assistantMessage, toolCall, config, signal, tools = currentContext.tools ?? []) {\n",
			lookup: "    const tool = tools.find((t) => t.name === toolCall.name);",
			patchedLookup:
				"    const effectiveToolCall = normalizeOpenMarketingToolAlias(toolCall, tools);\n    const tool = tools.find((t) => t.name === effectiveToolCall.name);",
		},
	];
	const variant = variants.find((candidate) => normalizedSource.includes(candidate.start + candidate.lookup));
	if (!variant) {
		return normalizedSource;
	}

	let patched = normalizedSource.replace(variant.start, `${HELPER}\n${variant.start}`);
	patched = patched.replace(variant.start + variant.lookup, variant.start + variant.patchedLookup);
	patched = patched.replace(
		"        const preparedToolCall = prepareToolCallArguments(tool, toolCall);",
		"        const preparedToolCall = prepareToolCallArguments(tool, effectiveToolCall);",
	);
	patched = patched.replace(
		"                toolCall,\n                args: validatedArgs,",
		"                toolCall: preparedToolCall,\n                args: validatedArgs,",
	);
	patched = patched.replace(
		"            toolCall,\n            tool,",
		"            toolCall: preparedToolCall,\n            tool,",
	);
	return patched;
}
