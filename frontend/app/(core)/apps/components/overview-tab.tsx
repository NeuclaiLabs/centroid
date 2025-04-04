import { useState } from "react";
import useSWR from "swr";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { fetcher } from "@/lib/utils";
import type { ToolDefinition, ToolDefinitionsResponse } from "../../types";
import { ErrorState, LoadingState } from "./states";
import { filterTools } from "../[id]/utils";
import { ToolsTable } from "./tools-table";

interface OverviewTabProps {
	appId: string;
	onOpenSchema: (tool: ToolDefinition) => void;
}

export function OverviewTab({ appId, onOpenSchema }: OverviewTabProps) {
	const [searchQuery, setSearchQuery] = useState("");

	const { data: toolDefinitions, error } = useSWR<ToolDefinitionsResponse>(
		`/api/tool-definitions?appId=${appId}`,
		fetcher,
	);

	const filteredTools = filterTools(toolDefinitions?.data || [], searchQuery);

	if (!toolDefinitions && !error) {
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
					All Tools
					<span className="ml-2 text-muted-foreground">
						({filteredTools.length})
					</span>
				</h3>
				<div className="flex items-center gap-4">
					<div className="relative w-[300px]">
						<Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
						<Input
							placeholder="Search all tools"
							className="pl-9 h-10 w-full"
							value={searchQuery}
							onChange={(e) => setSearchQuery(e.target.value)}
						/>
					</div>
				</div>
			</div>

			{/* Table section */}
			<ToolsTable tools={filteredTools} onOpenSchema={onOpenSchema} />
		</div>
	);
}
