import { tool } from 'ai';
import { z } from 'zod';
import { createSDLCTask, pollForTaskCompletion, parseTaskData } from './api';
import type { PlannerResult } from './types';

export const planner = tool({
  description: 'Create a comprehensive project plan with phases, tasks, dependencies, risks, and time estimates. The result will be displayed in a rich UI component.',
  parameters: z.object({
    task: z.string().describe('The project or feature to plan'),
    scope: z.string().optional().describe('Project scope and boundaries'),
    constraints: z.array(z.string()).optional().describe('Known constraints or limitations'),
    stakeholders: z.array(z.string()).optional().describe('Key stakeholders and their roles'),
    timeline: z.string().optional().describe('Desired timeline or deadline'),
  }),
  execute: async ({ task, scope, constraints, stakeholders, timeline }): Promise<PlannerResult> => {
    try {
      // Create the SDLC task
      const taskResponse = await createSDLCTask({
        toolType: 'planner',
        task,
        context: {
          scope,
          constraints,
          stakeholders,
          timeline,
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
          content: `Error in project planning: ${taskData.error || 'Unknown error occurred'}`,
          id: `error-${Date.now()}`,
        }];
      }

      // Return the messages array from the task data
      return taskData.result || taskData.messages || [];

    } catch (error) {
      return [{
        role: 'assistant',
        content: `Error in project planning: ${error instanceof Error ? error.message : 'Unknown error occurred'}`,
        id: `error-${Date.now()}`,
      }];
    }
  },
});
