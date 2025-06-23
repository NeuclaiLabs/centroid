'use client';

import { memo } from 'react';
import { motion } from 'framer-motion';
import { SparklesIcon, UserIcon } from './icons';
import { Markdown } from './markdown';
import { Badge } from './ui/badge';
import { cn, sanitizeText } from '@/lib/utils';
import type { ChatMessage } from '@/lib/ai/tools/sdlc/types';

interface SDLCChatMessagesProps {
  messages: ChatMessage[];
  className?: string;
}

interface SDLCChatMessageProps {
  message: ChatMessage;
  index: number;
}

const SDLCChatMessage = memo(function SDLCChatMessage({ message, index }: SDLCChatMessageProps) {
  const isUser = message.role === 'user';

  // Handle both string content and Anthropic API format (array of content blocks)
  const content = typeof message.content === 'string'
    ? message.content
    : Array.isArray(message.content)
    ? message.content
        .filter(block => block.type === 'text')
        .map(block => block.text || '')
        .join('')
    : '';

  return (
    <motion.div
      data-testid={`sdlc-message-${message.role}`}
      className="w-full mx-auto max-w-3xl px-4 group/message"
      initial={{ y: 5, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ delay: index * 0.1 }}
      data-role={message.role}
    >
      <div
        className={cn(
          'flex gap-4 w-full',
          {
            'group-data-[role=user]/message:ml-auto group-data-[role=user]/message:max-w-2xl group-data-[role=user]/message:w-fit': isUser
          }
        )}
      >
        {!isUser && (
          <div className="size-8 flex items-center rounded-full justify-center ring-1 shrink-0 ring-border bg-background">
            <div className="translate-y-px">
              <SparklesIcon size={14} />
            </div>
          </div>
        )}

        <div className="flex flex-col gap-4 w-full">
          <div
            className={cn('flex flex-col gap-4', {
              'bg-primary text-primary-foreground px-3 py-2 rounded-xl': isUser,
            })}
          >
            <Markdown>{sanitizeText(content)}</Markdown>
          </div>

          {/* Model and usage info for assistant messages */}
          {!isUser && (message.model || message.usage) && (
            <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
              {message.model && (
                <Badge variant="outline" className="text-xs">
                  {message.model}
                </Badge>
              )}
              {message.usage && (
                <Badge variant="outline" className="text-xs">
                  {message.usage.input_tokens + message.usage.output_tokens} tokens
                </Badge>
              )}
            </div>
          )}
        </div>

        {isUser && (
          <div className="size-8 flex items-center rounded-full justify-center ring-1 shrink-0 ring-border bg-background">
            <UserIcon size={14} />
          </div>
        )}
      </div>
    </motion.div>
  );
});

export const SDLCChatMessages = memo(function SDLCChatMessages({
  messages,
  className
}: SDLCChatMessagesProps) {
  if (!messages || messages.length === 0) {
    return null;
  }

  return (
    <div className={cn("flex flex-col gap-4", className)}>
      <div className="text-sm font-medium text-muted-foreground mb-2 px-4">
        💬 Development Session
      </div>

      <div className="space-y-4">
        {messages.map((message, index) => (
          <SDLCChatMessage
            key={message.id || `message-${index}`}
            message={message}
            index={index}
          />
        ))}
      </div>
    </div>
  );
});
