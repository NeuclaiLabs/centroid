import { createDocumentHandler } from '@/lib/artifacts/server';

export const architectDocumentHandler = createDocumentHandler<'architect'>({
  kind: 'architect',
  onCreateDocument: async ({ title, dataStream, session }) => {
    try {
      // Create SDLC task via backend API
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/v1/sdlc/tasks`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(session?.user?.token && { Authorization: `Bearer ${session.user.token}` }),
        },
        body: JSON.stringify({
          toolType: 'architect',
          task: title,
          context: {},
          workingDirectory: null,
        }),
      });

      if (!response.ok) {
        throw new Error(`Failed to create SDLC task: ${response.statusText}`);
      }

      const taskResponse = await response.json();
      const taskId = taskResponse.taskId;

      // Stream initial status
      dataStream.writeData({
        type: 'sdlc-status',
        taskId,
        status: 'in_progress',
        message: 'Starting architecture design task...',
      });

      // Poll for task completion
      let attempts = 0;
      const maxAttempts = 60; // 5 minutes timeout

      while (attempts < maxAttempts) {
        await new Promise(resolve => setTimeout(resolve, 5000)); // Wait 5 seconds

        const statusResponse = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/v1/sdlc/tasks/${taskId}/status`, {
          headers: {
            ...(session?.user?.token && { Authorization: `Bearer ${session.user.token}` }),
          },
        });
        if (!statusResponse.ok) {
          throw new Error(`Failed to check task status: ${statusResponse.statusText}`);
        }

        const statusData = await statusResponse.json();

        dataStream.writeData({
          type: 'sdlc-status',
          taskId,
          status: statusData.status,
          message: `Architecture task ${statusData.status}...`,
        });

        if (statusData.status === 'completed' || statusData.status === 'error') {
          // Get full task results
          const resultResponse = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/v1/sdlc/tasks/${taskId}`, {
            headers: {
              ...(session?.user?.token && { Authorization: `Bearer ${session.user.token}` }),
            },
          });
          if (resultResponse.ok) {
            const document = await resultResponse.json();
            const taskData = JSON.parse(document.content || '{}');

            if (statusData.status === 'completed') {
              dataStream.writeData({
                type: 'sdlc-result',
                taskId,
                result: taskData.result || [],
                status: 'completed',
              });

              // Return the result messages for storage
              return JSON.stringify(taskData.result || []);
            } else {
              dataStream.writeData({
                type: 'sdlc-error',
                taskId,
                error: taskData.error || 'Unknown error occurred',
                status: 'error',
              });

              throw new Error(taskData.error || 'SDLC architecture task failed');
            }
          }
          break;
        }

        attempts++;
      }

      if (attempts >= maxAttempts) {
        throw new Error('Architecture task timeout - taking longer than expected');
      }

      return '[]'; // Fallback empty result

    } catch (error) {
      dataStream.writeData({
        type: 'sdlc-error',
        error: error instanceof Error ? error.message : 'Unknown error',
        status: 'error',
      });

      throw error;
    }
  },
  onUpdateDocument: async ({ document, description, dataStream, session }) => {
    try {
      // For updates, we create a new task with context from the previous document
      const previousResult = JSON.parse(document.content || '[]');

      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/v1/sdlc/tasks`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(session?.user?.token && { Authorization: `Bearer ${session.user.token}` }),
        },
        body: JSON.stringify({
          toolType: 'architect',
          task: description,
          context: {
            previousResult,
            updateRequest: description,
          },
          workingDirectory: null,
        }),
      });

      if (!response.ok) {
        throw new Error(`Failed to create SDLC update task: ${response.statusText}`);
      }

      const taskResponse = await response.json();
      const taskId = taskResponse.taskId;

      // Stream initial status
      dataStream.writeData({
        type: 'sdlc-status',
        taskId,
        status: 'in_progress',
        message: 'Updating architecture design...',
      });

      // Poll for task completion (same logic as create)
      let attempts = 0;
      const maxAttempts = 60;

      while (attempts < maxAttempts) {
        await new Promise(resolve => setTimeout(resolve, 5000));

        const statusResponse = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/v1/sdlc/tasks/${taskId}/status`, {
          headers: {
            ...(session?.user?.token && { Authorization: `Bearer ${session.user.token}` }),
          },
        });
        if (!statusResponse.ok) {
          throw new Error(`Failed to check task status: ${statusResponse.statusText}`);
        }

        const statusData = await statusResponse.json();

        dataStream.writeData({
          type: 'sdlc-status',
          taskId,
          status: statusData.status,
          message: `Architecture update ${statusData.status}...`,
        });

        if (statusData.status === 'completed' || statusData.status === 'error') {
          const resultResponse = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/v1/sdlc/tasks/${taskId}`, {
            headers: {
              ...(session?.user?.token && { Authorization: `Bearer ${session.user.token}` }),
            },
          });
          if (resultResponse.ok) {
            const document = await resultResponse.json();
            const taskData = JSON.parse(document.content || '{}');

            if (statusData.status === 'completed') {
              dataStream.writeData({
                type: 'sdlc-result',
                taskId,
                result: taskData.result || [],
                status: 'completed',
              });

              return JSON.stringify(taskData.result || []);
            } else {
              dataStream.writeData({
                type: 'sdlc-error',
                taskId,
                error: taskData.error || 'Unknown error occurred',
                status: 'error',
              });

              throw new Error(taskData.error || 'SDLC architecture update task failed');
            }
          }
          break;
        }

        attempts++;
      }

      if (attempts >= maxAttempts) {
        throw new Error('Architecture update task timeout - taking longer than expected');
      }

      return '[]';

    } catch (error) {
      dataStream.writeData({
        type: 'sdlc-error',
        error: error instanceof Error ? error.message : 'Unknown error',
        status: 'error',
      });

      throw error;
    }
  },
});
