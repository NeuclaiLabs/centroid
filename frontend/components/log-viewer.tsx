import { useEffect, useState, useRef, useCallback, useMemo } from "react";
import { Button } from "./ui/button";
import {
	Card,
	CardContent,
	CardHeader,
	CardTitle,
	CardDescription,
	CardFooter,
} from "./ui/card";
import { ScrollArea } from "./ui/scroll-area";
import { Label } from "./ui/label";
import { Input } from "./ui/input";
import { Badge } from "./ui/badge";
import { Checkbox } from "./ui/checkbox";
import { Filter, AlertCircle, Info, Search } from "lucide-react";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuLabel,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from "./ui/dropdown-menu";

interface LogViewerProps {
	initialLogFile?: string;
	initialFormat?: "text" | "json";
	maxHeight?: string;
	initialMaxLines?: number;
	maxStoredLogs?: number;
	fullHeight?: boolean;
}

type LogLevel = "DEBUG" | "INFO" | "WARNING" | "ERROR" | "CRITICAL";
type LogFilter = { level: LogLevel; enabled: boolean };

// Define a proper type for JSON log entries
interface LogEntry {
	timestamp: string;
	level: LogLevel;
	name: string;
	message: string;
	module?: string;
	function?: string;
	line?: number;
	exception?: string;
	[key: string]: string | number | boolean | null | undefined; // More specific type for additional fields
}

export function LogViewer({
	initialLogFile = "app.log",
	initialFormat = "text",
	maxHeight = "calc(100vh - 200px)",
	initialMaxLines = 100,
	maxStoredLogs = 10000,
	fullHeight = false,
}: LogViewerProps) {
	const [logFile] = useState(initialLogFile);
	const [format] = useState<"text" | "json">(initialFormat);
	const [follow] = useState(true);
	const [maxLines] = useState(initialMaxLines);
	const [logs, setLogs] = useState<string[]>([]);
	const [isStreaming, setIsStreaming] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const [searchQuery, setSearchQuery] = useState("");
	const [filters, setFilters] = useState<LogFilter[]>([
		{ level: "DEBUG", enabled: true },
		{ level: "INFO", enabled: true },
		{ level: "WARNING", enabled: true },
		{ level: "ERROR", enabled: true },
		{ level: "CRITICAL", enabled: true },
	]);

	const scrollAreaRef = useRef<HTMLDivElement>(null);
	const abortControllerRef = useRef<AbortController | null>(null);
	const logsRef = useRef<string[]>([]);

	// Auto-scroll to bottom whenever logs change and follow is true
	const scrollToBottom = useCallback(() => {
		if (!follow) return;

		const scrollContainer = scrollAreaRef.current?.querySelector(
			"[data-radix-scroll-area-viewport]",
		);
		if (scrollContainer) {
			// Since logs are now prepended, we scroll to the top instead of bottom
			scrollContainer.scrollTop = 0;
		}
	}, [follow]);

	// Prepend new logs to the front instead of appending to the end
	// Only keep up to maxStoredLogs to prevent memory issues
	const addNewLogs = useCallback(
		(newLines: string[]) => {
			setLogs((prev) => {
				const combined = [...newLines, ...prev];
				// Limit to maxStoredLogs if needed
				return combined.length > maxStoredLogs
					? combined.slice(0, maxStoredLogs)
					: combined;
			});
		},
		[maxStoredLogs],
	);

	// Define startStreaming with useCallback
	const startStreaming = useCallback(async () => {
		// Reset state
		setLogs([]);
		setError(null);

		// Cancel any existing stream
		if (abortControllerRef.current) {
			abortControllerRef.current.abort();
		}

		// Create a new abort controller
		abortControllerRef.current = new AbortController();

		try {
			setIsStreaming(true);

			// Build URL with query params
			const url = new URL("/api/logs/stream", window.location.origin);
			url.searchParams.append("log_file", logFile);
			// Request a much larger initial set of logs
			url.searchParams.append("max_lines", "500");
			url.searchParams.append("follow", follow.toString());

			// Start fetch request with the abort signal
			const response = await fetch(url.toString(), {
				signal: abortControllerRef.current.signal,
			});

			if (!response.ok) {
				throw new Error(
					`HTTP error ${response.status}: ${response.statusText}`,
				);
			}

			// Get the reader from the response body
			const reader = response.body?.getReader();
			if (!reader) {
				throw new Error("Response body reader is not available");
			}

			// Process the stream
			const decoder = new TextDecoder();
			let buffer = "";

			while (true) {
				const { done, value } = await reader.read();

				if (done) {
					setIsStreaming(false);
					break;
				}

				// Decode the chunk and add it to our buffer
				const chunk = decoder.decode(value, { stream: true });
				buffer += chunk;

				// Split by newlines and update state
				const lines = buffer.split("\n");
				buffer = lines.pop() || ""; // Keep the last incomplete line in the buffer

				if (lines.length > 0) {
					// Use the new addNewLogs function
					addNewLogs(lines);
				}
			}
		} catch (error) {
			const err = error as Error;
			if (err.name !== "AbortError") {
				console.error("Error streaming logs:", err);
				setError(err.message || "Unknown error occurred");
			}
			setIsStreaming(false);
		}
	}, [logFile, follow, addNewLogs]);

	// Update logs ref and scroll when logs change
	useEffect(() => {
		logsRef.current = logs;
		scrollToBottom();
	}, [logs, scrollToBottom]);

	// Cleanup stream on unmount
	useEffect(() => {
		return () => {
			if (abortControllerRef.current) {
				abortControllerRef.current.abort();
				setIsStreaming(false);
			}
		};
	}, []);

	// Start streaming logs automatically on mount
	useEffect(() => {
		// Start streaming when component mounts or when streaming parameters change
		startStreaming();

		// Cleanup function will be handled by the separate cleanup effect
	}, [startStreaming]); // Dependencies are now encapsulated in startStreaming

	const stopStreaming = () => {
		if (abortControllerRef.current) {
			abortControllerRef.current.abort();
			abortControllerRef.current = null;
			setIsStreaming(false);
		}
	};

	const downloadLogs = () => {
		const blob = new Blob([logs.join("\n")], { type: "text/plain" });
		const url = URL.createObjectURL(blob);
		const a = document.createElement("a");
		a.href = url;
		a.download = `${logFile}-${new Date().toISOString()}.log`;
		document.body.appendChild(a);
		a.click();
		document.body.removeChild(a);
		URL.revokeObjectURL(url);
	};

	const toggleFilter = (level: LogLevel) => {
		setFilters((prev) =>
			prev.map((filter) =>
				filter.level === level
					? { ...filter, enabled: !filter.enabled }
					: filter,
			),
		);
	};

	// Filter and search logs
	const filteredLogs = useMemo(() => {
		// Filter logs based on criteria
		return logs.filter((log) => {
			// Apply level filters for JSON logs
			if (format === "json") {
				try {
					const parsed = JSON.parse(log);
					const level = parsed.level as LogLevel;
					const shouldShow = filters.some(
						(filter) => filter.level === level && filter.enabled,
					);

					// Apply search filter if provided
					if (searchQuery) {
						return (
							shouldShow &&
							JSON.stringify(parsed)
								.toLowerCase()
								.includes(searchQuery.toLowerCase())
						);
					}

					return shouldShow;
				} catch (e) {
					// If parsing fails, include the log if no search query or if it matches
					return (
						!searchQuery ||
						log.toLowerCase().includes(searchQuery.toLowerCase())
					);
				}
			}

			// For text logs, apply search filter and try to detect log levels
			if (
				searchQuery &&
				!log.toLowerCase().includes(searchQuery.toLowerCase())
			) {
				return false;
			}

			// Try to detect log level in text logs
			for (const filter of filters) {
				if (
					(!filter.enabled && log.includes(`"${filter.level}"`)) ||
					log.includes(` ${filter.level} `)
				) {
					return false;
				}
			}

			return true;
		});
	}, [logs, filters, searchQuery, format]);

	// Parse JSON logs for formatted view
	const formattedLogs = useMemo(() => {
		if (format !== "json") {
			return filteredLogs;
		}

		return filteredLogs.map((log) => {
			try {
				const parsed = JSON.parse(log);
				return parsed;
			} catch (e) {
				return log;
			}
		});
	}, [filteredLogs, format]);

	// Render a formatted log entry
	const renderLogEntry = (log: string | LogEntry, index: number) => {
		if (typeof log === "string") {
			return (
				<div
					key={`log-${index}-${typeof log === "string" ? log.substring(0, 8) : index}`}
					className="whitespace-pre-wrap py-1 border-b border-muted-foreground/10 text-xs"
				>
					{log}
				</div>
			);
		}

		// If it's a parsed JSON object
		const level = log.level;
		const levelColors = {
			DEBUG: "bg-blue-100 text-blue-800",
			INFO: "bg-green-100 text-green-800",
			WARNING: "bg-yellow-100 text-yellow-800",
			ERROR: "bg-red-100 text-red-800",
			CRITICAL: "bg-red-200 text-red-900",
		};

		return (
			<div
				key={`log-${index}-${log.timestamp || index}`}
				className="py-2 border-b border-muted-foreground/10 hover:bg-muted/30"
			>
				<div className="flex items-center gap-2 mb-1">
					<Badge
						variant="outline"
						className={levelColors[level] || "bg-gray-100"}
					>
						{level}
					</Badge>
					<span className="text-xs text-muted-foreground">{log.timestamp}</span>
					<span className="text-xs font-medium">{log.name || ""}</span>
				</div>
				<div className="font-medium text-sm">{log.message}</div>
				<div className="mt-1 text-xs text-muted-foreground">
					{log.module && <span className="mr-2">Module: {log.module}</span>}
					{log.function && (
						<span className="mr-2">Function: {log.function}</span>
					)}
					{log.line && <span>Line: {log.line}</span>}
				</div>
				{log.exception && (
					<div className="mt-1 text-xs text-red-500 whitespace-pre-wrap">
						{log.exception}
					</div>
				)}
			</div>
		);
	};

	return (
		<Card className={`w-full ${fullHeight ? "h-full flex flex-col" : ""}`}>
			<CardHeader className="pb-0">
				<div className="flex items-center justify-between">
					<div>
						<CardTitle>Log Viewer</CardTitle>
						<CardDescription>
							Stream and view application logs in real-time
						</CardDescription>
					</div>
					<div className="flex gap-2">
						<DropdownMenu>
							<DropdownMenuTrigger asChild>
								<Button variant="outline" size="sm" className="gap-1">
									<Filter className="h-4 w-4" /> Filter
								</Button>
							</DropdownMenuTrigger>
							<DropdownMenuContent align="end">
								<DropdownMenuLabel>Log Levels</DropdownMenuLabel>
								<DropdownMenuSeparator />
								{filters.map((filter) => (
									<DropdownMenuItem
										key={filter.level}
										onSelect={(e) => e.preventDefault()}
									>
										<div className="flex items-center gap-2">
											<Checkbox
												id={`filter-${filter.level}`}
												checked={filter.enabled}
												onCheckedChange={() => toggleFilter(filter.level)}
											/>
											<Label
												htmlFor={`filter-${filter.level}`}
												className="cursor-pointer"
											>
												{filter.level}
											</Label>
										</div>
									</DropdownMenuItem>
								))}
							</DropdownMenuContent>
						</DropdownMenu>
					</div>
				</div>
			</CardHeader>
			<CardContent
				className={`space-y-4 pt-4 ${fullHeight ? "flex-1 flex flex-col" : ""}`}
			>
				<div className="relative w-full">
					<Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
					<Input
						placeholder="Search logs..."
						className="pl-8"
						value={searchQuery}
						onChange={(e) => setSearchQuery(e.target.value)}
					/>
				</div>

				{error && (
					<div className="flex items-center gap-2 text-destructive p-2 border border-destructive/20 rounded-md bg-destructive/10">
						<AlertCircle className="h-4 w-4" />
						{error}
					</div>
				)}

				{isStreaming && (
					<div className="text-primary flex items-center gap-2 justify-center py-2 sticky top-0 bg-muted/80 backdrop-blur-sm z-10">
						<div className="h-2 w-2 rounded-full bg-primary animate-pulse" />
						<span className="text-xs animate-pulse">Streaming logs...</span>
					</div>
				)}

				<ScrollArea
					className={`border rounded-md p-4 bg-muted/50 font-mono ${fullHeight ? "flex-1" : ""}`}
					style={
						fullHeight ? { height: "calc(100vh - 300px)" } : { height: "70vh" }
					}
					ref={scrollAreaRef}
					type="always"
				>
					{filteredLogs.length === 0 ? (
						<div className="text-muted-foreground p-2 text-center flex flex-col items-center justify-center gap-2">
							<Info className="h-5 w-5" />
							<span>No logs to display</span>
							<span className="text-xs">
								{logs.length > 0
									? "All logs filtered out by current filters"
									: "Waiting for logs..."}
							</span>
						</div>
					) : (
						<div className="space-y-1 w-full">
							{format === "json"
								? formattedLogs.map((log, i) => renderLogEntry(log, i))
								: filteredLogs.map((line, i) => (
										<div
											key={`log-${i}-${line.substring(0, 8)}`}
											className="whitespace-pre-wrap text-xs py-0.5 w-full"
										>
											{line}
										</div>
									))}
						</div>
					)}
				</ScrollArea>
			</CardContent>
			<CardFooter className="text-xs text-muted-foreground">
				<div className="flex justify-between w-full">
					<div>
						{filteredLogs.length} logs displayed | {logs.length} total
						{logs.length >= maxStoredLogs && " (max capacity reached)"}
					</div>
					<div>{isStreaming ? "Streaming active" : "Stream inactive"}</div>
				</div>
			</CardFooter>
		</Card>
	);
}
