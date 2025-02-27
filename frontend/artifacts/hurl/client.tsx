import { Artifact } from '@/components/create-artifact';
import { CodeEditor } from '@/components/code-editor';
import {
  CopyIcon,
  LogsIcon,
  MessageIcon,
  PlayIcon,
  RedoIcon,
  UndoIcon,
} from '@/components/icons';
import { toast } from 'sonner';
import { generateUUID } from '@/lib/utils';
import {
  Console,
  ConsoleOutput,
  ConsoleOutputContent,
} from '@/components/console';

interface Metadata {
  outputs: Array<ConsoleOutput>;
}

// Add Hurl execution interface
interface HurlExecuteResponse {
  success: boolean;
  output: string[];
  exit_code: number;
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
  onStreamPart: ({ streamPart, setArtifact }) => {
    if (streamPart.type === 'code-delta') {
      setArtifact((draftArtifact) => ({
        ...draftArtifact,
        content: streamPart.content as string,
        isVisible:
          draftArtifact.status === 'streaming' &&
          draftArtifact.content.length > 300 &&
          draftArtifact.content.length < 310
            ? true
            : draftArtifact.isVisible,
        status: 'streaming',
      }));
    }
  },
  content: ({ metadata, setMetadata, ...props }) => {
    // const executeHurl = async () => {
    //   const runId = generateUUID();
    //   const outputContent: Array<ConsoleOutputContent> = [];

    //   setMetadata((metadata) => ({
    //     ...metadata,
    //     outputs: [
    //       ...metadata.outputs,
    //       {
    //         id: runId,
    //         contents: [],
    //         status: 'in_progress',
    //       },
    //     ],
    //   }));

    //   try {
    //     const response = await fetch('/api/v1/execute/hurl', {
    //       method: 'POST',
    //       headers: {
    //         'Content-Type': 'application/json',
    //       },
    //       body: JSON.stringify({ script: content }),
    //     });

    //     if (!response.ok) {
    //       throw new Error(`HTTP error! status: ${response.status}`);
    //     }

    //     const result: HurlExecuteResponse = await response.json();

    //     // Convert the output to console content
    //     const contents: ConsoleOutputContent[] = result.output.map((line) => ({
    //       type: 'text',
    //       value: line,
    //     }));

    //     // Add status information
    //     contents.unshift({
    //       type: 'text',
    //       value: `Status: ${result.success ? 'Success' : 'Failed'} (Exit Code: ${result.exit_code})`,
    //     });

    //     setMetadata((metadata) => ({
    //       ...metadata,
    //       outputs: [
    //         ...metadata.outputs.filter((output) => output.id !== runId),
    //         {
    //           id: runId,
    //           contents: contents,
    //           status: result.success ? 'completed' : 'failed',
    //         },
    //       ],
    //     }));
    //   } catch (error) {
    //     console.error('Failed to execute Hurl script:', error);
    //     setMetadata((metadata) => ({
    //       ...metadata,
    //       outputs: [
    //         ...metadata.outputs.filter((output) => output.id !== runId),
    //         {
    //           id: runId,
    //           contents: [
    //             {
    //               type: 'text',
    //               value: `Error: ${error instanceof Error ? error.message : String(error)}`,
    //             },
    //           ],
    //           status: 'failed',
    //         },
    //       ],
    //     }));
    //   }
    // };

    return (
      <>
        <div className="px-1">
          <CodeEditor {...props} />
        </div>

        {metadata?.outputs && (
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
      icon: <PlayIcon size={18} />,
      label: 'Run',
      description: 'Execute Hurl request',
      onClick: async ({ content, setMetadata }) => {
        const runId = generateUUID();

        setMetadata((metadata) => ({
          ...metadata,
          outputs: [
            ...metadata.outputs,
            {
              id: runId,
              contents: [],
              status: 'in_progress',
            },
          ],
        }));

        try {
          const response = await fetch('/api/v1/execute/hurl', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ script: content }),
          });

          if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
          }

          const result: HurlExecuteResponse = await response.json();

          // Convert the output to console content
          const contents: ConsoleOutputContent[] = result.output.map(
            (line) => ({
              type: 'text',
              value: line,
            }),
          );

          // Add status information
          contents.unshift({
            type: 'text',
            value: `Status: ${result.success ? 'Success' : 'Failed'} (Exit Code: ${result.exit_code})`,
          });

          setMetadata((metadata) => ({
            ...metadata,
            outputs: [
              ...metadata.outputs.filter((output) => output.id !== runId),
              {
                id: runId,
                contents: contents,
                status: result.success ? 'completed' : 'failed',
              },
            ],
          }));
        } catch (error) {
          console.error('Failed to execute Hurl script:', error);
          setMetadata((metadata) => ({
            ...metadata,
            outputs: [
              ...metadata.outputs.filter((output) => output.id !== runId),
              {
                id: runId,
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
