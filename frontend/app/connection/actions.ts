import type {
  Connection,
  ConnectionCreate,
  ConnectionUpdate,
  ConnectionsResponse,
} from './types';

const API_BASE = '/api/connection';

export async function createConnection(
  data: ConnectionCreate,
): Promise<Connection> {
  const response = await fetch(API_BASE, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.detail || 'Failed to create connection');
  }

  return response.json();
}

export async function updateConnection(
  id: string,
  data: ConnectionUpdate,
): Promise<Connection> {
  const response = await fetch(`${API_BASE}/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.detail || 'Failed to update connection');
  }

  return response.json();
}

export async function deleteConnection(id: string): Promise<void> {
  const response = await fetch(`${API_BASE}/${id}`, {
    method: 'DELETE',
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.detail || 'Failed to delete connection');
  }
}

export async function getConnections(
  params: { skip?: number; limit?: number } = {},
): Promise<ConnectionsResponse> {
  const searchParams = new URLSearchParams();
  if (params.skip) searchParams.append('skip', params.skip.toString());
  if (params.limit) searchParams.append('limit', params.limit.toString());

  const response = await fetch(`${API_BASE}?${searchParams}`);

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.detail || 'Failed to fetch connections');
  }

  return response.json();
}

export async function getConnection(id: string): Promise<Connection> {
  const response = await fetch(`${API_BASE}/${id}`);

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.detail || 'Failed to fetch connection');
  }

  return response.json();
}
