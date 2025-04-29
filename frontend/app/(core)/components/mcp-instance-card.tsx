import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { MoreVertical, Play, StopCircle } from "lucide-react";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { MCPInstance } from "@/lib/types";
import Link from "next/link";

interface MCPInstanceCardProps {
	instance: MCPInstance;
}

export function MCPInstanceCard({ instance }: MCPInstanceCardProps) {
	return (
		<Link href={`/mcp/${instance.id}`}>
			<Card className="hover:bg-muted/50 transition-colors">
				<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
					<CardTitle className="text-sm font-medium">{instance.name}</CardTitle>
					<DropdownMenu>
						<DropdownMenuTrigger asChild onClick={(e) => e.preventDefault()}>
							<Button variant="ghost" className="h-8 w-8 p-0">
								<MoreVertical className="h-4 w-4" />
							</Button>
						</DropdownMenuTrigger>
						<DropdownMenuContent align="end">
							<DropdownMenuItem>Edit</DropdownMenuItem>
							<DropdownMenuItem className="text-destructive">
								Delete
							</DropdownMenuItem>
						</DropdownMenuContent>
					</DropdownMenu>
				</CardHeader>
				<CardContent>
					<div className="flex items-center justify-between">
						<div className="space-y-1">
							<p className="text-sm text-muted-foreground">
								{instance.description}
							</p>
							<div className="flex items-center gap-2">
								<Badge
									variant={
										instance.status === "running" ? "success" : "secondary"
									}
								>
									{instance.status}
								</Badge>
								<span className="text-xs text-muted-foreground">
									{instance.created_at}
								</span>
							</div>
						</div>
						<Button
							variant="ghost"
							size="icon"
							className={
								instance.status === "running"
									? "text-destructive"
									: "text-success"
							}
							onClick={(e) => e.preventDefault()}
						>
							{instance.status === "running" ? (
								<StopCircle className="h-4 w-4" />
							) : (
								<Play className="h-4 w-4" />
							)}
						</Button>
					</div>
				</CardContent>
			</Card>
		</Link>
	);
}
