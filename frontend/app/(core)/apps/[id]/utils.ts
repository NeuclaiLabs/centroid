import type { ToolDefinition, ToolInstance } from '../../types';

export const fetcher = async (url: string) => {
  const res = await fetch(url);
  if (!res.ok) {
    throw new Error('Failed to fetch data');
  }
  return res.json();
};

export function filterTools<T extends ToolDefinition | ToolInstance>(
  tools: T[],
  searchQuery: string,
): T[] {
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
