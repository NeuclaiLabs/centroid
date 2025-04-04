import { z } from 'zod';

const connectionFormSchema = z.object({
  name: z.string().min(1),
  apiKey: z.string().min(1),
  webhookUrl: z.string().url().optional(),
  description: z.string().optional(),
});

export type ConnectionCreate = z.infer<typeof connectionFormSchema>;

export async function createConnection(data: ConnectionCreate): Promise<void> {
  const response = await fetch('/api/connections', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to create connection');
  }
}
