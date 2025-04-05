export interface ToolMetadata {
  name: string;
  description: string;
  tags?: string[];
  [key: string]: unknown;
}

export interface ToolSchema {
  type: string;
  properties: Record<string, unknown>;
  required: string[];
  description?: string;
  [key: string]: unknown;
}

export interface ToolDefinition {
  id: string;
  appId: string;
  toolSchema: ToolSchema | null;
  toolMetadata: ToolMetadata | null;
  createdAt: string;
  updatedAt: string;
}

export interface ToolDefinitionsResponse {
  data: ToolDefinition[];
  count: number;
}

export interface ToolInstance {
  id: string;
  appId: string;
  status: string;
  definition: ToolDefinition;
  config: Record<string, unknown> | null;
  createdAt: string;
  updatedAt: string;
}

export interface ToolInstancesResponse {
  data: ToolInstance[];
  count: number;
}

export enum AuthType {
  NONE = 'none',
  TOKEN = 'token',
  API_KEY = 'api_key',
  BASIC = 'basic',
}

export interface TokenAuth {
  token: string;
}

export interface ApiKeyAuth {
  key: string;
  value: string;
  location: 'header' | 'query';
}

export interface BasicAuth {
  username: string;
  password: string;
}

export interface AuthConfig {
  type: AuthType;
  config: TokenAuth | ApiKeyAuth | BasicAuth | Record<string, unknown>;
}

export interface Connection {
  id: string;
  name: string;
  description?: string;
  appId: string;
  baseUrl?: string;
  ownerId?: string;
  auth?: AuthConfig;
  kind: string;
  createdAt: string;
  updatedAt: string;
}

export interface ConnectionCreate {
  name: string;
  description?: string;
  baseUrl?: string;
  auth?: AuthConfig;
  appId: string;
}

export interface UtilsMessage {
  message: string;
}
