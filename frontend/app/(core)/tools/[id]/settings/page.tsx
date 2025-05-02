"use client";

import { useState, use } from "react";
import useSWR from "swr";
import { ArrowLeft, Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { fetcher } from "@/lib/utils";
import type {
	Connection,
	ToolInstance,
	ToolInstancesResponse,
} from "../../../types";
import { filterToolInstances } from "../../../utils";
import { ToolInstancesTable } from "../../components/tool-instances-table";
import { ErrorState, LoadingState } from "../../../components/states";
import { useRouter } from "next/navigation";
import { useConnection } from "../../../hooks/use-connections";

type SortDirection = "asc" | "desc" | null;

interface ConnectionSettingsPageProps {
	params: Promise<{
		id: string;
	}>;
}

export default function ConnectionSettingsPage(props: ConnectionSettingsPageProps) {
    const params = use(props.params);
    const router = useRouter();
    const [searchQuery, setSearchQuery] = useState("");
    const [statusSort, setStatusSort] = useState<SortDirection>(null);

    const {
		connection,
		isLoading: connectionLoading,
		error: connectionError,
	} = useConnection(params.id);

    const { data: toolInstances, error: toolsError } =
		useSWR<ToolInstancesResponse>(
			`/api/tool-instances?connectionId=${params.id}`,
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

    if (connectionLoading || (!toolInstances && !toolsError)) {
		return <LoadingState />;
	}

    if (connectionError || toolsError || !connection) {
		return <ErrorState />;
	}

    return (
		<div className="flex-1 p-6">
			<div className="mb-8">
				<Button
					variant="ghost"
					className="mb-4"
					onClick={() => router.push(`/tools/${params.id}`)}
				>
					<ArrowLeft className="mr-2 size-4" />
					Back to Connection
				</Button>
				<h1 className="text-2xl font-bold tracking-tight">
					Settings for {connection.name}
				</h1>
				<p className="text-muted-foreground">
					{connection.description || "No description available"}
				</p>
			</div>

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
		</div>
	);
}
