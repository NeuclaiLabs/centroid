"use client";

import { useState, useEffect } from "react";
import { mcpTemplates } from "@/lib/mcp-templates";
import { MCPTemplateCard } from "../components/mcp-template-card";
import { Button } from "@/components/ui/button";
import { Download } from "lucide-react";
import { InstallTemplateModal } from "../components/install-template-modal";
import { useMCPServers } from "@/app/(core)/hooks/use-mcp-servers";

export default function MCPTemplatesPage() {
	const [selectedTemplate, setSelectedTemplate] = useState<string | null>(null);
	const { servers, isLoading, error } = useMCPServers();

	useEffect(() => {
		console.log("Page rendered with data:", {
			servers,
			isLoading,
			error,
		});
	}, [servers, isLoading, error]);

	const selectedTemplateData = selectedTemplate
		? mcpTemplates.find((t) => t.id === selectedTemplate)
		: null;

	return (
		<div className="flex-1 py-6">
			<div className="mb-8">
				<h1 className="text-2xl font-bold tracking-tight">MCP Templates</h1>
				<p className="text-muted-foreground">
					Browse and manage your Model Context Protocol templates
				</p>
			</div>

			<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
				{mcpTemplates.map((template) => {
					const serverWithTemplate = servers.find(
						(server) => server.templateId === template.id,
					);
					const isInstalled = !!serverWithTemplate;

					return (
						<MCPTemplateCard
							key={template.id}
							template={template}
							isInstalled={isInstalled}
							server={serverWithTemplate}
							onInstall={() => setSelectedTemplate(template.id)}
						/>
					);
				})}
			</div>

			{selectedTemplateData && (
				<InstallTemplateModal
					isOpen={true}
					onOpenChange={() => setSelectedTemplate(null)}
					template={selectedTemplateData}
				/>
			)}
		</div>
	);
}
