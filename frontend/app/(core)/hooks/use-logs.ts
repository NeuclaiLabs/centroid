import useSWR from 'swr';
import { useState } from 'react';

interface LogsResponse {
  error?: string;
}

interface UseLogsOptions {
  refreshInterval?: number;
}

const defaultOptions: UseLogsOptions = {
  refreshInterval: 10000, // 10 seconds
};

/**
 * Custom hook for accessing system logs
 */
export function useLogs(options: UseLogsOptions = defaultOptions) {
  // Fetch available log files


  // State for streaming logs
  const [isStreaming, setIsStreaming] = useState(false);
  const [streamError, setStreamError] = useState<string | null>(null);
  const [logContent, setLogContent] = useState<string[]>([]);

  // Function to start streaming logs
  const startStreaming = async (
    logFile = 'app.log',
    format = 'text',
    maxLines = 100,
    follow = true,
  ) => {
    try {
      setIsStreaming(true);
      setStreamError(null);
      setLogContent([]);

      // Build the URL with query parameters
      const url = new URL('/api/logs/stream', window.location.origin);
      url.searchParams.append('log_file', logFile);
      url.searchParams.append('format', format);
      url.searchParams.append('max_lines', maxLines.toString());
      url.searchParams.append('follow', follow.toString());

      const response = await fetch(url.toString());

      if (!response.ok) {
        const errorData = await response.json();
        setStreamError(errorData.error || `Error ${response.status}`);
        setIsStreaming(false);
        return;
      }

      // Handle the streaming response
      const reader = response.body?.getReader();
      if (!reader) {
        setStreamError('Failed to initialize log stream reader');
        setIsStreaming(false);
        return;
      }

      // Process the stream
      const decoder = new TextDecoder();
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();

        if (done) {
          // Last piece of buffer
          if (buffer.length > 0) {
            setLogContent((prev) => [...prev, buffer]);
          }
          break;
        }

        // Decode the chunk and split by newlines
        const chunk = decoder.decode(value, { stream: true });
        buffer += chunk;

        // Process complete lines
        const lines = buffer.split('\n');
        buffer = lines.pop() || ''; // Keep the last incomplete line

        if (lines.length > 0) {
          setLogContent((prev) => [...prev, ...lines]);
        }
      }
    } catch (error) {
      setStreamError(
        error instanceof Error ? error.message : 'Unknown error occurred',
      );
    } finally {
      setIsStreaming(false);
    }
  };

  // Function to stop streaming
  const stopStreaming = () => {
    setIsStreaming(false);
  };

  // Clear log content
  const clearLogs = () => {
    setLogContent([]);
  };

  return {

    // Log streaming
    isStreaming,
    streamError,
    logContent,
    startStreaming,
    stopStreaming,
    clearLogs,
  };
}
