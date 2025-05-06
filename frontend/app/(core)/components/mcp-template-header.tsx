import { useState } from "react";
import { getMCPTemplateById, MCPTemplateKind } from "@/lib/mcp-templates/index";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { SimpleIcon } from "simple-icons";
import { Button } from "@/components/ui/button";
import { Download, Check } from "lucide-react";
import { InstallTemplateModal } from "./install-template-modal";
import { useMCPServers } from "../hooks/use-mcp-servers";
import { useRouter } from "next/navigation";

interface MCPTemplateHeaderProps {
	templateId: string;
}

export function MCPTemplateHeader({ templateId }: MCPTemplateHeaderProps) {
	const [isInstallOpen, setIsInstallOpen] = useState(false);
	const template = getMCPTemplateById(templateId);
	const { servers, isLoading } = useMCPServers();
	const router = useRouter();

	if (!template) return null;

	const icon = template.metadata.icon as SimpleIcon;
	const serverWithTemplate = servers.find(
		(server) => server.templateId === templateId,
	);
	const isInstalled = !!serverWithTemplate;

	const handleButtonClick = () => {
		if (isInstalled && serverWithTemplate) {
			router.push(`/mcp-servers/${serverWithTemplate.id}`);
		} else {
			setIsInstallOpen(true);
		}
	};

	return (
		<>
			<Card>
				<CardHeader className="flex flex-row items-center justify-between space-y-0 ">
					<div className="flex items-center gap-4">
						{icon && (
							<div className="size-12 rounded-lg flex items-center justify-center bg-primary/10">
								<svg
									role="img"
									viewBox="0 0 24 24"
									className="size-6 text-primary"
									fill="currentColor"
									aria-label={`${template.name} icon`}
								>
									{Array.isArray(template.metadata.icon) ? (
										template.metadata.icon.map((p, i) => (
											<path key={i} d={p.d} />
										))
									) : (
										<path d={template.metadata.icon.path} />
									)}
								</svg>
							</div>
						)}
						<div>
							<CardTitle className="text-2xl font-bold flex items-center">
								{template.name}
								{template.kind === MCPTemplateKind.OFFICIAL && (
									<span className="inline-flex ml-2 items-center">
										<div className="relative h-5 w-5">
											<svg
												viewBox="0 0 22 22"
												className="size-5 text-blue-500"
												fill="currentColor"
												aria-labelledby="verified-badge-title"
											>
												<title id="verified-badge-title">
													Verified Official Template
												</title>
												<path d="M20.396 11c-.018-.646-.215-1.275-.57-1.816-.354-.54-.852-.972-1.438-1.246.223-.607.27-1.264.14-1.897-.131-.634-.437-1.218-.882-1.687-.47-.445-1.053-.75-1.687-.882-.633-.13-1.29-.083-1.897.14-.273-.587-.704-1.086-1.245-1.44S11.647 1.62 11 1.604c-.646.017-1.273.213-1.813.568s-.969.854-1.24 1.44c-.608-.223-1.267-.272-1.902-.14-.635.13-1.22.436-1.69.882-.445.47-.749 1.055-.878 1.688-.13.633-.08 1.29.144 1.896-.587.274-1.087.705-1.443 1.245-.356.54-.555 1.17-.574 1.817.02.647.218 1.276.574 1.817.356.54.856.972 1.443 1.245-.224.606-.274 1.263-.144 1.896.13.634.433 1.218.877 1.688.47.443 1.054.747 1.687.878.633.132 1.29.084 1.897-.136.274.586.705 1.084 1.246 1.439.54.354 1.17.551 1.816.569.647-.016 1.276-.213 1.817-.567s.972-.854 1.245-1.44c.604.239 1.266.296 1.903.164.636-.132 1.22-.447 1.68-.907.46-.46.776-1.044.908-1.681s.075-1.299-.165-1.903c.586-.274 1.084-.705 1.439-1.246.354-.54.551-1.17.569-1.816zM9.662 14.85l-3.429-3.428 1.293-1.302 2.072 2.072 4.4-4.794 1.347 1.246z" />
											</svg>
										</div>
									</span>
								)}
							</CardTitle>
							<p className="text-sm text-muted-foreground mt-1">
								{template.description}
							</p>
						</div>
					</div>
					<Button
						onClick={handleButtonClick}
						className="gap-2"
						disabled={template.status !== "active" || isLoading}
						variant={isInstalled ? "secondary" : "default"}
					>
						{isInstalled ? (
							<>
								<Check className="size-4" />
								View Installed
							</>
						) : (
							<>
								<Download className="size-4" />
								Install
							</>
						)}
					</Button>
				</CardHeader>
				<CardContent>
					<div className="flex items-center gap-2">
						{template.kind !== MCPTemplateKind.OFFICIAL && (
							<Badge variant="secondary">{template.kind}</Badge>
						)}
						<Badge variant="outline">v{template.version}</Badge>
					</div>
					{/* <div className="flex items-center gap-4 text-sm text-muted-foreground">
						<div className="flex items-center gap-1">
							<span>Language:</span>
							<span className="font-medium">{template.metadata.language}</span>
						</div>
						<div className="flex items-center gap-1">
							<span>Provider:</span>
							<span className="font-medium">{template.metadata.provider}</span>
						</div>
						<div className="flex items-center gap-1">
							<span>Transport:</span>
							<span className="font-medium">{template.transport}</span>
						</div>
					</div> */}
				</CardContent>
			</Card>

			<InstallTemplateModal
				isOpen={isInstallOpen}
				onOpenChange={setIsInstallOpen}
				template={template}
			/>
		</>
	);
}
