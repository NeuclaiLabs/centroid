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
	FormDescription,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import type { Connection, ConnectionCreate } from "@/app/connection/types";

const AUTH_TYPES = {
	NONE: "none",
	TOKEN: "token",
	API_KEY: "api_key",
	BASIC: "basic",
} as const;

const API_KEY_LOCATIONS = {
	HEADER: "header",
	QUERY: "query",
} as const;

const authSchemas = {
	[AUTH_TYPES.NONE]: z.object({}),
	[AUTH_TYPES.TOKEN]: z.object({
		token: z.string().min(1, "Token is required"),
	}),
	[AUTH_TYPES.API_KEY]: z.object({
		key: z.string().min(1, "Key name is required"),
		value: z.string().min(1, "API key value is required"),
		location: z.enum([API_KEY_LOCATIONS.HEADER, API_KEY_LOCATIONS.QUERY]),
	}),
	[AUTH_TYPES.BASIC]: z.object({
		username: z.string().min(1, "Username is required"),
		password: z.string().min(1, "Password is required"),
	}),
};

const connectionSchema = z.object({
	name: z.string().min(1, "Name is required"),
	description: z.string().optional(),
	baseUrl: z.string().url("Must be a valid URL"),
	auth: z.object({
		type: z.enum([
			AUTH_TYPES.NONE,
			AUTH_TYPES.TOKEN,
			AUTH_TYPES.API_KEY,
			AUTH_TYPES.BASIC,
		]),
		config: z.union([
			authSchemas.none,
			authSchemas.token,
			authSchemas.api_key,
			authSchemas.basic,
		]),
	}),
});

type ConnectionFormData = z.infer<typeof connectionSchema>;

interface ConnectionFormProps {
	initialData?: Connection;
	onSubmit: (data: ConnectionCreate) => Promise<void>;
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
			baseUrl: initialData?.base_url ?? "",
			auth: {
				type: AUTH_TYPES.NONE,
				config: {},
			},
		},
	});

	const authType = form.watch("auth.type");

	const handleSubmit = useCallback(
		async (formData: ConnectionFormData) => {
			try {
				// Transform the data to match the API's expected format
				const submissionData: ConnectionCreate = {
					name: formData.name,
					description: formData.description,
					base_url: formData.baseUrl,
					kind: "api", // This should match the connection type
					auth: formData.auth.config,
				};

				await onSubmit(submissionData);
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
					name="baseUrl"
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

				<FormField
					control={form.control}
					name="auth.type"
					render={({ field }) => (
						<FormItem>
							<FormLabel>Authentication Type</FormLabel>
							<Select onValueChange={field.onChange} defaultValue={field.value}>
								<FormControl>
									<SelectTrigger>
										<SelectValue placeholder="Select authentication type" />
									</SelectTrigger>
								</FormControl>
								<SelectContent>
									<SelectItem value={AUTH_TYPES.NONE}>
										No Authentication
									</SelectItem>
									<SelectItem value={AUTH_TYPES.TOKEN}>Bearer Token</SelectItem>
									<SelectItem value={AUTH_TYPES.API_KEY}>API Key</SelectItem>
									<SelectItem value={AUTH_TYPES.BASIC}>Basic Auth</SelectItem>
								</SelectContent>
							</Select>
							<FormMessage />
						</FormItem>
					)}
				/>

				{authType === AUTH_TYPES.TOKEN && (
					<FormField
						control={form.control}
						name="auth.config.token"
						render={({ field }) => (
							<FormItem>
								<FormLabel>Bearer Token</FormLabel>
								<FormControl>
									<Input
										type="password"
										placeholder="Enter your bearer token"
										{...field}
									/>
								</FormControl>
								<FormDescription>
									The token will be sent in the Authorization header
								</FormDescription>
								<FormMessage />
							</FormItem>
						)}
					/>
				)}

				{authType === AUTH_TYPES.API_KEY && (
					<>
						<FormField
							control={form.control}
							name="auth.config.key"
							render={({ field }) => (
								<FormItem>
									<FormLabel>Key Name</FormLabel>
									<FormControl>
										<Input placeholder="X-API-Key" {...field} />
									</FormControl>
									<FormDescription>
										The name of the header or query parameter
									</FormDescription>
									<FormMessage />
								</FormItem>
							)}
						/>

						<FormField
							control={form.control}
							name="auth.config.value"
							render={({ field }) => (
								<FormItem>
									<FormLabel>API Key</FormLabel>
									<FormControl>
										<Input
											type="password"
											placeholder="Enter your API key"
											{...field}
										/>
									</FormControl>
									<FormMessage />
								</FormItem>
							)}
						/>

						<FormField
							control={form.control}
							name="auth.config.location"
							render={({ field }) => (
								<FormItem className="space-y-3">
									<FormLabel>Location</FormLabel>
									<FormControl>
										<RadioGroup
											onValueChange={field.onChange}
											defaultValue={field.value}
											className="flex flex-col space-y-1"
										>
											<FormItem className="flex items-center space-x-3 space-y-0">
												<FormControl>
													<RadioGroupItem value={API_KEY_LOCATIONS.HEADER} />
												</FormControl>
												<FormLabel className="font-normal">Header</FormLabel>
											</FormItem>
											<FormItem className="flex items-center space-x-3 space-y-0">
												<FormControl>
													<RadioGroupItem value={API_KEY_LOCATIONS.QUERY} />
												</FormControl>
												<FormLabel className="font-normal">
													Query Parameter
												</FormLabel>
											</FormItem>
										</RadioGroup>
									</FormControl>
									<FormMessage />
								</FormItem>
							)}
						/>
					</>
				)}

				{authType === AUTH_TYPES.BASIC && (
					<>
						<FormField
							control={form.control}
							name="auth.config.username"
							render={({ field }) => (
								<FormItem>
									<FormLabel>Username</FormLabel>
									<FormControl>
										<Input placeholder="Enter username" {...field} />
									</FormControl>
									<FormMessage />
								</FormItem>
							)}
						/>

						<FormField
							control={form.control}
							name="auth.config.password"
							render={({ field }) => (
								<FormItem>
									<FormLabel>Password</FormLabel>
									<FormControl>
										<Input
											type="password"
											placeholder="Enter password"
											{...field}
										/>
									</FormControl>
									<FormMessage />
								</FormItem>
							)}
						/>
					</>
				)}

				<Button type="submit" disabled={isSubmitting}>
					{isSubmitting ? "Saving..." : initialData ? "Update" : "Create"}
				</Button>
			</form>
		</Form>
	);
}
