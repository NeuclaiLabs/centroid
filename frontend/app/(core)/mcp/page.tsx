"use client";

import useSWR from "swr";
import { MCPInstanceCard } from "../components/mcp-instance-card";
import type { MCPInstance } from "@/lib/types";

interface MCPInstancesResponse {
	data: MCPInstance[];
	count: number;
}

export default function MCPInstancesPage() {
	const { data: mcpInstances, isLoading } = useSWR<MCPInstancesResponse>(
		"/api/mcp-instances",
		async (url) => {
			const response = await fetch(url);
			if (!response.ok) {
				throw new Error("Failed to fetch MCP instances");
			}
			return response.json();
		},
	);

	if (isLoading) {
		return (
			<div className="flex-1 p-6">
				<div className="animate-pulse">
					<div className="h-8 w-48 bg-muted rounded mb-4" />
					<div className="h-4 w-64 bg-muted rounded mb-8" />
					<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
						{[...Array(6)].map((_, i) => (
							<div key={`skeleton-${i}`} className="h-48 bg-muted rounded" />
						))}
					</div>
				</div>
			</div>
		);
	}

	return (
		<div className="flex-1 p-6">
			<div className="mb-8">
				<h1 className="text-2xl font-bold tracking-tight">MCP Instances</h1>
				<p className="text-muted-foreground">
					Manage and monitor your running MCP instances
				</p>
			</div>

			{/* <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
				{mcpInstances?.data.map((instance) => (
					<MCPInstanceCard key={instance.id} instance={instance} />
				))}
			</div> */}
		</div>
	);
}
