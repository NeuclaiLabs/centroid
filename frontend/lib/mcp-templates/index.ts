import type { MCPTemplate, MCPTemplateKind, MCPTemplateStatus } from './types';
import { githubTemplate } from './github';
import { awsTemplate } from './aws';
import { playwrightTemplate } from './playwright';
import { upstashTemplate } from './upstash';
import { hubspotTemplate } from './hubspot';

export const mcpTemplates: MCPTemplate[] = [
  githubTemplate,
  awsTemplate,
  playwrightTemplate,
  upstashTemplate,
  hubspotTemplate,
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

// Re-export types
export * from './types';
