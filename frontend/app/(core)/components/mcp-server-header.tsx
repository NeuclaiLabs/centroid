"use client";

import { useState } from "react";
import type { MCPServer } from "@/app/(core)/types";
import { MCPTemplateKind } from "@/app/(core)/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
	Play,
	StopCircle,
	Pencil,
	Trash2,
	AlertCircle,
	MoreVertical,
	Plus,
} from "lucide-react";
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
import type { SimpleIcon } from "simple-icons";
import { MCPServerConnectionModal } from "./mcp-server-connection-modal";
import { cn } from "@/lib/utils";

interface MCPServerHeaderProps {
	server: MCPServer;
	onStartStop: () => Promise<void>;
	onEdit: () => void;
	onDelete: () => Promise<void>;
}

export function MCPServerHeader({
	server,
	onStartStop,
	onEdit,
	onDelete,
}: MCPServerHeaderProps) {
	const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
	const [isDeleting, setIsDeleting] = useState(false);
	const [showConnectModal, setShowConnectModal] = useState(false);
	const [isStartingOrStopping, setIsStartingOrStopping] = useState(false);

	const template = server.template;
	const icon = template?.details?.icon as SimpleIcon;

	const getStateClassNames = (state?: string): string => {
		const defaultClasses = "capitalize";
		switch (state) {
			case "running":
				return `${defaultClasses} bg-green-100 text-green-700 border-green-200 dark:bg-green-900/50 dark:text-green-300 dark:border-green-700`;
			case "pending":
			case "initializing":
			case "restarting":
				return `${defaultClasses} bg-yellow-100 text-yellow-700 border-yellow-200 dark:bg-yellow-900/50 dark:text-yellow-300 dark:border-yellow-700`;
			case "stopping":
			case "stopped":
				return `${defaultClasses} bg-gray-100 text-gray-700 border-gray-200 dark:bg-gray-700/50 dark:text-gray-300 dark:border-gray-600`;
			case "disconnected":
			case "error":
				return `${defaultClasses} bg-red-100 text-red-700 border-red-200 dark:bg-red-900/50 dark:text-red-300 dark:border-red-700`;
			default:
				return `${defaultClasses} bg-gray-100 text-gray-700 border-gray-200 dark:bg-gray-700/50 dark:text-gray-300 dark:border-gray-600`;
		}
	};

	const handleDeleteConfirm = async () => {
		try {
			setIsDeleting(true);
			await onDelete();
			// The parent component handles redirection or state update
		} catch (error) {
			console.error("Error initiating delete:", error);
			// Optionally show an error to the user
			setIsDeleting(false); // Keep dialog open on error maybe? Or parent handles?
		}
		// No finally block to set isDeleting false, parent handles dialog closing
	};

	const handleStartStop = async () => {
		try {
			setIsStartingOrStopping(true);
			await onStartStop();
		} catch (error) {
			console.error("Error starting/stopping server:", error);
		} finally {
			setIsStartingOrStopping(false);
		}
	};

	return (
		<>
			<Card>
				<CardHeader className="flex flex-row items-center justify-between space-y-0">
					<div className="flex items-center gap-4">
						{icon && (
							<div className="size-12 rounded-lg flex items-center justify-center bg-primary/10">
								<svg
									role="img"
									viewBox="0 0 24 24"
									className="size-6 text-primary"
									fill="currentColor"
									aria-label={`${template?.name || server.name} icon`}
								>
									{Array.isArray(template?.details?.icon) ? (
										template?.details?.icon.map((p) => (
											<path key={`path-${p.d.substring(0, 8)}`} d={p.d} />
										))
									) : (
										<path d={template?.details?.icon?.path} />
									)}
								</svg>
							</div>
						)}

						<div>
							<CardTitle className="text-2xl font-bold flex items-center">
								{server.name}
								{template?.kind === MCPTemplateKind.OFFICIAL && (
									<span className="inline-flex ml-2 items-center">
										<div className="relative h-5 w-5">
											<svg
												viewBox="0 0 22 22"
												className="size-5 text-blue-500"
												fill="currentColor"
												aria-labelledby="verified-badge-title-server"
											>
												<title id="verified-badge-title-server">
													Verified Official Template
												</title>
												<path d="M20.396 11c-.018-.646-.215-1.275-.57-1.816-.354-.54-.852-.972-1.438-1.246.223-.607.27-1.264.14-1.897-.131-.634-.437-1.218-.882-1.687-.47-.445-1.053-.75-1.687-.882-.633-.13-1.29-.083-1.897.14-.273-.587-.704-1.086-1.245-1.44S11.647 1.62 11 1.604c-.646.017-1.273.213-1.813.568s-.969.854-1.24 1.44c-.608-.223-1.267-.272-1.902-.14-.635.13-1.22.436-1.69.882-.445.47-.749 1.055-.878 1.688-.13.633-.08 1.29.144 1.896-.587.274-1.087.705-1.443 1.245-.356.54-.555 1.17-.574 1.817.02.647.218 1.276.574 1.817.356.54.856.972 1.443 1.245-.224.606-.274 1.263-.144 1.896.13.634.433 1.218.877 1.688.47.443 1.054.747 1.687.878.633.132 1.29.084 1.897-.136.274.586.705 1.084 1.246 1.439.54.354 1.17.551 1.816.569.647-.016 1.276-.213 1.817-.567s.972-.854 1.245-1.44c.604.239 1.266.296 1.903.164.636-.132 1.22-.447 1.68-.907.46-.46.776-1.044.908-1.681s.075-1.299-.165-1.903c.586-.274 1.084-.705 1.439-1.246.354-.54.551-1.17.569-1.816zM9.662 14.85l-3.429-3.428 1.293-1.302 2.072 2.072 4.4-4.794 1.347 1.246z" />
											</svg>
										</div>
									</span>
								)}
							</CardTitle>
							<p className="text-sm text-muted-foreground mt-1">
								{server.description}
							</p>
						</div>
					</div>

					<div className="flex gap-2">
						<Button
							variant="outline"
							className="h-8 px-3 flex items-center gap-1"
							onClick={() => setShowConnectModal(true)}
						>
							<Plus className="h-3.5 w-3.5" />
							Connect
						</Button>

						<DropdownMenu>
							<DropdownMenuTrigger asChild>
								<Button variant="outline" size="icon" className="h-8 w-8">
									<MoreVertical className="h-4 w-4" />
								</Button>
							</DropdownMenuTrigger>
							<DropdownMenuContent align="end">
								{/* <DropdownMenuItem onClick={onEdit}>
									<Pencil className="mr-2 h-4 w-4" />
									<span>Edit Server</span>
								</DropdownMenuItem> */}
								<DropdownMenuItem
									onClick={handleStartStop}
									disabled={isStartingOrStopping}
									className={
										server.state === "running"
											? "text-destructive focus:text-destructive"
											: "text-green-600 focus:text-green-600"
									}
								>
									{isStartingOrStopping ? (
										<>Loading...</>
									) : server.state === "running" ? (
										<>
											<StopCircle className="mr-2 h-4 w-4" />
											Stop Server
										</>
									) : (
										<>
											<Play className="mr-2 h-4 w-4" />
											Start Server
										</>
									)}
								</DropdownMenuItem>
								<DropdownMenuSeparator />
								<DropdownMenuItem
									className="text-destructive focus:text-destructive"
									onClick={() => setIsDeleteDialogOpen(true)}
								>
									<Trash2 className="mr-2 h-4 w-4" />
									<span>Delete Server</span>
								</DropdownMenuItem>
							</DropdownMenuContent>
						</DropdownMenu>
					</div>
				</CardHeader>
				<CardContent>
					<div className="flex items-center justify-between">
						<div className="flex items-center gap-2">
							{server.version && (
								<Badge variant="outline">v{server.version}</Badge>
							)}
							{server.kind && server.kind !== "official" && (
								<Badge variant="secondary">{server.kind}</Badge>
							)}
							<Badge
								variant="outline"
								className={cn(
									"px-2 py-0.5 text-xs",
									getStateClassNames(server.state),
								)}
							>
								{server.state || "initializing"}
							</Badge>
						</div>
					</div>
				</CardContent>
			</Card>

			<MCPServerConnectionModal
				isOpen={showConnectModal}
				onOpenChange={setShowConnectModal}
				server={server}
			/>

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
							onClick={handleDeleteConfirm}
							disabled={isDeleting}
						>
							{isDeleting ? "Deleting..." : "Delete Server"}
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>
		</>
	);
}
