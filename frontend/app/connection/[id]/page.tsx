"use client";

import { useState, useEffect } from "react";
import { use } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { integrationRegistry, tools } from "@/lib/registry";
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

interface ActionRow {
	name: string;
	enum: string;
	description: string;
	type: "Action" | "Trigger";
}

interface PageProps {
	params: Promise<{ id: string }>;
}

export default function ConnectionPage({ params }: PageProps) {
	const resolvedParams = use(params);
	const [isFormOpen, setIsFormOpen] = useState(false);
	const [isSubmitting, setIsSubmitting] = useState(false);
	const [integrationData, setIntegrationData] = useState(
		integrationRegistry.github,
	);
	const [connection, setConnection] = useState({
		id: "",
		type: "github",
		name: "",
	});

	useEffect(() => {
		const integrationType =
			Object.keys(integrationRegistry).find(
				(key) => integrationRegistry[key].id === resolvedParams.id,
			) || "github";

		setIntegrationData(integrationRegistry[integrationType]);
		setConnection({
			id: resolvedParams.id,
			type: integrationType,
			name: `${integrationRegistry[integrationType].name} Connection`,
		});
	}, [resolvedParams.id]);

	const integrationTools = tools[connection.type] || [];

	// Map tools to ActionRow format
	const actions: ActionRow[] = integrationTools.map((tool) => ({
		name: tool.name
			.split("_")
			.map((word) => word.charAt(0).toUpperCase() + word.slice(1))
			.join(" "),
		enum: tool.name.toUpperCase(),
		description: tool.description,
		type: "Action",
	}));

	// Add triggers based on integration features
	const triggers: ActionRow[] = integrationData.features.map((feature) => ({
		name: `${feature} Trigger`,
		enum: `ON_${feature.toUpperCase().replace(/\s+/g, "_")}`,
		description: `Triggers when ${feature.toLowerCase()} occurs.`,
		type: "Trigger",
	}));

	const allActions = [...triggers, ...actions];

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
							aria-label={`${integrationData.name} icon`}
						>
							<path d={integrationData.icon.path} />
						</svg>
					</div>
					<div className="flex-1 min-w-0">
						<div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
							<div className="space-y-2 min-w-0">
								<h1 className="text-xl font-semibold flex items-center gap-2 truncate">
									{integrationData.name}
								</h1>
								<p className="text-muted-foreground line-clamp-2 sm:line-clamp-1">
									{integrationData.description}
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
												({allActions.length})
											</span>
										</h3>
										<div className="flex items-center gap-4">
											<Button variant="outline" className="h-10">
												Add custom action
											</Button>
											<div className="relative w-[300px]">
												<Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
												<Input
													placeholder="Search all tools"
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
																Type
															</TableHead>
															<TableHead className="min-w-[100px] py-4">
																Schema
															</TableHead>
														</TableRow>
													</TableHeader>
													<TableBody>
														{allActions.map((action) => (
															<TableRow key={action.enum} className="py-2">
																<TableCell className="font-medium py-4">
																	{action.name}
																</TableCell>
																<TableCell className="text-muted-foreground py-4">
																	{action.description}
																</TableCell>
																<TableCell className="py-4">
																	<Badge
																		variant={
																			action.type === "Trigger"
																				? "default"
																				: "secondary"
																		}
																		className="font-normal"
																	>
																		{action.type}
																	</Badge>
																</TableCell>
																<TableCell className="py-4">
																	<Button
																		variant="ghost"
																		size="sm"
																		className="h-7 px-2 text-xs font-medium"
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
												({allActions.length})
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
														{allActions.map((action) => (
															<TableRow key={action.enum} className="py-2">
																<TableCell className="font-medium py-4">
																	{action.name}
																</TableCell>
																<TableCell className="text-muted-foreground py-4">
																	{action.description}
																</TableCell>
																<TableCell className="py-4">
																	<Switch
																		defaultChecked={true}
																		onCheckedChange={(checked: boolean) => {
																			toast.success(
																				`${action.name} ${checked ? "enabled" : "disabled"}`,
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
				open={isFormOpen}
				onOpenChange={(open) => {
					if (!open) {
						setIsFormOpen(false);
					}
				}}
			>
				<DialogContent>
					<DialogHeader>
						<DialogTitle>Setup {integrationData.name} Integration</DialogTitle>
						<DialogDescription>
							Configure your {integrationData.name} integration settings below
						</DialogDescription>
					</DialogHeader>
					<ConnectionForm onSubmit={handleCreate} isSubmitting={isSubmitting} />
				</DialogContent>
			</Dialog>
		</>
	);
}
