"use client";

import {
	Card,
	CardHeader,
	CardContent,
	CardFooter,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { MoreVertical, Link, ExternalLink, LayoutGrid } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useRouter } from "next/navigation";
import type { Connection } from "../types";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { updateConnection } from "../hooks/use-connections";

interface ConnectionCardProps {
	connection: Connection;
}

export function ConnectionCard({ connection }: ConnectionCardProps) {
	const router = useRouter();

	const handleCardClick = () => {
		router.push(`/tools/${connection.id}`);
	};

	async function handleStatusChange(checked: boolean) {
		try {
			await updateConnection(connection.id, {
				status: checked ? "active" : "inactive",
			});
			toast.success("Connection status updated successfully");
		} catch (error) {
			console.error("Error updating connection status:", error);
			toast.error("Failed to update connection status");
		}
	}

	return (
		<Card
			className="hover:bg-secondary/50 transition-colors cursor-pointer flex flex-col h-full"
			onClick={handleCardClick}
		>
			<CardHeader className="p-6 flex flex-row items-start justify-between space-y-0">
				<div className="flex flex-col gap-2">
					<div className="flex items-center gap-2">
						<div className="size-8 rounded-lg flex items-center justify-center bg-primary/10">
							<Link className="size-5 text-primary" />
						</div>
						<div className="flex flex-col">
							<span className="font-semibold text-sm">{connection.name}</span>
							<span className="text-xs text-muted-foreground capitalize">
								{connection.kind}
							</span>
						</div>
					</div>
				</div>
				<DropdownMenu>
					<DropdownMenuTrigger asChild>
						<Button variant="ghost" className="size-8 p-0">
							<MoreVertical className="size-4" />
							<span className="sr-only">Open menu</span>
						</Button>
					</DropdownMenuTrigger>
					<DropdownMenuContent align="end">
						<DropdownMenuItem
							onClick={(e) => {
								e.stopPropagation();
								router.push(`/tools/${connection.id}/settings`);
							}}
						>
							Settings
						</DropdownMenuItem>
					</DropdownMenuContent>
				</DropdownMenu>
			</CardHeader>
			<CardContent className="px-6 py-2 space-y-4 flex-grow">
				<p className="text-sm text-muted-foreground">
					{connection.description || "No description available"}
				</p>

				{connection.baseUrl && (
					<div className="flex flex-wrap gap-2">
						<Badge
							variant="outline"
							className="bg-primary/10 text-primary text-xs hover:bg-primary/20"
						>
							{connection.baseUrl}
						</Badge>
					</div>
				)}
			</CardContent>
			<CardFooter className="px-6 py-4 mt-auto border-t border-border/40">
				<div className="flex items-center justify-between w-full text-sm">
					<div className="flex items-center gap-2 text-muted-foreground">
						<span className="text-xs">App ID: {connection.appId}</span>
					</div>
					<div className="flex items-center gap-2">
						<Switch
							checked={connection.status === "active"}
							onCheckedChange={handleStatusChange}
							onClick={(e) => e.stopPropagation()}
							className="data-[state=checked]:bg-primary"
						/>
					</div>
				</div>
			</CardFooter>
		</Card>
	);
}
