"use client";

import { mcpTemplates } from "@/lib/mcp-templates";
import { MCPTemplateCard } from "../components/mcp-template-card";

export default function MCPTemplatesPage() {
	return (
		<div className="flex-1 p-6">
			<div className="mb-8">
				<h1 className="text-2xl font-bold tracking-tight">MCP Templates</h1>
				<p className="text-muted-foreground">
					Browse and manage your Model Context Protocol templates
				</p>
			</div>

			<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
				{mcpTemplates.map((template) => (
					<MCPTemplateCard key={template.id} template={template} />
				))}
			</div>
		</div>
	);
}
