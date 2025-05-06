import type { MCPTemplate } from "@/lib/mcp-templates/types";
import { MCPTemplateKind } from "@/lib/mcp-templates/index";
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
import {
	ExternalLink,
	LayoutGrid,
	MoreVertical,
	Download,
	Check,
} from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";

interface MCPServerWithTemplate {
	id: string;
	templateId: string;
}

interface MCPTemplateCardProps {
	template: MCPTemplate;
	onInstall: () => void;
	isInstalled?: boolean;
	server?: MCPServerWithTemplate;
}

export function MCPTemplateCard({
	template,
	onInstall,
	isInstalled = false,
	server,
}: MCPTemplateCardProps) {
	const router = useRouter();
	const icon = template.metadata.icon;
	const [isInstalling, setIsInstalling] = useState(false);

	const handleCardClick = () => {
		router.push(`/mcp-templates/${template.id}`);
	};

	return (
		<Card
			className="hover:shadow-md transition-shadow flex flex-col h-full cursor-pointer"
			onClick={handleCardClick}
		>
			<CardHeader className="p-6 flex flex-row items-start justify-between space-y-0">
				<div className="flex flex-col gap-2 flex-1 min-w-0 pr-2">
					<div className="flex items-start gap-2">
						{icon && (
							<div className="size-8 rounded-lg flex items-center justify-center bg-primary/10 shrink-0">
								<svg
									role="img"
									viewBox="0 0 24 24"
									className="size-5 text-primary"
									fill="currentColor"
									aria-label={`${template.name} icon`}
								>
									{Array.isArray(template.metadata.icon) ? (
										template.metadata.icon.map((p, idx) => (
											<path
												key={`path-${p.d.substring(0, 8)}-${idx}`}
												d={p.d}
											/>
										))
									) : (
										<path d={template.metadata.icon.path} />
									)}
								</svg>
							</div>
						)}
						<div className="flex flex-col min-w-0 flex-1">
							<div className="flex items-start gap-1">
								<div className="flex gap-1 items-center">
									<span className="font-semibold text-sm break-words mr-1">
										{template.name}
									</span>
									{template.kind === MCPTemplateKind.OFFICIAL && (
										<div className="relative h-4 w-4 shrink-0 inline-flex">
											<svg
												viewBox="0 0 22 22"
												className="size-4 text-blue-500"
												fill="currentColor"
												aria-labelledby="verified-badge-title-card"
											>
												<title id="verified-badge-title-card">
													Verified Official Template
												</title>
												<path d="M20.396 11c-.018-.646-.215-1.275-.57-1.816-.354-.54-.852-.972-1.438-1.246.223-.607.27-1.264.14-1.897-.131-.634-.437-1.218-.882-1.687-.47-.445-1.053-.75-1.687-.882-.633-.13-1.29-.083-1.897.14-.273-.587-.704-1.086-1.245-1.44S11.647 1.62 11 1.604c-.646.017-1.273.213-1.813.568s-.969.854-1.24 1.44c-.608-.223-1.267-.272-1.902-.14-.635.13-1.22.436-1.69.882-.445.47-.749 1.055-.878 1.688-.13.633-.08 1.29.144 1.896-.587.274-1.087.705-1.443 1.245-.356.54-.555 1.17-.574 1.817.02.647.218 1.276.574 1.817.356.54.856.972 1.443 1.245-.224.606-.274 1.263-.144 1.896.13.634.433 1.218.877 1.688.47.443 1.054.747 1.687.878.633.132 1.29.084 1.897-.136.274.586.705 1.084 1.246 1.439.54.354 1.17.551 1.816.569.647-.016 1.276-.213 1.817-.567s.972-.854 1.245-1.44c.604.239 1.266.296 1.903.164.636-.132 1.22-.447 1.68-.907.46-.46.776-1.044.908-1.681s.075-1.299-.165-1.903c.586-.274 1.084-.705 1.439-1.246.354-.54.551-1.17.569-1.816zM9.662 14.85l-3.429-3.428 1.293-1.302 2.072 2.072 4.4-4.794 1.347 1.246z" />
											</svg>
										</div>
									)}
								</div>
							</div>
							<span className="text-xs text-muted-foreground break-words">
								{template.kind !== MCPTemplateKind.OFFICIAL
									? `${template.kind} • v${template.version}`
									: `v${template.version}`}
							</span>
						</div>
					</div>
				</div>
				<Button
					variant={isInstalled ? "secondary" : "outline"}
					size="sm"
					className="flex items-center gap-1 flex-shrink-0"
					onClick={(e) => {
						e.stopPropagation();
						if (!isInstalled) {
							onInstall();
						} else if (server) {
							router.push(`/mcp-servers/${server.id}`);
						} else {
							router.push(`/mcp-servers?template_id=${template.id}`);
						}
					}}
					disabled={template.status !== "active"}
				>
					{isInstalled ? (
						<>
							<Check className="h-3.5 w-3.5" />
							Installed
						</>
					) : (
						<>
							<Download className="h-3.5 w-3.5" />
							Install
						</>
					)}
				</Button>
			</CardHeader>
			<CardContent className="px-6 py-2 space-y-4 flex-grow">
				<p className="text-sm text-muted-foreground">{template.description}</p>
			</CardContent>
			<CardFooter className="px-6 py-4 mt-auto border-t border-border/40">
				<div className="flex items-center justify-between w-full text-sm">
					<div className="flex items-center gap-2 text-muted-foreground">
						<LayoutGrid className="size-3 text-orange-500" />
						<span className="text-xs">{template.tools.length} tools</span>
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
