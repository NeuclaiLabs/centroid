import React, { memo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface APIStepProps {
  number: number;
  action: string;
  endpoint: string;
  method: string;
  headers?: Record<string, string>;
  body?: string;
  response?: string;
}

const APIStep = memo(({ number, action, endpoint, method, headers, body, response }: APIStepProps) => (
  <div className="mb-4 p-4 bg-zinc-50 dark:bg-zinc-800 rounded-lg">
    <div className="flex items-center gap-2 mb-2">
      <Badge variant="outline" className="h-6 w-6 rounded-full flex items-center justify-center">
        {number}
      </Badge>
      <h3 className="font-medium">{action}</h3>
    </div>
    <div className="space-y-2 ml-8">
      <div className="flex items-center gap-2">
        <Badge className="text-xs" variant="secondary">
          {method}
        </Badge>
        <code className="text-sm bg-zinc-100 dark:bg-zinc-700 px-2 py-1 rounded">{endpoint}</code>
      </div>
      {headers && (
        <div className="text-sm">
          <div className="font-medium text-zinc-600 dark:text-zinc-400">Headers:</div>
          <pre className="bg-zinc-100 dark:bg-zinc-700 p-2 rounded mt-1 overflow-x-auto">
            {JSON.stringify(headers, null, 2)}
          </pre>
        </div>
      )}
      {body && (
        <div className="text-sm">
          <div className="font-medium text-zinc-600 dark:text-zinc-400">Request Body:</div>
          <pre className="bg-zinc-100 dark:bg-zinc-700 p-2 rounded mt-1 overflow-x-auto">
            {JSON.stringify(JSON.parse(body), null, 2)}
          </pre>
        </div>
      )}
      {response && (
        <div className="text-sm">
          <div className="font-medium text-zinc-600 dark:text-zinc-400">Expected Response:</div>
          <pre className="bg-zinc-100 dark:bg-zinc-700 p-2 rounded mt-1 overflow-x-auto">{response}</pre>
        </div>
      )}
    </div>
  </div>
));

APIStep.displayName = "APIStep";

interface ErrorHandlingProps {
  retries: number;
  backoff: string;
  timeout: string;
}

const ErrorHandling = memo(({ retries, backoff, timeout }: ErrorHandlingProps) => (
  <div className="mt-4 p-4 bg-zinc-50 dark:bg-zinc-800 rounded-lg">
    <h3 className="font-medium mb-2">Error Handling</h3>
    <div className="space-y-2 text-sm">
      <div>Retries: {retries}</div>
      <div>Backoff: {backoff}</div>
      <div>Timeout: {timeout}</div>
    </div>
  </div>
));

ErrorHandling.displayName = "ErrorHandling";

interface APIPlanProps {
  summary: string;
  steps: APIStepProps[];
  errorHandling: ErrorHandlingProps;
}

export const APIPlan = memo(({ summary, steps, errorHandling }: APIPlanProps) => (
  <Card>
    <CardHeader>
      <CardTitle>API Execution Plan</CardTitle>
    </CardHeader>
    <CardContent>
      <p className="text-sm text-zinc-600 dark:text-zinc-400 mb-4">{summary}</p>
      <div className="space-y-4">
        {steps.map((step) => (
          <APIStep key={step.number} {...step} />
        ))}
        <ErrorHandling {...errorHandling} />
      </div>
    </CardContent>
  </Card>
));

APIPlan.displayName = "APIPlan";
