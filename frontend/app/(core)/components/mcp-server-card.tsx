import {
	Card,
	CardContent,
	CardHeader,
	CardTitle,
	CardFooter,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Play, StopCircle, Plus } from "lucide-react";
import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { MCPServer } from "@/app/(core)/hooks/use-mcp-servers";
import Link from "next/link";
import { getMCPTemplateById, MCPTemplateKind } from "@/lib/mcp-templates";
import { cn } from "@/lib/utils";
import { useState } from "react";
import { useRouter } from "next/navigation";
import {
	AlertDialog,
	AlertDialogAction,
	AlertDialogCancel,
	AlertDialogContent,
	AlertDialogDescription,
	AlertDialogFooter,
	AlertDialogHeader,
	AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { toast } from "sonner";
import { useMCPServers } from "@/app/(core)/hooks/use-mcp-servers";
import { MCPServerConnectionModal } from "./mcp-server-connection-modal";

interface MCPServerCardProps {
	server: MCPServer;
}

export function MCPServerCard({ server }: MCPServerCardProps) {
	const [isDeleting, setIsDeleting] = useState(false);
	const [isTogglingStatus, setIsTogglingStatus] = useState(false);
	const [showDeleteDialog, setShowDeleteDialog] = useState(false);
	const [showConnectModal, setShowConnectModal] = useState(false);
	const router = useRouter();
	const { toggleServerStatus, deleteServer } = useMCPServers();

	const template = server.templateId
		? getMCPTemplateById(server.templateId)
		: undefined;
	const icon = template?.metadata?.icon;
	const isOfficial = template?.kind === MCPTemplateKind.OFFICIAL;

	const handleDelete = async (e: React.MouseEvent) => {
		e.preventDefault();
		setShowDeleteDialog(false);

		try {
			setIsDeleting(true);
			await deleteServer(server.id);
		} finally {
			setIsDeleting(false);
		}
	};

	const handleToggleStatus = async (e: React.MouseEvent) => {
		e.preventDefault();
		if (isTogglingStatus) return;

		try {
			setIsTogglingStatus(true);
			await toggleServerStatus(server.id);
		} finally {
			setIsTogglingStatus(false);
		}
	};

	const handleConnectClick = (e: React.MouseEvent) => {
		e.preventDefault();
		setShowConnectModal(true);
	};

	return (
		<>
			<Link href={`/mcp-servers/${server.id}`}>
				<Card className="hover:bg-muted/50 transition-colors h-full flex flex-col">
					<CardHeader className="p-6 flex flex-row items-start justify-between space-y-0">
						<div className="flex flex-col gap-2">
							<div className="flex items-center gap-2">
								{icon && (
									<div className="size-8 rounded-lg flex items-center justify-center bg-primary/10">
										<svg
											role="img"
											viewBox="0 0 24 24"
											className="size-5 text-primary"
											fill="currentColor"
											aria-label={`${server.name} icon`}
										>
											<path d={icon.path} />
										</svg>
									</div>
								)}
								<div className="flex flex-col">
									<div className="flex items-center gap-1">
										<span className="font-semibold text-sm">{server.name}</span>
										{isOfficial && (
											<div className="relative h-4 w-4">
												<svg
													viewBox="0 0 22 22"
													className="size-4 text-blue-500"
													fill="currentColor"
													aria-labelledby="verified-badge-title-server"
												>
													<title id="verified-badge-title-server">
														Verified Official Server
													</title>
													<path d="M20.396 11c-.018-.646-.215-1.275-.57-1.816-.354-.54-.852-.972-1.438-1.246.223-.607.27-1.264.14-1.897-.131-.634-.437-1.218-.882-1.687-.47-.445-1.053-.75-1.687-.882-.633-.13-1.29-.083-1.897.14-.273-.587-.704-1.086-1.245-1.44S11.647 1.62 11 1.604c-.646.017-1.273.213-1.813.568s-.969.854-1.24 1.44c-.608-.223-1.267-.272-1.902-.14-.635.13-1.22.436-1.69.882-.445.47-.749 1.055-.878 1.688-.13.633-.08 1.29.144 1.896-.587.274-1.087.705-1.443 1.245-.356.54-.555 1.17-.574 1.817.02.647.218 1.276.574 1.817.356.54.856.972 1.443 1.245-.224.606-.274 1.263-.144 1.896.13.634.433 1.218.877 1.688.47.443 1.054.747 1.687.878.633.132 1.29.084 1.897-.136.274.586.705 1.084 1.246 1.439.54.354 1.17.551 1.816.569.647-.016 1.276-.213 1.817-.567s.972-.854 1.245-1.44c.604.239 1.266.296 1.903.164.636-.132 1.22-.447 1.68-.907.46-.46.776-1.044.908-1.681s.075-1.299-.165-1.903c.586-.274 1.084-.705 1.439-1.246.354-.54.551-1.17.569-1.816zM9.662 14.85l-3.429-3.428 1.293-1.302 2.072 2.072 4.4-4.794 1.347 1.246z" />
												</svg>
											</div>
										)}
									</div>
									{template && (
										<span className="text-xs text-muted-foreground">
											{template.kind !== MCPTemplateKind.OFFICIAL
												? `${template.kind} • v${server.version}`
												: `v${server.version}`}
										</span>
									)}
								</div>
							</div>
						</div>
						<Button
							variant="outline"
							size="sm"
							className="flex items-center gap-1"
							onClick={handleConnectClick}
						>
							<Plus className="h-3.5 w-3.5" />
							Connect
						</Button>
					</CardHeader>
					<CardContent className="px-6 py-2 flex-grow">
						<p className="text-sm text-muted-foreground line-clamp-2">
							{server.description}
						</p>
					</CardContent>
					<CardFooter className="px-6 py-2 mt-auto border-t border-border/40 flex items-center justify-between">
						<div className="flex items-center gap-2">
							<div
								className={cn(
									"size-2 rounded-full",
									server.status === "active" ? "bg-green-500" : "bg-yellow-500",
								)}
								aria-hidden="true"
							/>
							<span className="text-xs capitalize text-muted-foreground">
								{server.status}
							</span>
						</div>
						<Button
							variant="ghost"
							size="sm"
							className={
								server.status === "active" ? "text-destructive" : "text-success"
							}
							onClick={handleToggleStatus}
							disabled={isTogglingStatus}
						>
							{isTogglingStatus ? (
								<span className="size-3.5 border-2 border-current border-r-transparent rounded-full animate-spin" />
							) : server.status === "active" ? (
								<StopCircle className="h-3.5 w-3.5" />
							) : (
								<Play className="h-3.5 w-3.5" />
							)}
						</Button>
					</CardFooter>
				</Card>
			</Link>

			<MCPServerConnectionModal
				isOpen={showConnectModal}
				onOpenChange={setShowConnectModal}
				server={server}
			/>

			<AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
				<AlertDialogContent>
					<AlertDialogHeader>
						<AlertDialogTitle>Are you sure?</AlertDialogTitle>
						<AlertDialogDescription>
							This will permanently delete the MCP server &quot;{server.name}
							&quot;. This action cannot be undone.
						</AlertDialogDescription>
					</AlertDialogHeader>
					<AlertDialogFooter>
						<AlertDialogCancel>Cancel</AlertDialogCancel>
						<AlertDialogAction
							onClick={handleDelete}
							className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
						>
							Delete
						</AlertDialogAction>
					</AlertDialogFooter>
				</AlertDialogContent>
			</AlertDialog>
		</>
	);
}
