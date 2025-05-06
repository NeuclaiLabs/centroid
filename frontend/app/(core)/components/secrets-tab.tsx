import { getMCPTemplateById } from "@/lib/mcp-templates/index";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Key, Plus } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";

interface SecretsTabProps {
	templateId: string;
}

export function SecretsTab({ templateId }: SecretsTabProps) {
	const template = getMCPTemplateById(templateId);
	if (!template) return null;

	// Extract environment variables from run config
	const envVars = template.run.env || {};

	return (
		<ScrollArea className="h-[calc(100vh-350px)]">
			<div className="space-y-4 pr-2">
				<div className="flex items-center justify-between">
					<h3 className="text-lg font-medium">Environment Variables</h3>
					<Button variant="outline" size="sm">
						<Plus className="size-4 mr-2" />
						Add Secret
					</Button>
				</div>

				<Card>
					<CardHeader>
						<CardTitle className="text-lg">Required Secrets</CardTitle>
					</CardHeader>
					<CardContent>
						<div className="space-y-4">
							{Object.entries(envVars).map(([key, value]) => (
								<div
									key={key}
									className="flex items-center justify-between p-4 border rounded-lg"
								>
									<div className="flex items-center gap-2">
										<Key className="size-4 text-muted-foreground" />
										<span className="font-medium">{key}</span>
									</div>
									<div className="flex items-center gap-2">
										<span className="text-sm text-muted-foreground">
											{value.startsWith("${") && value.endsWith("}")
												? "Not configured"
												: "Configured"}
										</span>
										<Button variant="outline" size="sm">
											Edit
										</Button>
									</div>
								</div>
							))}
						</div>
					</CardContent>
				</Card>
			</div>
		</ScrollArea>
	);
}
