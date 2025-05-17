"use client";

import * as React from "react";
import { useEffect, useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Code2, FileText, Key, Terminal, Settings } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { MCPTemplateHeader } from "../../../components/mcp-template-header";
import { SchemaDialog } from "../../../components/schema-dialog";
import type { MCPTool, MCPTemplate } from "@/app/(core)/types";
import { useRouter } from "next/navigation";

interface PageProps {
	params: Promise<{ id: string }>;
}

export default function MCPTemplatePage({ params }: PageProps) {
	const { id } = React.use(params);
	const router = useRouter();
	const [template, setTemplate] = useState<MCPTemplate | null>(null);
	const [isLoading, setIsLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);

	const [isSchemaOpen, setIsSchemaOpen] = useState(false);
	const [selectedTool, setSelectedTool] = useState<MCPTool | null>(null);

	useEffect(() => {
		const fetchTemplate = async () => {
			try {
				setIsLoading(true);
				const response = await fetch(`/api/mcp/templates/${id}`);

				if (!response.ok) {
					if (response.status === 404) {
						router.push("/mcp/templates");
						return;
					}
					throw new Error("Failed to fetch template");
				}

				const data = await response.json();
				console.log(data);
				setTemplate(data);
				setIsLoading(false);
			} catch (err) {
				setError(err instanceof Error ? err.message : "An error occurred");
				setIsLoading(false);
			}
		};

		fetchTemplate();
	}, [id, router]);

	const handleOpenSchema = (tool: MCPTool) => {
		setSelectedTool(tool);
		setIsSchemaOpen(true);
	};

	if (isLoading) {
		return (
			<div className="flex flex-col">
				{/* Header skeleton */}
				<div className="flex-shrink-0 px-6 pt-6">
					<div className="animate-pulse">
						<div className="rounded-lg border bg-card">
							<div className="p-6 pb-4">
								<div className="flex items-center justify-between">
									<div className="flex items-center gap-4">
										<div className="size-12 rounded-lg bg-primary/10" />
										<div>
											<div className="h-8 w-64 bg-muted rounded mb-2" />
											<div className="h-4 w-96 bg-muted rounded" />
										</div>
									</div>
									<div className="flex gap-2">
										<div className="h-8 w-24 bg-muted rounded" />
										<div className="h-8 w-8 bg-muted rounded" />
									</div>
								</div>
							</div>
							<div className="px-6 pb-5 pt-2">
								<div className="flex gap-2">
									<div className="h-5 w-20 bg-muted rounded-full" />
								</div>
							</div>
						</div>
					</div>
				</div>

				{/* Main content skeleton */}
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
								<div className="h-[calc(100vh-350px)]">
									<div className="space-y-4">
										{[1, 2, 3, 4].map((i) => (
											<div
												key={i}
												className="rounded-lg border bg-card shadow animate-pulse"
											>
												<div className="p-6 pb-4">
													<div className="flex items-center justify-between">
														<div>
															<div className="flex items-center gap-2 mb-3">
																<div className="size-4 rounded bg-primary/30" />
																<div className="h-6 w-36 bg-muted rounded" />
															</div>
															<div className="h-4 w-64 bg-muted rounded" />
														</div>
														<div className="h-9 w-28 bg-muted rounded" />
													</div>
												</div>
											</div>
										))}
									</div>
								</div>
							</TabsContent>

							<TabsContent
								value="settings"
								className="flex-1 m-0 data-[state=active]:block"
							>
								<div className="h-[calc(100vh-350px)]">
									<div className="space-y-8">
										{/* Run Configuration skeleton */}
										<div className="space-y-4">
											<div className="h-6 w-40 bg-muted rounded mb-4" />

											<div className="rounded-lg border bg-card shadow animate-pulse">
												<div className="p-6 pb-3">
													<div className="flex items-center gap-2 mb-4">
														<div className="size-4 rounded bg-primary/30" />
														<div className="h-5 w-24 bg-muted rounded" />
													</div>
													<div className="h-12 w-full bg-muted rounded-md" />
												</div>
											</div>

											<div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
												{[1, 2, 3, 4].map((i) => (
													<div
														key={i}
														className="flex items-center justify-between p-4 border rounded-lg animate-pulse"
													>
														<div className="flex items-center gap-2">
															<div className="size-4 rounded bg-muted" />
															<div className="h-5 w-28 bg-muted rounded" />
														</div>
														<div className="h-5 w-20 bg-muted rounded" />
													</div>
												))}
											</div>
										</div>

										{/* Secrets section skeleton */}
										<div className="space-y-4">
											<div className="h-6 w-20 bg-muted rounded mb-4" />

											<div className="space-y-4">
												{[1, 2, 3].map((i) => (
													<div
														key={i}
														className="flex items-center justify-between p-4 border rounded-lg animate-pulse"
													>
														<div className="flex items-center gap-2">
															<div className="size-4 rounded bg-muted" />
															<div className="h-5 w-36 bg-muted rounded" />
														</div>
														<div className="h-5 w-16 bg-muted rounded" />
													</div>
												))}
											</div>
										</div>
									</div>
								</div>
							</TabsContent>
						</Tabs>
					</div>
				</div>
			</div>
		);
	}

	// if (error) {
	// 	return <div className="flex-1 p-6 text-red-500">Error: {error}</div>;
	// }

	// if (!template) {
	// 	return <div className="flex-1 p-6">Template not found</div>;
	// }

	// Extract environment variables from run config
	const envVars = template?.run?.env || {};

	return (
		<div className="flex flex-col">
			{/* Header takes its natural height */}
			<div className="flex-shrink-0 px-6 pt-6">
				{template && <MCPTemplateHeader template={template} />}
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
									{template?.tools?.map((tool: MCPTool) => (
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

										{template?.run?.command && (
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
															{template?.run?.command}
														</span>
														{template?.run?.args?.map((arg: string) => (
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
											{template?.run?.cwd && (
												<div className="flex items-center justify-between p-4 border rounded-lg">
													<div className="flex items-center gap-2">
														<Settings className="size-4 text-muted-foreground" />
														<span className="font-medium">
															Working Directory
														</span>
													</div>
													<span className="text-sm text-muted-foreground">
														{template?.run?.cwd}
													</span>
												</div>
											)}
											{template?.run?.maxRetries !== undefined &&
												template?.run?.maxRetries !== null && (
													<div className="flex items-center justify-between p-4 border rounded-lg">
														<div className="flex items-center gap-2">
															<Settings className="size-4 text-muted-foreground" />
															<span className="font-medium">Max Retries</span>
														</div>
														<span className="text-sm text-muted-foreground">
															{template?.run?.maxRetries}
														</span>
													</div>
												)}
											{template?.run?.retryDelay !== undefined &&
												template?.run?.retryDelay !== null && (
													<div className="flex items-center justify-between p-4 border rounded-lg">
														<div className="flex items-center gap-2">
															<Settings className="size-4 text-muted-foreground" />
															<span className="font-medium">Retry Delay</span>
														</div>
														<span className="text-sm text-muted-foreground">
															{template?.run?.retryDelay} seconds
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
																	: String(value)}
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
