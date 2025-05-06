import { useState } from "react";
import { useRouter } from "next/navigation";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogHeader,
	DialogTitle,
	DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import type { MCPTemplate } from "@/lib/mcp-templates/types";

interface InstallTemplateModalProps {
	isOpen: boolean;
	onOpenChange: (open: boolean) => void;
	template: MCPTemplate;
}

export function InstallTemplateModal({
	isOpen,
	onOpenChange,
	template,
}: InstallTemplateModalProps) {
	const router = useRouter();
	const [secrets, setSecrets] = useState<Record<string, string>>({});
	const [isInstalling, setIsInstalling] = useState(false);

	// Extract environment variables that need to be configured
	const envVars = Object.entries(template.run.env || {}).filter(
		([_, value]) => value.startsWith("${") && value.endsWith("}"),
	);

	const handleInstall = async () => {
		try {
			setIsInstalling(true);
			const response = await fetch("/api/mcp-servers", {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
				},
				body: JSON.stringify({
					name: template.name,
					description: template.description,
					transport: template.transport,
					version: template.version,
					kind: template.kind,
					templateId: template.id,
					run: template.run,
					settings: { metadata: template.metadata },
					tools: template.tools,
					secrets,
				}),
			});

			if (!response.ok) {
				const error = await response.json();
				throw new Error(error.error || "Failed to install template");
			}

			const data = await response.json();
			toast.success("Template installed successfully");
			router.push(`/mcp-servers/${data.id}`);
			onOpenChange(false);
		} catch (error) {
			toast.error(
				error instanceof Error ? error.message : "Failed to install template",
			);
			console.error("Install error:", error);
		} finally {
			setIsInstalling(false);
		}
	};

	const handleSecretChange = (key: string, value: string) => {
		setSecrets((prev) => ({ ...prev, [key]: value }));
	};

	const isValid = envVars.every(([key]) => secrets[key]?.trim());

	return (
		<Dialog open={isOpen} onOpenChange={onOpenChange}>
			<DialogContent className="max-w-[560px]">
				<DialogHeader className="space-y-1">
					<DialogTitle>Install {template.name}</DialogTitle>
					<DialogDescription>
						Configure the required secrets to install this template
					</DialogDescription>
				</DialogHeader>
				<div className="space-y-5 py-4">
					{envVars.map(([key]) => (
						<div key={key} className="space-y-2">
							<Label htmlFor={key} className="text-sm font-semibold">
								{key}
							</Label>
							<Input
								id={key}
								type="password"
								className="font-mono"
								value={secrets[key] || ""}
								onChange={(e) => handleSecretChange(key, e.target.value)}
								placeholder={`Enter ${key.toLowerCase()}`}
							/>
						</div>
					))}
				</div>
				<DialogFooter>
					<Button variant="outline" onClick={() => onOpenChange(false)}>
						Cancel
					</Button>
					<Button onClick={handleInstall} disabled={!isValid || isInstalling}>
						{isInstalling ? "Installing..." : "Install"}
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
}
