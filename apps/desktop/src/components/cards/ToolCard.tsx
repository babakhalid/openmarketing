import type { Item } from "../../lib/types";
import { AskModelCard, ImageGenCard } from "./ModelCards";
import { BashCard, FileCard, GenerateCard, GenericCard, SearchCard, SubagentCard, WebCard } from "./CoreCards";
import { AnalyzeCard, FinishCard, RenderCard, SetupCard, StillsCard, TranscribeCard, WorkspaceCard } from "./VideoCards";

type Props = { tool: Extract<Item, { kind: "tool" }>; cwd: string; onOpen: (path: string) => void };

const CARDS: Record<string, (props: Props) => React.ReactNode> = {
	video_workspace: WorkspaceCard,
	video_analyze_reference: AnalyzeCard,
	video_transcribe: TranscribeCard,
	video_still: StillsCard,
	video_render: RenderCard,
	video_finish: FinishCard,
	video_setup: SetupCard,
	image_generate: ImageGenCard,
	ask_model: AskModelCard,
	bash: BashCard,
	read: FileCard,
	write: FileCard,
	edit: FileCard,
	grep: SearchCard,
	find: SearchCard,
	ls: SearchCard,
	subagent: SubagentCard,
	web_search: WebCard,
	fetch_content: WebCard,
	get_search_content: WebCard,
};

export function ToolCard(props: Props) {
	const Card = CARDS[props.tool.name] ?? (props.tool.name.startsWith("higgsfield_") ? GenerateCard : GenericCard);
	return <Card {...props} />;
}
