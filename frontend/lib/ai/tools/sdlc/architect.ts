import { tool } from 'ai';
import { z } from 'zod';
import { createSDLCTask, pollForTaskCompletion, parseTaskData } from './api';
import type { ArchitectResult } from './types';

export const architect = tool({
  description: 'Design system architecture with components, patterns, trade-offs, and scalability considerations. The result will be displayed in a rich UI component.',
  parameters: z.object({
    requirements: z.string().describe('System requirements and functionality to architect'),
    scale: z.enum(['small', 'medium', 'large', 'enterprise']).optional().describe('Expected system scale'),
    constraints: z.array(z.string()).optional().describe('Technical constraints or limitations'),
    technologies: z.array(z.string()).optional().describe('Preferred or required technologies'),
    patterns: z.array(z.string()).optional().describe('Architectural patterns to consider'),
  }),
  execute: async ({ requirements, scale, constraints, technologies, patterns }): Promise<ArchitectResult> => {
    try {
      // Create the SDLC task
      const taskResponse = await createSDLCTask({
        toolType: 'architect',
        task: `Design architecture for: ${requirements}`,
        context: {
          requirements,
          scale,
          constraints,
          technologies,
          patterns,
        },
      });

      // Poll for completion
      const document = await pollForTaskCompletion(taskResponse.taskId);

      // Parse the task data
      const taskData = parseTaskData(document.content);

      if (!taskData) {
        throw new Error('Failed to parse task results');
      }

      if (taskData.status === 'ERROR') {
        return [{
          role: 'assistant',
          content: `Error in architecture design: ${taskData.error || 'Unknown error occurred'}`,
          id: `error-${Date.now()}`,
        }];
      }

      // Return the messages array from the task data
      return taskData.result || taskData.messages || [];

    } catch (error) {
      return [{
        role: 'assistant',
        content: `Error in architecture design: ${error instanceof Error ? error.message : 'Unknown error occurred'}`,
        id: `error-${Date.now()}`,
      }];
    }
  },
});
