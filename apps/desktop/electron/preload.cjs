const { contextBridge, ipcRenderer, webUtils } = require("electron");

const subscribe = (channel) => (listener) => {
	const handler = (_event, payload) => listener(payload);
	ipcRenderer.on(channel, handler);
	return () => ipcRenderer.removeListener(channel, handler);
};

contextBridge.exposeInMainWorld("om", {
	getState: () => ipcRenderer.invoke("state:get"),
	pickWorkspace: () => ipcRenderer.invoke("workspace:pick"),
	openWorkspace: (cwd) => ipcRenderer.invoke("workspace:open", cwd),
	forgetWorkspace: (cwd) => ipcRenderer.invoke("workspace:forget", cwd),
	describeWorkspace: (cwd) => ipcRenderer.invoke("workspace:describe", cwd),
	importReferences: (cwd, paths) => ipcRenderer.invoke("workspace:import", cwd, paths),
	command: (cwd, command) => ipcRenderer.invoke("agent:command", cwd, command),
	respondToUi: (cwd, response) => ipcRenderer.invoke("agent:ui-response", cwd, response),
	readFile: (path) => ipcRenderer.invoke("file:read", path),
	reveal: (path) => ipcRenderer.invoke("shell:reveal", path),
	openPath: (path) => ipcRenderer.invoke("shell:open", path),
	pathForFile: (file) => webUtils.getPathForFile(file),
	devFixture: () => ipcRenderer.invoke("dev:fixture"),
	bridge: (type, payload) => ipcRenderer.invoke("bridge:request", type, payload),
	openExternal: (url) => ipcRenderer.invoke("shell:external", url),
	onBridgeEvent: subscribe("bridge:event"),
	onEvent: subscribe("agent:event"),
	onExit: subscribe("agent:exit"),
});
