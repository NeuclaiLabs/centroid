"use client";

import { useState, useEffect, useRef } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { EyeIcon, EyeOffIcon } from "lucide-react";
import type { Secret, SecretInput } from "@/app/(core)/types";

interface SecretInputFieldProps {
	label: string;
	placeholder?: string;
	helpText?: string;
	secretInput?: SecretInput;
	availableSecrets: Secret[];
	onChange: (secretInput: SecretInput) => void;
	onDirectValueChange?: (value: string) => void;
	isLoadingSecrets?: boolean;
	showVisibilityToggle?: boolean;
	allowReferences?: boolean;
	id?: string;
	required?: boolean;
	excludeSecretId?: string; // ID of secret to exclude from dropdown
	variant?: "form" | "inline"; // Layout variant
	className?: string;
	inputClassName?: string;
}

export function SecretInputField({
	label,
	placeholder,
	helpText,
	secretInput,
	availableSecrets,
	onChange,
	onDirectValueChange,
	isLoadingSecrets = false,
	showVisibilityToggle = true,
	allowReferences = true,
	id,
	required = false,
	excludeSecretId,
	variant = "form",
	className,
	inputClassName,
}: SecretInputFieldProps) {
	const [displayValue, setDisplayValue] = useState('');
	const [showDropdown, setShowDropdown] = useState(false);
	const [showValue, setShowValue] = useState(false);
	const inputRef = useRef<HTMLInputElement>(null);
	const dropdownRef = useRef<HTMLDivElement>(null);

	// Initialize display value based on existing secretInput
	useEffect(() => {
		if (secretInput) {
			if (secretInput.type === 'reference') {
				const secret = availableSecrets.find(s => s.id === secretInput.secretId);
				setDisplayValue(secret ? `@${secret.name}` : '');
			} else {
				setDisplayValue(secretInput.value);
			}
		}
	}, [secretInput, availableSecrets]);

	// Close dropdown when clicking outside
	useEffect(() => {
		const handleClickOutside = (event: MouseEvent) => {
			if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
				setShowDropdown(false);
			}
		};

		document.addEventListener('mousedown', handleClickOutside);
		return () => document.removeEventListener('mousedown', handleClickOutside);
	}, []);

	const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		const value = e.target.value;

		setDisplayValue(value);

		// Handle @ references if enabled
		if (allowReferences) {
			// Check if user typed @ to show dropdown
			if (value.endsWith('@') && !showDropdown) {
				setShowDropdown(true);
			} else if (!value.includes('@')) {
				setShowDropdown(false);
				// Manual entry
				if (onDirectValueChange) {
					onDirectValueChange(value);
				} else {
					onChange({ type: 'value', value });
				}
			}
		} else {
			// Direct value change without references
			if (onDirectValueChange) {
				onDirectValueChange(value);
			} else {
				onChange({ type: 'value', value });
			}
		}
	};

	const handleSecretSelect = (secret: Secret) => {
		if (!allowReferences) return;

		// Replace the @ with the secret reference
		const beforeAt = displayValue.substring(0, displayValue.lastIndexOf('@'));
		const newValue = `${beforeAt}@${secret.name}`;

		setDisplayValue(newValue);
		setShowDropdown(false);
		onChange({ type: 'reference', secretId: secret.id });

		// Focus back to input
		setTimeout(() => inputRef.current?.focus(), 0);
	};

	const handleKeyDown = (e: React.KeyboardEvent) => {
		if (e.key === 'Escape') {
			setShowDropdown(false);
		}
	};

	const filteredSecrets = availableSecrets.filter(secret => {
		if (!showDropdown || !allowReferences) return false;
		// Exclude self from dropdown
		if (excludeSecretId && secret.id === excludeSecretId) return false;
		const searchTerm = displayValue.substring(displayValue.lastIndexOf('@') + 1).toLowerCase();
		return secret.name.toLowerCase().includes(searchTerm);
	});

	const isReference = secretInput?.type === 'reference';
	const inputType = showValue || isReference ? "text" : "password";

	if (variant === "inline") {
		return (
			<div className={`relative ${className || ""}`}>
				<Input
					ref={inputRef}
					id={id}
					type={inputType}
					className={`font-mono pr-16 ${inputClassName || ""}`}
					value={displayValue}
					onChange={handleInputChange}
					onKeyDown={handleKeyDown}
					placeholder={placeholder || `Enter ${label.toLowerCase()}${allowReferences ? ' or type @ for secrets' : ''}`}
					autoFocus
				/>

				<div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
					{isReference && (
						<span className="text-xs bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 px-1.5 py-0.5 rounded">
							ref
						</span>
					)}

					{showVisibilityToggle && !isReference && (
						<Button
							type="button"
							variant="ghost"
							size="sm"
							className="h-6 w-6 p-0"
							onClick={() => setShowValue(!showValue)}
						>
							{showValue ? (
								<EyeOffIcon className="h-3 w-3" />
							) : (
								<EyeIcon className="h-3 w-3" />
							)}
						</Button>
					)}
				</div>

				{/* Dropdown */}
				{showDropdown && allowReferences && (
					<div
						ref={dropdownRef}
						className="absolute top-full left-0 right-0 mt-1 bg-background border border-border rounded-md shadow-lg max-h-40 overflow-y-auto z-50"
					>
						{isLoadingSecrets ? (
							<div className="p-2 text-sm text-muted-foreground">Loading secrets...</div>
						) : filteredSecrets.length === 0 ? (
							<div className="p-2 text-sm text-muted-foreground">No secrets found</div>
						) : (
							filteredSecrets.map((secret) => (
								<button
									key={secret.id}
									type="button"
									className="w-full text-left px-3 py-2 text-sm hover:bg-muted focus:bg-muted focus:outline-none"
									onClick={() => handleSecretSelect(secret)}
								>
									<div className="font-medium">{secret.name}</div>
									{secret.description && (
										<div className="text-xs text-muted-foreground">{secret.description}</div>
									)}
								</button>
							))
						)}
					</div>
				)}
			</div>
		);
	}

	// Form variant (original)
	return (
		<div className={`space-y-3 relative ${className || ""}`}>
			{label && (
				<Label htmlFor={id} className="text-sm font-semibold">
					{label}
					{required && <span className="text-destructive ml-1">*</span>}
					{helpText && (
						<span className="text-xs text-muted-foreground ml-2">
							{helpText}
						</span>
					)}
					{allowReferences && (
						<span className="text-xs text-muted-foreground ml-2">
							(type @ to reference existing secrets)
						</span>
					)}
				</Label>
			)}

			<div className="relative">
				<Input
					ref={inputRef}
					id={id}
					type={inputType}
					className={`font-mono ${showVisibilityToggle ? 'pr-16' : 'pr-8'} ${inputClassName || ""}`}
					value={displayValue}
					onChange={handleInputChange}
					onKeyDown={handleKeyDown}
					placeholder={placeholder || `Enter ${label.toLowerCase()}${allowReferences ? ' or type @ for secrets' : ''}`}
				/>

				<div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
					{isReference && (
						<span className="text-xs bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 px-1.5 py-0.5 rounded">
							ref
						</span>
					)}

					{showVisibilityToggle && !isReference && (
						<Button
							type="button"
							variant="ghost"
							size="sm"
							className="h-8 w-8 p-0"
							onClick={() => setShowValue(!showValue)}
						>
							{showValue ? (
								<EyeOffIcon className="h-4 w-4" />
							) : (
								<EyeIcon className="h-4 w-4" />
							)}
						</Button>
					)}
				</div>

				{/* Dropdown */}
				{showDropdown && allowReferences && (
					<div
						ref={dropdownRef}
						className="absolute top-full left-0 right-0 mt-1 bg-background border border-border rounded-md shadow-lg max-h-40 overflow-y-auto z-50"
					>
						{isLoadingSecrets ? (
							<div className="p-2 text-sm text-muted-foreground">
								Loading secrets...
							</div>
						) : filteredSecrets.length === 0 ? (
							<div className="p-2 text-sm text-muted-foreground">
								No secrets found
							</div>
						) : (
							filteredSecrets.map((secret) => (
								<button
									key={secret.id}
									type="button"
									className="w-full text-left px-3 py-2 text-sm hover:bg-muted focus:bg-muted focus:outline-none"
									onClick={() => handleSecretSelect(secret)}
								>
									<div className="font-medium">{secret.name}</div>
									{secret.description && (
										<div className="text-xs text-muted-foreground">
											{secret.description}
										</div>
									)}
								</button>
							))
						)}
					</div>
				)}
			</div>
		</div>
	);
}
