import { useEffect, useState, useRef, useCallback, useMemo } from "react";
import { Button } from "../../../components/ui/button";
import {
	Card,
	CardContent,
	CardHeader,
	CardTitle,
	CardDescription,
	CardFooter,
} from "../../../components/ui/card";
import { ScrollArea } from "../../../components/ui/scroll-area";
import { Label } from "../../../components/ui/label";
import { Input } from "../../../components/ui/input";
import { Badge } from "../../../components/ui/badge";
import { Checkbox } from "../../../components/ui/checkbox";
import {
	Filter,
	AlertCircle,
	Info,
	Search,
	Pause,
	Play,
	Download,
	RefreshCw,
} from "lucide-react";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuLabel,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from "../../../components/ui/dropdown-menu";

interface LogViewerProps {
	initialLogFile?: string;
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
	maxHeight = "calc(100vh - 200px)",
	initialMaxLines = 100,
	maxStoredLogs = 10000,
	fullHeight = false,
}: LogViewerProps) {
	const [logFile] = useState(initialLogFile);
	const [follow, setFollow] = useState(false); // Start with follow disabled
	const [maxLines] = useState(initialMaxLines);
	const [logs, setLogs] = useState<string[]>([]);
	const [isStreaming, setIsStreaming] = useState(false);
	const [isLoading, setIsLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);
	const [searchQuery, setSearchQuery] = useState("");
	const [latestTimestamp, setLatestTimestamp] = useState<string | null>(null);
	const [filters, setFilters] = useState<LogFilter[]>([
		{ level: "DEBUG", enabled: true },
		{ level: "INFO", enabled: true },
		{ level: "WARNING", enabled: true },
		{ level: "ERROR", enabled: true },
		{ level: "CRITICAL", enabled: true },
	]);

	const scrollAreaRef = useRef<HTMLDivElement>(null);
	const abortControllerRef = useRef<AbortController | null>(null);

	// Parse and extract timestamp from a log entry
	const extractTimestamp = useCallback(
		(logEntry: LogEntry | Record<string, unknown>): string | null => {
			if (!logEntry || !logEntry.timestamp) return null;

			try {
				// Handle different timestamp formats
				if (typeof logEntry.timestamp === "string") {
					// Already an ISO string, just return it
					return logEntry.timestamp;
				}
				if (typeof logEntry.timestamp === "number") {
					// Convert Unix timestamp to ISO string
					return new Date(logEntry.timestamp * 1000).toISOString();
				}
			} catch (e) {
				console.error("Error extracting timestamp:", e);
			}
			return null;
		},
		[],
	);

	// Prepend new logs to the front instead of appending to the end
	// Only keep up to maxStoredLogs to prevent memory issues
	const addNewLogs = useCallback(
		(newLines: string[]) => {
			// For streaming updates, backend returns logs in chronological order (oldest first)
			// We need to reverse them to show newest first
			const reversedLines = [...newLines].reverse();

			setLogs((prev) => {
				const combined = [...reversedLines, ...prev];
				// Limit to maxStoredLogs if needed
				return combined.length > maxStoredLogs
					? combined.slice(0, maxStoredLogs)
					: combined;
			});

			// Update latest timestamp using the newest log (after reversing, it's at index 0)
			if (newLines.length > 0) {
				try {
					// The newest log is the last one from the backend (first after reversing)
					const newestLog = JSON.parse(reversedLines[0]);
					const timestamp = extractTimestamp(newestLog);
					if (timestamp !== null) {
						setLatestTimestamp(timestamp);
					}
				} catch (e) {
					// If parsing fails, don't update the timestamp
				}
			}
		},
		[maxStoredLogs, extractTimestamp],
	);

	// Load initial logs synchronously (non-streaming)
	const loadInitialLogs = useCallback(async () => {
		setIsLoading(true);
		setError(null);

		try {
			// Build URL with query params for non-streaming initial load
			const url = new URL("/api/logs/stream", window.location.origin);
			url.searchParams.append("log_file", logFile);
			url.searchParams.append("max_lines", maxLines.toString());
			url.searchParams.append("follow", "false"); // Explicitly request non-streaming

			const response = await fetch(url.toString());

			if (!response.ok) {
				throw new Error(
					`HTTP error ${response.status}: ${response.statusText}`,
				);
			}

			const text = await response.text();
			let lines = text.split("\n").filter((line) => line.trim());

			// Backend returns logs in chronological order (oldest first, newest last)
			// We need to reverse them to show newest first
			lines = lines.reverse();

			// Set logs and update the timestamp of the newest log
			if (lines.length > 0) {
				setLogs(lines);

				// Try to find the latest timestamp from the newest log (now at index 0 after reversing)
				try {
					const newestLog = JSON.parse(lines[0]);
					const timestamp = extractTimestamp(newestLog);
					if (timestamp !== null) {
						console.log(
							"Setting latest timestamp from initial load:",
							timestamp,
						);
						setLatestTimestamp(timestamp);
					}
				} catch (e) {
					console.error("Error parsing newest log for timestamp:", e);
					// If parsing fails, don't update the timestamp
				}
			}
		} catch (error) {
			const err = error as Error;
			console.error("Error loading initial logs:", err);
			setError(err.message || "Failed to load logs");
		} finally {
			setIsLoading(false);
		}
	}, [logFile, maxLines, extractTimestamp]);

	// Stream logs with useCallback
	const streamLogs = useCallback(async () => {
		// Cancel any existing stream
		if (abortControllerRef.current) {
			abortControllerRef.current.abort();
			abortControllerRef.current = null;
		}

		// Don't start a new stream if we're already streaming
		if (isStreaming) return;

		// Create a new abort controller
		abortControllerRef.current = new AbortController();

		try {
			setIsStreaming(true);
			setError(null);

			// Build URL with query params
			const url = new URL("/api/logs/stream", window.location.origin);
			url.searchParams.append("log_file", logFile);
			url.searchParams.append("follow", "true");

			// Use the latest timestamp if available to only get new logs
			if (latestTimestamp) {
				console.log("Streaming logs since timestamp:", latestTimestamp);
				// Make sure the since parameter is explicitly set
				url.searchParams.set("since", latestTimestamp);
			} else {
				// If no timestamp is available, get the last few logs
				console.log(
					"No timestamp available for streaming, using max_lines instead",
				);
				url.searchParams.append("max_lines", "50");
			}

			// Log the complete request URL for debugging
			console.log("Streaming logs URL:", url.toString());

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
	}, [logFile, latestTimestamp, addNewLogs, isStreaming]);

	// Refresh logs and update timestamp for streaming
	const refreshLogs = useCallback(() => {
		// Reset timestamp to get a fresh set of logs
		setLatestTimestamp(null);
		loadInitialLogs();
	}, [loadInitialLogs]);

	// Toggle streaming state with proper timestamp
	const toggleStreaming = useCallback(() => {
		// If we're enabling streaming and don't have a timestamp,
		// but we have logs, try to extract the latest timestamp
		if (!follow && !latestTimestamp && logs.length > 0) {
			try {
				// Get the newest log (first in the reversed array)
				const newestLog = JSON.parse(logs[0]);
				const timestamp = extractTimestamp(newestLog);
				if (timestamp !== null) {
					console.log(
						"Setting timestamp before enabling streaming:",
						timestamp,
					);
					setLatestTimestamp(timestamp);
					// We'll set follow in the next tick after the timestamp is set
					setTimeout(() => setFollow(true), 0);
					return;
				}
			} catch (e) {
				console.error("Error extracting timestamp before streaming:", e);
			}
		}

		// Normal toggle if we don't need to set timestamp
		setFollow((prevFollow) => !prevFollow);
	}, [follow, latestTimestamp, logs, extractTimestamp]);

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
					!searchQuery || log.toLowerCase().includes(searchQuery.toLowerCase())
				);
			}
		});
	}, [logs, filters, searchQuery]);

	// Parse JSON logs for formatted view
	const formattedLogs = useMemo(() => {
		return filteredLogs.map((log) => {
			try {
				return JSON.parse(log);
			} catch (e) {
				return log;
			}
		});
	}, [filteredLogs]);

	// Cleanup stream on unmount
	useEffect(() => {
		return () => {
			if (abortControllerRef.current) {
				abortControllerRef.current.abort();
				setIsStreaming(false);
			}
		};
	}, []);

	// Load initial logs on mount
	useEffect(() => {
		loadInitialLogs();
	}, [loadInitialLogs]);

	// Toggle streaming state when follow changes
	useEffect(() => {
		// Only handle changes if isLoading is false (initial load completed)
		if (isLoading) return;

		if (follow) {
			// Only start streaming if we're not already streaming
			if (!isStreaming) {
				streamLogs();
			}
		} else {
			stopStreaming();
		}
	}, [follow, streamLogs, isStreaming, isLoading]);

	const stopStreaming = useCallback(() => {
		if (abortControllerRef.current) {
			abortControllerRef.current.abort();
			abortControllerRef.current = null;
			setIsStreaming(false);
		}
	}, []);

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
						<CardDescription>View and manage application logs</CardDescription>
					</div>
					<div className="flex gap-2">
						<Button
							variant="outline"
							size="sm"
							onClick={toggleStreaming}
							disabled={isLoading}
							className="gap-1"
						>
							{follow ? (
								<>
									<Pause className="h-4 w-4" /> Pause
								</>
							) : (
								<>
									<Play className="h-4 w-4" /> Live
								</>
							)}
						</Button>

						<Button
							variant="outline"
							size="sm"
							onClick={refreshLogs}
							disabled={isLoading || isStreaming}
							className="gap-1"
						>
							<RefreshCw className="h-4 w-4" /> Refresh
						</Button>

						<Button
							variant="outline"
							size="sm"
							onClick={downloadLogs}
							disabled={logs.length === 0}
							className="gap-1"
						>
							<Download className="h-4 w-4" /> Download
						</Button>

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

				{isLoading ? (
					<div className="text-primary flex items-center gap-2 justify-center py-4">
						<div className="h-2 w-2 rounded-full bg-primary animate-pulse" />
						<span className="text-xs animate-pulse">Loading logs...</span>
					</div>
				) : (
					isStreaming && (
						<div className="text-primary flex items-center gap-2 justify-center py-2 sticky top-0 bg-muted/80 backdrop-blur-sm z-10">
							<div className="h-2 w-2 rounded-full bg-primary animate-pulse" />
							<span className="text-xs animate-pulse">Streaming logs...</span>
						</div>
					)
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
									: isLoading
										? "Loading logs..."
										: "No logs available"}
							</span>
						</div>
					) : (
						<div className="space-y-1 w-full">
							{formattedLogs.map((log, i) => renderLogEntry(log, i))}
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
					<div>
						{isLoading
							? "Loading logs..."
							: isStreaming
								? "Live streaming"
								: "Paused"}
					</div>
				</div>
			</CardFooter>
		</Card>
	);
}
