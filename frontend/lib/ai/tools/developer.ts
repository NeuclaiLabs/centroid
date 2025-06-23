import { tool } from 'ai';
import { z } from 'zod';

export interface DeveloperResult {
  task: string;
  success: boolean;
  diff: string;
  error?: string;
  filesChanged?: string[];
  additions?: number;
  deletions?: number;
}

export const developer = tool({
  description: 'Generate code for a given task and return the git diff patch. The result will be displayed in a rich UI component, so do not repeat or summarize the diff content in your response.',
  parameters: z.object({
    task: z.string().describe('The development task to implement'),
    workingDirectory: z.string().optional().describe('Working directory to execute the task in'),
  }),
  execute: async ({ task, workingDirectory }): Promise<DeveloperResult> => {
    try {
      // For now, we'll simulate code generation and return a mock diff
      // In a real implementation, this would:
      // 1. Use an AI model to generate code based on the task
      // 2. Apply the changes to files
      // 3. Generate the actual git diff

      const mockDiff = `diff --git a/src/components/NewFeature.tsx b/src/components/NewFeature.tsx
new file mode 100644
index 0000000..1234567
--- /dev/null
+++ b/src/components/NewFeature.tsx
@@ -0,0 +1,25 @@
+import React from 'react';
+
+interface NewFeatureProps {
+  title: string;
+  description?: string;
+}
+
+export function NewFeature({ title, description }: NewFeatureProps) {
+  return (
+    <div className="p-4 border rounded-lg shadow-sm">
+      <h2 className="text-xl font-semibold mb-2">{title}</h2>
+      {description && (
+        <p className="text-gray-600">{description}</p>
+      )}
+      <button className="mt-4 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600">
+        Execute Feature
+      </button>
+    </div>
+  );
+}
+
+export default NewFeature;
diff --git a/src/types/index.ts b/src/types/index.ts
index abcd123..efgh456 100644
--- a/src/types/index.ts
+++ b/src/types/index.ts
@@ -10,3 +10,8 @@ export interface User {
+  email: string;
+  createdAt: Date;
+}
+
+export interface Feature {
+  id: string;
+  name: string;
+}`;

      // Parse diff to extract file information
      const filesChanged = mockDiff.match(/diff --git a\/(.+?) b\//g)?.map(match =>
        match.replace('diff --git a/', '').replace(/ b\/.*/, '')
      ) || [];

      const additions = (mockDiff.match(/^\+(?!\+\+)/gm) || []).length;
      const deletions = (mockDiff.match(/^-(?!--)/gm) || []).length;

      return {
        task,
        success: true,
        diff: mockDiff,
        filesChanged,
        additions,
        deletions,
      };
    } catch (error) {
      return {
        task,
        success: false,
        diff: '',
        error: error instanceof Error ? error.message : 'Unknown error occurred',
      };
    }
  },
});
