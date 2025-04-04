import {
	Table,
	TableHeader,
	TableBody,
	TableHead,
	TableRow,
	TableCell,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Eye } from "lucide-react";
import type { ToolDefinition } from "../../types";
import { Badge } from "@/components/ui/badge";
import { useState, useEffect, useRef } from "react";

interface ToolsTableProps {
	tools: ToolDefinition[];
	onOpenSchema: (tool: ToolDefinition) => void;
}

export function ToolsTable({ tools, onOpenSchema }: ToolsTableProps) {
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
				setContainerHeight(`${contentHeight}px`);
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
						<TableHead>Tags</TableHead>
						<TableHead className="w-[100px]">Schema</TableHead>
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
									colSpan={4}
									className="h-[200px] text-center text-muted-foreground"
								>
									<div className="flex items-center justify-center h-full">
										No tools found
									</div>
								</TableCell>
							</TableRow>
						) : (
							tools.map((tool) => (
								<TableRow key={tool.id}>
									<TableCell className="w-[200px]">
										{(tool.toolSchema?.name || tool.id) as string}
									</TableCell>
									<TableCell className="w-[400px]">
										{
											(tool.toolSchema?.description ||
												"No description available") as string
										}
									</TableCell>
									<TableCell>
										<div className="flex flex-wrap gap-1">
											{tool.toolMetadata?.tags?.map((tag) => (
												<Badge key={tag} variant="secondary">
													{tag}
												</Badge>
											)) || "No tags"}
										</div>
									</TableCell>
									<TableCell className="w-[100px]">
										<Button
											variant="ghost"
											size="icon"
											onClick={() => onOpenSchema(tool)}
										>
											<Eye className="h-4 w-4" />
										</Button>
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
