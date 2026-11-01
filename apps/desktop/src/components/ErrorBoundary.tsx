import { AlertTriangle } from "lucide-react";
import { Component, type ReactNode } from "react";

// Without a boundary, one card that throws while rendering unmounts the whole window and leaves
// it blank. Cards are wrapped one by one, so a failure stays in its card; the app root is
// wrapped too, as the last resort.
export class ErrorBoundary extends Component<{ children: ReactNode; label: string; page?: boolean }, { error?: Error }> {
	state: { error?: Error } = {};

	static getDerivedStateFromError(error: Error) {
		return { error };
	}

	componentDidCatch(error: Error) {
		console.error(`[${this.props.label}]`, error);
	}

	render() {
		const { error } = this.state;
		if (!error) return this.props.children;
		return (
			<div className={`notice error ${this.props.page ? "crash-page" : ""}`}>
				<AlertTriangle size={13} />
				<span>
					The {this.props.label} could not be shown: {error.message}. The agent is still running.{" "}
					{this.props.page ? (
						<button className="link" onClick={() => location.reload()}>
							Reload the window
						</button>
					) : (
						<button className="link" onClick={() => this.setState({ error: undefined })}>
							Try again
						</button>
					)}
				</span>
			</div>
		);
	}
}
