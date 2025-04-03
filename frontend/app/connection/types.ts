import type { appRegistry, Tool } from '@/lib/registry';

export interface ConnectionBase {
  name: string;
  description?: string;
  kind: string;
  base_url: string;
  auth?: Record<string, unknown>;
}

export interface Connection extends ConnectionBase {
  id: string;
  name: string;
  type: keyof typeof appRegistry;
  description: string;
  apiKey: string;
  status: 'active' | 'inactive';
  created_at: string;
  updated_at: string;
  tools?: Tool[];
}

export interface ConnectionCreate extends ConnectionBase {}

export interface ConnectionUpdate extends Partial<ConnectionBase> {}

export interface ConnectionsResponse {
  data: Connection[];
  count: number;
}
