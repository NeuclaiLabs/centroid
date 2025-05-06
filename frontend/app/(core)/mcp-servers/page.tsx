"use client";

import { MCPServerCard } from "../components/mcp-server-card";
import { useMCPServers } from "@/app/(core)/hooks/use-mcp-servers";
import { Plus, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import {
	Card,
	CardHeader,
	CardContent,
	CardFooter,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

// Predefined skeleton keys
const SKELETON_KEYS = [
	"mcp-skeleton-a",
	"mcp-skeleton-b",
	"mcp-skeleton-c",
	// "mcp-skeleton-d",
	// "mcp-skeleton-e",
	// "mcp-skeleton-f",
];

export default function MCPServersPage() {
	const { servers, count, isLoading } = useMCPServers();

	return (
		<div className="flex-1 py-6">
			<div className="mb-8">
				<h1 className="text-2xl font-bold tracking-tight">MCP Servers</h1>
				<p className="text-muted-foreground">
					Manage and monitor your running MCP instances
				</p>
			</div>

			<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
				{isLoading ? (
					<>
						{SKELETON_KEYS.map((key) => (
							<Card
								key={key}
								className="hover:shadow-md transition-shadow flex flex-col h-full cursor-pointer"
							>
								<CardHeader className="p-6 flex flex-row items-start justify-between space-y-0">
									<div className="flex flex-col gap-2">
										<div className="flex items-center gap-2">
											<Skeleton className="size-8 rounded-lg" />
											<div className="flex flex-col">
												<div className="flex items-center gap-1">
													<Skeleton className="h-4 w-24" />
													<Skeleton className="h-4 w-4 rounded-full" />
												</div>
												<Skeleton className="h-3 w-16 mt-1" />
											</div>
										</div>
									</div>
									<Skeleton className="h-9 w-24" />
								</CardHeader>
								<CardContent className="px-6 py-2 space-y-4 flex-grow">
									<div className="space-y-1.5">
										<Skeleton className="h-4 w-full" />
										<Skeleton className="h-4 w-5/6" />
										<Skeleton className="h-4 w-4/6" />
									</div>
								</CardContent>
								<CardFooter className="px-6 py-4 mt-auto border-t border-border/40">
									<div className="flex items-center justify-between w-full text-sm">
										<div className="flex items-center gap-2">
											<Skeleton className="h-3 w-3" />
											<Skeleton className="h-4 w-16" />
										</div>
										<div className="flex items-center gap-1">
											<Skeleton className="h-3 w-3" />
											<Skeleton className="h-4 w-20" />
										</div>
									</div>
								</CardFooter>
							</Card>
						))}
					</>
				) : servers.length === 0 ? (
					<div className="col-span-full flex flex-col items-center justify-center p-8 text-center border rounded-lg bg-card">
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
					<>
						{servers.map((server) => (
							<MCPServerCard key={server.id} server={server} />
						))}
					</>
				)}
			</div>
		</div>
	);
}
