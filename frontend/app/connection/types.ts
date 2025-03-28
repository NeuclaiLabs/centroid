import { integrationRegistry } from '@/lib/registry';

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
  type: keyof typeof integrationRegistry;
  description: string;
  apiKey: string;
  status: 'active' | 'inactive';
  created_at: string;
  updated_at: string;
}

export interface ConnectionCreate extends ConnectionBase {}

export interface ConnectionUpdate extends Partial<ConnectionBase> {}

export interface ConnectionsResponse {
  data: Connection[];
  count: number;
}
