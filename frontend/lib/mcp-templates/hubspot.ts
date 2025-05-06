import { siHubspot } from 'simple-icons';
import type { MCPTemplate } from './types';
import { MCPTemplateKind, MCPTemplateStatus } from './types';

export const hubspotTemplate: MCPTemplate = {
  id: 'template_01HUBSPOTMCP',
  name: 'HubSpot MCP Server',
  description: 'MCP server for HubSpot integration and data retrieval',
  status: MCPTemplateStatus.ACTIVE,
  kind: MCPTemplateKind.OFFICIAL,
  transport: 'http',
  version: '1.0.0',
  run: {
    command: 'npx',
    args: ['-y', '@hubspot/mcp-server'],
    env: {
      PRIVATE_APP_ACCESS_TOKEN: '${input:hubspot_token}',
    },
  },
  tools: [
    {
      name: 'queryContacts',
      description: 'Queries HubSpot contacts based on search criteria',
      parameters: {
        type: 'object',
        properties: {
          query: {
            type: 'string',
            description: 'The search query for contacts',
          },
          limit: {
            type: 'integer',
            description: 'Maximum number of contacts to return',
          },
          properties: {
            type: 'array',
            description: 'Contact properties to include in the response',
          },
        },
      },
      status: true,
    },
    {
      name: 'queryCompanies',
      description: 'Queries HubSpot companies based on search criteria',
      parameters: {
        type: 'object',
        properties: {
          query: {
            type: 'string',
            description: 'The search query for companies',
          },
          limit: {
            type: 'integer',
            description: 'Maximum number of companies to return',
          },
          properties: {
            type: 'array',
            description: 'Company properties to include in the response',
          },
        },
      },
      status: true,
    },
    {
      name: 'queryDeals',
      description: 'Queries HubSpot deals based on search criteria',
      parameters: {
        type: 'object',
        properties: {
          query: {
            type: 'string',
            description: 'The search query for deals',
          },
          limit: {
            type: 'integer',
            description: 'Maximum number of deals to return',
          },
          properties: {
            type: 'array',
            description: 'Deal properties to include in the response',
          },
        },
      },
      status: true,
    },
  ],
  metadata: {
    maintainer: 'HubSpot',
    homepage: 'https://developers.hubspot.com/',
    language: 'TypeScript',
    requirements: {
      node: '>=18.0.0',
    },
    provider: 'HubSpot',
    capabilities: ['crm-integration', 'data-retrieval', 'automation'],
    supportedLanguages: ['en'],
    icon: siHubspot,
    logo: 'https://www.hubspot.com/hubfs/assets/hubspot.com/style-guide/brand-guidelines/guidelines_the-logo.svg',
  },
  createdAt: '2024-04-22T00:00:00Z',
  updatedAt: '2024-04-22T00:00:00Z',
};
