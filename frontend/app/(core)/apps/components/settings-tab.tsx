import { useState } from "react";
import useSWR from "swr";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { fetcher } from "@/lib/utils";
import type { ToolInstance, ToolInstancesResponse } from "../../types";
import { filterToolInstances } from "../../utils";
import { ToolInstancesTable } from "./tool-instances-table";
import { ErrorState, LoadingState } from "./states";

type SortDirection = "asc" | "desc" | null;

interface SettingsTabProps {
	appId: string;
}

export function SettingsTab({ appId }: SettingsTabProps) {
	const [searchQuery, setSearchQuery] = useState("");
	const [statusSort, setStatusSort] = useState<SortDirection>(null);

	const { data: toolInstances, error } = useSWR<ToolInstancesResponse>(
		`/api/tool-instances?appId=${appId}`,
		fetcher,
	);

	const filteredTools = filterToolInstances(
		toolInstances?.data || [],
		searchQuery,
	);

	const sortedTools = [...filteredTools].sort((a, b) => {
		if (statusSort === null) return 0;
		if (statusSort === "asc") {
			return a.status.localeCompare(b.status);
		}
		return b.status.localeCompare(a.status);
	});

	const toggleStatusSort = () => {
		setStatusSort((current) => {
			if (current === null) return "asc";
			if (current === "asc") return "desc";
			return null;
		});
	};

	if (!toolInstances && !error) {
		return <LoadingState />;
	}

	if (error) {
		return <ErrorState />;
	}

	return (
		<div className="border rounded-lg p-6 flex flex-col h-full overflow-hidden">
			{/* Header section with fixed height */}
			<div className="flex items-center justify-between mb-6 flex-shrink-0">
				<h3 className="text-xl font-medium">
					Tool Settings
					<span className="ml-2 text-muted-foreground">
						({sortedTools.length})
					</span>
				</h3>
				<div className="flex items-center gap-4">
					<div className="relative w-[300px]">
						<Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
						<Input
							placeholder="Search tools"
							className="pl-9 h-10 w-full"
							value={searchQuery}
							onChange={(e) => setSearchQuery(e.target.value)}
						/>
					</div>
				</div>
			</div>

			{/* Table section that fills remaining space and scrolls */}
			<div className="flex-grow overflow-hidden">
				<ToolInstancesTable
					tools={sortedTools}
					onSortStatus={toggleStatusSort}
					statusSort={statusSort}
				/>
			</div>
		</div>
	);
}
