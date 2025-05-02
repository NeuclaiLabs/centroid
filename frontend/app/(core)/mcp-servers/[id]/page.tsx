"use client";

import useSWR from "swr";
import { useParams } from "next/navigation";
import { use, useState } from "react";
import type { MCPServer, MCPTool } from "@/app/(core)/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
	Play,
	StopCircle,
	Code2,
	FileText,
	Key,
	Plus,
	Pencil,
	Trash2,
	AlertCircle,
	MoreVertical,
	Terminal,
	Settings,
} from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { getMCPTemplateById, MCPTemplateKind } from "@/lib/mcp-templates";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Switch } from "@/components/ui/switch";
import { ScrollArea } from "@/components/ui/scroll-area";
import { SchemaDialog } from "../../components/schema-dialog";
import { useMCPServers } from "@/app/(core)/hooks/use-mcp-servers";
import { EnvironmentVariableEditor } from "../../components/environment-variable-editor";
import { MCPServerHeader } from "../../components/mcp-server-header";

interface PageProps {
	params: Promise<{ id: string }>;
}

export default function MCPServerPage({ params }: PageProps) {
	const { id } = use(params);
	const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
	const [isDeleting, setIsDeleting] = useState(false);
	const [isSchemaOpen, setIsSchemaOpen] = useState(false);
	const [selectedTool, setSelectedTool] = useState<MCPTool | null>(null);
	const [isTogglingTool, setIsTogglingTool] = useState<string | null>(null);
	const [activeTools, setActiveTools] = useState<Record<string, boolean>>({});
	const [isUpdatingEnv, setIsUpdatingEnv] = useState(false);
	const { toggleServerStatus, updateEnvironmentVariable, toggleToolStatus } =
		useMCPServers();

	const {
		data: server,
		isLoading,
		mutate,
	} = useSWR<MCPServer>(`/api/mcp-servers/${id}`, async (url: string) => {
		const response = await fetch(url);
		if (!response.ok) {
			throw new Error("Failed to fetch MCP server");
		}
		return response.json();
	});

	const handleStartStop = async () => {
		const updatedServer = await toggleServerStatus(id);
		if (updatedServer) {
			mutate();
		}
	};

	const handleDelete = async () => {
		try {
			setIsDeleting(true);

			const response = await fetch(`/api/mcp-servers/${id}`, {
				method: "DELETE",
			});

			if (!response.ok) {
				throw new Error("Failed to delete server");
			}

			// Redirect to servers list
			window.location.href = "/mcp-servers";
		} catch (error) {
			console.error("Error:", error);
			setIsDeleting(false);
		}
	};

	const handleEdit = () => {
		window.location.href = `/mcp-servers/${id}/edit`;
	};

	const handleOpenSchema = (tool: MCPTool) => {
		setSelectedTool(tool);
		setIsSchemaOpen(true);
	};

	const handleToggleTool = async (toolName: string) => {
		try {
			if (isTogglingTool === toolName) return;

			setIsTogglingTool(toolName);

			// Determine new status (opposite of current)
			const currentTools = server?.tools || [];
			const currentTool = currentTools.find(
				(t: MCPTool) => t.name === toolName,
			);
			const newStatus = currentTool ? !currentTool.status : true;

			// Call the hook function to update the tool status
			const updatedServer = await toggleToolStatus(id, toolName, newStatus);

			if (updatedServer) {
				// Update local state to reflect the change
				mutate(updatedServer);
			}
		} catch (error) {
			console.error("Error toggling tool status:", error);
		} finally {
			setIsTogglingTool(null);
		}
	};

	const handleUpdateEnvVariable = async (name: string, value: string) => {
		try {
			setIsUpdatingEnv(true);
			const updatedServer = await updateEnvironmentVariable(id, name, value);
			if (updatedServer) {
				// The hook already updates the cache, just force a revalidation here
				mutate();
			}
		} catch (error) {
			console.error("Error updating environment variable:", error);
		} finally {
			setIsUpdatingEnv(false);
		}
	};

	if (isLoading) {
		return (
			<div className="flex-1 p-6">
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
							<div className="px-6 pb-6 pt-2">
								<div className="flex gap-2">
									<div className="h-6 w-20 bg-muted rounded-full" />
								</div>
							</div>
						</div>
					</div>
				</div>

				{/* Main content skeleton */}
				<div className="flex-1 px-6 mt-8 min-h-0">
					<div className="w-full h-full">
						<div className="flex flex-col h-full">
							{/* Tabs skeleton */}
							<div className="inline-flex h-9 items-center mb-4 border-b">
								<div className="h-9 px-4 border-b-2 border-primary font-semibold text-sm">
									Details
								</div>
								<div className="h-9 px-4 text-muted-foreground text-sm">
									Tools
								</div>
								<div className="h-9 px-4 text-muted-foreground text-sm">
									Settings
								</div>
							</div>

							{/* Tab content skeleton */}
							<div className="h-[calc(100vh-350px)]">
								<div className="space-y-8">
									<div className="rounded-lg border bg-card shadow">
										<div className="p-6 space-y-2">
											<div className="h-6 w-36 bg-muted rounded mb-4" />
											<div className="space-y-6">
												{[1, 2, 3, 4, 5, 6].map((i) => (
													<div key={i} className="flex justify-between">
														<div className="h-5 w-32 bg-muted rounded" />
														<div className="h-5 w-40 bg-muted rounded" />
													</div>
												))}
											</div>
										</div>
									</div>
								</div>
							</div>
						</div>
					</div>
				</div>
			</div>
		);
	}

	if (!server) {
		return (
			<div className="flex-1 p-6">
				<div className="text-center">
					<h1 className="text-2xl font-bold tracking-tight">
						Server not found
					</h1>
					<p className="text-muted-foreground">
						The MCP server you're looking for doesn't exist or you don't have
						access to it.
					</p>
				</div>
			</div>
		);
	}

	const template = server.templateId
		? getMCPTemplateById(server.templateId)
		: undefined;

	return (
		<div className="flex-1 p-6">
			{/* Header takes its natural height */}
			<div className="flex-shrink-0 px-6 pt-6">
				<MCPServerHeader
					server={server}
					onStartStop={handleStartStop}
					onEdit={handleEdit}
					onDelete={handleDelete}
				/>
			</div>

			{/* Main content area fills available space */}
			<div className="flex-1 px-6 mt-8 min-h-0">
				<div className="w-full h-full">
					<Tabs defaultValue="details" className="flex flex-col h-full">
						<TabsList className="inline-flex h-9 items-center text-muted-foreground w-full justify-start rounded-none border-b bg-transparent p-0 flex-shrink-0 mb-4">
							<TabsTrigger
								className="inline-flex items-center justify-center whitespace-nowrap py-1 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 data-[state=active]:bg-background relative h-9 rounded-none border-b-2 border-b-transparent bg-transparent px-4 pb-3 pt-2 font-semibold text-muted-foreground shadow-none transition-none data-[state=active]:border-b-primary data-[state=active]:text-foreground data-[state=active]:shadow-none"
								value="details"
							>
								Details
							</TabsTrigger>
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
							value="details"
							className="flex-1 m-0 data-[state=active]:block"
						>
							<ScrollArea className="h-[calc(100vh-350px)]">
								<div className="space-y-8">
									<Card>
										<CardHeader>
											<CardTitle className="text-lg">Server Details</CardTitle>
										</CardHeader>
										<CardContent>
											<dl className="space-y-4">
												<div className="flex justify-between">
													<dt className="text-sm text-muted-foreground">
														Status
													</dt>
													<dd>
														<Badge
															variant={
																server.status === "active"
																	? "default"
																	: "secondary"
															}
															className={
																server.status === "active"
																	? "bg-green-100 text-green-800"
																	: ""
															}
														>
															{server.status}
														</Badge>
													</dd>
												</div>
												<div className="flex justify-between">
													<dt className="text-sm text-muted-foreground">
														Template
													</dt>
													<dd className="text-sm flex items-center gap-1">
														{template ? template.name : "Custom"}
													</dd>
												</div>
												<div className="flex justify-between">
													<dt className="text-sm text-muted-foreground">
														Mount Path
													</dt>
													<dd className="text-sm font-mono">
														{server.mountPath}
													</dd>
												</div>
												<div className="flex justify-between">
													<dt className="text-sm text-muted-foreground">
														Created At
													</dt>
													<dd className="text-sm">{server.createdAt}</dd>
												</div>
												<div className="flex justify-between">
													<dt className="text-sm text-muted-foreground">
														Updated At
													</dt>
													<dd className="text-sm">{server.updatedAt}</dd>
												</div>
												<div className="flex justify-between">
													<dt className="text-sm text-muted-foreground">
														Server ID
													</dt>
													<dd className="text-sm font-mono">{server.id}</dd>
												</div>
											</dl>
										</CardContent>
									</Card>
								</div>
							</ScrollArea>
						</TabsContent>

						<TabsContent
							value="tools"
							className="flex-1 m-0 data-[state=active]:block"
						>
							<ScrollArea className="h-[calc(100vh-350px)]">
								<div className="space-y-4 pr-2">
									{template?.tools ? (
										template.tools.map((tool) => {
											// Find if we have the tool in the server's tools array
											const serverTool = server.tools?.find(
												(t) => t.name === tool.name,
											);
											// Get status from server tool if it exists, otherwise use template status
											const isActive = serverTool ? serverTool.status : false;
											const isToggling = isTogglingTool === tool.name;

											return (
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
														<div className="flex items-center gap-4">
															<div className="flex items-center gap-2">
																<span className="text-sm text-muted-foreground">
																	{isActive ? "Active" : "Inactive"}
																</span>
																<Switch
																	checked={isActive}
																	onCheckedChange={() =>
																		handleToggleTool(tool.name)
																	}
																	disabled={isToggling}
																/>
																{isToggling && (
																	<span className="size-4 border-2 border-primary border-r-transparent rounded-full animate-spin ml-2" />
																)}
															</div>
															<Button
																variant="outline"
																size="sm"
																onClick={() => handleOpenSchema(tool)}
															>
																<FileText className="size-4 mr-2" />
																View Schema
															</Button>
														</div>
													</CardHeader>
												</Card>
											);
										})
									) : (
										<div className="text-center p-4">
											<p className="text-muted-foreground">
												No tools available for this server.
											</p>
										</div>
									)}
								</div>
							</ScrollArea>
						</TabsContent>

						<TabsContent
							value="settings"
							className="flex-1 m-0 data-[state=active]:block"
						>
							<ScrollArea className="h-[calc(100vh-350px)]">
								<div className="space-y-4">
									{/* Run Configuration */}
									{server.run && (
										<div className="space-y-4 mb-6">
											<div className="flex items-center justify-between">
												<h3 className="text-lg font-medium">
													Run Configuration
												</h3>
											</div>

											<Card>
												<CardHeader className="pb-2">
													<div className="flex items-center gap-2">
														<Terminal className="size-4 text-primary" />
														<CardTitle className="text-md">Command</CardTitle>
													</div>
												</CardHeader>
												<CardContent>
													<div className="font-mono text-sm bg-muted p-3 rounded-md overflow-x-auto">
														<span className="font-medium text-primary">
															{server.run.command}
														</span>
														{server.run.args?.map((arg) => (
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

											{/* Additional run configurations could be added here */}
										</div>
									)}

									<div className="flex items-center justify-between">
										<h3 className="text-lg font-medium">
											Environment Variables
										</h3>
										{isUpdatingEnv && (
											<span className="text-sm text-muted-foreground animate-pulse">
												Updating...
											</span>
										)}
									</div>

									{server.secrets ? (
										<div className="space-y-4">
											{Object.entries(server.secrets).map(([key, value]) => (
												<div
													key={key}
													className="group p-4 border rounded-lg hover:border-primary/50 transition-colors"
												>
													<EnvironmentVariableEditor
														name={key}
														value={
															typeof value === "string"
																? value
																: typeof value === "undefined" || value === null
																	? ""
																	: String(value)
														}
														onSave={handleUpdateEnvVariable}
													/>
												</div>
											))}
										</div>
									) : (
										<div className="text-center p-4">
											<p className="text-muted-foreground">
												No environment variables available for this server.
											</p>
										</div>
									)}
								</div>
							</ScrollArea>
						</TabsContent>
					</Tabs>
				</div>
			</div>

			{/* Delete confirmation dialog */}
			<Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
				<DialogContent>
					<DialogHeader>
						<DialogTitle className="flex items-center gap-2">
							<AlertCircle className="h-5 w-5 text-destructive" />
							Confirm Server Deletion
						</DialogTitle>
						<DialogDescription>
							Are you sure you want to delete "{server.name}"? This action
							cannot be undone and all associated data will be permanently lost.
						</DialogDescription>
					</DialogHeader>
					<DialogFooter className="gap-2 sm:gap-0">
						<Button
							variant="outline"
							onClick={() => setIsDeleteDialogOpen(false)}
						>
							Cancel
						</Button>
						<Button
							variant="destructive"
							onClick={handleDelete}
							disabled={isDeleting}
						>
							{isDeleting ? "Deleting..." : "Delete Server"}
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>

			<SchemaDialog
				isOpen={isSchemaOpen}
				onOpenChange={setIsSchemaOpen}
				tool={selectedTool}
			/>
		</div>
	);
}
