"use client";

import { useState, useEffect } from "react";
import { use } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { appRegistry, tools } from "@/lib/registry";
import { ArrowRight, Copy, Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import {
	Table,
	TableHeader,
	TableBody,
	TableHead,
	TableRow,
	TableCell,
} from "@/components/ui/table";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import { ConnectionForm } from "@/components/connection-form";
import { toast } from "sonner";
import { createConnection } from "../actions";
import type { ConnectionCreate } from "../types";
import { Switch } from "@/components/ui/switch";
import type { Tool } from "@/lib/registry";

interface ActionRow {
	name: string;
	enum: string;
	description: string;
	tags: "Action" | "Trigger";
}

interface PageProps {
	params: Promise<{ id: string }>;
}

function filterTools(tools: ActionRow[], searchQuery: string): ActionRow[] {
	const query = searchQuery.toLowerCase().trim();
	if (!query) return tools;

	return tools.filter(
		(tool) =>
			tool.name.toLowerCase().includes(query) ||
			tool.description.toLowerCase().includes(query) ||
			tool.tags.toLowerCase().includes(query),
	);
}

export default function ConnectionPage({ params }: PageProps) {
	const resolvedParams = use(params);
	const [searchQuery, setSearchQuery] = useState("");
	const [isFormOpen, setIsFormOpen] = useState(false);
	const [isSchemaOpen, setIsSchemaOpen] = useState(false);
	const [selectedTool, setSelectedTool] = useState<ActionRow | null>(null);
	const [isSubmitting, setIsSubmitting] = useState(false);
	const [appData, setAppData] = useState(appRegistry.github);
	const [connection, setConnection] = useState({
		id: "",
		type: "",
		name: "",
	});
	const [connTools, setConnTools] = useState<ActionRow[]>([]);

	useEffect(() => {
		const appType =
			Object.keys(appRegistry).find(
				(key) => appRegistry[key].id === resolvedParams.id,
			) || "github";

		setAppData(appRegistry[appType]);
		setConnection({
			id: resolvedParams.id,
			type: appType,
			name: `${appRegistry[appType].name} Connection`,
		});

		// Get tools for this connection - either by id or by type, depending on what's available
		const integrationTools = tools.filter(
			(tool) => tool.appId === resolvedParams.id || tool.appId === appType,
		);

		// Map tools to ActionRow format
		const toolsList: ActionRow[] = integrationTools.map((tool: Tool) => ({
			name: tool.name
				.split("_")
				.map((word: string) => word.charAt(0).toUpperCase() + word.slice(1))
				.join(" "),
			enum: tool.name.toUpperCase(),
			description: tool.description,
			tags: "Action",
		}));

		setConnTools(toolsList);
	}, [resolvedParams.id]);

	const allTools = [...connTools];
	const filteredTools = filterTools(allTools, searchQuery);

	const handleCreate = async (formData: ConnectionCreate) => {
		try {
			setIsSubmitting(true);
			await createConnection(formData);
			setIsFormOpen(false);
			toast.success("Connection created successfully");
		} catch (error) {
			toast.error("Failed to create connection");
		} finally {
			setIsSubmitting(false);
		}
	};

	return (
		<>
			<div className="container mx-auto py-8 space-y-8">
				{/* Header Section */}
				<div className="flex flex-col sm:flex-row items-start gap-4">
					<div className="size-14 shrink-0 rounded-lg flex items-center justify-center bg-primary/10">
						<svg
							role="img"
							viewBox="0 0 24 24"
							className="size-9 text-primary"
							fill="currentColor"
							aria-label={`${appData.name} icon`}
						>
							<path d={appData.icon.path} />
						</svg>
					</div>
					<div className="flex-1 min-w-0">
						<div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
							<div className="space-y-2 min-w-0">
								<h1 className="text-xl font-semibold flex items-center gap-2 truncate">
									{appData.name}
								</h1>
								<p className="text-muted-foreground line-clamp-2 sm:line-clamp-1">
									{appData.description}
								</p>
							</div>
							<Button
								size="lg"
								className="h-11 shrink-0"
								onClick={(e) => {
									e.preventDefault();
									e.stopPropagation();
									setIsFormOpen(true);
								}}
							>
								Connect
								<ArrowRight className="ml-2 size-4" />
							</Button>
						</div>
					</div>
				</div>

				{/* Tabs Section */}
				<div className="w-full">
					<div className="w-[1000px] max-w-[90vw]">
						<Tabs defaultValue="overview" className="space-y-6">
							<TabsList className="mb-2">
								<TabsTrigger value="overview">Overview</TabsTrigger>
								<TabsTrigger value="settings">Settings</TabsTrigger>
							</TabsList>

							<TabsContent
								value="overview"
								className="mt-0 data-[state=inactive]:hidden"
							>
								<div className="border rounded-lg p-6 space-y-8">
									<div className="flex items-center justify-between">
										<h3 className="text-xl font-medium">
											All Tools
											<span className="ml-2 text-muted-foreground">
												({allTools.length})
											</span>
										</h3>
										<div className="flex items-center gap-4">
											<div className="relative w-[300px]">
												<Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
												<Input
													placeholder="Search all tools"
													className="pl-9 h-10 w-full"
													value={searchQuery}
													onChange={(e) => setSearchQuery(e.target.value)}
												/>
											</div>
										</div>
									</div>

									<div className="relative">
										<div className="rounded-md border">
											<div className="w-full overflow-auto">
												<Table>
													<TableHeader className="sticky top-0 bg-background z-10">
														<TableRow className="hover:bg-transparent">
															<TableHead className="min-w-[200px] py-4">
																Name
															</TableHead>
															<TableHead className="min-w-[300px] py-4">
																Description
															</TableHead>
															<TableHead className="min-w-[100px] py-4">
																Tags
															</TableHead>
															<TableHead className="min-w-[100px] py-4">
																Schema
															</TableHead>
														</TableRow>
													</TableHeader>
													<TableBody>
														{filteredTools.map((tool) => (
															<TableRow key={tool.enum} className="py-2">
																<TableCell className="font-medium py-4">
																	{tool.name}
																</TableCell>
																<TableCell className="text-muted-foreground py-4">
																	{tool.description}
																</TableCell>
																<TableCell className="py-4">
																	<Badge
																		variant={
																			tool.tags === "Trigger"
																				? "default"
																				: "secondary"
																		}
																		className="font-normal"
																	>
																		{tool.tags}
																	</Badge>
																</TableCell>
																<TableCell className="py-4">
																	<Button
																		variant="outline"
																		size="sm"
																		className="h-7 px-2 text-xs font-medium"
																		onClick={() => {
																			setSelectedTool(tool);
																			setIsSchemaOpen(true);
																		}}
																	>
																		Open
																	</Button>
																</TableCell>
															</TableRow>
														))}
													</TableBody>
												</Table>
											</div>
										</div>
									</div>
								</div>
							</TabsContent>

							<TabsContent
								value="settings"
								className="mt-0 data-[state=inactive]:hidden"
							>
								<div className="border rounded-lg p-6 space-y-8">
									<div className="flex items-center justify-between">
										<h3 className="text-xl font-medium">
											Tool Settings
											<span className="ml-2 text-muted-foreground">
												({allTools.length})
											</span>
										</h3>
										<div className="flex items-center gap-4">
											<div className="relative w-[300px]">
												<Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
												<Input
													placeholder="Search tools"
													className="pl-9 h-10 w-full"
												/>
											</div>
										</div>
									</div>

									<div className="relative">
										<div className="rounded-md border">
											<div className="w-full overflow-auto">
												<Table>
													<TableHeader className="sticky top-0 bg-background z-10">
														<TableRow className="hover:bg-transparent">
															<TableHead className="min-w-[200px] py-4">
																Name
															</TableHead>
															<TableHead className="min-w-[300px] py-4">
																Description
															</TableHead>
															<TableHead className="min-w-[100px] py-4">
																Status
															</TableHead>
														</TableRow>
													</TableHeader>
													<TableBody>
														{allTools.map((tool) => (
															<TableRow key={tool.enum} className="py-2">
																<TableCell className="font-medium py-4">
																	{tool.name}
																</TableCell>
																<TableCell className="text-muted-foreground py-4">
																	{tool.description}
																</TableCell>
																<TableCell className="py-4">
																	<Switch
																		defaultChecked={true}
																		onCheckedChange={(checked: boolean) => {
																			toast.success(
																				`${tool.name} ${checked ? "enabled" : "disabled"}`,
																			);
																		}}
																	/>
																</TableCell>
															</TableRow>
														))}
													</TableBody>
												</Table>
											</div>
										</div>
									</div>
								</div>
							</TabsContent>
						</Tabs>
					</div>
				</div>
			</div>

			<Dialog
				open={isSchemaOpen}
				onOpenChange={(open) => {
					if (!open) {
						setIsSchemaOpen(false);
						setSelectedTool(null);
					}
				}}
			>
				<DialogContent className="max-w-3xl max-h-[90vh] flex flex-col">
					<DialogHeader className="flex-none">
						<DialogTitle className="flex items-center gap-2">
							<span>{selectedTool?.name} Schema</span>
							<Button
								variant="outline"
								size="icon"
								className="h-6 w-6"
								onClick={() => {
									const schema =
										document.getElementById("schema-content")?.textContent;
									if (schema) {
										navigator.clipboard.writeText(schema);
										toast.success("Schema copied to clipboard");
									}
								}}
							>
								<Copy className="h-3 w-3" />
							</Button>
						</DialogTitle>
						<DialogDescription>
							The schema defines the structure and types of data that can be
							used with this tool.
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
								{JSON.stringify(
									{
										name: selectedTool?.name,
										type: "object",
										required: ["input"],
										properties: {
											input: {
												type: "object",
												required: ["message"],
												properties: {
													message: {
														type: "string",
														description: "The message to process",
													},
													options: {
														type: "object",
														properties: {
															maxLength: {
																type: "number",
																description: "Maximum length of the output",
															},
															format: {
																type: "string",
																enum: ["json", "text", "markdown"],
																description: "Output format",
															},
														},
													},
												},
											},
										},
									},
									null,
									2,
								)}
							</pre>
						</div>
					</div>
				</DialogContent>
			</Dialog>

			<Dialog
				open={isFormOpen}
				onOpenChange={(open) => {
					if (!open) {
						setIsFormOpen(false);
					}
				}}
			>
				<DialogContent>
					<DialogHeader>
						<DialogTitle>Setup {appData.name} Integration</DialogTitle>
						<DialogDescription>
							Configure your {appData.name} integration settings below
						</DialogDescription>
					</DialogHeader>
					<ConnectionForm onSubmit={handleCreate} isSubmitting={isSubmitting} />
				</DialogContent>
			</Dialog>
		</>
	);
}
