"use client";

import { appRegistry } from "@/lib/registry";
import { AppCard } from "./components/app-card";

export default function AppsPage() {
	return (
		<div className="flex-1 p-6">
			<div className="mb-8">
				<h1 className="text-2xl font-bold tracking-tight">Available Apps</h1>
				<p className="text-muted-foreground">
					Browse and connect with your favorite apps and services
				</p>
			</div>

			<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
				{Object.values(appRegistry).map((app) => (
					<AppCard key={app.id} app={app} />
				))}
			</div>
		</div>
	);
}
