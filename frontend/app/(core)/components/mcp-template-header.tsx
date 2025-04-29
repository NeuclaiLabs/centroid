import { getMCPTemplateById } from "@/lib/mcp-templates";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { SimpleIcon } from "simple-icons";

interface MCPTemplateHeaderProps {
	templateId: string;
}

export function MCPTemplateHeader({ templateId }: MCPTemplateHeaderProps) {
	const template = getMCPTemplateById(templateId);
	if (!template) return null;

	const icon = template.metadata.icon as SimpleIcon;

	return (
		<Card>
			<CardHeader className="flex flex-row items-center justify-between space-y-0 ">
				<div className="flex items-center gap-4">
					{icon && (
						<div className="size-12 rounded-lg flex items-center justify-center bg-primary/10">
							<svg
								role="img"
								viewBox="0 0 24 24"
								className="size-6 text-primary"
								fill="currentColor"
								aria-label={`${template.name} icon`}
							>
								<path d={icon.path} />
							</svg>
						</div>
					)}
					<div>
						<CardTitle className="text-2xl font-bold">
							{template.name}
						</CardTitle>
						<p className="text-sm text-muted-foreground mt-1">
							{template.description}
						</p>
					</div>
				</div>
			</CardHeader>
			<CardContent>
				<div className="flex items-center gap-2">
					<Badge variant="secondary">{template.kind}</Badge>
					<Badge
						variant="outline"
						className={cn(
							template.status === "active" && "bg-green-100 text-green-800",
							template.status === "inactive" && "bg-yellow-100 text-yellow-800",
							template.status === "deprecated" && "bg-red-100 text-red-800",
						)}
					>
						{template.status}
					</Badge>
					<Badge variant="outline">v{template.version}</Badge>
				</div>
				{/* <div className="flex items-center gap-4 text-sm text-muted-foreground">
					<div className="flex items-center gap-1">
						<span>Language:</span>
						<span className="font-medium">{template.metadata.language}</span>
					</div>
					<div className="flex items-center gap-1">
						<span>Provider:</span>
						<span className="font-medium">{template.metadata.provider}</span>
					</div>
					<div className="flex items-center gap-1">
						<span>Transport:</span>
						<span className="font-medium">{template.transport}</span>
					</div>
				</div> */}
			</CardContent>
		</Card>
	);
}
