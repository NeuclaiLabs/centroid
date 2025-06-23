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
        tool_type: 'planner',
        task,
        context: {
          scope,
          constraints,
          stakeholders,
          timeline,
        },
      });

      // Poll for completion
      const document = await pollForTaskCompletion(taskResponse.task_id);

      // Parse the task data
      const taskData = parseTaskData(document.content);

      if (!taskData) {
        throw new Error('Failed to parse task results');
      }

      if (taskData.status === 'ERROR') {
        return {
          success: false,
          error: taskData.error || 'Unknown error occurred',
          plan: {
            title: '',
            phases: [],
            dependencies: [],
            risks: [],
            estimatedTime: '',
          },
        };
      }

      const result = taskData.result;

      return {
        success: result.success,
        plan: result.plan,
        error: result.error,
      };

    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred',
        plan: {
          title: '',
          phases: [],
          dependencies: [],
          risks: [],
          estimatedTime: '',
        },
      };
    }
  },
});
