import { siUpstash } from 'simple-icons';
import type { MCPTemplate } from './types';
import { MCPTemplateKind, MCPTemplateStatus } from './types';

export const upstashTemplate: MCPTemplate = {
  id: 'template_01UPSTASHCTX7',
  name: 'Upstash Context7 MCP',
  description: 'MCP server for context retrieval using Upstash Context7',
  status: MCPTemplateStatus.ACTIVE,
  kind: MCPTemplateKind.OFFICIAL,
  transport: 'http',
  version: 'latest',
  run: {
    command: 'docker',
    args: [
      'run',
      '--rm',
      '-it',
      'node:20-slim',
      'npx',
      '--yes',
      '@upstash/context7-mcp@latest',
    ],
  },
  tools: [
    {
      name: 'queryContext7',
      description: 'Queries Upstash Context7 for relevant context',
      parameters: {
        type: 'object',
        properties: {
          query: {
            type: 'string',
            description: 'The search query',
          },
          topK: {
            type: 'integer',
            description: 'Number of top results to return',
          },
        },
      },
      status: true,
    },
  ],
  metadata: {
    maintainer: 'Upstash',
    homepage: 'https://upstash.com/',
    language: 'TypeScript',
    requirements: {
      node: '>=20.0.0',
    },
    provider: 'Upstash',
    capabilities: ['context-retrieval'],
    supportedLanguages: ['en'],
    icon: siUpstash,
    logo: 'https://upstash.com/static/upstash.svg',
  },
  createdAt: '2024-04-20T00:00:00Z',
  updatedAt: '2024-04-20T00:00:00Z',
};
