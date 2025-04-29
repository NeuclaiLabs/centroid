"use client";

import useSWR from "swr";
import { useParams } from "next/navigation";
import { MCPInstance } from "@/lib/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Play, StopCircle } from "lucide-react";

export default function MCPInstancePage() {
	const { id } = useParams();
	const { data: instance, isLoading } = useSWR<MCPInstance>(
		`/api/mcp-instances/${id}`,
		async (url) => {
			const response = await fetch(url);
			if (!response.ok) {
				throw new Error("Failed to fetch MCP instance");
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
					<div className="h-96 bg-muted rounded" />
				</div>
			</div>
		);
	}

	if (!instance) {
		return (
			<div className="flex-1 p-6">
				<div className="text-center">
					<h1 className="text-2xl font-bold tracking-tight">
						Instance not found
					</h1>
					<p className="text-muted-foreground">
						The MCP instance you're looking for doesn't exist or you don't have
						access to it.
					</p>
				</div>
			</div>
		);
	}

	return (
		<div className="flex-1 p-6">
			<div className="mb-8">
				<div className="flex items-center justify-between">
					<div>
						<h1 className="text-2xl font-bold tracking-tight">
							{instance.name}
						</h1>
						<p className="text-muted-foreground">{instance.description}</p>
					</div>
					<Button
						variant="default"
						size="sm"
						className={
							instance.status === "running"
								? "bg-destructive hover:bg-destructive/90"
								: "bg-success hover:bg-success/90"
						}
					>
						{instance.status === "running" ? (
							<>
								<StopCircle className="mr-2 h-4 w-4" />
								Stop Instance
							</>
						) : (
							<>
								<Play className="mr-2 h-4 w-4" />
								Start Instance
							</>
						)}
					</Button>
				</div>
			</div>

			<div className="grid gap-4 md:grid-cols-2">
				<Card>
					<CardHeader>
						<CardTitle className="text-sm font-medium">
							Instance Details
						</CardTitle>
					</CardHeader>
					<CardContent>
						<dl className="space-y-2">
							<div className="flex justify-between">
								<dt className="text-sm text-muted-foreground">Status</dt>
								<dd>
									<Badge
										variant={
											instance.status === "running" ? "success" : "secondary"
										}
									>
										{instance.status}
									</Badge>
								</dd>
							</div>
							<div className="flex justify-between">
								<dt className="text-sm text-muted-foreground">Created At</dt>
								<dd className="text-sm">{instance.created_at}</dd>
							</div>
							<div className="flex justify-between">
								<dt className="text-sm text-muted-foreground">Instance ID</dt>
								<dd className="text-sm font-mono">{instance.id}</dd>
							</div>
						</dl>
					</CardContent>
				</Card>

				<Card>
					<CardHeader>
						<CardTitle className="text-sm font-medium">Actions</CardTitle>
					</CardHeader>
					<CardContent>
						<div className="space-y-2">
							<Button variant="outline" className="w-full justify-start">
								Edit Instance
							</Button>
							<Button
								variant="outline"
								className="w-full justify-start text-destructive"
							>
								Delete Instance
							</Button>
						</div>
					</CardContent>
				</Card>
			</div>
		</div>
	);
}
