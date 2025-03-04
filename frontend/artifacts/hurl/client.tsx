import { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  PlayIcon,
  CopyIcon,
  UndoIcon,
  RedoIcon,
  MessageIcon,
} from '@/components/icons';
import { toast } from 'sonner';
import { generateUUID } from '@/lib/utils';
import { Artifact } from '@/components/create-artifact';
import { CodeEditor } from '@/components/code-editor';
import { Console, ConsoleOutput } from '@/components/console';

import { HurlPreview } from './preview';
import { nanoid } from 'nanoid';
interface Metadata {
  executionResult?: HurlExecutionResult | undefined;
  outputs: Array<ConsoleOutput>;
}

export const hurlArtifact = new Artifact<'hurl', Metadata>({
  kind: 'hurl',
  description:
    'HTTP request utility for testing APIs with a simple plain text format.',
  initialize: async ({ setMetadata }) => {
    setMetadata({
      outputs: [],
    });
  },
  content: ({ metadata, setMetadata, content, ...props }) => {
    const [activeTab, setActiveTab] = useState<'code' | 'preview'>('code');

    // Function to trigger the run action
    const handleRunScript = () => {
      const runButton = document.querySelector('[data-id="run"]');
      if (runButton) {
        (runButton as HTMLElement).click();
      }
    };

    return (
      <>
        <Tabs
          value={activeTab}
          onValueChange={(value) => setActiveTab(value as 'code' | 'preview')}
          className="w-full"
        >
          <div className="px-2">
            <TabsList className="mb-2">
              <TabsTrigger value="code">Code</TabsTrigger>
              <TabsTrigger value="preview">Preview</TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value="code" className="mt-0">
            <div className="px-2">
              <CodeEditor content={content} {...props} />
            </div>
          </TabsContent>

          <TabsContent value="preview" className="mt-0">
            <div className="px-2 space-y-4 max-h-[500px] overflow-auto">
              <HurlPreview
                content={content}
                executionResult={metadata?.executionResult}
                onRunScript={handleRunScript}
              />
            </div>
          </TabsContent>
        </Tabs>

        {metadata?.outputs.length > 0 && (
          <Console
            consoleOutputs={metadata.outputs}
            setConsoleOutputs={() => {
              setMetadata({
                ...metadata,
                outputs: [],
              });
            }}
          />
        )}
      </>
    );
  },
  actions: [
    {
      id: 'run',
      icon: <PlayIcon size={18} />,
      label: 'Run',
      description: 'Execute Hurl request',
      onClick: async ({ content, setMetadata }) => {
        try {
          const runId = generateUUID();

          // Update metadata to show loading state
          setMetadata((prev) => ({
            ...prev,
            outputs: [
              ...(prev?.outputs || []),
              {
                id: runId,
                contents: [
                  {
                    type: 'text',
                    value: 'Running Hurl script...',
                  },
                ],
                status: 'in_progress',
              },
            ],
          }));

          const response = await fetch('http://localhost:8000/api/v1/execute/hurl', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ script: content }),
          });

          if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
          }

          const responseText = await response.text();

          try {
            // Safely parse the JSON response
            const result = JSON.parse(responseText);

            // Update metadata with execution result
            setMetadata((prev) => ({
              ...prev,
              executionResult: result,
              outputs: [
                ...(prev?.outputs || []).filter((o) => o.id !== runId),
                {
                  id: runId,
                  contents: [
                    {
                      type: 'text',
                      value: `Execution completed in ${result.time} ms with ${result.success ? 'success' : 'errors'}.`,
                    },
                  ],
                  status: result.success ? 'completed' : 'failed',
                },
              ],
            }));
          } catch (parseError) {
            console.error('Error parsing JSON response:', parseError);

            setMetadata((prev) => ({
              ...prev,
              outputs: [
                ...(prev?.outputs || []).filter((o) => o.id !== runId),
                {
                  id: runId,
                  contents: [
                    {
                      type: 'text',
                      value: `Error parsing response: ${parseError instanceof Error ? parseError.message : String(parseError)}\n\nRaw response: ${responseText.substring(0, 500)}...`,
                    },
                  ],
                  status: 'failed',
                },
              ],
            }));
          }
        } catch (error) {
          console.error('Execution error:', error);

          setMetadata((prev) => ({
            ...prev,
            outputs: [
              ...(prev?.outputs || []),
              {
                id: generateUUID(),
                contents: [
                  {
                    type: 'text',
                    value: `Error: ${error instanceof Error ? error.message : String(error)}`,
                  },
                ],
                status: 'failed',
              },
            ],
          }));
        }
      },
    },
    {
      icon: <CopyIcon size={18} />,
      description: 'Copy Hurl script to clipboard',
      onClick: ({ content }) => {
        navigator.clipboard.writeText(content);
        toast.success('Copied to clipboard!');
      },
    },
    {
      icon: <UndoIcon size={18} />,
      description: 'View Previous version',
      onClick: ({ handleVersionChange }) => {
        handleVersionChange('prev');
      },
      isDisabled: ({ currentVersionIndex }) => {
        return currentVersionIndex === 0;
      },
    },
    {
      icon: <RedoIcon size={18} />,
      description: 'View Next version',
      onClick: ({ handleVersionChange }) => {
        handleVersionChange('next');
      },
      isDisabled: ({ isCurrentVersion }) => {
        return isCurrentVersion;
      },
    },
  ],
  toolbar: [
    {
      icon: <MessageIcon />,
      description: 'Explain this Hurl script',
      onClick: ({ appendMessage }) => {
        appendMessage({
          role: 'user',
          content: 'Explain what this Hurl script does',
        });
      },
    },
  ],
});
