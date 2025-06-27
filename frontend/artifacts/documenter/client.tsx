import { Artifact } from '@/components/create-artifact';
import {
  CopyIcon,
  DownloadIcon,
  FileIcon as FileTextIcon,
  CrossIcon as RefreshIcon,
  TerminalIcon as Terminal,
  CheckCircleFillIcon as CheckCircle2,
  BotIcon,
  UserIcon,
} from '@/components/icons';
import { toast } from 'sonner';
// Chat message format compatible with Anthropic's Messages API v1
export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string | Array<{
    type: 'text' | 'tool_use' | 'tool_result';
    text?: string;
    name?: string;
    input?: any;
    tool_use_id?: string;
    content?: any;
  }>;
  id?: string;
  type?: 'message';
  model?: string;
  stop_reason?: 'end_turn' | 'max_tokens' | 'stop_sequence';
  stop_sequence?: string | null;
  usage?: {
    input_tokens: number;
    output_tokens: number;
  };
}

export type DocumenterResult = ChatMessage[];

interface DocumenterArtifactMetadata {
  result: DocumenterResult | null;
}

export const documenterArtifact = new Artifact<'documenter', DocumenterArtifactMetadata>({
  kind: 'documenter',
  description: 'Display comprehensive documentation with API references, usage examples, and developer guides.',
  initialize: async ({ setMetadata }) => {
    setMetadata({
      result: null,
    });
  },
  onStreamPart: ({ streamPart, setMetadata }) => {
    if (streamPart.type === 'sdlc-result') {
      const data = streamPart as any;
      if (data.result) {
        setMetadata({ result: data.result });
      }
    }
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
      return (
        <div className="flex flex-col h-full bg-black font-mono">
          <div className="flex items-center gap-2 px-4 py-3 border-b border-zinc-800 bg-zinc-900/50">
            <div className="size-4 text-cyan-400">
              <Terminal size={16} />
            </div>
            <span className="text-zinc-300 text-sm">claude-documenter</span>
            <div className="flex-1" />
            <div className="flex items-center gap-1">
              <div className="size-3 rounded-full bg-red-500/80" />
              <div className="size-3 rounded-full bg-yellow-500/80" />
              <div className="size-3 rounded-full bg-green-500/80" />
            </div>
          </div>
          <div className="flex-1 p-4 bg-black">
            <div className="space-y-3">
              <div className="h-4 bg-zinc-800 rounded animate-pulse" />
              <div className="h-4 bg-zinc-800/60 rounded animate-pulse w-3/4" />
              <div className="h-4 bg-zinc-800/40 rounded animate-pulse w-1/2" />
            </div>
          </div>
        </div>
      );
    }

    const result = metadata.result;

    // Extract task from first user message
    const firstUserMessage = result.find(msg => msg.role === 'user');
    const taskText = firstUserMessage?.content;
    const task = typeof taskText === 'string' ? taskText :
      Array.isArray(taskText) ? taskText.find(c => c.type === 'text')?.text || 'Documentation' :
      'Documentation';

    return (
      <div className="flex flex-col h-full bg-black font-mono">
        {/* Terminal Header */}
        <div className="flex items-center gap-2 px-4 py-3 border-b border-zinc-800 bg-zinc-900/50">
          <div className="size-4 text-cyan-400">
            <Terminal size={16} />
          </div>
          <span className="text-zinc-300 text-sm">claude-documenter</span>
          <div className="flex-1" />
          <div className="flex items-center gap-1">
            <div className="size-3 rounded-full bg-red-500/80" />
            <div className="size-3 rounded-full bg-yellow-500/80" />
            <div className="size-3 rounded-full bg-green-500/80" />
          </div>
        </div>

        {/* Terminal Content */}
        <div className="flex-1 p-4 bg-black overflow-hidden">
          {/* Status Line */}
          <div className="flex items-center gap-2 mb-4">
            <div className="size-4 text-cyan-400">
              <CheckCircle2 size={16} />
            </div>
            <span className="text-zinc-300 text-sm">
              ✓ {task}
            </span>
          </div>

          {/* Messages */}
          <div className="h-full overflow-y-auto space-y-4">
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
                      <div className="size-4 text-zinc-400 shrink-0 mt-0.5">
                        <UserIcon />
                      </div>
                    ) : (
                      <div className="size-4 text-cyan-400 shrink-0 mt-0.5">
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
  },
  actions: [
    {
      icon: <CopyIcon size={18} />,
      description: 'Copy documentation to clipboard',
      onClick: ({ metadata }) => {
        if (metadata?.result) {
          const assistantMessages = metadata.result.filter(msg => msg.role === 'assistant');
          const finalMessage = assistantMessages[assistantMessages.length - 1];
          const finalContent = typeof finalMessage?.content === 'string' ? finalMessage.content :
            Array.isArray(finalMessage?.content) ? finalMessage.content.find(c => c.type === 'text')?.text || '' :
            '';

          if (finalContent) {
            navigator.clipboard.writeText(finalContent);
            toast.success('Documentation copied to clipboard!');
          }
        }
      },
      isDisabled: ({ metadata }) => {
        if (!metadata?.result) return true;
        const assistantMessages = metadata.result.filter(msg => msg.role === 'assistant');
        const finalMessage = assistantMessages[assistantMessages.length - 1];
        const finalContent = typeof finalMessage?.content === 'string' ? finalMessage.content :
          Array.isArray(finalMessage?.content) ? finalMessage.content.find(c => c.type === 'text')?.text || '' :
          '';
        return !finalContent;
      },
    },
    {
      icon: <DownloadIcon size={18} />,
      description: 'Download documentation as markdown file',
      onClick: ({ metadata }) => {
        if (metadata?.result) {
          const assistantMessages = metadata.result.filter(msg => msg.role === 'assistant');
          const finalMessage = assistantMessages[assistantMessages.length - 1];
          const finalContent = typeof finalMessage?.content === 'string' ? finalMessage.content :
            Array.isArray(finalMessage?.content) ? finalMessage.content.find(c => c.type === 'text')?.text || '' :
            '';

          const firstUserMessage = metadata.result.find(msg => msg.role === 'user');
          const taskText = firstUserMessage?.content;
          const task = typeof taskText === 'string' ? taskText :
            Array.isArray(taskText) ? taskText.find(c => c.type === 'text')?.text || 'Documentation' :
            'Documentation';

          if (finalContent) {
            const blob = new Blob([finalContent], { type: 'text/markdown' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `${task.replace(/[^a-zA-Z0-9]/g, '_')}_docs.md`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
            toast.success('Documentation file downloaded!');
          }
        }
      },
      isDisabled: ({ metadata }) => {
        if (!metadata?.result) return true;
        const assistantMessages = metadata.result.filter(msg => msg.role === 'assistant');
        const finalMessage = assistantMessages[assistantMessages.length - 1];
        const finalContent = typeof finalMessage?.content === 'string' ? finalMessage.content :
          Array.isArray(finalMessage?.content) ? finalMessage.content.find(c => c.type === 'text')?.text || '' :
          '';
        return !finalContent;
      },
    },
  ],
  toolbar: [
    {
      icon: <RefreshIcon />,
      description: 'Regenerate documentation',
      onClick: ({ appendMessage }) => {
        appendMessage({
          role: 'user',
          content: 'Please regenerate the documentation with additional detail or examples.',
        });
      },
    },
    {
      icon: <FileTextIcon />,
      description: 'Create API reference',
      onClick: ({ appendMessage }) => {
        appendMessage({
          role: 'user',
          content: 'Please create a comprehensive API reference based on this documentation.',
        });
      },
    },
  ],
});
