"use client";

import { MCPServerCard } from "../components/mcp-server-card";
import { useMCPServers } from "@/app/(core)/hooks/use-mcp-servers";
import { Plus, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";

export default function MCPServersPage() {
	const { servers, count, isLoading } = useMCPServers();

	if (isLoading) {
		return (
			<div className="flex-1 py-6">
				<div className="animate-pulse">
					<div className="mb-8">
						<div className="h-8 w-48 bg-muted rounded mb-2" />
						<div className="h-4 w-64 bg-muted rounded" />
					</div>
					<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
						{[
							"skeleton-1",
							"skeleton-2",
							"skeleton-3",
							"skeleton-4",
							"skeleton-5",
							"skeleton-6",
						].map((skeletonId) => (
							<div
								key={skeletonId}
								className="rounded-lg border bg-card text-card-foreground shadow-sm h-[220px] flex flex-col"
							>
								<div className="flex items-center justify-between p-6 pb-2">
									<div className="flex items-center gap-3">
										<div className="size-10 rounded-lg bg-muted" />
										<div className="h-5 w-32 bg-muted rounded" />
									</div>
									<div className="h-8 w-24 rounded-md bg-muted" />
								</div>
								<div className="p-6 pt-2 flex-1 flex flex-col">
									<div className="space-y-2 flex-1">
										<div className="h-4 w-full bg-muted rounded" />
										<div className="h-4 w-3/4 bg-muted rounded" />
									</div>
									<div className="flex items-center justify-between mt-4">
										<div className="flex gap-2">
											<div className="h-5 w-16 bg-muted rounded-full" />
											<div className="h-5 w-12 bg-muted rounded-full" />
										</div>
										<div className="h-8 w-8 rounded-md bg-muted" />
									</div>
								</div>
							</div>
						))}
					</div>
				</div>
			</div>
		);
	}

	return (
		<div className="flex-1 py-6">
			<div className="mb-8">
				<h1 className="text-2xl font-bold tracking-tight">MCP Servers</h1>
				<p className="text-muted-foreground">
					Manage and monitor your running MCP instances
				</p>
			</div>

			{servers.length === 0 ? (
				<div className="flex flex-col items-center justify-center p-8 text-center border rounded-lg bg-card">
					<div className="size-12 rounded-full bg-primary/10 flex items-center justify-center mb-4">
						<FileText className="size-6 text-primary" />
					</div>
					<h3 className="text-lg font-medium mb-2">No servers available</h3>
					<p className="text-muted-foreground mb-4">
						Browse our templates gallery and pick one to get started with your
						first MCP server.
					</p>
					<Link href="/mcp-templates">
						<Button className="flex items-center gap-2">
							<Plus className="size-4" />
							Choose a Template
						</Button>
					</Link>
				</div>
			) : (
				<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
					{servers.map((server) => (
						<MCPServerCard key={server.id} server={server} />
					))}
				</div>
			)}
		</div>
	);
}
