import "@fontsource-variable/jetbrains-mono";
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "./App";
import "./styles.css";

// Theme is applied before first paint so there is no flash of the wrong palette.
try {
	document.documentElement.dataset.theme = localStorage.getItem("ma-theme") === "light" ? "light" : "dark";
} catch {
	document.documentElement.dataset.theme = "dark";
}

createRoot(document.getElementById("root")!).render(
	<StrictMode>
		<App />
	</StrictMode>,
);
