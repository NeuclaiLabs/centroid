import { Artifact } from '@/components/create-artifact';
import { DocumentSkeleton } from '@/components/document-skeleton';
import {
  CopyIcon,
  DownloadIcon,
  FileIcon as FileTextIcon,
  CrossIcon as RefreshIcon,
  PlusIcon as Plus,
  EyeIcon as Minus,
} from '@/components/icons';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import type { DeveloperResult } from '@/lib/ai/tools/developer';

interface DeveloperArtifactMetadata {
  result: DeveloperResult | null;
}

function DiffLine({ line, type }: { line: string; type: 'addition' | 'deletion' | 'context' | 'header' }) {
  const getLineStyles = () => {
    switch (type) {
      case 'addition':
        return 'bg-green-50 text-green-800 border-l-2 border-green-400';
      case 'deletion':
        return 'bg-red-50 text-red-800 border-l-2 border-red-400';
      case 'header':
        return 'bg-blue-50 text-blue-800 font-semibold';
      case 'context':
      default:
        return 'bg-gray-50 text-gray-800';
    }
  };

  const getIcon = () => {
    switch (type) {
      case 'addition':
        return <div className="w-3 h-3 text-green-600 mr-2 flex-shrink-0"><Plus size={12} /></div>;
      case 'deletion':
        return <div className="w-3 h-3 text-red-600 mr-2 flex-shrink-0"><Minus size={12} /></div>;
      default:
        return null;
    }
  };

  return (
    <div className={cn('px-3 py-1 flex items-start font-mono text-sm', getLineStyles())}>
      {getIcon()}
      <span className="whitespace-pre overflow-x-auto">{line}</span>
    </div>
  );
}

function DiffView({ diff }: { diff: string }) {
  const lines = diff.split('\n');

  const parsedLines = lines.map((line, index) => {
    if (line.startsWith('diff --git') || line.startsWith('index') || line.startsWith('+++') || line.startsWith('---')) {
      return { type: 'header' as const, content: line };
    } else if (line.startsWith('+')) {
      return { type: 'addition' as const, content: line.substring(1) };
    } else if (line.startsWith('-')) {
      return { type: 'deletion' as const, content: line.substring(1) };
    } else if (line.startsWith('@@')) {
      return { type: 'header' as const, content: line };
    } else {
      return { type: 'context' as const, content: line };
    }
  });

  return (
    <div className="border rounded-lg overflow-hidden bg-white">
      <div className="bg-gray-100 px-3 py-2 text-sm font-medium text-gray-700 border-b">
        Git Diff
      </div>
      <div className="max-h-[calc(100vh-300px)] overflow-y-auto">
        {parsedLines.map((line, index) => (
          <DiffLine
            key={index}
            line={line.content}
            type={line.type}
          />
        ))}
      </div>
    </div>
  );
}

export const developerArtifact = new Artifact<'developer', DeveloperArtifactMetadata>({
  kind: 'developer',
  description: 'Display git diff and code generation results in a maximized view.',
  initialize: async ({ setMetadata }) => {
    setMetadata({
      result: null,
    });
  },
  onStreamPart: () => {
    // Developer artifacts are created manually, not via stream
  },
  content: ({
    mode,
    status,
    content,
    isCurrentVersion,
    currentVersionIndex,
    onSaveContent,
    getDocumentContentById,
    isLoading,
    metadata,
  }) => {
    if (isLoading || !metadata?.result) {
      return <DocumentSkeleton artifactKind="developer" />;
    }

    const result = metadata.result;

    return (
      <div className="flex flex-col h-full p-6">
        {/* Header with stats */}
        <div className="mb-6">
          <h2 className="text-xl font-semibold mb-3">{result.task}</h2>

          {result.success && (
            <div className="flex gap-2 mb-4">
              {result.filesChanged && result.filesChanged.length > 0 && (
                <Badge variant="outline" className="text-sm">
                  <FileTextIcon size={16} />
                  {result.filesChanged.length} file{result.filesChanged.length !== 1 ? 's' : ''}
                </Badge>
              )}

              {result.additions !== undefined && result.additions > 0 && (
                <Badge variant="outline" className="text-sm text-green-700">
                  <Plus size={16} />
                  +{result.additions}
                </Badge>
              )}

              {result.deletions !== undefined && result.deletions > 0 && (
                <Badge variant="outline" className="text-sm text-red-700">
                  <Minus size={16} />
                  -{result.deletions}
                </Badge>
              )}
            </div>
          )}

          {/* Files Changed */}
          {result.success && result.filesChanged && result.filesChanged.length > 0 && (
            <div className="mb-4">
              <h4 className="text-sm font-medium text-gray-700 mb-2">Files Modified:</h4>
              <div className="flex flex-wrap gap-1">
                {result.filesChanged.map((file, index) => (
                  <Badge key={index} variant="secondary" className="text-xs">
                    {file}
                  </Badge>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-auto">
          {result.error ? (
            <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-red-800 font-medium">Error occurred:</p>
              <p className="text-red-700 text-sm mt-1">{result.error}</p>
            </div>
          ) : result.diff ? (
            <DiffView diff={result.diff} />
          ) : (
            <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
              <p className="text-yellow-800">Task completed but no changes were made.</p>
            </div>
          )}
        </div>
      </div>
    );
  },
  actions: [
    {
      icon: <CopyIcon size={18} />,
      description: 'Copy git diff to clipboard',
      onClick: ({ metadata }) => {
        if (metadata?.result?.diff) {
          navigator.clipboard.writeText(metadata.result.diff);
          toast.success('Git diff copied to clipboard!');
        }
      },
      isDisabled: ({ metadata }) => !metadata?.result?.diff,
    },
    {
      icon: <DownloadIcon size={18} />,
      description: 'Download as patch file',
      onClick: ({ metadata }) => {
        if (metadata?.result?.diff) {
          const blob = new Blob([metadata.result.diff], { type: 'text/plain' });
          const url = URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = `${metadata.result.task.replace(/[^a-zA-Z0-9]/g, '_')}.patch`;
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);
          URL.revokeObjectURL(url);
          toast.success('Patch file downloaded!');
        }
      },
      isDisabled: ({ metadata }) => !metadata?.result?.diff,
    },
    {
      icon: <FileTextIcon size={18} />,
      description: 'View file list',
      onClick: ({ metadata }) => {
        if (metadata?.result?.filesChanged) {
          const fileList = metadata.result.filesChanged.join('\n');
          navigator.clipboard.writeText(fileList);
          toast.success('File list copied to clipboard!');
        }
      },
      isDisabled: ({ metadata }) => !metadata?.result?.filesChanged?.length,
    },
  ],
  toolbar: [
    {
      icon: <RefreshIcon />,
      description: 'Regenerate code',
      onClick: ({ appendMessage }) => {
        appendMessage({
          role: 'user',
          content: 'Please regenerate the code with improvements or modifications.',
        });
      },
    },
    {
      icon: <FileTextIcon />,
      description: 'Create documentation',
      onClick: ({ appendMessage }) => {
        appendMessage({
          role: 'user',
          content: 'Please create documentation for the generated code explaining how to use it.',
        });
      },
    },
  ],
});
