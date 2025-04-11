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
import { ScrollArea } from "@/components/ui/scroll-area";

interface ToolsTableProps {
	tools: ToolDefinition[];
	onOpenSchema: (tool: ToolDefinition) => void;
}

export function ToolsTable({ tools, onOpenSchema }: ToolsTableProps) {
	return (
		<div className="rounded-md border">
			<div className="relative">
				<Table>
					<TableHeader className="bg-muted/50">
						<TableRow>
							<TableHead className="w-[200px]">Name</TableHead>
							<TableHead className="w-[400px]">Description</TableHead>
							<TableHead>Tags</TableHead>
							<TableHead className="w-[100px]">Schema</TableHead>
						</TableRow>
					</TableHeader>
				</Table>

				<ScrollArea className="h-[400px]">
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
				</ScrollArea>
			</div>
		</div>
	);
}
