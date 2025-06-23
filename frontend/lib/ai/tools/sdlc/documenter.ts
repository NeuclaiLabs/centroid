import { tool } from 'ai';
import { z } from 'zod';
import { createSDLCTask, pollForTaskCompletion, parseTaskData } from './api';
import type { DocumenterResult } from './types';

export const documenter = tool({
  description: 'Generate comprehensive documentation including overviews, API references, examples, and changelogs. The result will be displayed in a rich UI component.',
  parameters: z.object({
    subject: z.string().describe('What to document (feature, API, codebase, etc.)'),
    type: z.enum(['api', 'user-guide', 'technical', 'readme', 'changelog']).optional().describe('Type of documentation to generate'),
    audience: z.enum(['developer', 'end-user', 'admin', 'stakeholder']).optional().describe('Target audience for the documentation'),
    format: z.enum(['markdown', 'html', 'pdf', 'wiki']).optional().describe('Output format preference'),
    includeExamples: z.boolean().optional().describe('Whether to include code examples'),
  }),
  execute: async ({ subject, type, audience, format, includeExamples }): Promise<DocumenterResult> => {
    try {
      // Create the SDLC task
      const taskResponse = await createSDLCTask({
        tool_type: 'documenter',
        task: `Generate documentation for: ${subject}`,
        context: {
          subject,
          type,
          audience,
          format,
          includeExamples,
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
          documentation: {
            title: '',
            sections: [],
            examples: [],
            changelog: [],
          },
        };
      }

      const result = taskData.result;

      return {
        success: result.success,
        documentation: result.documentation,
        error: result.error,
      };

    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred',
        documentation: {
          title: '',
          sections: [],
          examples: [],
          changelog: [],
        },
      };
    }
  },
});
