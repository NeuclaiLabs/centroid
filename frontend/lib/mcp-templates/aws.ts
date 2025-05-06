import { siAmazon } from 'simple-icons';
import type { MCPTemplate } from './types';
import { MCPTemplateKind, MCPTemplateStatus } from './types';

export const awsTemplate: MCPTemplate = {
  id: 'template_02AB3C4D5E6F7G',
  name: 'AWS Knowledge Base Retrieval',
  description: 'MCP server for retrieving context from AWS knowledge bases',
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
      'AWS_ACCESS_KEY_ID',
      '-e',
      'AWS_SECRET_ACCESS_KEY',
      '-e',
      'AWS_REGION',
      'mcp/aws-kb-retrieval-server',
    ],
    env: {
      AWS_ACCESS_KEY_ID: '${AWS_ACCESS_KEY_ID}',
      AWS_SECRET_ACCESS_KEY: '${AWS_SECRET_ACCESS_KEY}',
      AWS_REGION: '${AWS_REGION}',
    },
  },
  tools: [
    {
      name: 'queryKnowledgeBase',
      description: 'Queries AWS knowledge bases for relevant information',
      parameters: {
        type: 'object',
        properties: {
          query: {
            type: 'string',
            description: 'The search query',
          },
          kbId: {
            type: 'string',
            description: 'ID of the knowledge base to query',
          },
          maxResults: {
            type: 'integer',
            description: 'Maximum number of results to return',
          },
        },
      },
      status: true,
    },
    {
      name: 'listKnowledgeBases',
      description: 'Lists available AWS knowledge bases',
      parameters: {
        type: 'object',
        properties: {
          maxResults: {
            type: 'integer',
            description: 'Maximum number of knowledge bases to return',
          },
          filters: {
            type: 'object',
            description: 'Optional filters to apply',
          },
        },
      },
      status: true,
    },
  ],
  metadata: {
    maintainer: 'AWS Services Team',
    homepage: 'https://github.com/aws/kb-retrieval-mcp',
    language: 'Python',
    requirements: {
      docker: '>=20.0.0',
    },
    provider: 'AWS',
    capabilities: ['knowledge-retrieval', 'analysis'],
    supportedLanguages: ['en'],
    icon: siAmazon,
    logo: 'https://aws.amazon.com/logo.png',
  },
  createdAt: '2024-04-15T14:30:00Z',
  updatedAt: '2024-04-15T14:30:00Z',
};
