import useSWR from 'swr';
import { toast } from 'sonner';
import type { MCPServer, MCPTool } from '@/app/(core)/types';


interface MCPServersResponse {
  data: MCPServer[];
  count: number;
}

interface UseMCPServersOptions {
  templateId?: string;
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

export function useMCPServers(options: UseMCPServersOptions = {}) {
  const { templateId } = options;

  const { data, error, isLoading, mutate } = useSWR<MCPServersResponse>(
    '/api/mcp-servers',
    fetcher,
  );

  const changeServerState = async (
    serverId: string,
    action: 'start' | 'stop',
  ) => {
    const server = data?.data.find((s) => s.id === serverId);
    if (!server) return null;

    const actionVerb = action === 'start' ? 'starting' : 'stopping';
    const toastId = `toggle-status-${serverId}`;

    try {
      toast.loading(`${actionVerb} ${server.name}...`, { id: toastId });

      const response = await fetch(`/api/mcp-servers/${serverId}/${action}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });

      if (!response.ok) {
        throw new Error(
          (await response.json()).error || `Failed to ${actionVerb} server`,
        );
      }

      const updatedServer = await response.json();
      const resultMessage =
        updatedServer.state === 'running'
          ? 'Started successfully'
          : 'Stopped successfully';

      toast.success(resultMessage, { id: toastId });

      // Update the cache
      await mutate((currentData) => {
        if (!currentData) return currentData;
        return {
          ...currentData,
          data: currentData.data.map((s) =>
            s.id === serverId ? updatedServer : s,
          ),
        };
      }, false);

      return updatedServer;
    } catch (error) {
      const errorMessage =
        error instanceof Error
          ? error.message
          : 'Failed to update server state';
      toast.error(errorMessage, { id: toastId });
      return null;
    }
  };

  const deleteServer = async (serverId: string) => {
    const server = data?.data.find((s) => s.id === serverId);
    if (!server) return false;

    const toastId = `delete-server-${serverId}`;

    try {
      toast.loading(`Deleting ${server.name}...`, { id: toastId });

      const response = await fetch(`/api/mcp-servers/${serverId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to delete server');
      }

      toast.success('Server deleted successfully', { id: toastId });

      // Update the cache
      await mutate((currentData) => {
        if (!currentData) return currentData;
        return {
          ...currentData,
          data: currentData.data.filter((s) => s.id !== serverId),
          count: currentData.count - 1,
        };
      }, false);

      return true;
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Failed to delete server';
      toast.error(errorMessage, { id: toastId });
      return false;
    }
  };

  const updateEnvironmentVariable = async (
    serverId: string,
    name: string,
    value: string,
  ) => {
    const server = data?.data.find((s) => s.id === serverId);
    if (!server) return null;

    const toastId = `update-env-${serverId}-${name}`;

    try {
      toast.loading('Updating environment variable...', { id: toastId });

      // Create updated server object with new secret value
      const updatedServerData = {
        secrets: {
          ...(server.secrets || {}),
          [name]: value,
        },
      };

      console.log(updatedServerData);

      const response = await fetch(`/api/mcp-servers/${serverId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedServerData),
      });

      if (!response.ok) {
        throw new Error(
          (await response.json()).error ||
            'Failed to update environment variable',
        );
      }

      const updatedServer = await response.json();
      toast.success('Environment variable updated', { id: toastId });
      console.log(updatedServer);
      // Update the cache
      await mutate((currentData) => {
        if (!currentData) return currentData;
        return {
          ...currentData,
          data: currentData.data.map((s) =>
            s.id === serverId ? updatedServer : s,
          ),
        };
      }, false);

      return updatedServer;
    } catch (error) {
      const errorMessage =
        error instanceof Error
          ? error.message
          : 'Failed to update environment variable';
      toast.error(errorMessage, { id: toastId });
      return null;
    }
  };

  const toggleToolStatus = async (
    serverId: string,
    toolName: string,
    status: boolean,
  ) => {
    const server = data?.data.find((s) => s.id === serverId);
    if (!server) return null;

    const toastId = `toggle-tool-${serverId}-${toolName}`;
    const actionVerb = status ? 'Activating' : 'Deactivating';

    try {
      toast.loading(`${actionVerb} ${toolName}...`, { id: toastId });

      // Create a copy of the current tools array or an empty array if none exists
      const currentTools = [...(server.tools || [])];

      // Find the tool to update
      const updatedTools = currentTools.map((tool) => {
        if (tool.name === toolName) {
          return { ...tool, status };
        }
        return tool;
      });

      // If the tool wasn't found in the array (unlikely but possible), we'll add it with the status
      if (!currentTools.some((tool: MCPTool) => tool.name === toolName)) {
        updatedTools.push({
          name: toolName,
          description: '', // We don't have this info, so using empty string
          parameters: {
            type: 'object',
            properties: {},
          }, // We don't have this info, so using empty object
          status,
        });
      }

      // Update the server with the modified tools array
      const response = await fetch(`/api/mcp-servers/${serverId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tools: updatedTools }),
      });

      if (!response.ok) {
        throw new Error(
          (await response.json()).error ||
            `Failed to ${actionVerb.toLowerCase()} tool`,
        );
      }

      const updatedServer = await response.json();
      const resultMessage = `${toolName} ${
        status ? 'activated' : 'deactivated'
      } successfully`;

      toast.success(resultMessage, { id: toastId });

      // Update the cache
      await mutate((currentData) => {
        if (!currentData) return currentData;
        return {
          ...currentData,
          data: currentData.data.map((s) =>
            s.id === serverId ? updatedServer : s,
          ),
        };
      }, false);

      return updatedServer;
    } catch (error) {
      const errorMessage =
        error instanceof Error
          ? error.message
          : `Failed to ${actionVerb.toLowerCase()} tool`;
      toast.error(errorMessage, { id: toastId });
      return null;
    }
  };

  return {
    servers: data?.data ?? [],
    count: data?.count ?? 0,
    error,
    isLoading,
    mutate,
    changeServerState,
    deleteServer,
    updateEnvironmentVariable,
    toggleToolStatus,
  };
}
