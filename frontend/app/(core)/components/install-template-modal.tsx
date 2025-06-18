import { useState, useEffect } from "react";
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import type { MCPTemplate, Secret, SecretInput, SecretsResponse } from "@/app/(core)/types";

interface InstallTemplateModalProps {
	isOpen: boolean;
	onOpenChange: (open: boolean) => void;
	template: MCPTemplate;
}

interface SecretInputFieldProps {
	envKey: string;
	secretInput?: SecretInput;
	availableSecrets: Secret[];
	onChange: (secretInput: SecretInput) => void;
	isLoadingSecrets: boolean;
}

function SecretInputField({
	envKey,
	secretInput,
	availableSecrets,
	onChange,
	isLoadingSecrets,
}: SecretInputFieldProps) {
	const [inputMode, setInputMode] = useState<'manual' | 'reference'>('manual');

	// Initialize input mode based on existing secretInput
	useEffect(() => {
		if (secretInput) {
			setInputMode(secretInput.type === 'reference' ? 'reference' : 'manual');
		}
	}, [secretInput]);

	const handleModeChange = (newMode: 'manual' | 'reference') => {
		setInputMode(newMode);
		// Reset the secret input when mode changes
		if (newMode === 'manual') {
			onChange({ type: 'value', value: '' });
		} else {
			onChange({ type: 'reference', secretId: '' });
		}
	};

	const handleValueChange = (value: string) => {
		if (inputMode === 'manual') {
			onChange({ type: 'value', value });
		} else {
			onChange({ type: 'reference', secretId: value });
		}
	};


	return (
		<div className="space-y-3">
			<Label htmlFor={envKey} className="text-sm font-semibold">
				{envKey}
			</Label>

			{/* Mode selector */}
			<Select value={inputMode} onValueChange={handleModeChange}>
				<SelectTrigger className="w-full">
					<SelectValue />
				</SelectTrigger>
				<SelectContent>
					<SelectItem value="manual">Enter value manually</SelectItem>
					<SelectItem value="reference" disabled={isLoadingSecrets || availableSecrets.length === 0}>
						Use existing secret {isLoadingSecrets ? "(loading...)" : availableSecrets.length === 0 ? "(none available)" : ""}
					</SelectItem>
				</SelectContent>
			</Select>

			{/* Input field based on mode */}
			{inputMode === 'manual' ? (
				<Input
					id={envKey}
					type="password"
					className="font-mono"
					value={secretInput?.type === 'value' ? secretInput.value : ''}
					onChange={(e) => handleValueChange(e.target.value)}
					placeholder={`Enter ${envKey.toLowerCase()}`}
				/>
			) : (
				<Select
					value={secretInput?.type === 'reference' ? secretInput.secretId : ''}
					onValueChange={handleValueChange}
				>
					<SelectTrigger className="w-full">
						<SelectValue placeholder="Select a secret" />
					</SelectTrigger>
					<SelectContent>
						{availableSecrets.map((secret) => (
							<SelectItem key={secret.id} value={secret.id}>
								{secret.name} {secret.description && `- ${secret.description}`}
							</SelectItem>
						))}
					</SelectContent>
				</Select>
			)}
		</div>
	);
}

export function InstallTemplateModal({
	isOpen,
	onOpenChange,
	template,
}: InstallTemplateModalProps) {
	const router = useRouter();
	const [secrets, setSecrets] = useState<Record<string, SecretInput>>({});
	const [isInstalling, setIsInstalling] = useState(false);
	const [availableSecrets, setAvailableSecrets] = useState<Secret[]>([]);
	const [isLoadingSecrets, setIsLoadingSecrets] = useState(false);

	// Extract environment variables that need to be configured
	const envVars = Object.entries(template.run?.env || {}).filter(
		([_, value]) => value.startsWith("${") && value.endsWith("}"),
	);

	// Fetch available secrets when modal opens
	useEffect(() => {
		if (isOpen) {
			fetchSecrets();
		}
	}, [isOpen]);

	const fetchSecrets = async () => {
		try {
			setIsLoadingSecrets(true);
			const response = await fetch("/api/secrets");
			if (response.ok) {
				const data: SecretsResponse = await response.json();
				setAvailableSecrets(data.data);
			}
		} catch (error) {
			console.error("Failed to fetch secrets:", error);
		} finally {
			setIsLoadingSecrets(false);
		}
	};

	const handleInstall = async () => {
		try {
			setIsInstalling(true);
			const response = await fetch("/api/mcp/servers", {
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
					settings: { metadata: template.details },
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
			router.push(`/mcp/servers/${data.id}`);
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

	const handleSecretChange = (key: string, secretInput: SecretInput) => {
		setSecrets((prev) => ({ ...prev, [key]: secretInput }));
	};

	const isValid = envVars.every(([key]) => {
		const secret = secrets[key];
		if (!secret) return false;
		if (secret.type === "value") return secret.value.trim() !== "";
		if (secret.type === "reference") return secret.secretId.trim() !== "";
		return false;
	});

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
						<SecretInputField
							key={key}
							envKey={key}
							secretInput={secrets[key]}
							availableSecrets={availableSecrets}
							onChange={(secretInput) => handleSecretChange(key, secretInput)}
							isLoadingSecrets={isLoadingSecrets}
						/>
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
