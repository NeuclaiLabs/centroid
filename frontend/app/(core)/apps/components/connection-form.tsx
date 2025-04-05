import { useCallback, useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import React from "react";

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
import type { Connection, ConnectionCreate } from "../../types";
import { AuthType } from "../../types";
import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import {
	createConnection,
	updateConnection,
	useConnection,
	useConnections,
} from "../hooks/use-connections";

const AUTH_TYPES = {
	NONE: AuthType.NONE,
	TOKEN: AuthType.TOKEN,
	API_KEY: AuthType.API_KEY,
	BASIC: AuthType.BASIC,
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
	auth: z.discriminatedUnion("type", [
		z.object({
			type: z.literal(AUTH_TYPES.NONE),
			config: authSchemas[AUTH_TYPES.NONE],
		}),
		z.object({
			type: z.literal(AUTH_TYPES.TOKEN),
			config: authSchemas[AUTH_TYPES.TOKEN],
		}),
		z.object({
			type: z.literal(AUTH_TYPES.API_KEY),
			config: authSchemas[AUTH_TYPES.API_KEY],
		}),
		z.object({
			type: z.literal(AUTH_TYPES.BASIC),
			config: authSchemas[AUTH_TYPES.BASIC],
		}),
	]),
});

type ConnectionFormData = z.infer<typeof connectionSchema>;

interface ConnectionFormProps {
	appId: string;
	initialData?: Connection;
	onSuccess?: () => void;
	isSubmitting?: boolean;
}

export function ConnectionForm({
	appId,
	initialData,
	onSuccess,
	isSubmitting: externalIsSubmitting,
}: ConnectionFormProps): JSX.Element {
	const [isSubmitting, setIsSubmitting] = useState(false);
	const form = useForm<ConnectionFormData>({
		resolver: zodResolver(connectionSchema),
		defaultValues: {
			name: initialData?.name ?? "",
			description: initialData?.description ?? "",
			baseUrl: initialData?.baseUrl ?? "",
			auth: {
				type: initialData?.auth?.type ?? AUTH_TYPES.NONE,
				config: initialData?.auth?.type
					? {
							...initialData.auth.config,
						}
					: {},
			} as ConnectionFormData["auth"],
		},
		mode: "onChange",
	});


	// Reset auth config when auth type changes
	const authType = form.watch("auth.type");
	useEffect(() => {
		const defaultConfigs = {
			[AUTH_TYPES.NONE]: {},
			[AUTH_TYPES.TOKEN]: { token: "" },
			[AUTH_TYPES.API_KEY]: {
				key: "",
				value: "",
				location: API_KEY_LOCATIONS.HEADER,
			},
			[AUTH_TYPES.BASIC]: { username: "", password: "" },
		} as const;


		// Only set default config for new connections or when auth type changes for existing ones
		if (!initialData || initialData?.auth?.type !== authType) {
			form.setValue("auth.type", authType, { shouldValidate: false });
			form.setValue("auth.config", defaultConfigs[authType], {
				shouldValidate: true,
			});
		}
	}, [form, authType, initialData]);

	const onSubmit = useCallback(
		async (data: ConnectionFormData) => {
			try {
				setIsSubmitting(true);

				// Ensure we have the correct auth config based on the auth type
				const formattedData = {
					...data,
					auth: {
						type: data.auth.type,
						config: data.auth.type === AUTH_TYPES.NONE ? {} : data.auth.config,
					},
				};


				if (initialData?.id) {
					await updateConnection(initialData.id, formattedData);
					toast.success("Connection updated successfully");
				} else {
					const submissionData = {
						...formattedData,
						appId,
					};
					await createConnection(submissionData);
					toast.success("Connection created successfully");
				}
				onSuccess?.();
			} catch (error) {
				console.error("Form submission error:", error);
				toast.error(
					error instanceof Error ? error.message : "Failed to save connection",
				);
			} finally {
				setIsSubmitting(false);
			}
		},
		[appId, initialData?.id, onSuccess],
	);

	const isProcessing = externalIsSubmitting || isSubmitting;

	return (
		<Form {...form}>
			<form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
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
							<Select onValueChange={field.onChange} value={field.value}>
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
											value={field.value}
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

				<Button type="submit" disabled={isProcessing}>
					{isProcessing
						? "Saving..."
						: initialData
							? "Update Connection"
							: "Create Connection"}
				</Button>
			</form>
		</Form>
	);
}

interface ConnectionDialogProps {
	appId: string;
	isOpen: boolean;
	onOpenChange: (open: boolean) => void;
	connectionId?: string;
	onSelectConnection: (connectionId?: string) => void;
}

export function ConnectionDialog({
	appId,
	isOpen,
	onOpenChange,
	connectionId,
	onSelectConnection,
}: ConnectionDialogProps) {
	const { connections, isLoading: isLoadingConnections } = useConnections({
		appId,
	});
	const { connection, isLoading: isLoadingConnection } = useConnection(
		connectionId ?? "",
	);


	// If we're opening the dialog and there's exactly one connection, use that
	useEffect(() => {
		if (isOpen && !connectionId && connections.length === 1) {
			// Auto-select the only connection
			onSelectConnection(connections[0].id);
		}
	}, [isOpen, connectionId, connections, onSelectConnection]);

	const isLoading = isLoadingConnections || isLoadingConnection;

	if (isLoading) {
		return (
			<Dialog open={isOpen} onOpenChange={onOpenChange}>
				<DialogContent className="sm:max-w-[600px]">
					<DialogHeader>
						<DialogTitle className="text-center">Loading...</DialogTitle>
					</DialogHeader>
				</DialogContent>
			</Dialog>
		);
	}

	// If there's no specific connection selected and we have multiple connections,
	// show the connection list
	if (!connectionId && connections.length > 0) {
		return (
			<Dialog open={isOpen} onOpenChange={onOpenChange}>
				<DialogContent className="sm:max-w-[600px]">
					<DialogHeader>
						<DialogTitle className="text-center">Select Connection</DialogTitle>
					</DialogHeader>
					<div className="grid gap-4">
						{connections.map((conn) => (
							<Button
								key={conn.id}
								variant="outline"
								className="flex flex-col items-start p-4 h-auto"
								onClick={() => onSelectConnection(conn.id)}
							>
								<div className="font-medium">{conn.name}</div>
								{conn.description && (
									<div className="text-sm text-muted-foreground mt-1">
										{conn.description}
									</div>
								)}
							</Button>
						))}
						<Button onClick={() => onSelectConnection()}>
							Create New Connection
						</Button>
					</div>
				</DialogContent>
			</Dialog>
		);
	}

	return (
		<Dialog open={isOpen} onOpenChange={onOpenChange}>
			<DialogContent className="sm:max-w-[600px] max-h-[85vh] flex flex-col">
				<DialogHeader className="flex-none">
					<DialogTitle className="text-center">
						{connectionId ? "Edit Connection" : "Create Connection"}
					</DialogTitle>
				</DialogHeader>
				<div className="flex-1 min-h-0 overflow-y-auto pr-1">
					<ConnectionForm
						appId={appId}
						initialData={connection}
						onSuccess={() => onOpenChange(false)}
					/>
				</div>
			</DialogContent>
		</Dialog>
	);
}
