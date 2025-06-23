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
        tool_type: 'reviewer',
        task: `Review code files: ${codeFiles.join(', ')}`,
        context: {
          codeFiles,
          reviewType,
          standards,
          context,
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
          review: {
            overallScore: 0,
            summary: '',
            issues: [],
            strengths: [],
            metrics: {
              complexity: 'Unknown',
              maintainability: 'Unknown',
              testCoverage: 'Unknown',
            },
          },
        };
      }

      const result = taskData.result;

      return {
        success: result.success,
        review: result.review,
        error: result.error,
      };

    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred',
        review: {
          overallScore: 0,
          summary: '',
          issues: [],
          strengths: [],
          metrics: {
            complexity: 'Unknown',
            maintainability: 'Unknown',
            testCoverage: 'Unknown',
          },
        },
      };
    }
  },
});
