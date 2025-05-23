import {
	Card,
	CardHeader,
	CardContent,
	CardFooter,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { MoreVertical, ExternalLink, LayoutGrid } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { AppMetadata } from "@/lib/registry";

interface AppCardProps {
	app: AppMetadata;
}

export function AppCard({ app }: AppCardProps) {
	const router = useRouter();

	const handleCardClick = () => {
		router.push(`/apps/${app.id}`);
	};

	return (
		<Card
			className="hover:bg-secondary/50 transition-colors cursor-pointer flex flex-col h-full"
			onClick={handleCardClick}
		>
			<CardHeader className="p-6 flex flex-row items-start justify-between space-y-0">
				<div className="flex flex-col gap-2">
					<div className="flex items-center gap-2">
						<div className="size-8 rounded-lg flex items-center justify-center bg-primary/10">
							<svg
								role="img"
								viewBox="0 0 24 24"
								className="size-5 text-primary"
								fill="currentColor"
								aria-label={`${app.name} icon`}
							>
								<path d={app.icon.path} />
							</svg>
						</div>
						<div className="flex flex-col">
							<span className="font-semibold text-sm">{app.name}</span>
							<span className="text-xs text-muted-foreground capitalize">
								{app.category}
							</span>
						</div>
					</div>
				</div>
				<DropdownMenu>
					<DropdownMenuTrigger asChild>
						<Button variant="ghost" className="size-8 p-0">
							<MoreVertical className="size-4" />
							<span className="sr-only">Open menu</span>
						</Button>
					</DropdownMenuTrigger>
					<DropdownMenuContent align="end">
						<DropdownMenuItem
							onClick={(e) => {
								e.stopPropagation();
								router.push(`/apps/${app.id}/settings`);
							}}
						>
							Settings
						</DropdownMenuItem>
					</DropdownMenuContent>
				</DropdownMenu>
			</CardHeader>
			<CardContent className="px-6 py-2 space-y-4 flex-grow">
				<p className="text-sm text-muted-foreground">{app.description}</p>

				<div className="flex flex-wrap gap-2">
					{app.features.slice(0, 3).map((feature) => (
						<Badge
							key={feature}
							variant="outline"
							className="bg-primary/10 text-primary text-xs hover:bg-primary/20"
						>
							{feature}
						</Badge>
					))}
				</div>
			</CardContent>
			<CardFooter className="px-6 py-4 mt-auto border-t border-border/40">
				<div className="flex items-center justify-between w-full text-sm">
					<div className="flex items-center gap-2 text-muted-foreground">
						<LayoutGrid className="size-3 text-orange-500" />
						<span className="text-xs">{app.apiEndpointCount} actions</span>
					</div>
					<Link
						href={app.docsUrl}
						target="_blank"
						rel="noopener noreferrer"
						className="flex items-center gap-1 text-xs text-primary hover:underline"
						onClick={(e) => e.stopPropagation()}
					>
						<ExternalLink className="size-3" />
						Documentation
					</Link>
				</div>
			</CardFooter>
		</Card>
	);
}
