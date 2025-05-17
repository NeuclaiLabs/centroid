import useSWR from 'swr';
import { toast } from 'sonner';
import type { MCPTemplate } from '@/app/(core)/types';

interface MCPTemplatesResponse {
  data: MCPTemplate[];
  count: number;
}

interface UseMCPTemplatesOptions {
  skip?: number;
  limit?: number;
}

const fetcher = async (url: string) => {
  const res = await fetch(url);
  if (!res.ok) {
    const errorData = await res
      .json()
      .catch(() => ({ error: 'Failed to fetch data' }));
    throw new Error(errorData.error || `API error: ${res.status}`);
  }
  return res.json();
};

export function useMCPTemplates(options: UseMCPTemplatesOptions = {}) {
  const { skip = 0, limit = 100 } = options;

  const params = new URLSearchParams();
  if (skip) params.append('skip', skip.toString());
  if (limit) params.append('limit', limit.toString());

  const { data, error, isLoading, mutate } = useSWR<MCPTemplatesResponse>(
    `/api/mcp/templates?${params.toString()}`,
    fetcher,
  );

  const createTemplate = async (
    templateData: Omit<MCPTemplate, 'createdAt' | 'updatedAt'>,
  ) => {
    const toastId = 'create-template';

    try {
      toast.loading('Creating template...', { id: toastId });

      const response = await fetch('/api/mcp/templates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(templateData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create template');
      }

      const newTemplate = await response.json();
      toast.success('Template created successfully', { id: toastId });

      // Update the cache
      await mutate((currentData) => {
        if (!currentData) return { data: [newTemplate], count: 1 };
        return {
          data: [...currentData.data, newTemplate],
          count: currentData.count + 1,
        };
      }, false);

      return newTemplate;
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Failed to create template';
      toast.error(errorMessage, { id: toastId });
      return null;
    }
  };

  const updateTemplate = async (
    id: string,
    templateData: Partial<MCPTemplate>,
  ) => {
    const toastId = `update-template-${id}`;

    try {
      toast.loading('Updating template...', { id: toastId });

      const response = await fetch(`/api/mcp/templates/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(templateData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to update template');
      }

      const updatedTemplate = await response.json();
      toast.success('Template updated successfully', { id: toastId });

      // Update the cache
      await mutate((currentData) => {
        if (!currentData) return { data: [updatedTemplate], count: 1 };
        return {
          ...currentData,
          data: currentData.data.map((template) =>
            template.id === id ? updatedTemplate : template,
          ),
        };
      }, false);

      return updatedTemplate;
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Failed to update template';
      toast.error(errorMessage, { id: toastId });
      return null;
    }
  };

  const deleteTemplate = async (id: string) => {
    const template = data?.data.find((t) => t.id === id);
    if (!template) return false;

    const toastId = `delete-template-${id}`;

    try {
      toast.loading(`Deleting ${template.name}...`, { id: toastId });

      const response = await fetch(`/api/mcp/templates/${id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to delete template');
      }

      toast.success('Template deleted successfully', { id: toastId });

      // Update the cache
      await mutate((currentData) => {
        if (!currentData) return currentData;
        return {
          ...currentData,
          data: currentData.data.filter((t) => t.id !== id),
          count: currentData.count - 1,
        };
      }, false);

      return true;
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Failed to delete template';
      toast.error(errorMessage, { id: toastId });
      return false;
    }
  };

  return {
    templates: data?.data ?? [],
    count: data?.count ?? 0,
    isLoading,
    error,
    mutate,
    createTemplate,
    updateTemplate,
    deleteTemplate,
  };
}
