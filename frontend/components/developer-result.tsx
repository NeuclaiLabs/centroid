import { memo } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, XCircle, FileText, Plus, Minus, Copy, Maximize2 } from 'lucide-react';
import type { DeveloperResult as DeveloperResultType } from '@/lib/ai/tools/developer';
import { useArtifact } from '@/hooks/use-artifact';
import { generateUUID } from '@/lib/utils';

interface DeveloperResultProps {
  result?: DeveloperResultType;
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
        return <Plus className="w-3 h-3 text-green-600 mr-2 flex-shrink-0" />;
      case 'deletion':
        return <Minus className="w-3 h-3 text-red-600 mr-2 flex-shrink-0" />;
      default:
        return null;
    }
  };

  return (
    <div className={`px-3 py-1 flex items-start font-mono text-sm ${getLineStyles()}`}>
      {getIcon()}
      <span className="whitespace-pre-wrap break-all">{line}</span>
    </div>
  );
}

function DiffView({ diff }: { diff: string }) {
  const lines = diff.split('\n');

  const parsedLines = lines.map((line) => {
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

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(diff);
    } catch (err) {
      console.error('Failed to copy diff:', err);
    }
  };

  return (
    <div className="relative">
      <div className="absolute top-2 right-2 z-10">
        <Button
          variant="outline"
          size="sm"
          onClick={copyToClipboard}
          className="h-8 px-2"
        >
          <Copy className="w-3 h-3" />
        </Button>
      </div>
      <div className="border rounded-lg overflow-hidden bg-white">
        <div className="bg-gray-100 px-3 py-2 text-sm font-medium text-gray-700 border-b">
          Git Diff
        </div>
        <div className="max-h-96 overflow-y-auto overflow-x-auto">
          {parsedLines.map((line, index) => (
            <DiffLine
              key={index}
              line={line.content}
              type={line.type}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

export const DeveloperResult = memo(function DeveloperResult({ result }: DeveloperResultProps) {
  const { setArtifact, setMetadata } = useArtifact();

  // Loading state
  if (!result) {
    return (
      <Card className="w-full">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="w-5 h-5" />
            Generating code...
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="h-4 bg-gray-200 rounded animate-pulse" />
            <div className="h-32 bg-gray-200 rounded animate-pulse" />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            {result.success ? (
              <CheckCircle className="w-5 h-5 text-green-600" />
            ) : (
              <XCircle className="w-5 h-5 text-red-600" />
            )}
            Developer Task: {result.task}
          </CardTitle>

          {result.success && result.diff && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                const newDocumentId = generateUUID();

                // Make the artifact visible with developer content
                setArtifact((artifact) => ({
                  ...artifact,
                  title: `Code: ${result.task}`,
                  documentId: newDocumentId,
                  kind: 'developer' as const,
                  content: result.diff,
                  isVisible: true,
                  status: 'idle' as const,
                }));

                // Set up the artifact metadata with the developer result
                // Use setTimeout to ensure the artifact is updated first
                setTimeout(() => {
                  setMetadata({ result });
                }, 0);
              }}
              className="h-8 px-3"
            >
              <Maximize2 className="w-3 h-3 mr-1" />
              Maximize
            </Button>
          )}
        </div>

        {result.success && (
          <div className="flex flex-wrap gap-2 mt-2">
            {result.filesChanged && result.filesChanged.length > 0 && (
              <Badge variant="outline" className="text-xs">
                <FileText className="w-3 h-3 mr-1" />
                {result.filesChanged.length} file{result.filesChanged.length !== 1 ? 's' : ''} changed
              </Badge>
            )}

            {result.additions !== undefined && result.additions > 0 && (
              <Badge variant="outline" className="text-xs text-green-700">
                <Plus className="w-3 h-3 mr-1" />
                +{result.additions}
              </Badge>
            )}

            {result.deletions !== undefined && result.deletions > 0 && (
              <Badge variant="outline" className="text-xs text-red-700">
                <Minus className="w-3 h-3 mr-1" />
                -{result.deletions}
              </Badge>
            )}
          </div>
        )}
      </CardHeader>

      <CardContent className="space-y-4">
        {result.error ? (
          <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-red-800 font-medium">Error occurred:</p>
            <p className="text-red-700 text-sm mt-1">{result.error}</p>
          </div>
        ) : result.diff ? (
          <div className="space-y-4">
            {result.filesChanged && result.filesChanged.length > 0 && (
              <div>
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

            <DiffView diff={result.diff} />
          </div>
        ) : (
          <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
            <p className="text-yellow-800">Task completed but no changes were made.</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
});
