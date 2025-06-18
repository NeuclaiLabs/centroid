"use client";

import { useState, useEffect, useCallback } from "react";
import { nanoid } from "nanoid";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardHeader, CardContent, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Skeleton } from "@/components/ui/skeleton";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { KeyIcon, EyeIcon, EyeOffIcon, CheckIcon, AlertCircleIcon, LoaderIcon, InfoIcon } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";

interface Secret {
	id: string;
	name: string;
	description: string | null;
	ownerId: string;
	createdAt: string;
	updatedAt: string;
	value: string | null;
}

const PREDEFINED_SECRETS = [
	{
		name: "Anthropic API Key",
		description: "API key for Anthropic Claude models",
	},
	{
		name: "GitHub Token",
		description: "Personal access token for GitHub integration",
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
			const response = await fetch("/api/secrets", {
				headers: {
					"Content-Type": "application/json",
				},
			});

			if (!response.ok) {
				throw new Error("Failed to fetch secrets");
			}

			const data = await response.json();
			const existingSecrets = data.data || [];

			// Create a map of existing secrets by name
			const existingSecretsMap = new Map(
				existingSecrets.map((secret: Secret) => [secret.name, secret])
			);

			// Merge predefined secrets with existing ones
			const mergedSecrets = PREDEFINED_SECRETS.map((predefined) => {
				const existing = existingSecretsMap.get(predefined.name);
				return existing ? existing : {
					id: nanoid(), // Generate unique ID for new secrets
					...predefined,
					ownerId: user?.id || "",
					createdAt: "",
					updatedAt: "",
					value: null,
				};
			});

			setSecrets(mergedSecrets);

		} catch (err) {
			setError(err instanceof Error ? err.message : "Failed to fetch secrets");
		} finally {
			setIsLoading(false);
		}
	};

	const handleToggleVisibility = (secretId: string) => {
		setShowValues((prev) => ({
			...prev,
			[secretId]: !prev[secretId],
		}));
	};

	const autoSave = useCallback(async (secretId: string, value: string) => {
		if (!value.trim()) {
			// Clear any existing save status if value is empty
			setSaveStatus(prev => ({ ...prev, [secretId]: null }));
			return;
		}

		const secret = secrets.find((s) => s.id === secretId);
		if (!secret) return;

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
					value: value,
				}),
			});

			if (!response.ok) {
				const errorData = await response.json();
				throw new Error(errorData.detail || "Failed to save secret");
			}

			// Backend handles both create and update automatically

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
	}, [secrets]);

	const handleValueChange = (secretId: string, value: string) => {
		setSecrets((prev) =>
			prev.map((secret) =>
				secret.id === secretId ? { ...secret, value } : secret
			)
		);

		// Clear any existing timeout for this secret
		if (saveTimeouts[secretId]) {
			clearTimeout(saveTimeouts[secretId]);
		}

		// Set a new timeout to auto-save after 1 second of no typing
		const timeoutId = setTimeout(() => {
			autoSave(secretId, value);
		}, 1000);

		setSaveTimeouts(prev => ({ ...prev, [secretId]: timeoutId }));
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

				<div className="space-y-4">
					{PREDEFINED_SECRETS.map((predefined, index) => (
						<Card key={index}>
							<CardHeader>
								<CardTitle className="flex items-center gap-2">
									<Skeleton className="h-5 w-5" />
									<Skeleton className="h-6 w-32" />
								</CardTitle>
								<Skeleton className="h-4 w-64" />
							</CardHeader>
							<CardContent className="space-y-4">
								<div>
									<div className="flex items-center justify-between mb-2">
										<div className="flex items-center gap-2">
											<Skeleton className="h-4 w-10" />
											<Skeleton className="h-3 w-3" />
										</div>
									</div>
									<div className="flex gap-2">
										<div className="relative flex-1">
											<Skeleton className="h-10 w-full" />
										</div>
									</div>
								</div>
							</CardContent>
						</Card>
					))}
				</div>
			</div>
		);
	}

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

			<div className="space-y-4">
				{secrets.map((secret) => (
					<Card key={secret.id}>
						<CardHeader>
							<CardTitle className="flex items-center gap-2">
								<KeyIcon className="h-5 w-5" />
								{secret.name}
							</CardTitle>
							{secret.description && (
								<p className="text-sm text-muted-foreground">
									{secret.description}
								</p>
							)}
						</CardHeader>
						<CardContent className="space-y-4">
							<div>
								<div className="flex items-center justify-between mb-2">
									<div className="flex items-center gap-2">
										<Label htmlFor={`secret-${secret.id}`} className="text-sm font-medium">
											Value
										</Label>
										<Tooltip>
											<TooltipTrigger asChild>
												<InfoIcon className="h-3 w-3 text-muted-foreground cursor-help" />
											</TooltipTrigger>
											<TooltipContent>
												<p>Changes are saved automatically after you stop typing</p>
											</TooltipContent>
										</Tooltip>
									</div>
									<div className="flex items-center gap-2">
										{isSaving[secret.id] && (
											<div className="flex items-center gap-1 text-sm text-muted-foreground">
												<LoaderIcon className="h-3 w-3 animate-spin" />
												Saving...
											</div>
										)}
										{saveStatus[secret.id] === 'saved' && (
											<div className="flex items-center gap-1 text-sm text-green-600 dark:text-green-400">
												<CheckIcon className="h-3 w-3" />
												Saved
											</div>
										)}
										{saveStatus[secret.id] === 'error' && (
											<div className="flex items-center gap-1 text-sm text-destructive">
												<AlertCircleIcon className="h-3 w-3" />
												Error
											</div>
										)}
									</div>
								</div>
								<div className="flex gap-2">
									<div className="relative flex-1">
										<Input
											id={`secret-${secret.id}`}
											type={showValues[secret.id] ? "text" : "password"}
											value={secret.value || ""}
											onChange={(e) => handleValueChange(secret.id, e.target.value)}
											placeholder="Enter your API key or token"
											className="pr-10"
										/>
										<Button
											variant="ghost"
											size="sm"
											className="absolute right-0 top-0 h-full px-3"
											onClick={() => handleToggleVisibility(secret.id)}
										>
											{showValues[secret.id] ? (
												<EyeOffIcon className="h-4 w-4" />
											) : (
												<EyeIcon className="h-4 w-4" />
											)}
										</Button>
									</div>
								</div>
							</div>
						</CardContent>
					</Card>
				))}
			</div>
		</div>
	);
}
