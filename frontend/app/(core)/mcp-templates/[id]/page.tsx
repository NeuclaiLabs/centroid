"use client";

import { use, useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { MCPTemplateHeader } from "../../components/mcp-template-header";
import { ToolsTab } from "../../components/tools-tab";
import { SecretsTab } from "../../components/secrets-tab";
import { SchemaDialog } from "../../components/schema-dialog";
import type { MCPTool } from "@/lib/mcp-templates";

interface PageProps {
	params: { id: string };
}

export default function MCPTemplatePage({ params }: PageProps) {
	const { id } = use(params);

	const [isSchemaOpen, setIsSchemaOpen] = useState(false);
	const [selectedTool, setSelectedTool] = useState<MCPTool | null>(null);

	const handleOpenSchema = (tool: MCPTool) => {
		setSelectedTool(tool);
		setIsSchemaOpen(true);
	};

	return (
		<div className="flex flex-col">
			{/* Header takes its natural height */}
			<div className="flex-shrink-0 px-6 pt-6">
				<MCPTemplateHeader templateId={params.id} />
			</div>

			{/* Main content area fills available space */}
			<div className="flex-1 px-6 mt-8 min-h-0">
				<div className="mx-auto w-[1000px] max-w-[90vw] h-full">
					<Tabs defaultValue="tools" className="flex flex-col h-full">
						<TabsList className="inline-flex h-9 items-center text-muted-foreground w-full justify-start rounded-none border-b bg-transparent p-0 flex-shrink-0 mb-4 w-fit">
							<TabsTrigger
								className="inline-flex items-center justify-center whitespace-nowrap py-1 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 data-[state=active]:bg-background relative h-9 rounded-none border-b-2 border-b-transparent bg-transparent px-4 pb-3 pt-2 font-semibold text-muted-foreground shadow-none transition-none data-[state=active]:border-b-primary data-[state=active]:text-foreground data-[state=active]:shadow-none"
								value="tools"
							>
								Tools
							</TabsTrigger>
							<TabsTrigger
								className="inline-flex items-center justify-center whitespace-nowrap py-1 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 data-[state=active]:bg-background relative h-9 rounded-none border-b-2 border-b-transparent bg-transparent px-4 pb-3 pt-2 font-semibold text-muted-foreground shadow-none transition-none data-[state=active]:border-b-primary data-[state=active]:text-foreground data-[state=active]:shadow-none"
								value="secrets"
							>
								Secrets
							</TabsTrigger>
						</TabsList>

						<TabsContent
							value="tools"
							className="flex-1 m-0 data-[state=active]:block"
						>
							<ToolsTab
								templateId={params.id}
								onOpenSchema={handleOpenSchema}
							/>
						</TabsContent>

						<TabsContent
							value="secrets"
							className="flex-1 m-0 data-[state=active]:block"
						>
							<SecretsTab templateId={params.id} />
						</TabsContent>
					</Tabs>
				</div>
			</div>

			<SchemaDialog
				isOpen={isSchemaOpen}
				onOpenChange={setIsSchemaOpen}
				tool={selectedTool}
			/>
		</div>
	);
}
