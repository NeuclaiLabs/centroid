import { useCallback } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";

import { Button } from "@/components/ui/button";
import {
	Form,
	FormControl,
	FormField,
	FormItem,
	FormLabel,
	FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import type { Connection } from "@/app/connection/types";

const connectionSchema = z.object({
	name: z.string().min(1, "Name is required"),
	description: z.string().optional(),
	kind: z.string().min(1, "Kind is required"),
	base_url: z.string().url("Must be a valid URL"),
	auth: z.record(z.string(), z.unknown()).optional(),
});

type ConnectionFormData = z.infer<typeof connectionSchema>;

interface ConnectionFormProps {
	initialData?: Connection;
	onSubmit: (data: ConnectionFormData) => Promise<void>;
	isSubmitting?: boolean;
}

export function ConnectionForm({
	initialData,
	onSubmit,
	isSubmitting,
}: ConnectionFormProps) {
	const form = useForm<ConnectionFormData>({
		resolver: zodResolver(connectionSchema),
		defaultValues: {
			name: initialData?.name ?? "",
			description: initialData?.description ?? "",
			kind: initialData?.kind ?? "",
			base_url: initialData?.base_url ?? "",
			auth: initialData?.auth ?? {},
		},
	});

	const handleSubmit = useCallback(
		async (data: ConnectionFormData) => {
			try {
				await onSubmit(data);
				form.reset();
			} catch (error) {
				console.error("Form submission error:", error);
			}
		},
		[form, onSubmit],
	);

	return (
		<Form {...form}>
			<form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
				<FormField
					control={form.control}
					name="name"
					render={({ field }) => (
						<FormItem>
							<FormLabel>Name</FormLabel>
							<FormControl>
								<Input placeholder="Connection name" {...field} />
							</FormControl>
							<FormMessage />
						</FormItem>
					)}
				/>

				<FormField
					control={form.control}
					name="description"
					render={({ field }) => (
						<FormItem>
							<FormLabel>Description</FormLabel>
							<FormControl>
								<Textarea placeholder="Connection description" {...field} />
							</FormControl>
							<FormMessage />
						</FormItem>
					)}
				/>

				<FormField
					control={form.control}
					name="kind"
					render={({ field }) => (
						<FormItem>
							<FormLabel>Kind</FormLabel>
							<FormControl>
								<Input placeholder="Connection kind" {...field} />
							</FormControl>
							<FormMessage />
						</FormItem>
					)}
				/>

				<FormField
					control={form.control}
					name="base_url"
					render={({ field }) => (
						<FormItem>
							<FormLabel>Base URL</FormLabel>
							<FormControl>
								<Input placeholder="https://api.example.com" {...field} />
							</FormControl>
							<FormMessage />
						</FormItem>
					)}
				/>

				<Button type="submit" disabled={isSubmitting}>
					{isSubmitting ? "Saving..." : initialData ? "Update" : "Create"}
				</Button>
			</form>
		</Form>
	);
}
