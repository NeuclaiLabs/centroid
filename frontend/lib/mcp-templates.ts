import { z } from 'zod';
import type { SimpleIcon } from 'simple-icons';
import {
  siGithub,
  siAnthropic,
  siOpenai,
  siGoogle,
  siAmazon,
} from 'simple-icons';

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

// Sample MCP Templates data
export const mcpTemplates: MCPTemplate[] = [
  {
    id: 'template_01HZXRG45NSQV2',
    name: 'GitHub MCP Server',
    description:
      "GitHub's implementation of the Model Context Protocol server for repository context retrieval and code analysis",
    status: MCPTemplateStatus.ACTIVE,
    kind: MCPTemplateKind.OFFICIAL,
    transport: 'http',
    version: '1.0.0',
    run: {
      command: 'docker',
      args: [
        'run',
        '-i',
        '--rm',
        '-e',
        'GITHUB_PERSONAL_ACCESS_TOKEN',
        'ghcr.io/github/github-mcp-server',
      ],
      env: {
        GITHUB_PERSONAL_ACCESS_TOKEN: '${input:github_token}',
      },
    },
    tools: [
      {
        name: 'retrieveRepositoryContext',
        description:
          'Retrieves context from GitHub repositories based on the query',
        parameters: {
          type: 'object',
          properties: {
            repository: {
              type: 'string',
              description: 'The repository in owner/repo format',
            },
            query: {
              type: 'string',
              description: 'The search query',
            },
            limit: {
              type: 'integer',
              description: 'Maximum number of results to return',
            },
          },
        },
        status: true,
      },
      {
        name: 'retrieveRepositoryContext-3',
        description:
          'Retrieves context from GitHub repositories based on the query',
        parameters: {
          type: 'object',
          properties: {
            repository: {
              type: 'string',
              description: 'The repository in owner/repo format',
            },
            query: {
              type: 'string',
              description: 'The search query',
            },
            limit: {
              type: 'integer',
              description: 'Maximum number of results to return',
            },
          },
        },
        status: true,
      },
      {
        name: 'retrieveRepositoryContext-2',
        description:
          'Retrieves context from GitHub repositories based on the query',
        parameters: {
          type: 'object',
          properties: {
            repository: {
              type: 'string',
              description: 'The repository in owner/repo format',
            },
            query: {
              type: 'string',
              description: 'The search query',
            },
            limit: {
              type: 'integer',
              description: 'Maximum number of results to return',
            },
          },
        },
        status: true,
      },
      {
        name: 'retrieveRepositoryContext-1',
        description:
          'Retrieves context from GitHub repositories based on the query',
        parameters: {
          type: 'object',
          properties: {
            repository: {
              type: 'string',
              description: 'The repository in owner/repo format',
            },
            query: {
              type: 'string',
              description: 'The search query',
            },
            limit: {
              type: 'integer',
              description: 'Maximum number of results to return',
            },
          },
        },
        status: true,
      },
      {
        name: 'getFileContent',
        description: 'Gets the content of a file from a GitHub repository',
        parameters: {
          type: 'object',
          properties: {
            repository: {
              type: 'string',
              description: 'The repository in owner/repo format',
            },
            path: {
              type: 'string',
              description: 'Path to the file',
            },
            ref: {
              type: 'string',
              description: 'The name of the commit/branch/tag',
            },
          },
        },
        status: true,
      },
    ],
    metadata: {
      maintainer: 'GitHub',
      homepage: 'https://github.com/github/github-mcp-server',
      language: 'TypeScript',
      requirements: {
        node: '>=18.0.0',
      },
      provider: 'GitHub',
      capabilities: ['text-generation', 'analysis', 'coding'],
      supportedLanguages: ['en'],
      icon: siGithub,
      logo: 'https://github.com/logo.png',
    },
    createdAt: '2023-12-15T12:00:00Z',
    updatedAt: '2024-03-22T15:30:00Z',
  },
  {
    id: 'template_01HZXS9WRTYK6J',
    name: 'Anthropic MCP Server',
    description:
      "Anthropic's reference implementation of an MCP server focusing on document context retrieval",
    status: MCPTemplateStatus.ACTIVE,
    kind: MCPTemplateKind.OFFICIAL,
    transport: 'http',
    version: '0.2.1',
    run: {
      command: 'python',
      args: ['-m', 'anthropic_mcp.server'],
      env: {
        PORT: '8000',
        VECTOR_DB_URL: '${VECTOR_DB_URL}',
        API_KEY: '${ANTHROPIC_API_KEY}',
      },
      cwd: '/srv',
      timeout: 600,
      maxRetries: 5,
      retryDelay: 10,
    },
    tools: [
      {
        name: 'retrieveContext',
        description: 'Retrieves relevant context from documents based on query',
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
            filters: {
              type: 'object',
              description: 'Filters to apply to the search',
            },
          },
        },
        status: true,
      },
      {
        name: 'storeDocument',
        description: 'Stores a document in the vector database',
        parameters: {
          type: 'object',
          properties: {
            content: {
              type: 'string',
              description: 'Document content',
            },
            metadata: {
              type: 'object',
              description: 'Document metadata',
            },
          },
        },
        status: true,
      },
    ],
    metadata: {
      maintainer: 'Anthropic',
      homepage: 'https://github.com/anthropic/reference-mcp',
      language: 'Python',
      requirements: {
        python: '>=3.9.0',
      },
      provider: 'Anthropic',
      capabilities: ['text-generation', 'analysis', 'coding'],
      supportedLanguages: ['en'],
      icon: siAnthropic,
      logo: 'https://anthropic.com/logo.png',
    },
    createdAt: '2024-01-08T09:15:00Z',
    updatedAt: '2024-04-12T10:45:00Z',
  },

  {
    id: 'template_01HZXWP74MT9VS',
    name: 'openai-assistant-api-mcp',
    description:
      'MCP server implementation that leverages OpenAI Assistant API for context retrieval',
    status: MCPTemplateStatus.ACTIVE,
    kind: MCPTemplateKind.EXTERNAL,
    transport: 'http',
    version: '0.3.0',
    run: {
      command: 'python',
      args: ['-m', 'openai_mcp'],
      env: {
        PORT: '3500',
        OPENAI_API_KEY: '${OPENAI_API_KEY}',
        ASSISTANT_ID: '${ASSISTANT_ID}',
      },
      cwd: '/app',
      timeout: 300,
      maxRetries: 3,
      retryDelay: 5,
    },
    tools: [
      {
        name: 'queryAssistant',
        description: 'Queries an OpenAI Assistant with context',
        parameters: {
          type: 'object',
          properties: {
            query: {
              type: 'string',
              description: 'The query text',
            },
            assistant_id: {
              type: 'string',
              description: 'ID of the OpenAI Assistant to use',
            },
            additional_context: {
              type: 'string',
              description: 'Additional context for the query',
            },
          },
        },
        status: true,
      },
      {
        name: 'uploadFile',
        description: 'Uploads a file to be used for context',
        parameters: {
          type: 'object',
          properties: {
            file_content: {
              type: 'string',
              description: 'Base64 encoded file content',
            },
            file_name: {
              type: 'string',
              description: 'Name of the file',
            },
          },
        },
        status: true,
      },
    ],
    metadata: {
      maintainer: 'Community Developer',
      homepage: 'https://github.com/community/openai-mcp',
      language: 'Python',
      requirements: {
        python: '>=3.9.0',
        openai: '>=1.0.0',
      },
      provider: 'OpenAI',
      capabilities: ['chat', 'embeddings'],
      contextWindow: 128000,
      icon: siOpenai,
      logo: 'https://openai.com/logo.png',
    },
    createdAt: '2024-01-25T10:00:00Z',
    updatedAt: '2024-04-01T13:45:00Z',
  },
  {
    id: 'template_01HZXY6MTFR2VK',
    name: 'database-mcp-server',
    description: 'MCP server for retrieving context from SQL databases',
    status: MCPTemplateStatus.ACTIVE,
    kind: MCPTemplateKind.OFFICIAL,
    transport: 'grpc',
    version: '2.0.1',
    run: {
      command: 'java',
      args: ['-jar', 'database-mcp.jar'],
      env: {
        PORT: '8080',
        DB_URL: '${DB_URL}',
        DB_USER: '${DB_USER}',
        DB_PASSWORD: '${DB_PASSWORD}',
      },
      cwd: '/opt/mcp',
      timeout: 180,
      maxRetries: 5,
      retryDelay: 10,
    },
    tools: [
      {
        name: 'executeQuery',
        description: 'Executes an SQL query and returns results',
        parameters: {
          type: 'object',
          properties: {
            query: {
              type: 'string',
              description: 'SQL query to execute',
            },
            params: {
              type: 'object',
              description: 'Query parameters',
            },
            limit: {
              type: 'integer',
              description: 'Maximum number of rows to return',
            },
          },
        },
        status: true,
      },
      {
        name: 'describeSchema',
        description: 'Describes database schema',
        parameters: {
          type: 'object',
          properties: {
            database: {
              type: 'string',
              description: 'Database name',
            },
            tables: {
              type: 'array',
              description: 'Specific tables to describe',
            },
          },
        },
        status: true,
      },
    ],
    metadata: {
      maintainer: 'Enterprise Database Solutions',
      homepage: 'https://github.com/enterprise/db-mcp-server',
      language: 'Java',
      requirements: {
        java: '>=17',
      },
      provider: 'Mistral AI',
      capabilities: ['text-generation'],
      modelSize: '32B',
      icon: 'https://mistral.ai/logo.png',
      logo: 'https://mistral.ai/logo.png',
    },
    createdAt: '2023-09-05T08:30:00Z',
    updatedAt: '2024-02-12T14:20:00Z',
  },
  {
    id: 'template_01HZXZ92K7P4WT',
    name: 'search-api-mcp-server',
    description: 'MCP server that integrates with various search APIs',
    status: MCPTemplateStatus.ACTIVE,
    kind: MCPTemplateKind.EXTERNAL,
    transport: 'http',
    version: '0.9.2',
    run: {
      command: 'go',
      args: ['run', 'main.go'],
      env: {
        PORT: '9000',
        GOOGLE_API_KEY: '${GOOGLE_API_KEY}',
        BING_API_KEY: '${BING_API_KEY}',
        CACHE_TTL: '3600',
      },
      cwd: '/go/src/app',
      timeout: 240,
      maxRetries: 3,
      retryDelay: 5,
    },
    tools: [
      {
        name: 'webSearch',
        description: 'Performs a web search and returns results',
        parameters: {
          type: 'object',
          properties: {
            query: {
              type: 'string',
              description: 'Search query',
            },
            provider: {
              type: 'string',
              description: 'Search provider (google, bing, etc.)',
            },
            limit: {
              type: 'integer',
              description: 'Maximum number of results',
            },
          },
        },
        status: true,
      },
      {
        name: 'fetchWebPage',
        description: 'Fetches and processes a web page',
        parameters: {
          type: 'object',
          properties: {
            url: {
              type: 'string',
              description: 'URL of the webpage',
            },
            extract: {
              type: 'string',
              description: 'Content extraction mode',
            },
          },
        },
        status: true,
      },
    ],
    metadata: {
      maintainer: 'Search API Integration Team',
      homepage: 'https://github.com/search-team/search-mcp',
      language: 'Go',
      requirements: {
        go: '>=1.18',
      },
      provider: 'Google',
      capabilities: ['text-generation', 'analysis', 'coding'],
      supportedLanguages: ['en'],
      icon: siGoogle,
      logo: 'https://google.com/logo.png',
    },
    createdAt: '2024-02-10T11:20:00Z',
    updatedAt: '2024-03-25T16:40:00Z',
  },
  {
    id: 'template_01HZY0N5W8TGVP',
    name: 'aws-lambda-mcp-serverfaas-again',
    description: 'Serverless MCP implementation using AWS Lambda',
    status: MCPTemplateStatus.ACTIVE,
    kind: MCPTemplateKind.EXTERNAL,
    transport: 'http',
    version: '1.2.0',
    run: {
      command: 'serverless',
      args: ['deploy'],
      env: {
        AWS_ACCESS_KEY_ID: '${AWS_ACCESS_KEY_ID}',
        AWS_SECRET_ACCESS_KEY: '${AWS_SECRET_ACCESS_KEY}',
        AWS_REGION: '${AWS_REGION}',
      },
      cwd: '/app',
      timeout: 600,
      maxRetries: 2,
      retryDelay: 15,
    },
    tools: [
      {
        name: 'queryCloudResources',
        description: 'Queries AWS resources for context',
        parameters: {
          type: 'object',
          properties: {
            resource_type: {
              type: 'string',
              description: 'Type of AWS resource',
            },
            filters: {
              type: 'object',
              description: 'Resource filters',
            },
            region: {
              type: 'string',
              description: 'AWS region',
            },
          },
        },
        status: true,
      },
      {
        name: 'invokeFunction',
        description: 'Invokes an AWS Lambda function',
        parameters: {
          type: 'object',
          properties: {
            function_name: {
              type: 'string',
              description: 'Name of the Lambda function',
            },
            payload: {
              type: 'object',
              description: 'Function payload',
            },
          },
        },
        status: true,
      },
    ],
    metadata: {
      maintainer: 'Cloud Architecture Team',
      homepage: 'https://github.com/cloud-team/lambda-mcp',
      language: 'TypeScript',
      requirements: {
        node: '>=16.0.0',
        serverless: '>=3.0.0',
      },
      provider: 'AWS',
      capabilities: ['text-generation', 'analysis', 'coding'],
      supportedLanguages: ['en'],
      icon: siAmazon,
      logo: 'https://aws.amazon.com/logo.png',
    },
    createdAt: '2023-10-18T09:30:00Z',
    updatedAt: '2024-01-30T13:15:00Z',
  },
];

// Helper functions
export function getMCPTemplateById(id: string): MCPTemplate | undefined {
  return mcpTemplates.find((template) => template.id === id);
}

export function getMCPTemplatesByKind(kind: MCPTemplateKind): MCPTemplate[] {
  return mcpTemplates.filter((template) => template.kind === kind);
}

export function getMCPTemplatesByStatus(
  status: MCPTemplateStatus,
): MCPTemplate[] {
  return mcpTemplates.filter((template) => template.status === status);
}

export function searchMCPTemplates(query: string): MCPTemplate[] {
  const searchTerm = query.toLowerCase();
  return mcpTemplates.filter(
    (template) =>
      template.name.toLowerCase().includes(searchTerm) ||
      template.description.toLowerCase().includes(searchTerm) ||
      Object.keys(template.metadata).some((key) =>
        String(template.metadata[key]).toLowerCase().includes(searchTerm),
      ),
  );
}
