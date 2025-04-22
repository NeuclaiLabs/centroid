import { useState } from "react";
import { useConnections, deleteConnection } from "../hooks/use-connections";
import { Button } from "@/components/ui/button";
import { Edit, Search, Plus, Pencil, Trash2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import { ErrorState, LoadingState } from "./states";
import type { Connection } from "@/app/(core)/types";
import { toast } from "sonner";

interface ConnectionsTabProps {
	appId: string;
	onEditConnection: (connectionId?: string) => void;
}

export function ConnectionsTab({
	appId,
	onEditConnection,
}: ConnectionsTabProps) {
	const [searchQuery, setSearchQuery] = useState("");
	const { connections, isLoading, error } = useConnections({ appId });

	const filteredConnections = connections.filter(
		(connection) =>
			connection.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
			connection.description?.toLowerCase().includes(searchQuery.toLowerCase()),
	);

	const handleDelete = async (connectionId: string) => {
		try {
			await deleteConnection(connectionId);
			toast.success("Connection deleted successfully");
		} catch (error) {
			toast.error("Failed to delete connection");
		}
	};

	if (isLoading) {
		return <LoadingState />;
	}

	if (error) {
		return <ErrorState />;
	}

	return (
		<div className="border rounded-lg p-6">
			{/* Header section */}
			<div className="flex items-center justify-between mb-6">
				<h3 className="text-xl font-medium">
					Connections
					<span className="ml-2 text-muted-foreground">
						({filteredConnections.length})
					</span>
				</h3>
				<div className="flex items-center gap-4">
					<div className="relative w-[300px]">
						<Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
						<Input
							placeholder="Search connections"
							className="pl-9 h-10 w-full"
							value={searchQuery}
							onChange={(e) => setSearchQuery(e.target.value)}
						/>
					</div>
				</div>
			</div>

			{/* Connections list */}
			<div className="space-y-4">
				{filteredConnections.length === 0 ? (
					<Card>
						<CardHeader>
							<CardTitle>No Connections</CardTitle>
							<CardDescription>
								You haven't created any connections yet.
							</CardDescription>
						</CardHeader>
						<CardContent>
							<Button onClick={() => onEditConnection(undefined)}>
								<Plus className="mr-2 h-4 w-4" />
								Create Connection
							</Button>
						</CardContent>
					</Card>
				) : (
					<div className="grid gap-4">
						{filteredConnections.map((connection) => (
							<Card key={connection.id}>
								<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
									<div>
										<CardTitle className="text-lg">{connection.name}</CardTitle>
										{connection.description && (
											<CardDescription>
												{connection.description}
											</CardDescription>
										)}
									</div>
									<div className="flex items-center space-x-2">
										<Button
											variant="ghost"
											size="icon"
											onClick={() => onEditConnection(connection.id)}
										>
											<Pencil className="h-4 w-4" />
										</Button>
										<Button
											variant="ghost"
											size="icon"
											onClick={() => handleDelete(connection.id)}
										>
											<Trash2 className="h-4 w-4" />
										</Button>
									</div>
								</CardHeader>
								<CardContent>
									<div className="text-sm text-muted-foreground">
										<div>Base URL: {connection.baseUrl || "Not set"}</div>
										<div>Auth Type: {connection.auth?.type || "None"}</div>
									</div>
								</CardContent>
							</Card>
						))}
					</div>
				)}
			</div>
		</div>
	);
}
