import { memo } from 'react';
import { Button } from '@/components/ui/button';
import { CheckCircle2, Terminal, Maximize2, Copy, PlayCircle } from 'lucide-react';
import { BotIcon, UserIcon } from '@/components/icons';
import type { DeveloperResult as DeveloperResultType } from '@/lib/ai/tools/sdlc/types';
import { useArtifact } from '@/hooks/use-artifact';
import { generateUUID } from '@/lib/utils';

interface DeveloperResultProps {
  result?: DeveloperResultType;
}

export const DeveloperResult = memo(function DeveloperResult({ result }: DeveloperResultProps) {
  const { setArtifact, setMetadata } = useArtifact();

  // Loading state or invalid data
  if (!result || !Array.isArray(result) || result.length === 0) {
    return (
      <div className="w-full bg-black/95 border border-zinc-800 rounded-lg font-mono">
        <div className="flex items-center gap-2 px-4 py-3 border-b border-zinc-800 bg-zinc-900/50">
          <Terminal className="w-4 h-4 text-emerald-400" />
          <span className="text-zinc-300 text-sm">claude-code</span>
          <div className="flex-1" />
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 rounded-full bg-red-500/80" />
            <div className="w-3 h-3 rounded-full bg-yellow-500/80" />
            <div className="w-3 h-3 rounded-full bg-green-500/80" />
          </div>
        </div>
        <div className="p-4">
          <div className="flex items-center gap-2 text-emerald-400 mb-3">
            <PlayCircle className="w-4 h-4 animate-pulse" />
            <span className="text-sm">Generating code...</span>
          </div>
          <div className="space-y-2">
            <div className="h-3 bg-zinc-800 rounded animate-pulse" />
            <div className="h-3 bg-zinc-800/60 rounded animate-pulse w-3/4" />
            <div className="h-3 bg-zinc-800/40 rounded animate-pulse w-1/2" />
          </div>
        </div>
      </div>
    );
  }

  // Extract task from first user message
  const firstUserMessage = result.find(msg => msg.role === 'user');
  const taskText = firstUserMessage?.content;
  const task = typeof taskText === 'string' ? taskText :
    Array.isArray(taskText) ? taskText.find(c => c.type === 'text')?.text || 'Development Task' :
    'Development Task';

  // Get the final assistant message content for artifact display
  const assistantMessages = result.filter(msg => msg.role === 'assistant');
  const finalMessage = assistantMessages[assistantMessages.length - 1];
  const finalContent = typeof finalMessage?.content === 'string' ? finalMessage.content :
    Array.isArray(finalMessage?.content) ? finalMessage.content.find(c => c.type === 'text')?.text || '' :
    '';

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  return (
    <div className="w-full bg-black/95 border border-zinc-800 rounded-lg font-mono overflow-hidden">
      {/* Terminal Header */}
      <div className="flex items-center gap-2 px-4 py-3 border-b border-zinc-800 bg-zinc-900/50">
        <Terminal className="w-4 h-4 text-emerald-400" />
        <span className="text-zinc-300 text-sm">claude-code</span>
        <div className="flex-1" />

        {/* Window Controls */}
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => copyToClipboard(finalContent)}
            className="h-6 px-2 text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800"
          >
            <Copy className="w-3 h-3" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              const newDocumentId = generateUUID();

              // Make the artifact visible with developer content
              setArtifact((artifact) => ({
                ...artifact,
                title: `Code: ${task}`,
                documentId: newDocumentId,
                kind: 'code' as const,
                content: finalContent,
                isVisible: true,
                status: 'idle' as const,
              }));

              // Set up the artifact metadata with the developer result
              setTimeout(() => {
                setMetadata({ result });
              }, 0);
            }}
            className="h-6 px-2 text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800"
          >
            <Maximize2 className="w-3 h-3" />
          </Button>

          <div className="flex items-center gap-1">
            <div className="w-3 h-3 rounded-full bg-red-500/80" />
            <div className="w-3 h-3 rounded-full bg-yellow-500/80" />
            <div className="w-3 h-3 rounded-full bg-green-500/80" />
          </div>
        </div>
      </div>

      {/* Terminal Content */}
      <div className="p-4 bg-black/90">
        {/* Status Line */}
        <div className="flex items-center gap-2 mb-4">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          <span className="text-zinc-300 text-sm">
            ✓ {task}
          </span>
        </div>

        {/* Messages in Terminal Style */}
        <div className="space-y-4 max-h-96 overflow-y-auto">
          {result.map((message, index) => {
            const isUser = message.role === 'user';
            const content = typeof message.content === 'string'
              ? message.content
              : Array.isArray(message.content)
              ? message.content
                  .filter(block => block.type === 'text')
                  .map(block => block.text || '')
                  .join('')
              : '';

            return (
              <div key={message.id || `message-${index}`} className="space-y-1">
                {/* Message Line */}
                <div className="flex items-start gap-2">
                  {isUser ? (
                    <div className="w-4 h-4 text-zinc-400 shrink-0 mt-0.5">
                      <UserIcon />
                    </div>
                  ) : (
                    <div className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5">
                      <BotIcon />
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <pre className="text-zinc-300 text-sm whitespace-pre-wrap break-words overflow-hidden m-0">{content}</pre>

                    {message.usage && (
                      <div className="mt-2 text-zinc-500 text-xs">
                        tokens: {message.usage.input_tokens + message.usage.output_tokens}
                      </div>
                    )}

                    {message.model && !isUser && (
                      <div className="mt-1 text-zinc-500 text-xs">({message.model})</div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
});
