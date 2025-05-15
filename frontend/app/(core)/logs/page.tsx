"use client";

import { Suspense } from "react";
import { LogViewer } from "@/app/(core)/components/log-viewer";
import { Loader2 } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

// Simple loader component
function LogsLoader() {
	return (
		<div className="flex items-center justify-center h-48">
			<div className="flex flex-col items-center gap-2">
				<Loader2 className="h-8 w-8 animate-spin text-primary" />
				<p className="text-sm text-muted-foreground">Loading logs...</p>
			</div>
		</div>
	);
}

export default function LogsPage() {
	return (
		<div className="container py-6 space-y-6">
			<div className="flex flex-col">
				<h1 className="text-3xl font-bold tracking-tight">Application Logs</h1>
				<p className="text-muted-foreground">
					Monitor and analyze system activity with user-friendly controls
				</p>
			</div>

			<Suspense fallback={<LogsLoader />}>
				<Card className="border-none shadow-none">
					<CardContent className="p-0">
						<LogViewer
							initialLogFile="app.log"
							maxHeight="75vh"
							initialMaxLines={200}
						/>
					</CardContent>
				</Card>
			</Suspense>
		</div>
	);
}
