import { z } from 'zod';
import type { SimpleIcon } from 'simple-icons';

export enum MCPTemplateStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
  DEPRECATED = 'deprecated',
}

export enum MCPTemplateKind {
  OFFICIAL = 'official',
  EXTERNAL = 'external',
  OPENAPI = 'openapi',
}

export interface MCPToolParameter {
  type: string;
  // biome-ignore lint/suspicious/noExplicitAny: <explanation>
  properties: Record<string, any>;
}

export interface MCPTool {
  name: string;
  description: string;
  parameters: MCPToolParameter;
  status: boolean;
}

export interface MCPRunConfig {
  command: string;
  args?: string[];
  env?: Record<string, string>;
  cwd?: string;
  timeout?: number;
  maxRetries?: number;
  retryDelay?: number;
}

export interface MCPTemplate {
  id: string;
  name: string;
  description: string;
  status: MCPTemplateStatus;
  kind: MCPTemplateKind;
  transport: string;
  version: string;
  run: MCPRunConfig;
  tools: MCPTool[];
  // biome-ignore lint/suspicious/noExplicitAny: metadata can contain various types of values
  metadata: Record<string, any>;
  createdAt: string;
  updatedAt: string;
}
