"use client";

import { useState, use } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AppHeader } from "../components/app-header";
import { OverviewTab } from "../components/overview-tab";
import { SettingsTab } from "../components/settings-tab";
import { SchemaDialog } from "../components/schema-dialog";
import { ConnectionDialog } from "@/app/(core)/apps/components/connection-form";
import { ConnectionsTab } from "../components/connections-tab";
import type { ToolDefinition } from "../../types";

interface PageProps {
	params: Promise<{ id: string }>;
}

export default function ConnectionPage({ params }: PageProps) {
	const { id } = use(params);
	const [isFormOpen, setIsFormOpen] = useState(false);
	const [isSchemaOpen, setIsSchemaOpen] = useState(false);
	const [selectedTool, setSelectedTool] = useState<ToolDefinition | null>(null);
	const [selectedConnectionId, setSelectedConnectionId] = useState<string>();

	const handleOpenSchema = (tool: ToolDefinition) => {
		setSelectedTool(tool);
		setIsSchemaOpen(true);
	};

	const handleOpenConnectionForm = (connectionId?: string) => {
		setSelectedConnectionId(connectionId);
		setIsFormOpen(true);
	};

	return (
		<div className="flex flex-col">
			{/* Header takes its natural height */}
			<div className="flex-shrink-0 px-6 pt-6">
				<AppHeader appId={id} onConnect={handleOpenConnectionForm} />
			</div>

			{/* Main content area fills available space */}
			<div className="flex-1 px-6 mt-8 min-h-0">
				<div className="mx-auto w-[1000px] max-w-[90vw] h-full">
					<Tabs defaultValue="overview" className="flex flex-col h-full">
						<TabsList className="flex-shrink-0 mb-4 w-fit">
							<TabsTrigger value="overview">Overview</TabsTrigger>
							<TabsTrigger value="connections">Connections</TabsTrigger>
							<TabsTrigger value="settings">Settings</TabsTrigger>
						</TabsList>

						<TabsContent
							value="overview"
							className="flex-1 m-0 data-[state=active]:block"
						>
							<OverviewTab appId={id} onOpenSchema={handleOpenSchema} />
						</TabsContent>

						<TabsContent
							value="connections"
							className="flex-1 m-0 data-[state=active]:block"
						>
							<ConnectionsTab
								appId={id}
								onEditConnection={handleOpenConnectionForm}
							/>
						</TabsContent>

						<TabsContent
							value="settings"
							className="flex-1 m-0 data-[state=active]:block"
						>
							<SettingsTab appId={id} />
						</TabsContent>
					</Tabs>
				</div>
			</div>

			<SchemaDialog
				isOpen={isSchemaOpen}
				onOpenChange={setIsSchemaOpen}
				tool={selectedTool}
			/>

			<ConnectionDialog
				isOpen={isFormOpen}
				onOpenChange={setIsFormOpen}
				connectionId={selectedConnectionId}
				appId={id}
				onSelectConnection={handleOpenConnectionForm}
			/>
		</div>
	);
}
