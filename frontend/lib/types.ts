export interface MCPInstance {
  id: string;
  name: string;
  description: string;
  status: 'running' | 'stopped';
  created_at: string;
  owner_id: string;
}
