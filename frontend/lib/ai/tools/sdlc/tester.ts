import { tool } from 'ai';
import { z } from 'zod';
import { createSDLCTask, pollForTaskCompletion, parseTaskData } from './api';
import type { TesterResult } from './types';

export const tester = tool({
  description: 'Create comprehensive test plans with test types, strategies, automation levels, and risk assessment. The result will be displayed in a rich UI component.',
  parameters: z.object({
    feature: z.string().describe('Feature or system to create test plan for'),
    testTypes: z.array(z.enum(['unit', 'integration', 'e2e', 'performance', 'security', 'accessibility'])).optional().describe('Types of tests to include'),
    coverage: z.string().optional().describe('Desired test coverage percentage or requirements'),
    frameworks: z.array(z.string()).optional().describe('Testing frameworks to use'),
    riskAreas: z.array(z.string()).optional().describe('Known risk areas to focus testing on'),
  }),
  execute: async ({ feature, testTypes, coverage, frameworks, riskAreas }): Promise<TesterResult> => {
    try {
      // Create the SDLC task
      const taskResponse = await createSDLCTask({
        tool_type: 'tester',
        task: `Create test plan for: ${feature}`,
        context: {
          feature,
          testTypes,
          coverage,
          frameworks,
          riskAreas,
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
          testPlan: {
            title: '',
            testTypes: [],
            testStrategy: '',
            automationLevel: '',
            riskAreas: [],
          },
        };
      }

      const result = taskData.result;

      return {
        success: result.success,
        testPlan: result.testPlan,
        error: result.error,
      };

    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred',
        testPlan: {
          title: '',
          testTypes: [],
          testStrategy: '',
          automationLevel: '',
          riskAreas: [],
        },
      };
    }
  },
});
