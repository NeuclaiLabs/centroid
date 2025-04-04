import {
	Table,
	TableHeader,
	TableBody,
	TableHead,
	TableRow,
	TableCell,
} from "@/components/ui/table";
import { Switch } from "@/components/ui/switch";
import { useState, useEffect, useRef } from "react";
import type { ToolInstance } from "../../types";

interface ToolInstancesTableProps {
	tools: ToolInstance[];
}

export function ToolInstancesTable({ tools }: ToolInstancesTableProps) {
	const [containerHeight, setContainerHeight] = useState("auto");
	const tableBodyRef = useRef<HTMLDivElement>(null);

	// Calculate appropriate height based on content with a bit of added space
	useEffect(() => {
		if (tableBodyRef.current) {
			// Get actual content height
			const contentHeight = tableBodyRef.current.scrollHeight;
			// Set minimum height for empty state
			if (tools.length === 0) {
				setContainerHeight("200px");
			}
			// For content, add a small buffer (16px) to avoid cutting text off
			else if (contentHeight < 400) {
				setContainerHeight(`${contentHeight + 16}px`);
			}
			// Cap at 400px for larger datasets
			else {
				setContainerHeight("400px");
			}
		}
	}, [tools, tableBodyRef]);

	return (
		<div className="rounded-md border">
			<Table>
				<TableHeader>
					<TableRow>
						<TableHead className="w-[200px]">Name</TableHead>
						<TableHead className="w-[400px]">Description</TableHead>
						<TableHead className="w-[100px]">Status</TableHead>
					</TableRow>
				</TableHeader>
			</Table>

			<div
				ref={tableBodyRef}
				className="overflow-auto"
				style={{ height: containerHeight, maxHeight: "400px" }}
			>
				<Table>
					<TableBody>
						{tools.length === 0 ? (
							<TableRow>
								<TableCell
									colSpan={3}
									className="h-[200px] text-center text-muted-foreground"
								>
									<div className="flex items-center justify-center h-full">
										No tool instances found
									</div>
								</TableCell>
							</TableRow>
						) : (
							tools.map((tool) => (
								<TableRow key={tool.id}>
									<TableCell className="w-[200px]">{tool.name}</TableCell>
									<TableCell className="w-[400px]">
										{tool.description}
									</TableCell>
									<TableCell className="w-[100px]">
										<Switch checked={tool.enabled} />
									</TableCell>
								</TableRow>
							))
						)}
					</TableBody>
				</Table>
			</div>
		</div>
	);
}
