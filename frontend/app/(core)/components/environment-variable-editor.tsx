"use client";

import { useState } from "react";
import { Key, Check, X, Pencil, Eye, EyeOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

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
	const [editedValue, setEditedValue] = useState(value);
	const [isSaving, setIsSaving] = useState(false);
	const [isValueVisible, setIsValueVisible] = useState(false);

	const handleEdit = () => {
		setEditedValue(value);
		setIsEditing(true);
	};

	const handleCancel = () => {
		setIsEditing(false);
		setEditedValue(value);
		onCancel?.();
	};

	const handleSave = async () => {
		try {
			setIsSaving(true);
			await onSave(name, editedValue);
			setIsEditing(false);
		} catch (error) {
			console.error("Failed to save environment variable:", error);
		} finally {
			setIsSaving(false);
		}
	};

	const toggleValueVisibility = () => {
		setIsValueVisible(!isValueVisible);
	};

	const getMaskedValue = (val: string) => {
		if (!val) return "-";

		// If it's a variable template like ${VAR_NAME}, show "Not configured"
		if (val.startsWith("${") && val.endsWith("}")) {
			return "Not configured";
		}

		// If visible, show the actual value
		if (isValueVisible) {
			return val;
		}

		// Mask all characters with bullet points
		return "•".repeat(Math.min(10, Math.max(4, Math.floor(val.length * 0.7))));
	};

	if (isEditing) {
		return (
			<div className={cn("flex items-center justify-between gap-2", className)}>
				<div className="flex items-center gap-2 flex-1">
					<Key className="size-4 text-muted-foreground" />
					<span className="font-medium">{name}</span>
				</div>
				<div className="flex items-center gap-2">
					<Input
						value={editedValue}
						onChange={(e) => setEditedValue(e.target.value)}
						className="h-8 w-60"
						type={isValueVisible ? "text" : "password"}
						autoFocus
					/>
					<Button
						variant="ghost"
						size="icon"
						onClick={toggleValueVisibility}
						className="h-8 w-8"
						type="button"
					>
						{isValueVisible ? (
							<EyeOff className="size-4" />
						) : (
							<Eye className="size-4" />
						)}
					</Button>
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
						disabled={isSaving}
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
					onClick={toggleValueVisibility}
					className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity"
					type="button"
				>
					{isValueVisible ? (
						<EyeOff className="size-4" />
					) : (
						<Eye className="size-4" />
					)}
				</Button>
				<Button
					variant="ghost"
					size="icon"
					onClick={handleEdit}
					className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity"
					type="button"
				>
					<Pencil className="size-4" />
				</Button>
			</div>
		</div>
	);
}
