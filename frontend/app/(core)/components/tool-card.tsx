"use client";

import {
	Card,
	CardHeader,
	CardContent,
	CardFooter,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { MoreVertical, Wrench } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useRouter } from "next/navigation";
import type { ToolInstance } from "../types";
import { Switch } from "@/components/ui/switch";
import { useSWRConfig } from "swr";
import { toast } from "sonner";

interface ToolCardProps {
	tool: ToolInstance;
}

export function ToolCard({ tool }: ToolCardProps) {
	const router = useRouter();
	const { mutate } = useSWRConfig();

	const handleCardClick = () => {
		router.push(`/tools/${tool.id}`);
	};

	async function handleStatusChange(checked: boolean) {
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

			await mutate("/api/tool-instances");
			toast.success("Tool status updated successfully");
		} catch (error) {
			console.error("Error updating tool status:", error);
			toast.error("Failed to update tool status");
		}
	}

	const toolName = tool.definition.toolMetadata?.name || "Unnamed Tool";
	const toolDescription =
		tool.definition.toolMetadata?.description || "No description available";
	const toolTags = tool.definition.toolMetadata?.tags || [];

	return (
		<Card
			className="hover:bg-secondary/50 transition-colors cursor-pointer flex flex-col h-full"
			onClick={handleCardClick}
		>
			<CardHeader className="p-6 flex flex-row items-start justify-between space-y-0">
				<div className="flex flex-col gap-2">
					<div className="flex items-center gap-2">
						<div className="size-8 rounded-lg flex items-center justify-center bg-primary/10">
							<Wrench className="size-5 text-primary" />
						</div>
						<div className="flex flex-col">
							<span className="font-semibold text-sm">{toolName}</span>
							<span className="text-xs text-muted-foreground capitalize">
								{tool.status}
							</span>
						</div>
					</div>
				</div>
				<DropdownMenu>
					<DropdownMenuTrigger asChild>
						<Button
							variant="ghost"
							className="size-8 p-0"
							onClick={(e) => e.stopPropagation()}
						>
							<MoreVertical className="size-4" />
							<span className="sr-only">Open menu</span>
						</Button>
					</DropdownMenuTrigger>
					<DropdownMenuContent align="end">
						<DropdownMenuItem
							onClick={(e) => {
								e.stopPropagation();
								router.push(`/tools/${tool.id}/settings`);
							}}
						>
							Settings
						</DropdownMenuItem>
					</DropdownMenuContent>
				</DropdownMenu>
			</CardHeader>
			<CardContent className="px-6 py-2 space-y-4 flex-grow">
				<p className="text-sm text-muted-foreground">{toolDescription}</p>

				<div className="flex flex-wrap gap-2">
					{toolTags.slice(0, 3).map((tag) => (
						<Badge
							key={tag}
							variant="outline"
							className="bg-primary/10 text-primary text-xs hover:bg-primary/20"
						>
							{tag}
						</Badge>
					))}
				</div>
			</CardContent>
			<CardFooter className="px-6 py-4 mt-auto border-t border-border/40">
				<div className="flex items-center justify-between w-full text-sm">
					<div className="flex items-center gap-2 text-muted-foreground">
						<span className="text-xs">App ID: {tool.appId}</span>
					</div>
					<Switch
						checked={tool.status === "active"}
						onCheckedChange={handleStatusChange}
						onClick={(e) => e.stopPropagation()}
					/>
				</div>
			</CardFooter>
		</Card>
	);
}
