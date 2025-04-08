import type { ToolDefinition, ToolInstance } from './types';

export const fetcher = async (url: string) => {
  const res = await fetch(url);
  if (!res.ok) {
    throw new Error('Failed to fetch data');
  }
  return res.json();
};

export function filterTools(
  tools: ToolDefinition[],
  searchQuery: string,
): ToolDefinition[] {
  const query = searchQuery.toLowerCase().trim();
  if (!query) return tools;

  return tools.filter((tool) => {
    const name = String(tool.toolMetadata?.name || tool.id).toLowerCase();
    const description = String(
      tool.toolMetadata?.description || '',
    ).toLowerCase();
    return name.includes(query) || description.includes(query);
  });
}

export function filterToolInstances(
  tools: ToolInstance[],
  searchQuery: string,
): ToolInstance[] {
  const query = searchQuery.toLowerCase().trim();
  if (!query) return tools;

  return tools.filter((tool) => {
    const name = String(
      tool.definition.toolSchema?.name || tool.id,
    ).toLowerCase();
    const description = String(
      tool.definition.toolSchema?.description || '',
    ).toLowerCase();
    return name.includes(query) || description.includes(query);
  });
}
