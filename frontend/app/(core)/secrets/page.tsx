"use client";

import { useState, useEffect, useCallback } from "react";
import { nanoid } from "nanoid";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Skeleton } from "@/components/ui/skeleton";
import { EnvironmentVariableEditor } from "@/app/(core)/components/environment-variable-editor";
import { AlertCircleIcon } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import type { SecretInput, Secret, SecretsResponse } from "@/app/(core)/types";

const PREDEFINED_SECRETS = [
	{
		name: "Anthropic API Key",
		description: "API key for Anthropic Claude models",
		provider: "anthropic",
	},
	{
		name: "GitHub Token",
		description: "Personal access token for GitHub integration",
		provider: "github",
	},
];

export default function SecretsPage() {
	const { user } = useAuth();
	const [secrets, setSecrets] = useState<Secret[]>([]);
	const [isLoading, setIsLoading] = useState(true);
	const [isSaving, setIsSaving] = useState<Record<string, boolean>>({});
	const [saveStatus, setSaveStatus] = useState<Record<string, 'saved' | 'error' | null>>({});
	const [error, setError] = useState<string | null>(null);
	const [showValues, setShowValues] = useState<Record<string, boolean>>({});
	const [saveTimeouts, setSaveTimeouts] = useState<Record<string, NodeJS.Timeout>>({});
	const [secretInputs, setSecretInputs] = useState<Record<string, SecretInput>>({});
	const [availableSecrets, setAvailableSecrets] = useState<Secret[]>([]);
	const [isLoadingSecrets, setIsLoadingSecrets] = useState(false);


	useEffect(() => {
		fetchSecrets();
	}, []);

	// Cleanup timeouts on unmount
	useEffect(() => {
		return () => {
			Object.values(saveTimeouts).forEach(timeout => {
				if (timeout) clearTimeout(timeout);
			});
		};
	}, [saveTimeouts]);

	const fetchSecrets = async () => {
		try {
			setIsLoading(true);
			setIsLoadingSecrets(true);
			const response = await fetch("/api/secrets", {
				headers: {
					"Content-Type": "application/json",
				},
			});

			if (!response.ok) {
				throw new Error("Failed to fetch secrets");
			}

			const data: SecretsResponse = await response.json();
			const existingSecrets = data.data || [];

			// Set available secrets for referencing (only existing secrets with values)
			setAvailableSecrets(existingSecrets.filter((secret: Secret) => secret.value));

			// Create a map of existing secrets by name
			const existingSecretsMap = new Map(
				existingSecrets.map((secret: Secret) => [secret.name, secret])
			);

			// Merge predefined secrets with existing ones
			const mergedSecrets: Secret[] = PREDEFINED_SECRETS.map((predefined) => {
				const existing = existingSecretsMap.get(predefined.name);
				return existing ? existing : {
					id: nanoid(), // Generate unique ID for new secrets
					name: predefined.name,
					description: predefined.description,
					provider: predefined.provider,
					ownerId: user?.id || "",
					createdAt: "",
					updatedAt: "",
					value: undefined,
				};
			});

			setSecrets(mergedSecrets);

			// Initialize secret inputs for existing secrets
			const inputs: Record<string, SecretInput> = {};
			mergedSecrets.forEach((secret) => {
				if (secret.value) {
					// Check if the value is a reference pattern (starts with @)
					if (secret.value.startsWith('@')) {
						// This is a reference to another secret by name
						const referencedSecretName = secret.value.substring(1); // Remove the @
						const referencedSecret = existingSecrets.find(s => s.name === referencedSecretName);
						if (referencedSecret) {
							inputs[secret.id] = { type: 'reference', secretId: referencedSecret.id };
						} else {
							// If referenced secret not found, treat as direct value
							inputs[secret.id] = { type: 'value', value: secret.value };
						}
					} else {
						// Direct value
						inputs[secret.id] = { type: 'value', value: secret.value };
					}
				}
			});
			setSecretInputs(inputs);

		} catch (err) {
			setError(err instanceof Error ? err.message : "Failed to fetch secrets");
		} finally {
			setIsLoading(false);
			setIsLoadingSecrets(false);
		}
	};

	const handleToggleVisibility = (secretId: string) => {
		setShowValues((prev) => ({
			...prev,
			[secretId]: !prev[secretId],
		}));
	};

	const autoSave = useCallback(async (secretId: string, secretInput: SecretInput) => {
		const secret = secrets.find((s) => s.id === secretId);
		if (!secret) return;

		// Determine the value to save based on input type
		let valueToSave: string;
		if (secretInput.type === 'reference') {
			// For references, find the referenced secret name and save as @SecretName
			const referencedSecret = availableSecrets.find(s => s.id === secretInput.secretId);
			if (!referencedSecret) {
				setError("Referenced secret not found");
				return;
			}
			valueToSave = `@${referencedSecret.name}`;
		} else {
			// For direct values, save the value directly
			if (!secretInput.value.trim()) {
				// Clear any existing save status if value is empty
				setSaveStatus(prev => ({ ...prev, [secretId]: null }));
				return;
			}
			valueToSave = secretInput.value;
		}

		try {
			setIsSaving(prev => ({ ...prev, [secretId]: true }));
			setSaveStatus(prev => ({ ...prev, [secretId]: null }));
			setError(null);

			// Use the unified create/update endpoint
			const response = await fetch("/api/secrets", {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
				},
				body: JSON.stringify({
					id: secretId, // Include the generated ID
					name: secret.name,
					description: secret.description,
					provider: secret.provider,
					value: valueToSave,
				}),
			});

			if (!response.ok) {
				const errorData = await response.json();
				throw new Error(errorData.detail || "Failed to save secret");
			}

			// Backend handles both create and update automatically
			// Update the secret's value in local state
			setSecrets(prev => prev.map(s =>
				s.id === secretId ? { ...s, value: valueToSave } : s
			));

			// Update available secrets for future references (only if it's a direct value)
			if (secretInput.type === 'value') {
				const updatedSecret = { ...secret, value: valueToSave };
				setAvailableSecrets(prev => {
					const exists = prev.find(s => s.id === secretId);
					if (exists) {
						return prev.map(s => s.id === secretId ? updatedSecret : s);
					} else {
						return [...prev, updatedSecret];
					}
				});
			}

			setSaveStatus(prev => ({ ...prev, [secretId]: 'saved' }));

			// Clear the saved status after 3 seconds
			setTimeout(() => {
				setSaveStatus(prev => ({ ...prev, [secretId]: null }));
			}, 3000);

		} catch (err) {
			setSaveStatus(prev => ({ ...prev, [secretId]: 'error' }));
			setError(err instanceof Error ? err.message : "Failed to save secret");
		} finally {
			setIsSaving(prev => ({ ...prev, [secretId]: false }));
		}
	}, [secrets, availableSecrets]);

	const handleSecretInputChange = (secretId: string, secretInput: SecretInput) => {
		// Update the secret input state
		setSecretInputs(prev => ({ ...prev, [secretId]: secretInput }));

		// Clear any existing timeout for this secret
		if (saveTimeouts[secretId]) {
			clearTimeout(saveTimeouts[secretId]);
		}

		// Set a new timeout to auto-save after 1 second of no typing (for both direct values and references)
		if (secretInput.type === 'value' || secretInput.type === 'reference') {
			const timeoutId = setTimeout(() => {
				autoSave(secretId, secretInput);
			}, 1000);

			setSaveTimeouts(prev => ({ ...prev, [secretId]: timeoutId }));
		}
	};

	const handleDirectValueChange = (secretId: string, value: string) => {
		// Update the secret value directly in the secrets state for display purposes
		setSecrets((prev) =>
			prev.map((secret) =>
				secret.id === secretId ? { ...secret, value } : secret
			)
		);

		// Also update the secret input
		const secretInput: SecretInput = { type: 'value', value };
		handleSecretInputChange(secretId, secretInput);
	};

	if (isLoading) {
		return (
			<div className="flex-1 py-6">
				<div className="mb-8">
					<h1 className="text-2xl font-bold tracking-tight">Secrets</h1>
					<p className="text-muted-foreground">
						Manage your API keys and sensitive configuration
					</p>
				</div>

				<div className="space-y-6">
					{PREDEFINED_SECRETS.map((predefined) => (
						<div key={predefined.provider} className="space-y-3">
							<div className="flex items-center gap-2">
								<Skeleton className="h-5 w-5 rounded-full" />
								<Skeleton className="h-6 w-40" />
							</div>
							<Skeleton className="h-4 w-64" />
							<div className="group p-4 border rounded-lg animate-pulse">
								<div className="flex items-center justify-between">
									<div className="flex items-center gap-2">
										<Skeleton className="h-4 w-4 rounded" />
										<Skeleton className="h-4 w-16" />
									</div>
									<div className="flex items-center gap-2">
										<Skeleton className="h-4 w-32" />
										<Skeleton className="h-8 w-8 rounded" />
									</div>
								</div>
							</div>
						</div>
					))}
				</div>
			</div>
		);
	}

	const handleSecretSave = async (secretId: string, value: string) => {
		const secret = secrets.find((s) => s.id === secretId);
		if (!secret) return;

		// Convert the value to a SecretInput format for the autosave logic
		let secretInput: SecretInput;
		if (value.startsWith("@")) {
			// This is a reference - find the secret by name
			const referencedSecretName = value.substring(1);
			const referencedSecret = availableSecrets.find((s) => s.name === referencedSecretName);
			if (referencedSecret) {
				secretInput = { type: "reference", secretId: referencedSecret.id };
			} else {
				// Fallback to direct value if reference not found
				secretInput = { type: "value", value };
			}
		} else {
			secretInput = { type: "value", value };
		}

		// Update the secret input state
		setSecretInputs((prev) => ({ ...prev, [secretId]: secretInput }));

		// Use the existing autosave logic
		await autoSave(secretId, secretInput);
	};

	return (
		<div className="flex-1 py-6">
			<div className="mb-8">
				<h1 className="text-2xl font-bold tracking-tight">Secrets</h1>
				<p className="text-muted-foreground">
					Manage your API keys and sensitive configuration
				</p>
			</div>

			{error && (
				<Alert className="mb-6 border-destructive/50 text-destructive dark:border-destructive">
					<AlertCircleIcon className="h-4 w-4" />
					<AlertDescription>{error}</AlertDescription>
				</Alert>
			)}

			{secrets.length > 0 ? (
				<div className="space-y-6">
					{secrets.map((secret) => (
						<div
							key={secret.id}
							className="group p-4 border rounded-lg hover:border-primary/50 focus-within:border-primary/70 transition-colors"
						>
							<EnvironmentVariableEditor
								name={secret.name}
								value={secret.value || ""}
								onSave={(_, value) => handleSecretSave(secret.id, value)}
							/>
						</div>
					))}
				</div>
			) : (
				<div className="text-center p-8">
					<p className="text-muted-foreground">
						No secrets available.
					</p>
				</div>
			)}
		</div>
	);
}
