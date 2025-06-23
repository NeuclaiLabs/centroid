import { memo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, XCircle, Calendar, Users, Clock } from 'lucide-react';
import type { PlannerResult as PlannerResultType } from '@/lib/ai/tools/sdlc/types';
import { SDLCChatMessages } from '../sdlc-chat-messages';

interface PlannerResultProps {
  result?: PlannerResultType;
}

export const PlannerResult = memo(function PlannerResult({ result }: PlannerResultProps) {
  // Loading state
  if (!result) {
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

  if (!result.success) {
    return (
      <Card className="w-full">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <XCircle className="w-5 h-5 text-red-600" />
            Planning Failed
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-red-800 font-medium">Error occurred:</p>
            <p className="text-red-700 text-sm mt-1">{result.error}</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <CheckCircle className="w-5 h-5 text-green-600" />
          {result.plan.title}
        </CardTitle>
        <div className="flex flex-wrap gap-2 mt-2">
          <Badge variant="outline" className="text-xs">
            <Clock className="w-3 h-3 mr-1" />
            {result.plan.estimatedTime}
          </Badge>
          <Badge variant="outline" className="text-xs">
            <Users className="w-3 h-3 mr-1" />
            {result.plan.phases.length} phases
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {result.messages && result.messages.length > 0 ? (
          <SDLCChatMessages messages={result.messages} />
        ) : (
          <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
            <p className="text-yellow-800">No planning session messages available.</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
});
