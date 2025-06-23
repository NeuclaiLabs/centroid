import { tool } from 'ai';
import { z } from 'zod';
import { createSDLCTask, pollForTaskCompletion, parseTaskData } from './api';
import type { DeveloperResult } from './types';

export const developer = tool({
  description: 'Generate code for a given task using Claude Code SDK and return the git diff patch. The result will be displayed in a rich UI component, so do not repeat or summarize the diff content in your response.',
  parameters: z.object({
    task: z.string().describe('The development task to implement'),
    workingDirectory: z.string().optional().describe('Working directory to execute the task in'),
    context: z.record(z.any()).optional().describe('Additional context for the development task'),
  }),
  execute: async ({ task, workingDirectory, context }): Promise<DeveloperResult> => {
    try {
      // Create the SDLC task
      const taskResponse = await createSDLCTask({
        toolType: 'developer',
        task,
        context,
        workingDirectory,
      });

      // Poll for completion
      const document = await pollForTaskCompletion(taskResponse.taskId);

      // Parse the task data
      const taskData = parseTaskData(document.content);

      if (!taskData) {
        throw new Error('Failed to parse task results');
      }

      if (taskData.status === 'ERROR') {
        // Return error as a message format
        return [
          {
            role: 'user',
            content: [{ type: 'text', text: task }]
          },
          {
            id: 'error_msg',
            type: 'message',
            role: 'assistant',
            model: 'claude-3-5-sonnet-20241022',
            content: [{
              type: 'text',
              text: `Error: ${taskData.error || 'Unknown error occurred'}`
            }],
            stop_reason: 'end_turn',
            stop_sequence: null,
            usage: { input_tokens: 0, output_tokens: 0 }
          }
        ];
      }

      // The result should now be an array of ChatMessages
      const result = taskData.result;

      if (Array.isArray(result)) {
        return result;
      } else {
        throw new Error('Expected messages array but got different format');
      }

    } catch (error) {
      // Return error as a message format
      return [
        {
          role: 'user',
          content: [{ type: 'text', text: task }]
        },
        {
          id: 'error_msg',
          type: 'message',
          role: 'assistant',
          model: 'claude-3-5-sonnet-20241022',
          content: [{
            type: 'text',
            text: `Error: ${error instanceof Error ? error.message : 'Unknown error occurred'}`
          }],
          stop_reason: 'end_turn',
          stop_sequence: null,
          usage: { input_tokens: 0, output_tokens: 0 }
        }
      ];
    }
  },
});
