'use client';

import * as React from 'react';
import { ChevronDown, Lock } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardContent } from '@/components/ui/card';
import { RequestPreview } from './request-preview';
import { ResponsePreview } from './responePreview';
import {
  type HurlEntry,
  type HurlExplorerProps,
  type HurlPreviewProps,
  getMethodColor,
} from './utils';
import sampleData from './sample.json';

// Entry Item Component
function EntryItem({
  entry,
  onRunScript,
}: {
  entry: HurlEntry;
  onRunScript?: () => void;
}) {
  const [isOpen, setIsOpen] = React.useState(false);

  // We'll use the first call's request data for display
  const request = entry.calls[0].request;
  const response = entry.calls[0].response;

  // Check if there's an Authorization header to determine if secured
  const isSecured = true; //request.headers.some(
  //   (h) =>
  //     h.name.toLowerCase() === 'authorization' ||
  //     h.name.toLowerCase() === 'x-api-key',
  // );

  return (
    <Card className="overflow-hidden">
      <CardHeader className="p-4 flex flex-row items-center space-y-0 gap-2">
        {/* Method - fixed width with forced dimensions */}
        <div
          className="flex items-center justify-center w-20 h-8 rounded-md border text-xs font-semibold bg-gray-800 shrink-0"
          style={{ color: getMethodColor(request.method) }}
        >
          {request.method}
        </div>

        {/* URL - flexible width with truncation */}
        {/* biome-ignore lint/nursery/noStaticElementInteractions: <explanation> */}
        <div
          className="flex-1 min-w-0 cursor-pointer"
          onClick={() => setIsOpen(!isOpen)}
        >
          <div className="font-mono text-sm truncate">{request.url}</div>
        </div>

        {/* Status and metadata - fixed width */}
        <div className="flex items-center gap-2 shrink-0">
          {isSecured && <Lock className="size-4 text-muted-foreground" />}
          <Badge
            variant={response.status < 400 ? 'default' : 'destructive'}
            className="font-mono"
          >
            {response.status}
          </Badge>
          <span className="text-xs text-muted-foreground whitespace-nowrap">
            {entry.time}ms
          </span>
          {onRunScript && (
            <Button
              onClick={(e) => {
                e.stopPropagation();
                onRunScript();
              }}
              size="sm"
              variant="outline"
            >
              Run
            </Button>
          )}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsOpen(!isOpen)}
            className="p-0 size-8"
          >
            <ChevronDown
              className={cn(
                'h-4 w-4 transition-transform',
                isOpen && 'rotate-180',
              )}
            />
            <span className="sr-only">{isOpen ? 'Collapse' : 'Expand'}</span>
          </Button>
        </div>
      </CardHeader>

      {isOpen && (
        <CardContent className="px-4 pb-4 pt-0">
          <RequestPreview
            request={request}
            onRunScript={onRunScript}
            curl_cmd={entry.curl_cmd}
          />
          <ResponsePreview
            response={response}
            assertions={entry.asserts}
            captures={entry.captures}
          />
        </CardContent>
      )}
    </Card>
  );
}

export function HurlExplorer({ data, onRunScript }: HurlExplorerProps) {
  return (
    <div className="w-full space-y-4">
      {data.entries.map((entry) => (
        <Card key={entry.index} className="overflow-hidden mb-2">
          <EntryItem entry={entry} onRunScript={onRunScript} />
        </Card>
      ))}
    </div>
  );
}

export const HurlPreview: React.FC<HurlPreviewProps> = ({
  content,
  executionResult,
  onRunScript,
}) => {
  // Use the provided execution result or the default one from sample.json
  const resultToUse = executionResult || sampleData.apiExplorerData;

  return <HurlExplorer data={resultToUse} onRunScript={onRunScript} />;
};

export default function ApiExplorer() {
  // Sample data from sample.json
  const data = sampleData.apiExplorerData;

  return (
    <div className="container mx-auto py-10">
      <h1 className="text-2xl font-bold mb-6">API Explorer</h1>
      <HurlExplorer data={data} />
    </div>
  );
}
