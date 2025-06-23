import { memo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, XCircle, Search, AlertTriangle, CheckSquare, BarChart3 } from 'lucide-react';
import type { ReviewerResult as ReviewerResultType } from '@/lib/ai/tools/sdlc/types';

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
  // Loading state
  if (!result) {
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

  if (!result.success) {
    return (
      <Card className="w-full">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <XCircle className="w-5 h-5 text-red-600" />
            Review Failed
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

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'high': return 'border-red-200 bg-red-50';
      case 'medium': return 'border-yellow-200 bg-yellow-50';
      case 'low': return 'border-blue-200 bg-blue-50';
      default: return 'border-gray-200 bg-gray-50';
    }
  };

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case 'high': return <AlertTriangle className="w-4 h-4 text-red-500" />;
      case 'medium': return <AlertTriangle className="w-4 h-4 text-yellow-500" />;
      case 'low': return <AlertTriangle className="w-4 h-4 text-blue-500" />;
      default: return <AlertTriangle className="w-4 h-4 text-gray-500" />;
    }
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <CheckCircle className="w-5 h-5 text-green-600" />
            Code Review Complete
          </CardTitle>
          <ScoreCircle score={result.review.overallScore} />
        </div>
        <p className="text-sm text-gray-600 mt-2">{result.review.summary}</p>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Metrics */}
        <div>
          <h4 className="text-sm font-medium text-gray-700 mb-3 flex items-center gap-1">
            <BarChart3 className="w-4 h-4" />
            Quality Metrics
          </h4>
          <div className="grid grid-cols-3 gap-4">
            <div className="text-center p-3 bg-gray-50 rounded-lg">
              <div className="text-sm font-medium text-gray-900">{result.review.metrics.complexity}</div>
              <div className="text-xs text-gray-500">Complexity</div>
            </div>
            <div className="text-center p-3 bg-gray-50 rounded-lg">
              <div className="text-sm font-medium text-gray-900">{result.review.metrics.maintainability}</div>
              <div className="text-xs text-gray-500">Maintainability</div>
            </div>
            <div className="text-center p-3 bg-gray-50 rounded-lg">
              <div className="text-sm font-medium text-gray-900">{result.review.metrics.testCoverage}</div>
              <div className="text-xs text-gray-500">Test Coverage</div>
            </div>
          </div>
        </div>

        {/* Issues */}
        {result.review.issues.length > 0 && (
          <div>
            <h4 className="text-sm font-medium text-gray-700 mb-3">Issues Found</h4>
            <div className="space-y-3">
              {result.review.issues.map((issue, index) => (
                <div key={index} className={`border rounded-lg p-4 ${getSeverityColor(issue.severity)}`}>
                  <div className="flex items-start gap-3">
                    {getSeverityIcon(issue.severity)}
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <Badge variant="outline" className="text-xs capitalize">
                          {issue.severity}
                        </Badge>
                        <Badge variant="secondary" className="text-xs">
                          {issue.type}
                        </Badge>
                      </div>
                      <div className="text-sm font-medium mb-1">{issue.description}</div>
                      <div className="text-xs text-gray-600 mb-2">
                        {issue.file}:{issue.line}
                      </div>
                      <div className="text-sm text-gray-700 bg-white p-2 rounded border">
                        <strong>Suggestion:</strong> {issue.suggestion}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Strengths */}
        {result.review.strengths.length > 0 && (
          <div>
            <h4 className="text-sm font-medium text-gray-700 mb-3 flex items-center gap-1">
              <CheckSquare className="w-4 h-4 text-green-500" />
              Strengths
            </h4>
            <div className="space-y-2">
              {result.review.strengths.map((strength, index) => (
                <div key={index} className="flex items-start gap-2 p-2 bg-green-50 rounded">
                  <CheckSquare className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                  <span className="text-sm text-green-800">{strength}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
});
