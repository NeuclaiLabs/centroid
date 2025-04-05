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
    const name = String(
      'toolSchema' in tool ? tool.toolSchema?.name || tool.id : tool.name,
    ).toLowerCase();
    const description = String(
      'toolSchema' in tool
        ? tool.toolSchema?.description || ''
        : tool.description,
    ).toLowerCase();
    return name.includes(query) || description.includes(query);
  });
}

export function filterToolInstances(
  tools: ToolInstance[],
  searchQuery: string,
): ToolInstance[] {
  const query = searchQuery.toLowerCase().trim();
  console.log(query);
  if (!query) return tools;

  return tools.filter((tool) => {
    const name = String(
      'toolSchema' in tool.definition
        ? tool.definition.toolSchema?.name || tool.id
        : tool.name,
    ).toLowerCase();
    const description = String(
      'toolSchema' in tool.definition
        ? tool.definition.toolSchema?.description || ''
        : tool.description,
    ).toLowerCase();
    return name.includes(query) || description.includes(query);
  });
}
