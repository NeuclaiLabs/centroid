import useSWR, { mutate } from 'swr';
import type { Connection, ConnectionCreate } from '../types';

const fetcher = async (url: string) => {
  const res = await fetch(url);
  if (!res.ok) {
    throw new Error('Failed to fetch connections');
  }
  return res.json();
};

interface UseConnectionsOptions {
  appId?: string;
  limit?: number;
  skip?: number;
}

export function useConnections(options: UseConnectionsOptions = {}) {
  const { appId, limit, skip } = options;
  const params = new URLSearchParams();
  if (appId) params.append('appId', appId);
  if (limit) params.append('limit', limit.toString());
  if (skip) params.append('skip', skip.toString());

  const { data, error, isLoading } = useSWR<{
    data: Connection[];
    count: number;
  }>(`/api/connection?${params.toString()}`, fetcher);


  return {
    connections: data?.data ?? [],
    total: data?.count ?? 0,
    isLoading,
    error,
  };
}

export function useConnection(id: string) {
  const { data, error, isLoading } = useSWR<Connection>(
    id ? `/api/connection/${id}` : null,
    fetcher,
  );

  return {
    connection: data,
    isLoading,
    error,
  };
}

export async function getFirstConnection(
  appId: string,
): Promise<Connection | null> {
  const params = new URLSearchParams({ appId, limit: '1' });
  const response = await fetch(`/api/connection?${params.toString()}`);
  console.log('Fetching connection', response);
  if (!response.ok) {
    throw new Error('Failed to fetch connection');
  }
  const data = await response.json();
  return data.items?.[0] ?? null;
}

export async function createConnection(data: ConnectionCreate) {
  const response = await fetch('/api/connection', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to create connection');
  }

  const result = await response.json();
  await mutate('/api/connection'); // Invalidate connections list
  return result;
}

export async function updateConnection(
  id: string,
  data: Partial<ConnectionCreate>,
) {
  const response = await fetch(`/api/connection/${id}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ id, ...data }),
  });
  console.log('Updating connection', response);

  if (!response.ok) {
    let errorMessage = 'Failed to update connection';
    try {
      const errorData = await response.json();
      errorMessage = errorData.error || errorData.message || errorMessage;
    } catch (e) {
      // If parsing JSON fails, use the status text or default message
      errorMessage = response.statusText || errorMessage;
    }
    throw new Error(errorMessage);
  }

  const result = await response.json();
  await Promise.all([
    mutate('/api/connection'), // Invalidate connections list
    mutate(`/api/connection/${id}`), // Invalidate single connection
  ]);
  return result;
}
