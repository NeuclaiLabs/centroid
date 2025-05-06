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

export interface MCPInstance {
  id: string;
  name: string;
  description: string;
  status: 'running' | 'stopped';
  created_at: string;
  owner_id: string;
}

export type MCPServerStatus = 'active' | 'inactive';

export type MCPServerKind = 'official' | 'external' | 'openapi';

export type MCPServerState =
  | 'pending'
  | 'initializing'
  | 'running'
  | 'stopping'
  | 'stopped'
  | 'restarting'
  | 'disconnected'
  | 'error';

export interface MCPServerRunConfig {
  command: string;
  args?: string[];
  env?: Record<string, string>;
  cwd?: string;
}

export interface MCPServerMetadata {
  icon?: {
    path: string;
  };
  homepage?: string;
  [key: string]: unknown;
}

export interface MCPToolParameter {
  type: string;
  properties: Record<string, unknown>;
}

export interface MCPTool {
  id?: string;
  name: string;
  description: string;
  parameters: MCPToolParameter;
  status: boolean;
}

export interface MCPServer {
  id: string;
  name: string;
  description: string;
  status: MCPServerStatus;
  state?: MCPServerState;
  kind: MCPServerKind;
  transport: string;
  version: string;
  templateId?: string;
  run?: MCPServerRunConfig;
  settings?: {
    metadata?: MCPServerMetadata;
  };
  secrets?: Record<string, string | number | boolean | null>;
  tools?: MCPTool[];
  ownerId: string;
  createdAt: string;
  updatedAt: string;
  mountPath: string;
}

export interface MCPServerCreate {
  name: string;
  description: string;
  status?: MCPServerStatus;
  kind?: MCPServerKind;
  transport: string;
  version: string;
  templateId?: string;
  run?: MCPServerRunConfig;
  settings?: {
    metadata?: MCPServerMetadata;
  };
  secrets?: Record<string, string | number | boolean | null>;
}

export interface MCPServerUpdate {
  name?: string;
  description?: string;
  status?: MCPServerStatus;
  kind?: MCPServerKind;
  transport?: string;
  version?: string;
  run?: MCPServerRunConfig;
  settings?: {
    metadata?: MCPServerMetadata;
  };
  secrets?: Record<string, string | number | boolean | null>;
}

export interface MCPServersResponse {
  data: MCPServer[];
  count: number;
}
