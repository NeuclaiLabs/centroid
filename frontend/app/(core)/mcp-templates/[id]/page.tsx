"use client";

import { use, useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Code2, FileText, Key, Terminal, Settings } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { MCPTemplateHeader } from "../../components/mcp-template-header";
import { SchemaDialog } from "../../components/schema-dialog";
import { getMCPTemplateById } from "@/lib/mcp-templates";
import type { MCPTool } from "@/lib/mcp-templates";

interface PageProps {
	params: Promise<{ id: string }>;
}

export default function MCPTemplatePage({ params }: PageProps) {
	const { id } = use(params);
	const template = getMCPTemplateById(id);

	const [isSchemaOpen, setIsSchemaOpen] = useState(false);
	const [selectedTool, setSelectedTool] = useState<MCPTool | null>(null);

	const handleOpenSchema = (tool: MCPTool) => {
		setSelectedTool(tool);
		setIsSchemaOpen(true);
	};

	if (!template) return null;

	// Extract environment variables from run config
	const envVars = template.run.env || {};

	return (
		<div className="flex flex-col">
			{/* Header takes its natural height */}
			<div className="flex-shrink-0 px-6 pt-6">
				<MCPTemplateHeader templateId={id} />
			</div>

			{/* Main content area fills available space */}
			<div className="flex-1 px-6 mt-8 min-h-0">
				<div className="w-full h-full">
					<Tabs defaultValue="tools" className="flex flex-col h-full">
						<TabsList className="inline-flex h-9 items-center text-muted-foreground w-full justify-start rounded-none border-b bg-transparent p-0 flex-shrink-0 mb-4">
							<TabsTrigger
								className="inline-flex items-center justify-center whitespace-nowrap py-1 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 data-[state=active]:bg-background relative h-9 rounded-none border-b-2 border-b-transparent bg-transparent px-4 pb-3 pt-2 font-semibold text-muted-foreground shadow-none transition-none data-[state=active]:border-b-primary data-[state=active]:text-foreground data-[state=active]:shadow-none"
								value="tools"
							>
								Tools
							</TabsTrigger>
							<TabsTrigger
								className="inline-flex items-center justify-center whitespace-nowrap py-1 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 data-[state=active]:bg-background relative h-9 rounded-none border-b-2 border-b-transparent bg-transparent px-4 pb-3 pt-2 font-semibold text-muted-foreground shadow-none transition-none data-[state=active]:border-b-primary data-[state=active]:text-foreground data-[state=active]:shadow-none"
								value="settings"
							>
								Settings
							</TabsTrigger>
						</TabsList>

						<TabsContent
							value="tools"
							className="flex-1 m-0 data-[state=active]:block"
						>
							<ScrollArea className="h-[calc(100vh-350px)]">
								<div className="space-y-4">
									{template.tools.map((tool) => (
										<Card key={tool.name}>
											<CardHeader className="flex flex-row items-center justify-between space-y-0">
												<div className="flex flex-col gap-1">
													<div className="flex items-center gap-2">
														<Code2 className="size-4 text-primary" />
														<CardTitle className="text-lg">
															{tool.name}
														</CardTitle>
													</div>
													<p className="text-sm text-muted-foreground">
														{tool.description}
													</p>
												</div>
												<Button
													variant="outline"
													size="sm"
													onClick={() => handleOpenSchema(tool)}
												>
													<FileText className="size-4 mr-2" />
													View Schema
												</Button>
											</CardHeader>
										</Card>
									))}
								</div>
							</ScrollArea>
						</TabsContent>

						<TabsContent
							value="settings"
							className="flex-1 m-0 data-[state=active]:block"
						>
							<ScrollArea className="h-[calc(100vh-350px)]">
								<div className="space-y-8">
									{/* Run Configuration */}
									<div className="space-y-4">
										<div className="flex items-center justify-between">
											<h3 className="text-lg font-medium">Run Configuration</h3>
										</div>

										{template.run.command && (
											<Card>
												<CardHeader className="flex flex-row items-center space-y-0 pb-2">
													<div className="flex items-center gap-2">
														<Terminal className="size-4 text-primary" />
														<CardTitle className="text-md">Command</CardTitle>
													</div>
												</CardHeader>
												<CardContent>
													<div className="font-mono text-sm bg-muted p-3 rounded-md overflow-x-auto">
														<span className="font-medium text-primary">
															{template.run.command}
														</span>
														{template.run.args?.map((arg) => (
															<span
																key={arg}
																className="text-muted-foreground ml-2"
															>
																{arg}
															</span>
														))}
													</div>
												</CardContent>
											</Card>
										)}

										<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
											{template.run.cwd && (
												<div className="flex items-center justify-between p-4 border rounded-lg">
													<div className="flex items-center gap-2">
														<Settings className="size-4 text-muted-foreground" />
														<span className="font-medium">
															Working Directory
														</span>
													</div>
													<span className="text-sm text-muted-foreground">
														{template.run.cwd}
													</span>
												</div>
											)}
											{template.run.timeout && (
												<div className="flex items-center justify-between p-4 border rounded-lg">
													<div className="flex items-center gap-2">
														<Settings className="size-4 text-muted-foreground" />
														<span className="font-medium">Timeout</span>
													</div>
													<span className="text-sm text-muted-foreground">
														{template.run.timeout} seconds
													</span>
												</div>
											)}
											{template.run.maxRetries !== undefined &&
												template.run.maxRetries !== null && (
													<div className="flex items-center justify-between p-4 border rounded-lg">
														<div className="flex items-center gap-2">
															<Settings className="size-4 text-muted-foreground" />
															<span className="font-medium">Max Retries</span>
														</div>
														<span className="text-sm text-muted-foreground">
															{template.run.maxRetries}
														</span>
													</div>
												)}
											{template.run.retryDelay !== undefined &&
												template.run.retryDelay !== null && (
													<div className="flex items-center justify-between p-4 border rounded-lg">
														<div className="flex items-center gap-2">
															<Settings className="size-4 text-muted-foreground" />
															<span className="font-medium">Retry Delay</span>
														</div>
														<span className="text-sm text-muted-foreground">
															{template.run.retryDelay} seconds
														</span>
													</div>
												)}
										</div>
									</div>

									{/* Secrets Section */}
									<div className="space-y-4">
										{Object.keys(envVars).length > 0 && (
											<>
												<div className="flex items-center justify-between">
													<h3 className="text-lg font-medium">Secrets</h3>
												</div>

												<div className="space-y-4">
													{Object.entries(envVars).map(([key, value]) => (
														<div
															key={key}
															className="flex items-center justify-between p-4 border rounded-lg"
														>
															<div className="flex items-center gap-2">
																<Key className="size-4 text-muted-foreground" />
																<span className="font-medium">{key}</span>
															</div>
															<span className="text-sm text-muted-foreground">
																{typeof value === "string" &&
																value.startsWith("${") &&
																value.endsWith("}")
																	? "Required"
																	: value.toString()}
															</span>
														</div>
													))}
												</div>
											</>
										)}
									</div>
								</div>
							</ScrollArea>
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
