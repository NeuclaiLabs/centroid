import type { MCPTemplate } from "@/lib/mcp-templates";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
	CardFooter,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { SimpleIcon } from "simple-icons";
import { cn } from "@/lib/utils";
import { ExternalLink, LayoutGrid, MoreVertical } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useRouter } from "next/navigation";

interface MCPTemplateCardProps {
	template: MCPTemplate;
}

export function MCPTemplateCard({ template }: MCPTemplateCardProps) {
	const router = useRouter();
	const icon = template.metadata.icon as SimpleIcon;

	const handleCardClick = () => {
		router.push(`/mcp-templates/${template.id}`);
	};

	return (
		<Card
			className="hover:shadow-md transition-shadow flex flex-col h-full cursor-pointer"
			onClick={handleCardClick}
		>
			<CardHeader className="p-6 flex flex-row items-start justify-between space-y-0">
				<div className="flex flex-col gap-2">
					<div className="flex items-center gap-2">
						{icon && (
							<div className="size-8 rounded-lg flex items-center justify-center bg-primary/10">
								<svg
									role="img"
									viewBox="0 0 24 24"
									className="size-5 text-primary"
									fill="currentColor"
									aria-label={`${template.name} icon`}
								>
									<path d={template.metadata.icon.path} />
								</svg>
							</div>
						)}
						<div className="flex flex-col">
							<span className="font-semibold text-sm">{template.name}</span>
							<span className="text-xs text-muted-foreground capitalize">
								{template.kind}
							</span>
						</div>
					</div>
				</div>
				<DropdownMenu>
					<DropdownMenuTrigger asChild>
						<Button
							variant="ghost"
							className="size-8 p-0"
							onClick={(e) => e.stopPropagation()}
						>
							<MoreVertical className="size-4" />
							<span className="sr-only">Open menu</span>
						</Button>
					</DropdownMenuTrigger>
					<DropdownMenuContent align="end">
						<DropdownMenuItem
							onClick={(e) => {
								e.stopPropagation();
								router.push(`/mcp-templates/${template.id}/settings`);
							}}
						>
							Settings
						</DropdownMenuItem>
					</DropdownMenuContent>
				</DropdownMenu>
			</CardHeader>
			<CardContent className="px-6 py-2 space-y-4 flex-grow">
				<p className="text-sm text-muted-foreground">{template.description}</p>
				<div className="flex flex-wrap gap-2">
					<Badge
						variant="outline"
						className={cn(
							template.status === "active" && "bg-green-100 text-green-800",
							template.status === "inactive" && "bg-yellow-100 text-yellow-800",
							template.status === "deprecated" && "bg-red-100 text-red-800",
						)}
					>
						{template.status}
					</Badge>
					<Badge variant="outline">v{template.version}</Badge>
				</div>
			</CardContent>
			<CardFooter className="px-6 py-4 mt-auto border-t border-border/40">
				<div className="flex items-center justify-between w-full text-sm">
					<div className="flex items-center gap-2 text-muted-foreground">
						<LayoutGrid className="size-3 text-orange-500" />
						<span className="text-xs">{template.tools.length} actions</span>
					</div>
					{template.metadata.homepage && (
						<Link
							href={template.metadata.homepage}
							target="_blank"
							rel="noopener noreferrer"
							className="flex items-center gap-1 text-xs text-primary hover:underline"
							onClick={(e) => e.stopPropagation()}
						>
							<ExternalLink className="size-3" />
							Documentation
						</Link>
					)}
				</div>
			</CardFooter>
		</Card>
	);
}
