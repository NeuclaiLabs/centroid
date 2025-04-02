"use client";

import { useCallback, useState } from "react";
import { toast } from "sonner";
import useSWR from "swr";

import { Button } from "@/components/ui/button";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
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
import { ConnectionCard } from "@/components/connection-card";
import { ConnectionForm } from "@/components/connection-form";
import {
	createConnection,
	deleteConnection,
	getConnections,
	updateConnection,
} from "./actions";
import type { Connection, ConnectionCreate, ConnectionUpdate } from "./types";
import { ChatHeader } from "@/components/chat-header";
import { SidebarToggle } from "@/components/sidebar-toggle";
import {
	Card,
	CardHeader,
	CardContent,
	CardFooter,
} from "@/components/ui/card";
import { Plus } from "lucide-react";
import { integrationRegistry } from "@/lib/registry";

// Map integration registry to connections format for display
const registryConnections: Connection[] = Object.entries(
	integrationRegistry,
).map(([key, integration]) => ({
	id: integration.id,
	name: integration.name,
	type: key as keyof typeof integrationRegistry,
	description: integration.description,
	apiKey: "***************************",
	status: "active",
	created_at: new Date().toISOString(),
	updated_at: new Date().toISOString(),
	kind: integration.category.toLowerCase(),
	base_url: integration.docsUrl,
}));

export default function ConnectionsPage() {
	const [isFormOpen, setIsFormOpen] = useState(false);
	const [isSubmitting, setIsSubmitting] = useState(false);
	const [selectedConnection, setSelectedConnection] =
		useState<Connection | null>(null);
	const [connectionToDelete, setConnectionToDelete] =
		useState<Connection | null>(null);

	const { data, mutate } = useSWR("/api/connections", getConnections);

	const handleCreate = useCallback(
		async (formData: ConnectionCreate) => {
			try {
				setIsSubmitting(true);
				await createConnection(formData);
				await mutate();
				setIsFormOpen(false);
				toast.success("Connection created successfully");
			} catch (error) {
				toast.error("Failed to create connection");
			} finally {
				setIsSubmitting(false);
			}
		},
		[mutate],
	);

	const handleUpdate = useCallback(
		async (formData: ConnectionUpdate) => {
			if (!selectedConnection) return;

			try {
				setIsSubmitting(true);
				await updateConnection(selectedConnection.id, formData);
				await mutate();
				setSelectedConnection(null);
				toast.success("Connection updated successfully");
			} catch (error) {
				toast.error("Failed to update connection");
			} finally {
				setIsSubmitting(false);
			}
		},
		[selectedConnection, mutate],
	);

	const handleDelete = useCallback(async () => {
		if (!connectionToDelete) return;

		try {
			await deleteConnection(connectionToDelete.id);
			await mutate();
			setConnectionToDelete(null);
			toast.success("Connection deleted successfully");
		} catch (error) {
			toast.error("Failed to delete connection");
		}
	}, [connectionToDelete, mutate]);

	return (
		<>
			<div className="flex-1">
				{/* <p className="text-muted-foreground mb-8">
						Manage your API connections and integrations
					</p> */}

				<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
					{/* <Card
							key="create"
							onClick={() => setIsFormOpen(true)}
							className="cursor-pointer hover:bg-secondary/50 transition-colors"
						>
							<CardHeader className="p-6 flex flex-row items-center justify-between space-y-0">
								<Button
									variant="ghost"
									className="size-8 rounded-full bg-secondary flex items-center justify-center p-0"
								>
									<Plus className="size-4" />
								</Button>
							</CardHeader>
							<CardContent className="px-6 py-2">
								<h3 className="font-semibold text-lg leading-none mb-1">
									Create Connection
								</h3>
							</CardContent>
							<CardFooter className="px-6">
								<h3 className="text-sm text-primary/50">
									Add a new API connection
								</h3>
							</CardFooter>
						</Card> */}

					{(data?.data || registryConnections).map((connection) => (
						<ConnectionCard
							key={connection.id}
							connection={connection}
							onEdit={setSelectedConnection}
							onDelete={setConnectionToDelete}
						/>
					))}
				</div>
			</div>

			<Dialog
				open={isFormOpen || !!selectedConnection}
				onOpenChange={(open) => {
					if (!open) {
						setIsFormOpen(false);
						setSelectedConnection(null);
					}
				}}
			>
				<DialogContent>
					<DialogHeader>
						<DialogTitle>
							{selectedConnection ? "Edit Connection" : "Add Connection"}
						</DialogTitle>
						<DialogDescription>
							{selectedConnection
								? "Update your connection details below"
								: "Add a new API connection to your workspace"}
						</DialogDescription>
					</DialogHeader>
					<ConnectionForm
						initialData={selectedConnection ?? undefined}
						onSubmit={selectedConnection ? handleUpdate : handleCreate}
						isSubmitting={isSubmitting}
					/>
				</DialogContent>
			</Dialog>
			<AlertDialog
				open={!!connectionToDelete}
				onOpenChange={(open) => !open && setConnectionToDelete(null)}
			>
				<AlertDialogContent>
					<AlertDialogHeader>
						<AlertDialogTitle>Are you sure?</AlertDialogTitle>
						<AlertDialogDescription>
							This action cannot be undone. This will permanently delete the
							connection and remove its data from our servers.
						</AlertDialogDescription>
					</AlertDialogHeader>
					<AlertDialogFooter>
						<AlertDialogCancel>Cancel</AlertDialogCancel>
						<AlertDialogAction onClick={handleDelete}>Delete</AlertDialogAction>
					</AlertDialogFooter>
				</AlertDialogContent>
			</AlertDialog>
		</>
	);
}
