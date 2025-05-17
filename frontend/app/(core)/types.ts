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

export enum MCPTemplateKind {
  OFFICIAL = 'official',
  EXTERNAL = 'external',
  OPENAPI = 'openapi',
}

export type MCPServerState =
  | 'pending'
  | 'initializing'
  | 'running'
  | 'stopping'
  | 'stopped'
  | 'restarting'
  | 'disconnected'
  | 'error';

export interface MCPRunConfig {
  command: string;
  args?: string[];
  env?: Record<string, string>;
  cwd?: string;
  maxRetries?: number;
  retryDelay?: number;
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
  kind: MCPTemplateKind;
  transport: string;
  version: string;
  templateId?: string;
  run?: MCPRunConfig;
  settings?: {
    metadata?: MCPServerMetadata;
  };
  secrets?: Record<string, string | number | boolean | null>;
  tools?: MCPTool[];
  ownerId: string;
  createdAt: string;
  updatedAt: string;
  mountPath: string;
  template?: MCPTemplate;
}

export interface MCPServerCreate {
  name: string;
  description: string;
  status?: MCPServerStatus;
  kind?: MCPTemplateKind;
  transport: string;
  version: string;
  templateId?: string;
  run?: MCPRunConfig;
  settings?: {
    metadata?: MCPServerMetadata;
  };
  secrets?: Record<string, string | number | boolean | null>;
}

export interface MCPServerUpdate {
  name?: string;
  description?: string;
  status?: MCPServerStatus;
  kind?: MCPTemplateKind;
  transport?: string;
  version?: string;
  run?: MCPRunConfig;
  settings?: {
    metadata?: MCPServerMetadata;
  };
  secrets?: Record<string, string | number | boolean | null>;
}

export interface MCPServersResponse {
  data: MCPServer[];
  count: number;
}

export interface MCPTemplate {
  id: string;
  name: string;
  description: string;
  status: 'active' | 'inactive';
  kind: MCPTemplateKind;
  transport: string;
  version: string;
  run?: MCPRunConfig;
  tools?: MCPTool[];
  details?: {
    icon?: { path: string } | Array<{ d: string }>;
    homepage?: string;
    [key: string]: unknown;
  };
  servers?: MCPServer[];
  createdAt: string;
  updatedAt: string;
}

export interface MCPTemplateCreate {
  id: string;
  name: string;
  description: string;
  status?: 'active' | 'inactive';
  kind?: MCPTemplateKind;
  transport: string;
  version: string;
  run?: MCPRunConfig;
  tools?: MCPTool[];
  details?: Record<string, unknown>;
}

export interface MCPTemplateUpdate {
  name?: string;
  description?: string;
  status?: 'active' | 'inactive';
  kind?: MCPTemplateKind;
  transport?: string;
  version?: string;
  run?: MCPRunConfig;
  tools?: MCPTool[];
  details?: Record<string, unknown>;
}

export interface MCPTemplatesResponse {
  data: MCPTemplate[];
  count: number;
}
