import { memo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { CheckCircle, Calendar, } from 'lucide-react';
import type { ChatMessage } from '../sdlc-chat-messages';

type PlannerResultType = ChatMessage[];
import { SDLCChatMessages } from '../sdlc-chat-messages';

interface PlannerResultProps {
  result?: PlannerResultType;
}

export const PlannerResult = memo(function PlannerResult({ result }: PlannerResultProps) {
  // Loading state or invalid data
  if (!result || !Array.isArray(result) || result.length === 0) {
    return (
      <Card className="w-full">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="w-5 h-5" />
            Creating project plan...
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

  // Extract task from first user message
  const firstUserMessage = result.find(msg => msg.role === 'user');
  const taskText = firstUserMessage?.content;
  const task = typeof taskText === 'string' ? taskText :
    Array.isArray(taskText) ? taskText.find(c => c.type === 'text')?.text || 'Planning Task' :
    'Planning Task';

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <CheckCircle className="w-5 h-5 text-green-600" />
          Project Plan: {task}
        </CardTitle>
      </CardHeader>

      <CardContent className="space-y-4">
        <SDLCChatMessages messages={result} />
      </CardContent>
    </Card>
  );
});
