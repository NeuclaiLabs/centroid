import { siGithub } from 'simple-icons';
import type { MCPTemplate } from './types';
import { MCPTemplateKind, MCPTemplateStatus } from './types';

export const githubTemplate: MCPTemplate = {
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
      name: 'add_issue_comment',
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
};
