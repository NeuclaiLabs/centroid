import { tool } from 'ai';
import { z } from 'zod';
import { createSDLCTask, pollForTaskCompletion, parseTaskData } from './api';
import type { ReviewerResult } from './types';

export const reviewer = tool({
  description: 'Perform comprehensive code review analysis including quality scores, issues, suggestions, and metrics. The result will be displayed in a rich UI component.',
  parameters: z.object({
    codeFiles: z.array(z.string()).describe('File paths or code snippets to review'),
    reviewType: z.enum(['security', 'performance', 'maintainability', 'general']).optional().describe('Type of review to focus on'),
    standards: z.array(z.string()).optional().describe('Coding standards or guidelines to check against'),
    context: z.string().optional().describe('Additional context about the codebase or review requirements'),
  }),
  execute: async ({ codeFiles, reviewType, standards, context }): Promise<ReviewerResult> => {
    try {
      // Create the SDLC task
      const taskResponse = await createSDLCTask({
        toolType: 'reviewer',
        task: `Review code files: ${codeFiles.join(', ')}`,
        context: {
          codeFiles,
          reviewType,
          standards,
          context,
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
          content: `Error in code review: ${taskData.error || 'Unknown error occurred'}`,
          id: `error-${Date.now()}`,
        }];
      }

      // Return the messages array from the task data
      return taskData.result || taskData.messages || [];

    } catch (error) {
      return [{
        role: 'assistant',
        content: `Error in code review: ${error instanceof Error ? error.message : 'Unknown error occurred'}`,
        id: `error-${Date.now()}`,
      }];
    }
  },
});
