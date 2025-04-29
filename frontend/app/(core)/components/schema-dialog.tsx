import { Button } from "@/components/ui/button";
import { Copy } from "lucide-react";
import { toast } from "sonner";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import type { MCPTool } from "@/lib/mcp-templates";

interface SchemaDialogProps {
	isOpen: boolean;
	onOpenChange: (open: boolean) => void;
	tool: MCPTool | null;
}

export function SchemaDialog({
	isOpen,
	onOpenChange,
	tool,
}: SchemaDialogProps) {
	return (
		<Dialog
			open={isOpen}
			onOpenChange={(open) => {
				if (!open) {
					onOpenChange(false);
				}
			}}
		>
			<DialogContent className="max-w-3xl max-h-[90vh] flex flex-col">
				<DialogHeader className="flex-none">
					<DialogTitle className="flex items-center gap-2">
						<span>{String(tool?.name || tool?.id)}</span>
						<Button
							variant="outline"
							size="icon"
							className="h-6 w-6"
							onClick={() => {
								const schema = tool?.parameters;
								if (schema) {
									navigator.clipboard.writeText(
										JSON.stringify(schema, null, 2),
									);
									toast.success("Schema copied to clipboard");
								}
							}}
						>
							<Copy className="h-3 w-3" />
						</Button>
					</DialogTitle>
					<DialogDescription>
						{String(tool?.description || "No description available")}
					</DialogDescription>
				</DialogHeader>
				<div className="flex-1 min-h-0 mt-4">
					<div
						className="h-full rounded-md bg-muted p-4 overflow-y-scroll scrollbar-thin scrollbar-thumb-gray-400 scrollbar-track-gray-100"
						style={{
							maxHeight: "60vh",
							overflowY: "scroll",
							scrollbarWidth: "thin",
							scrollbarColor: "rgb(156 163 175) rgb(243 244 246)",
						}}
					>
						<pre id="schema-content" className="text-sm">
							{JSON.stringify(tool || null, null, 2)}
						</pre>
					</div>
				</div>
			</DialogContent>
		</Dialog>
	);
}
