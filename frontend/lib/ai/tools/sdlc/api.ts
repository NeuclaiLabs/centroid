// API utilities for SDLC tools
import { auth } from '@/app/(auth)/auth';

export interface SDLCTaskRequest {
  toolType: 'developer' | 'planner' | 'reviewer' | 'architect' | 'tester' | 'documenter';
  task: string;
  context?: Record<string, any>;
  workingDirectory?: string;
}

export interface SDLCTaskResponse {
  taskId: string;
  status: string;
  message: string;
}

export interface TaskStatus {
  taskId: string;
  status: 'IN_PROGRESS' | 'COMPLETED' | 'ERROR';
  toolType?: string;
  createdAt?: string;
  completedAt?: string;
  hasResult: boolean;
  hasError: boolean;
  error?: string;
}

export interface DocumentResponse {
  id: string;
  title: string;
  content: string | null;
  kind: string;
  userId: string;
  projectId: string | null;
  createdAt: string | null;
  updatedAt: string | null;
}

// Helper for authenticated API calls to backend
async function fetchBackendApi<T>(
  endpoint: string,
  options?: RequestInit,
): Promise<T> {
  const session = await auth();
  // @ts-ignore
  const token = session?.user?.token;

  const response = await fetch(
    `${process.env.NEXT_PUBLIC_API_URL}/api/v1${endpoint}`,
    {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...(token && { Authorization: `Bearer ${token}` }),
        ...options?.headers,
      },
    },
  );

  if (!response.ok) {
    throw new Error(`API request failed: ${response.status} ${response.statusText}`);
  }

  return response.json();
}

/**
 * Create a new SDLC task
 */
export async function createSDLCTask(request: SDLCTaskRequest): Promise<SDLCTaskResponse> {
  return fetchBackendApi<SDLCTaskResponse>('/sdlc/tasks', {
    method: 'POST',
    body: JSON.stringify(request),
  });
}

/**
 * Get task status for polling
 */
export async function getSDLCTaskStatus(taskId: string): Promise<TaskStatus> {
  return fetchBackendApi<TaskStatus>(`/sdlc/tasks/${taskId}/status`);
}

/**
 * Get complete task data and results
 */
export async function getSDLCTaskResults(taskId: string): Promise<DocumentResponse> {
  return fetchBackendApi<DocumentResponse>(`/sdlc/tasks/${taskId}`);
}

/**
 * Parse task data from document content
 */
export function parseTaskData(content: string | null): any {
  if (!content) return null;

  try {
    return JSON.parse(content);
  } catch (error) {
    console.error('Failed to parse task data:', error);
    return null;
  }
}

/**
 * Poll for task completion with exponential backoff
 */
export async function pollForTaskCompletion(
  taskId: string,
  onProgress?: (status: TaskStatus) => void,
  maxAttempts = 60,
  initialDelay = 2000
): Promise<DocumentResponse> {
  let attempts = 0;
  let delay = initialDelay;

  while (attempts < maxAttempts) {
    try {
      const status = await getSDLCTaskStatus(taskId);

      if (onProgress) {
        onProgress(status);
      }

      if (status.status === 'COMPLETED') {
        return await getSDLCTaskResults(taskId);
      }

      if (status.status === 'ERROR') {
        throw new Error(status.error || 'Task failed with unknown error');
      }

      // Wait before next poll
      await new Promise(resolve => setTimeout(resolve, delay));

      attempts++;
      // Exponential backoff with jitter, max 10 seconds
      delay = Math.min(delay * 1.2 + Math.random() * 1000, 10000);

    } catch (error) {
      console.error('Polling error:', error);
      attempts++;

      if (attempts >= maxAttempts) {
        throw error;
      }

      // Wait before retry
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }

  throw new Error('Task polling timeout - maximum attempts exceeded');
}
