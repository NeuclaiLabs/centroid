"use client";

import { useState, useEffect } from "react";
import type { MCPTemplate, MCPServer } from "@/app/(core)/types";
import { MCPTemplateCard } from "@/app/(core)/components/mcp-template-card";
import { InstallTemplateModal } from "@/app/(core)/components/install-template-modal";
import { useMCPTemplates } from "@/app/(core)/hooks/use-mcp-templates";
import {
	Card,
	CardHeader,
	CardContent,
	CardFooter,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

function TemplateSection({
	title,
	description,
	templates,
	isLoading,
	onTemplateInstall
}: {
	title: string;
	description: string;
	templates: MCPTemplate[];
	isLoading: boolean;
	onTemplateInstall: (templateId: string) => void;
}) {
	return (
		<div className="mb-12">
			<div className="mb-6">
				<h2 className="text-xl font-semibold tracking-tight">{title}</h2>
				<p className="text-muted-foreground text-sm">{description}</p>
			</div>

			<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
				{isLoading
					? // Skeleton UI for loading state
						Array.from({ length: 3 }).map((_, index) => (
							<Card
								key={`skeleton-${title.toLowerCase().replace(' ', '-')}-${crypto.randomUUID()}`}
								className="hover:shadow-md transition-shadow flex flex-col h-full cursor-pointer"
							>
								<CardHeader className="p-6 flex flex-row items-start justify-between space-y-0">
									<div className="flex flex-col gap-2 flex-1 min-w-0 pr-2">
										<div className="flex items-start gap-2">
											<Skeleton className="size-8 rounded-lg shrink-0" />
											<div className="flex flex-col min-w-0 flex-1">
												<div className="flex items-start gap-1">
													<div className="flex gap-1 items-center">
														<Skeleton className="h-4 w-24 mr-1" />
														<Skeleton className="h-4 w-4 rounded-full shrink-0" />
													</div>
												</div>
												<Skeleton className="h-3 w-16 mt-1" />
											</div>
										</div>
									</div>
									<Skeleton className="h-9 w-24 flex-shrink-0" />
								</CardHeader>
								<CardContent className="px-6 py-2 space-y-4 flex-grow">
									<div className="space-y-2">
										<Skeleton className="h-4 w-5/6" />
										<Skeleton className="h-4 w-4/6" />
									</div>
								</CardContent>
								<CardFooter className="px-6 py-4 mt-auto border-t border-border/40">
									<div className="flex items-center justify-between w-full text-sm">
										<div className="flex items-center gap-2">
											<Skeleton className="h-3 w-3" />
											<Skeleton className="h-4 w-16" />
										</div>
										<div className="flex items-center gap-1">
											<Skeleton className="h-3 w-3" />
											<Skeleton className="h-4 w-20" />
										</div>
									</div>
								</CardFooter>
							</Card>
						))
					: templates.map((template: MCPTemplate) => {
							return (
								<MCPTemplateCard
									key={template.id}
									template={template}
									isInstalled={!!template.servers?.length}
									onInstall={() => onTemplateInstall(template.id)}
								/>
							);
						})}
			</div>

			{!isLoading && templates.length === 0 && (
				<div className="text-center py-8 text-muted-foreground">
					No {title.toLowerCase()} available
				</div>
			)}
		</div>
	);
}

export default function MCPTemplatesPage() {
	const [selectedTemplate, setSelectedTemplate] = useState<string | null>(null);
	const { templates, isLoading } = useMCPTemplates();

	useEffect(() => {
		console.log("Page rendered with data:", {
			templates,
			isLoading,
		});
	}, [templates, isLoading]);

	// Filter templates based on isAgent flag
	const agentTemplates = templates.filter((template: MCPTemplate) => template.isAgent);
	const mcpTemplates = templates.filter((template: MCPTemplate) => !template.isAgent);

	const selectedTemplateData = selectedTemplate
		? templates.find((t: MCPTemplate) => t.id === selectedTemplate)
		: null;

	return (
		<div className="flex-1 py-6">
			<div className="mb-8">
				<h1 className="text-2xl font-bold tracking-tight">Templates</h1>
				<p className="text-muted-foreground">
					Browse and manage your Agent and MCP templates
				</p>
			</div>

			<TemplateSection
				title="Agent templates"
				description="Quick tools to automate your processes"
				templates={agentTemplates}
				isLoading={isLoading}
				onTemplateInstall={setSelectedTemplate}
			/>

			<TemplateSection
				title="Tool templates"
				description="Quick tools to automate your processes"
				templates={mcpTemplates}
				isLoading={isLoading}
				onTemplateInstall={setSelectedTemplate}
			/>

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
