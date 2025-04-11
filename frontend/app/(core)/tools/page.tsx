"use client";

import { appRegistry } from "@/lib/registry";
import { AppCard } from "../components/app-card";
import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";
import { useState } from "react";
import { LoadingState } from "../components/states";
import { ErrorState } from "../components/states";
import { useConnections } from "../hooks/use-connections";
import { ConnectionCard } from "../components/connection-card";
import { CreateConnectionCard } from "../components/create-connection-card";

export default function AppsPage() {
	const [searchQuery, setSearchQuery] = useState("");
	const { connections, isLoading, error } = useConnections();

	const filteredConnections =
		connections?.filter((connection) => {
			const query = searchQuery.toLowerCase().trim();
			if (!query) return true;

			const name = connection.name.toLowerCase();
			const description = (connection.description || "").toLowerCase();
			return name.includes(query) || description.includes(query);
		}) || [];

	if (isLoading) {
		return <LoadingState />;
	}

	if (error) {
		return <ErrorState />;
	}
	return (
		<div className="flex-1 p-6">
			<div className="mb-8">
				<h1 className="text-2xl font-bold tracking-tight">Tool Collections</h1>
				<p className="text-muted-foreground">
					Manage and configure your active tool connections
				</p>
			</div>

			<div className="mb-6">
				<div className="relative w-full max-w-md">
					<Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
					<Input
						placeholder="Search connections"
						className="pl-9 h-10 w-full"
						value={searchQuery}
						onChange={(e) => setSearchQuery(e.target.value)}
					/>
				</div>
			</div>

			<div className="max-w-7xl mx-auto">
				<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
					<CreateConnectionCard />
					{filteredConnections.map((connection) => (
						<ConnectionCard key={connection.id} connection={connection} />
					))}
				</div>
			</div>
		</div>
	);
}
