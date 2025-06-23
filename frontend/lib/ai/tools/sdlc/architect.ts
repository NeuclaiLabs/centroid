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
        tool_type: 'architect',
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
          architecture: {
            systemOverview: '',
            components: [],
            patterns: [],
            tradeoffs: [],
            scalability: {
              currentLoad: '',
              projectedLoad: '',
              bottlenecks: [],
              recommendations: [],
            },
          },
        };
      }

      const result = taskData.result;

      return {
        success: result.success,
        architecture: result.architecture,
        error: result.error,
      };

    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred',
        architecture: {
          systemOverview: '',
          components: [],
          patterns: [],
          tradeoffs: [],
          scalability: {
            currentLoad: '',
            projectedLoad: '',
            bottlenecks: [],
            recommendations: [],
          },
        },
      };
    }
  },
});
