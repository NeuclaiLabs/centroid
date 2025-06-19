"use client";

import { useState, useEffect } from "react";
import { Key, Check, X, Pencil } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SecretInputField } from "@/components/ui/secret-input";
import { cn } from "@/lib/utils";
import type { Secret, SecretInput, SecretsResponse } from "@/app/(core)/types";

interface EnvironmentVariableEditorProps {
	name: string;
	value: string;
	onSave: (name: string, value: string) => Promise<void>;
	onCancel?: () => void;
	className?: string;
}

export function EnvironmentVariableEditor({
	name,
	value,
	onSave,
	onCancel,
	className,
}: EnvironmentVariableEditorProps) {
	const [isEditing, setIsEditing] = useState(false);
	const [secretInput, setSecretInput] = useState<SecretInput>({ type: "value", value });
	const [isSaving, setIsSaving] = useState(false);
	const [availableSecrets, setAvailableSecrets] = useState<Secret[]>([]);
	const [isLoadingSecrets, setIsLoadingSecrets] = useState(false);

	// Fetch available secrets when editing starts
	useEffect(() => {
		if (isEditing) {
			fetchSecrets();
		}
	}, [isEditing]);

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

	const handleEdit = () => {
		setSecretInput({ type: "value", value });
		setIsEditing(true);
	};

	const handleCancel = () => {
		setIsEditing(false);
		setSecretInput({ type: "value", value });
		onCancel?.();
	};

	const handleSave = async () => {
		try {
			setIsSaving(true);
			const finalValue = secretInput.type === "value" ? secretInput.value : `\${${secretInput.secretId}}`;
			await onSave(name, finalValue);
			setIsEditing(false);
		} catch (error) {
			console.error("Failed to save environment variable:", error);
		} finally {
			setIsSaving(false);
		}
	};

	const handleSecretInputChange = (newSecretInput: SecretInput) => {
		setSecretInput(newSecretInput);
	};

	const getMaskedValue = (val: string) => {
		if (!val) return "-";

		// If it's a variable template like ${VAR_NAME}, show "Not configured"
		if (val.startsWith("${") && val.endsWith("}")) {
			return "Not configured";
		}

		// If it's a reference to another secret (starts with @), show it unmasked
		if (val.startsWith("@")) {
			return val;
		}

		// Mask all characters with bullet points
		return "•".repeat(Math.min(10, Math.max(4, Math.floor(val.length * 0.7))));
	};

	const isValid = () => {
		if (secretInput.type === "value") return secretInput.value.trim() !== "";
		if (secretInput.type === "reference") return secretInput.secretId.trim() !== "";
		return false;
	};

	if (isEditing) {
		return (
			<div className={cn("flex items-center justify-between gap-2", className)}>
				<div className="flex items-center gap-2 flex-1">
					<Key className="size-4 text-muted-foreground" />
					<span className="font-medium">{name}</span>
				</div>
				<div className="flex items-center gap-2">
					<SecretInputField
						label=""
						secretInput={secretInput}
						availableSecrets={availableSecrets}
						onChange={handleSecretInputChange}
						isLoadingSecrets={isLoadingSecrets}
						showVisibilityToggle={true}
						allowReferences={true}
						required={false}
						variant="inline"
						className="w-60"
						inputClassName="h-8"
						placeholder="Enter value or type @ for secrets"
					/>
					<Button
						variant="ghost"
						size="icon"
						onClick={handleCancel}
						className="h-8 w-8"
						type="button"
					>
						<X className="size-4" />
					</Button>
					<Button
						variant="ghost"
						size="icon"
						onClick={handleSave}
						className="h-8 w-8"
						disabled={isSaving || !isValid()}
						type="button"
					>
						<Check className="size-4" />
					</Button>
				</div>
			</div>
		);
	}

	return (
		<div className={cn("flex items-center justify-between", className)}>
			<div className="flex items-center gap-2">
				<Key className="size-4 text-muted-foreground" />
				<span className="font-medium">{name}</span>
			</div>
			<div className="flex items-center gap-2">
				<span className="text-sm text-muted-foreground font-mono">
					{getMaskedValue(value)}
				</span>
				<Button
					variant="ghost"
					size="icon"
					onClick={handleEdit}
					className="h-8 w-8 transition-opacity"
					type="button"
				>
					<Pencil className="size-4" />
				</Button>
			</div>
		</div>
	);
}
