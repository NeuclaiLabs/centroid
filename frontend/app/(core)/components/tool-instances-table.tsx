"use client";

import {
	Table,
	TableHeader,
	TableBody,
	TableHead,
	TableRow,
	TableCell,
} from "@/components/ui/table";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { ArrowUpDown, Eye } from "lucide-react";
import type { ToolInstance } from "../../types";
import { useSWRConfig } from "swr";
import { toast } from "sonner";
import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import { useState } from "react";
import { ScrollArea as DialogScrollArea } from "@/components/ui/scroll-area";

interface ToolInstancesTableProps {
	tools: ToolInstance[];
	onSortStatus: () => void;
	statusSort: "asc" | "desc" | null;
}

export function ToolInstancesTable({
	tools,
	onSortStatus,
	statusSort,
}: ToolInstancesTableProps) {
	const { mutate } = useSWRConfig();
	const [selectedConfig, setSelectedConfig] = useState<Record<
		string,
		unknown
	> | null>(null);

	async function handleStatusChange(tool: ToolInstance, checked: boolean) {
		try {
			const response = await fetch(`/api/tool-instances/${tool.id}`, {
				method: "PUT",
				headers: {
					"Content-Type": "application/json",
				},
				body: JSON.stringify({
					status: checked ? "active" : "inactive",
				}),
			});

			if (!response.ok) {
				throw new Error("Failed to update tool status");
			}

			await mutate(`/api/tool-instances?appId=${tool.appId}`);
			toast.success("Tool status updated successfully");
		} catch (error) {
			console.error("Error updating tool status:", error);
			toast.error("Failed to update tool status");
		}
	}

	return (
		<>
			<div className="rounded-md border">
				<div className="relative">
					<Table>
						<TableHeader className="bg-muted/50">
							<TableRow>
								<TableHead className="w-[250px]">Name</TableHead>
								<TableHead className="w-[400px]">Description</TableHead>
								<TableHead className="w-[120px]">
									<Button
										variant="ghost"
										size="sm"
										onClick={onSortStatus}
										className="-ml-3 h-8 px-2 font-medium"
									>
										Status
										<ArrowUpDown className="ml-2 h-4 w-4" />
										{statusSort && (
											<span className="ml-1 text-xs">({statusSort})</span>
										)}
									</Button>
								</TableHead>
								<TableHead className="w-[100px]">Config</TableHead>
							</TableRow>
						</TableHeader>
					</Table>

					<ScrollArea className="h-[400px]">
						<Table>
							<TableBody>
								{tools.length === 0 ? (
									<TableRow>
										<TableCell
											colSpan={4}
											className="h-[200px] text-center text-muted-foreground"
										>
											<div className="flex items-center justify-center h-full">
												No tool instances found
											</div>
										</TableCell>
									</TableRow>
								) : (
									tools.map((tool) => (
										<TableRow key={tool.id}>
											<TableCell className="w-[250px] font-medium">
												{tool.definition?.toolSchema?.name as string}
											</TableCell>
											<TableCell className="w-[400px]">
												{tool.definition?.toolSchema?.description}
											</TableCell>
											<TableCell className="w-[120px]">
												<Switch
													checked={tool.status === "active"}
													onCheckedChange={(checked) =>
														handleStatusChange(tool, checked)
													}
												/>
											</TableCell>
											<TableCell className="w-[100px]">
												<Button
													variant="ghost"
													size="icon"
													onClick={() => setSelectedConfig(tool.config)}
													disabled={!tool.config}
												>
													<Eye className="h-4 w-4" />
												</Button>
											</TableCell>
										</TableRow>
									))
								)}
							</TableBody>
						</Table>
					</ScrollArea>
				</div>
			</div>

			<Dialog
				open={selectedConfig !== null}
				onOpenChange={() => setSelectedConfig(null)}
			>
				<DialogContent className="max-w-2xl">
					<DialogHeader>
						<DialogTitle>Tool Configuration</DialogTitle>
					</DialogHeader>
					<DialogScrollArea className="max-h-[60vh]">
						<pre className="p-4 rounded bg-muted text-sm">
							{JSON.stringify(selectedConfig, null, 2)}
						</pre>
					</DialogScrollArea>
				</DialogContent>
			</Dialog>
		</>
	);
}
