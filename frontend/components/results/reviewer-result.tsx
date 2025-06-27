import { memo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { CheckCircle, Search, } from 'lucide-react';
import type { ChatMessage } from '../sdlc-chat-messages';

type ReviewerResultType = ChatMessage[];
import { SDLCChatMessages } from '../sdlc-chat-messages';

interface ReviewerResultProps {
  result?: ReviewerResultType;
}

function ScoreCircle({ score }: { score: number }) {
  const percentage = (score / 10) * 100;
  const strokeColor = score >= 8 ? 'text-green-500' : score >= 6 ? 'text-yellow-500' : 'text-red-500';

  return (
    <div className="flex items-center justify-center">
      <div className="relative w-16 h-16">
        <svg className="w-16 h-16 transform -rotate-90" viewBox="0 0 36 36">
          <path
            className="text-gray-200"
            stroke="currentColor"
            strokeWidth="3"
            fill="none"
            d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
          />
          <path
            className={strokeColor}
            stroke="currentColor"
            strokeWidth="3"
            strokeDasharray={`${percentage}, 100`}
            fill="none"
            d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-sm font-semibold">{score.toFixed(1)}</span>
        </div>
      </div>
    </div>
  );
}

export const ReviewerResult = memo(function ReviewerResult({ result }: ReviewerResultProps) {
  // Loading state or invalid data
  if (!result || !Array.isArray(result) || result.length === 0) {
    return (
      <Card className="w-full">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Search className="w-5 h-5" />
            Reviewing code...
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
    Array.isArray(taskText) ? taskText.find(c => c.type === 'text')?.text || 'Code Review' :
    'Code Review';

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <CheckCircle className="w-5 h-5 text-green-600" />
          Code Review: {task}
        </CardTitle>
      </CardHeader>

      <CardContent className="space-y-4">
        <SDLCChatMessages messages={result} />
      </CardContent>
    </Card>
  );
});
