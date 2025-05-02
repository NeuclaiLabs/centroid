import { getMCPTemplateById } from "@/lib/mcp-templates";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Code2, FileText } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import type { MCPTool } from "@/lib/mcp-templates";

interface ToolsTabProps {
	templateId: string;
	onOpenSchema: (tool: MCPTool) => void;
}

export function ToolsTab({ templateId, onOpenSchema }: ToolsTabProps) {
	const template = getMCPTemplateById(templateId);
	if (!template) return null;

	return (
		<ScrollArea className="h-[calc(100vh-350px)]">
			<div className="space-y-4 pr-2">
				{template.tools.map((tool) => (
					<Card key={tool.name}>
						<CardHeader className="flex flex-row items-center justify-between space-y-0">
							<div className="flex flex-col gap-1">
								<div className="flex items-center gap-2">
									<Code2 className="size-4 text-primary" />
									<CardTitle className="text-lg">{tool.name}</CardTitle>
								</div>
								<p className="text-sm text-muted-foreground">
									{tool.description}
								</p>
							</div>
							<Button
								variant="outline"
								size="sm"
								onClick={() => onOpenSchema(tool)}
							>
								<FileText className="size-4 mr-2" />
								View Schema
							</Button>
						</CardHeader>
					</Card>
				))}
			</div>
		</ScrollArea>
	);
}
