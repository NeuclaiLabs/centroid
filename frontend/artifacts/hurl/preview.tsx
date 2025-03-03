'use client';

import * as React from 'react';
import { ChevronDown, Lock } from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import { Badge } from '@/components/ui/badge';
import { useTheme } from 'next-themes';
import { Light as SyntaxHighlighter } from 'react-syntax-highlighter';
import {
  atomOneLight,
  tomorrowNight,
} from 'react-syntax-highlighter/dist/esm/styles/hljs';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { nanoid } from 'nanoid';

interface HurlEntry {
  index: number;
  line: number;
  time: number;
  curl_cmd: string;
  calls: Array<{
    request: {
      method: string;
      url: string;
      headers: Array<{ name: string; value: string }>;
      cookies: any[];
      query_string: any[];
      body?: any;
      authorization?: {
        type: string;
        token?: string;
      };
      assertions?: string[];
    };
    response: {
      status: number;
      headers: Array<{ name: string; value: string }>;
      cookies: any[];
      http_version: string;
      body?: string;
      certificate?: {
        expire_date: string;
        issuer: string;
        serial_number: string;
        start_date: string;
        subject: string;
      };
    };
    timings: {
      total: number;
      begin_call: string;
      end_call: string;
      [key: string]: any;
    };
  }>;
  captures: any[];
  asserts: any[];
}

interface HurlExplorerProps {
  data: {
    entries: HurlEntry[];
    cookies: any[];
    filename: string;
    success: boolean;
    time: number;
  };
  onRunScript?: () => void;
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

function EntryItem({
  entry,
  onRunScript,
}: {
  entry: HurlEntry;
  onRunScript?: () => void;
}) {
  const [isOpen, setIsOpen] = React.useState(false);
  const [activeTab, setActiveTab] = React.useState<'body' | 'headers'>('body');
  const { theme } = useTheme();

  // We'll use the first call's request data for display
  const request = entry.calls[0].request;
  const response = entry.calls[0].response;

  // Extract path from URL
  let path = '';
  try {
    const url = new URL(request.url);
    path = url.pathname;
  } catch (e) {
    // If URL parsing fails, use the raw URL
    path = request.url;
  }

  // Check if there's an Authorization header to determine if secured
  const isSecured = request.headers.some(
    (h) =>
      h.name.toLowerCase() === 'authorization' ||
      h.name.toLowerCase() === 'x-api-key',
  );

  // Get a description from the curl command if possible
  const description = getDescriptionFromPath(path);

  // Get current content for copying
  const getCurrentContent = () => {
    switch (activeTab) {
      case 'body':
        try {
          return response.body
            ? formatResponseBody(response.body, response.headers)
            : '';
        } catch (e) {
          return response.body || '';
        }
      case 'headers':
        return response.headers.map((h) => `${h.name}: ${h.value}`).join('\n');
      default:
        return '';
    }
  };

  // Handle save
  const handleSave = () => {
    const content = getCurrentContent();
    const blob = new Blob([content], {
      type: activeTab === 'body' ? 'application/json' : 'text/plain',
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `response-${new Date().getTime()}.${
      activeTab === 'body' && isJsonResponse(response.headers) ? 'json' : 'txt'
    }`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // Render content based on active tab
  const renderContent = (tab: 'body' | 'headers') => {
    switch (tab) {
      case 'body':
        return response.body ? (
          <div className="max-h-60 overflow-y-auto">
            <SyntaxHighlighter
              language={isJsonResponse(response.headers) ? 'json' : 'text'}
              style={theme === 'dark' ? tomorrowNight : atomOneLight}
              customStyle={{
                margin: 0,
                padding: '1rem',
                minWidth: '100%',
                width: 'fit-content',
                background: 'transparent',
                fontSize: '0.75rem',
              }}
              wrapLongLines={true}
            >
              {formatResponseBody(response.body, response.headers)}
            </SyntaxHighlighter>
          </div>
        ) : (
          <div className="text-sm text-muted-foreground p-3">
            No response body
          </div>
        );
      case 'headers':
        return response.headers.length > 0 ? (
          <div className="max-h-60 overflow-y-auto">
            <table className="w-full text-sm table-fixed">
              <thead className="bg-muted/50">
                <tr>
                  <th className="text-left p-2 font-medium w-1/3">Header</th>
                  <th className="text-left p-2 font-medium w-2/3">Value</th>
                </tr>
              </thead>
              <tbody>
                {response.headers.map((header) => (
                  <tr key={nanoid()} className="border-t">
                    <td className="p-2 font-mono text-xs truncate">
                      {header.name}
                    </td>
                    <td className="p-2 font-mono text-xs break-all">
                      {header.value}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-sm text-muted-foreground p-3">No headers</div>
        );
      default:
        return null;
    }
  };

  return (
    <Collapsible
      open={isOpen}
      onOpenChange={setIsOpen}
      className="border rounded-md overflow-hidden"
    >
      <CollapsibleTrigger className="flex w-full flex-col sm:flex-row sm:items-center justify-between p-4 text-left">
        <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 sm:mb-0">
          <Badge variant="outline">{request.method}</Badge>
          <span className="font-mono text-sm truncate max-w-[250px] sm:max-w-[300px] md:max-w-none">
            {getDescriptionFromPath(request.url)}
          </span>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {isSecured && <Lock className="size-4 text-muted-foreground" />}
          <Badge
            variant={response.status < 400 ? 'default' : 'destructive'}
            className="font-mono"
          >
            {response.status}
          </Badge>
          <span className="text-xs text-muted-foreground">{entry.time}ms</span>
          {onRunScript && (
            <Button
              onClick={(e) => {
                e.stopPropagation();
                onRunScript();
              }}
              size="sm"
              variant="outline"
              className="ml-auto sm:ml-2"
            >
              Run
            </Button>
          )}
          <ChevronDown
            className={cn(
              'h-4 w-4 text-muted-foreground transition-transform',
              isOpen && 'rotate-180',
            )}
          />
        </div>
      </CollapsibleTrigger>
      <CollapsibleContent className="px-4 pb-4">
        <Tabs defaultValue="parameters" className="w-full">
          <TabsList className="flex mb-4 justify-start overflow-x-auto pb-1 w-full">
            <TabsTrigger value="parameters">Parameters</TabsTrigger>
            <TabsTrigger value="body">Body</TabsTrigger>
            <TabsTrigger value="headers">Headers</TabsTrigger>
            <TabsTrigger value="authorization">Authorization</TabsTrigger>
            <TabsTrigger value="assertions">Assertions</TabsTrigger>
          </TabsList>

          <TabsContent value="parameters" className="p-4">
            {request.query_string && request.query_string.length > 0 ? (
              <div className="space-y-2">
                {request.query_string.map(
                  (param: { name: string; value: string }) => (
                    <div
                      key={nanoid()}
                      className="flex flex-col sm:flex-row sm:items-start gap-1 sm:gap-2"
                    >
                      <div className="font-medium">{param.name}:</div>
                      <div className="font-mono text-sm break-all">
                        {param.value}
                      </div>
                    </div>
                  ),
                )}
              </div>
            ) : (
              <div className="text-muted-foreground">No parameters</div>
            )}
          </TabsContent>

          <TabsContent value="body" className="p-4">
            {request.body ? (
              <div className="bg-muted p-4 rounded-md overflow-auto max-h-[200px] sm:max-h-[300px] md:max-h-[400px]">
                <pre className="text-xs sm:text-sm font-mono whitespace-pre-wrap break-all">
                  {JSON.stringify(request.body, null, 2)}
                </pre>
              </div>
            ) : (
              <div className="text-muted-foreground">No body</div>
            )}
          </TabsContent>

          <TabsContent value="headers" className="p-4">
            {request.headers && request.headers.length > 0 ? (
              <div className="space-y-2">
                {request.headers.map((header) => (
                  <div
                    key={nanoid()}
                    className="flex flex-col sm:flex-row sm:items-start gap-1 sm:gap-2"
                  >
                    <div className="font-medium">{header.name}:</div>
                    <div className="font-mono text-sm break-all">
                      {header.value}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-muted-foreground">No headers</div>
            )}
          </TabsContent>

          <TabsContent value="authorization" className="p-4">
            {request.authorization ? (
              <div className="space-y-2">
                <div className="font-medium">Type:</div>
                <div className="font-mono text-sm">
                  {request.authorization.type}
                </div>
                {request.authorization.token && (
                  <>
                    <div className="font-medium mt-2">Token:</div>
                    <div className="font-mono text-sm truncate max-w-full">
                      {request.authorization.token}
                    </div>
                  </>
                )}
              </div>
            ) : (
              <div className="text-muted-foreground">No authorization</div>
            )}
          </TabsContent>

          <TabsContent value="assertions" className="p-4">
            {request.assertions && request.assertions.length > 0 ? (
              <div className="space-y-2">
                {request.assertions.map((assertion: string) => (
                  <div key={nanoid()} className="bg-muted p-2 rounded-md">
                    <code className="text-sm">{assertion}</code>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-muted-foreground">No assertions</div>
            )}
          </TabsContent>
        </Tabs>

        <div>
          <h4 className="mb-2 font-medium">Response</h4>
          <div className="rounded-md border p-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-2 gap-2">
              <TabsList>
                <TabsTrigger value="body">Body</TabsTrigger>
                <TabsTrigger value="headers">Headers</TabsTrigger>
              </TabsList>
              <div className="flex items-center space-x-2">
                <CopyButton text={getCurrentContent()} />
                <Button variant="ghost" size="sm" onClick={handleSave}>
                  Save
                </Button>
              </div>
            </div>

            <Tabs
              defaultValue="body"
              onValueChange={(value) =>
                setActiveTab(value as 'body' | 'headers')
              }
            >
              <TabsContent value="body">{renderContent('body')}</TabsContent>
              <TabsContent value="headers">
                {renderContent('headers')}
              </TabsContent>
            </Tabs>

            {response.certificate && (
              <div className="mt-4">
                <Collapsible>
                  <CollapsibleTrigger className="flex w-full items-center justify-between text-sm font-medium">
                    <span>SSL Certificate</span>
                    <ChevronDown className="size-4" />
                  </CollapsibleTrigger>
                  <CollapsibleContent className="pt-2">
                    <div className="bg-muted/50 p-3 rounded-md text-xs">
                      <div>
                        <span className="font-medium">Subject:</span>{' '}
                        {response.certificate.subject}
                      </div>
                      <div>
                        <span className="font-medium">Issuer:</span>{' '}
                        {response.certificate.issuer}
                      </div>
                      <div>
                        <span className="font-medium">Valid from:</span>{' '}
                        {response.certificate.start_date}
                      </div>
                      <div>
                        <span className="font-medium">Valid until:</span>{' '}
                        {response.certificate.expire_date}
                      </div>
                      <div>
                        <span className="font-medium">Serial:</span>{' '}
                        {response.certificate.serial_number}
                      </div>
                    </div>
                  </CollapsibleContent>
                </Collapsible>
              </div>
            )}
          </div>
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
}

// Helper function to format response body
function formatResponseBody(
  body: string,
  headers: Array<{ name: string; value: string }>,
): string {
  try {
    const contentType =
      headers.find((h) => h.name.toLowerCase() === 'content-type')?.value || '';
    if (contentType.includes('application/json')) {
      return JSON.stringify(JSON.parse(body), null, 2);
    }
  } catch (e) {
    // If parsing fails, return the raw body
  }
  return body;
}

// Helper function to get a description based on the path
function getDescriptionFromPath(path: string): string {
  if (path.includes('/posts') && !path.includes('/comments')) {
    if (path === '/posts') {
      return 'List Posts';
    }
    if (path.match(/\/posts\/\d+$/)) {
      return 'Get Post';
    }
  }

  if (path.includes('/comments')) {
    if (path === '/comments') {
      return 'List Comments';
    }
    if (path.match(/\/comments\/\d+$/)) {
      return 'Get Comment';
    }
    if (path.match(/\/posts\/\d+\/comments$/)) {
      return 'Get Post Comments';
    }
  }

  return 'API Endpoint';
}

// Helper function to get status text
function getStatusText(status: number): string {
  const statusTexts: Record<number, string> = {
    200: 'OK',
    201: 'Created',
    204: 'No Content',
    400: 'Bad Request',
    401: 'Unauthorized',
    403: 'Forbidden',
    404: 'Not Found',
    500: 'Internal Server Error',
  };

  return statusTexts[status] || 'Unknown Status';
}

// Helper function to check if response is JSON
function isJsonResponse(
  headers: Array<{ name: string; value: string }>,
): boolean {
  const contentType =
    headers.find((h) => h.name.toLowerCase() === 'content-type')?.value || '';
  return contentType.includes('application/json');
}

// Copy button component
function CopyButton({
  text,
  className = '',
}: {
  text: string;
  className?: string;
}) {
  const [copied, setCopied] = React.useState(false);

  return (
    <Button
      variant="ghost"
      size="sm"
      className={className}
      onClick={() => {
        navigator.clipboard.writeText(text);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      }}
    >
      {copied ? 'Copied!' : 'Copy'}
    </Button>
  );
}

interface HurlPreviewProps {
  content: string;
  executionResult?: {
    entries: HurlEntry[];
    cookies: any[];
    filename: string;
    success: boolean;
    time: number;
  };
  onRunScript?: () => void;
}

export const HurlPreview: React.FC<HurlPreviewProps> = ({
  content,
  executionResult,
  onRunScript,
}) => {
  // Default data for preview when no execution result is available
  const defaultExecutionResult = {
    cookies: [],
    entries: [
      {
        asserts: [
          {
            line: 14,
            success: true,
          },
          {
            line: 14,
            success: true,
          },
          {
            line: 20,
            success: true,
          },
          {
            line: 21,
            success: true,
          },
          {
            line: 22,
            success: true,
          },
          {
            line: 23,
            success: true,
          },
          {
            line: 24,
            success: true,
          },
        ],
        calls: [
          {
            request: {
              cookies: [],
              headers: [
                {
                  name: 'Host',
                  value: 'api.restful-api.dev',
                },
                {
                  name: 'Accept',
                  value: '*/*',
                },
                {
                  name: 'Content-Type',
                  value: 'application/json',
                },
                {
                  name: 'User-Agent',
                  value: 'hurl/6.0.0',
                },
                {
                  name: 'Content-Length',
                  value: '102',
                },
              ],
              method: 'POST',
              query_string: [],
              url: 'https://api.restful-api.dev/objects',
            },
            response: {
              certificate: {
                expire_date: '2025-05-05 23:26:28 UTC',
                issuer: 'C = US, O = Google Trust Services, CN = WE1',
                serial_number:
                  'f3:2c:4c:65:cb:45:e1:0c:11:1d:40:a2:56:4f:17:51',
                start_date: '2025-02-04 22:28:50 UTC',
                subject: 'CN = restful-api.dev',
              },
              cookies: [],
              headers: [
                {
                  name: 'date',
                  value: 'Fri, 28 Feb 2025 05:30:39 GMT',
                },
                {
                  name: 'content-type',
                  value: 'application/json',
                },
                {
                  name: 'vary',
                  value: 'Origin',
                },
                {
                  name: 'vary',
                  value: 'Access-Control-Request-Method',
                },
                {
                  name: 'vary',
                  value: 'Access-Control-Request-Headers',
                },
                {
                  name: 'cf-cache-status',
                  value: 'DYNAMIC',
                },
                {
                  name: 'report-to',
                  value:
                    '{"endpoints":[{"url":"https:\\/\\/a.nel.cloudflare.com\\/report\\/v4?s=0ILtcwfithIUhcDIb%2FXizjCMQXNtd1fi8nA1k5e8XMsTH3XmPWgZqdI2YxFYAdHGrDbrG9wCz6AEF5gWtlJCLJuHgxFHj2gKyUDYqTdPnPq3Z0N5fHUCEiyV1bnf7UXnuC5ERh9WRjjjdv7LbeYcNpvL"}],"group":"cf-nel","max_age":604800}',
                },
                {
                  name: 'nel',
                  value:
                    '{"success_fraction":0,"report_to":"cf-nel","max_age":604800}',
                },
                {
                  name: 'server',
                  value: 'cloudflare',
                },
                {
                  name: 'cf-ray',
                  value: '918e061b6bd63d70-MRS',
                },
                {
                  name: 'alt-svc',
                  value: 'h3=":443"; ma=86400',
                },
                {
                  name: 'server-timing',
                  value:
                    'cfL4;desc="?proto=TCP&rtt=124586&min_rtt=124051&rtt_var=35879&sent=8&recv=10&lost=0&retrans=0&sent_bytes=2922&recv_bytes=711&delivery_rate=29154&cwnd=254&unsent_bytes=0&cid=1867b9f60a2912e5&ts=361&x=0"',
                },
              ],
              http_version: 'HTTP/2',
              status: 200,
            },
            timings: {
              app_connect: 278389,
              begin_call: '2025-02-28T05:30:38.917451Z',
              connect: 130784,
              end_call: '2025-02-28T05:30:39.549555Z',
              name_lookup: 1961,
              pre_transfer: 278716,
              start_transfer: 629418,
              total: 631560,
            },
          },
        ],
        captures: [
          {
            name: 'objectId',
            value: 'ff808181932badb601954b090d904816',
          },
        ],
        curl_cmd:
          'curl --header \'Content-Type: application/json\' --data $\'{\\n  "name": "Test Object",\\n  "data": {\\n    "year": 2024,\\n    "price": 100,\\n    "available": true\\n  }\\n}\' \'https://api.restful-api.dev/objects\'',
        index: 1,
        line: 2,
        time: 631,
      },
      {
        asserts: [
          {
            line: 30,
            success: true,
          },
          {
            line: 30,
            success: true,
          },
          {
            line: 33,
            success: true,
          },
          {
            line: 34,
            success: true,
          },
          {
            line: 35,
            success: true,
          },
        ],
        calls: [
          {
            request: {
              cookies: [],
              headers: [
                {
                  name: 'Host',
                  value: 'api.restful-api.dev',
                },
                {
                  name: 'Accept',
                  value: '*/*',
                },
                {
                  name: 'User-Agent',
                  value: 'hurl/6.0.0',
                },
              ],
              method: 'GET',
              query_string: [],
              url: 'https://api.restful-api.dev/objects/ff808181932badb601954b090d904816',
            },
            response: {
              certificate: {
                expire_date: '2025-05-05 23:26:28 UTC',
                issuer: 'C = US, O = Google Trust Services, CN = WE1',
                serial_number:
                  'f3:2c:4c:65:cb:45:e1:0c:11:1d:40:a2:56:4f:17:51',
                start_date: '2025-02-04 22:28:50 UTC',
                subject: 'CN = restful-api.dev',
              },
              cookies: [],
              headers: [
                {
                  name: 'date',
                  value: 'Fri, 28 Feb 2025 05:30:40 GMT',
                },
                {
                  name: 'content-type',
                  value: 'application/json',
                },
                {
                  name: 'vary',
                  value: 'Origin',
                },
                {
                  name: 'vary',
                  value: 'Access-Control-Request-Method',
                },
                {
                  name: 'vary',
                  value: 'Access-Control-Request-Headers',
                },
                {
                  name: 'cf-cache-status',
                  value: 'DYNAMIC',
                },
                {
                  name: 'report-to',
                  value:
                    '{"endpoints":[{"url":"https:\\/\\/a.nel.cloudflare.com\\/report\\/v4?s=ay9%2FmI%2FXQeVVlhFROZLal0nyi%2FfF%2BKPTALIjA8beFrt0Y7tIIciWrphRxf3To1t2iARoTtnYvybk7kEaCx1KOhO3H5AsnW6zILfSiyrYeyDspx5CTfxmDxpbtyKMZhK7S%2BhgG%2Fhe98l4hxaDH37TKxN6"}],"group":"cf-nel","max_age":604800}',
                },
                {
                  name: 'nel',
                  value:
                    '{"success_fraction":0,"report_to":"cf-nel","max_age":604800}',
                },
                {
                  name: 'server',
                  value: 'cloudflare',
                },
                {
                  name: 'cf-ray',
                  value: '918e061dafe13d70-MRS',
                },
                {
                  name: 'alt-svc',
                  value: 'h3=":443"; ma=86400',
                },
                {
                  name: 'server-timing',
                  value:
                    'cfL4;desc="?proto=TCP&rtt=124798&min_rtt=124051&rtt_var=27334&sent=12&recv=12&lost=0&retrans=0&sent_bytes=3785&recv_bytes=778&delivery_rate=29154&cwnd=257&unsent_bytes=0&cid=1867b9f60a2912e5&ts=985&x=0"',
                },
              ],
              http_version: 'HTTP/2',
              status: 200,
            },
            timings: {
              app_connect: 0,
              begin_call: '2025-02-28T05:30:39.552840Z',
              connect: 0,
              end_call: '2025-02-28T05:30:40.232621Z',
              name_lookup: 57,
              pre_transfer: 300,
              start_transfer: 679489,
              total: 679690,
            },
          },
        ],
        captures: [],
        curl_cmd:
          "curl 'https://api.restful-api.dev/objects/ff808181932badb601954b090d904816'",
        index: 2,
        line: 28,
        time: 679,
      },
      {
        asserts: [
          {
            line: 51,
            success: true,
          },
          {
            line: 51,
            success: true,
          },
          {
            line: 54,
            success: true,
          },
          {
            line: 55,
            success: true,
          },
          {
            line: 56,
          },
          {
            line: 57,
          },
        ],
        calls: [
          {
            request: {
              cookies: [],
              headers: [
                {
                  name: 'Host',
                  value: 'api.restful-api.dev',
                },
                {
                  name: 'Accept',
                  value: '*/*',
                },
                {
                  name: 'Content-Type',
                  value: 'application/json',
                },
                {
                  name: 'User-Agent',
                  value: 'hurl/6.0.0',
                },
                {
                  name: 'Content-Length',
                  value: '111',
                },
              ],
              method: 'PUT',
              query_string: [],
              url: 'https://api.restful-api.dev/objects/ff808181932badb601954b090d904816',
            },
            response: {
              certificate: {
                expire_date: '2025-05-05 23:26:28 UTC',
                issuer: 'C = US, O = Google Trust Services, CN = WE1',
                serial_number:
                  'f3:2c:4c:65:cb:45:e1:0c:11:1d:40:a2:56:4f:17:51',
                start_date: '2025-02-04 22:28:50 UTC',
                subject: 'CN = restful-api.dev',
              },
              cookies: [],
              headers: [
                {
                  name: 'date',
                  value: 'Fri, 28 Feb 2025 05:30:40 GMT',
                },
                {
                  name: 'content-type',
                  value: 'application/json',
                },
                {
                  name: 'vary',
                  value: 'Origin',
                },
                {
                  name: 'vary',
                  value: 'Access-Control-Request-Method',
                },
                {
                  name: 'vary',
                  value: 'Access-Control-Request-Headers',
                },
                {
                  name: 'cf-cache-status',
                  value: 'DYNAMIC',
                },
                {
                  name: 'report-to',
                  value:
                    '{"endpoints":[{"url":"https:\\/\\/a.nel.cloudflare.com\\/report\\/v4?s=eX71eATdjdt4zPHoz0jMitNd%2FSB8UqBA0S%2FHx4PcPRXgbZg42DR3rztXRz%2B1J%2BGOoP2z%2B%2BIcfO6GdfPJC%2Fkmr1dIsFpjCO2FlElK6v%2BaGplq1ywu6wrWQt4tmxV%2Fvq0reGOsA6fCRijFW4%2F9A6nVXlj8"}],"group":"cf-nel","max_age":604800}',
                },
                {
                  name: 'nel',
                  value:
                    '{"success_fraction":0,"report_to":"cf-nel","max_age":604800}',
                },
                {
                  name: 'server',
                  value: 'cloudflare',
                },
                {
                  name: 'cf-ray',
                  value: '918e0621ef733d70-MRS',
                },
                {
                  name: 'alt-svc',
                  value: 'h3=":443"; ma=86400',
                },
                {
                  name: 'server-timing',
                  value:
                    'cfL4;desc="?proto=TCP&rtt=132476&min_rtt=124051&rtt_var=35856&sent=16&recv=14&lost=0&retrans=0&sent_bytes=4423&recv_bytes=975&delivery_rate=29154&cwnd=257&unsent_bytes=0&cid=1867b9f60a2912e5&ts=1404&x=0"',
                },
              ],
              http_version: 'HTTP/2',
              status: 200,
            },
            timings: {
              app_connect: 0,
              begin_call: '2025-02-28T05:30:40.233614Z',
              connect: 0,
              end_call: '2025-02-28T05:30:40.640745Z',
              name_lookup: 93,
              pre_transfer: 528,
              start_transfer: 406800,
              total: 407045,
            },
          },
        ],
        captures: [],
        curl_cmd:
          'curl --request PUT --header \'Content-Type: application/json\' --data $\'{\\n  "name": "Updated Test Object",\\n  "data": {\\n    "year": 2025,\\n    "price": 150,\\n    "available": false\\n  }\\n}\' \'https://api.restful-api.dev/objects/ff808181932badb601954b090d904816\'',
        index: 3,
        line: 39,
        time: 407,
      },
      {
        asserts: [
          {
            line: 63,
            success: true,
          },
          {
            line: 63,
            success: true,
          },
          {
            line: 66,
            success: true,
          },
        ],
        calls: [
          {
            request: {
              cookies: [],
              headers: [
                {
                  name: 'Host',
                  value: 'api.restful-api.dev',
                },
                {
                  name: 'Accept',
                  value: '*/*',
                },
                {
                  name: 'User-Agent',
                  value: 'hurl/6.0.0',
                },
              ],
              method: 'DELETE',
              query_string: [],
              url: 'https://api.restful-api.dev/objects/ff808181932badb601954b090d904816',
            },
            response: {
              certificate: {
                expire_date: '2025-05-05 23:26:28 UTC',
                issuer: 'C = US, O = Google Trust Services, CN = WE1',
                serial_number:
                  'f3:2c:4c:65:cb:45:e1:0c:11:1d:40:a2:56:4f:17:51',
                start_date: '2025-02-04 22:28:50 UTC',
                subject: 'CN = restful-api.dev',
              },
              cookies: [],
              headers: [
                {
                  name: 'date',
                  value: 'Fri, 28 Feb 2025 05:30:40 GMT',
                },
                {
                  name: 'content-type',
                  value: 'application/json',
                },
                {
                  name: 'vary',
                  value: 'Origin',
                },
                {
                  name: 'vary',
                  value: 'Access-Control-Request-Method',
                },
                {
                  name: 'vary',
                  value: 'Access-Control-Request-Headers',
                },
                {
                  name: 'cf-cache-status',
                  value: 'DYNAMIC',
                },
                {
                  name: 'report-to',
                  value:
                    '{"endpoints":[{"url":"https:\\/\\/a.nel.cloudflare.com\\/report\\/v4?s=jes1zLxZMR0yaNhKygLxJYN6OEZ1ZNUblBPtKpqkfAuaXQRU0pRPAm7oSxpiefMYfpQ53bMtZPvV7TYAgovaMEyqNVu%2BtaaTN8SBmi3IeugAABcVfK%2Fw5xuKcnxnZLIFupYVUFf3ncpEhY4jQTMd3zBl"}],"group":"cf-nel","max_age":604800}',
                },
                {
                  name: 'nel',
                  value:
                    '{"success_fraction":0,"report_to":"cf-nel","max_age":604800}',
                },
                {
                  name: 'server',
                  value: 'cloudflare',
                },
                {
                  name: 'cf-ray',
                  value: '918e06247b423d70-MRS',
                },
                {
                  name: 'alt-svc',
                  value: 'h3=":443"; ma=86400',
                },
                {
                  name: 'server-timing',
                  value:
                    'cfL4;desc="?proto=TCP&rtt=137839&min_rtt=124051&rtt_var=37619&sent=20&recv=16&lost=0&retrans=0&sent_bytes=5098&recv_bytes=1049&delivery_rate=29154&cwnd=257&unsent_bytes=0&cid=1867b9f60a2912e5&ts=1810&x=0"',
                },
              ],
              http_version: 'HTTP/2',
              status: 200,
            },
            timings: {
              app_connect: 0,
              begin_call: '2025-02-28T05:30:40.641864Z',
              connect: 0,
              end_call: '2025-02-28T05:30:40.995579Z',
              name_lookup: 90,
              pre_transfer: 603,
              start_transfer: 353449,
              total: 353634,
            },
          },
        ],
        captures: [],
        curl_cmd:
          "curl --request DELETE 'https://api.restful-api.dev/objects/ff808181932badb601954b090d904816'",
        index: 4,
        line: 61,
        time: 353,
      },
    ],
    filename: 'sample.hurl',
    success: true,
    time: 2079,
  };

  // Use the provided execution result or the default one
  const resultToUse = executionResult || defaultExecutionResult;

  return <HurlExplorer data={resultToUse} onRunScript={onRunScript} />;
};

export default function ApiExplorer() {
  // Sample data for demonstration
  const data = {
    entries: [
      {
        asserts: [],
        calls: [
          {
            request: {
              cookies: [],
              headers: [
                {
                  name: 'Host',
                  value: 'api.example.com',
                },
                {
                  name: 'Accept',
                  value: '*/*',
                },
                {
                  name: 'Authorization',
                  value: 'Bearer token123',
                },
              ],
              method: 'GET',
              query_string: [],
              url: 'https://api.example.com/api/v1/chats/',
            },
            response: {
              cookies: [],
              headers: [
                {
                  name: 'content-type',
                  value: 'application/json',
                },
                {
                  name: 'date',
                  value: 'Thu, 27 Feb 2025 20:07:45 GMT',
                },
              ],
              http_version: 'HTTP/1.1',
              status: 200,
              body: JSON.stringify({ success: true, chats: [] }),
            },
            timings: {
              total: 120,
              begin_call: '2025-02-27T20:07:45.000Z',
              end_call: '2025-02-27T20:07:45.120Z',
            },
          },
        ],
        captures: [],
        curl_cmd:
          "curl -H 'Authorization: Bearer token123' 'https://api.example.com/api/v1/chats/'",
        index: 1,
        line: 1,
        time: 120,
      },
      {
        asserts: [],
        calls: [
          {
            request: {
              cookies: [],
              headers: [
                {
                  name: 'Host',
                  value: 'api.example.com',
                },
                {
                  name: 'Accept',
                  value: '*/*',
                },
                {
                  name: 'Content-Type',
                  value: 'application/json',
                },
                {
                  name: 'Authorization',
                  value: 'Bearer token123',
                },
              ],
              method: 'POST',
              query_string: [],
              url: 'https://api.example.com/api/v1/chats/',
            },
            response: {
              cookies: [],
              headers: [
                {
                  name: 'content-type',
                  value: 'application/json',
                },
                {
                  name: 'date',
                  value: 'Thu, 27 Feb 2025 20:07:45 GMT',
                },
              ],
              http_version: 'HTTP/1.1',
              status: 201,
              body: JSON.stringify({
                success: true,
                chat: {
                  id: 'chat_123',
                  title: 'New Chat',
                  created_at: '2025-02-27T20:07:45Z',
                },
              }),
            },
            timings: {
              total: 150,
              begin_call: '2025-02-27T20:07:45.200Z',
              end_call: '2025-02-27T20:07:45.350Z',
            },
          },
        ],
        captures: [],
        curl_cmd:
          "curl -X POST -H 'Content-Type: application/json' -H 'Authorization: Bearer token123' -d '{\"title\":\"New Chat\"}' 'https://api.example.com/api/v1/chats/'",
        index: 2,
        line: 2,
        time: 150,
      },
      {
        asserts: [],
        calls: [
          {
            request: {
              cookies: [],
              headers: [
                {
                  name: 'Host',
                  value: 'api.example.com',
                },
                {
                  name: 'Accept',
                  value: '*/*',
                },
                {
                  name: 'Authorization',
                  value: 'Bearer token123',
                },
              ],
              method: 'DELETE',
              query_string: [],
              url: 'https://api.example.com/api/v1/chats/',
            },
            response: {
              cookies: [],
              headers: [
                {
                  name: 'content-type',
                  value: 'application/json',
                },
                {
                  name: 'date',
                  value: 'Thu, 27 Feb 2025 20:07:45 GMT',
                },
              ],
              http_version: 'HTTP/1.1',
              status: 200,
              body: JSON.stringify({ success: true, deleted: 3 }),
            },
            timings: {
              total: 130,
              begin_call: '2025-02-27T20:07:45.400Z',
              end_call: '2025-02-27T20:07:45.530Z',
            },
          },
        ],
        captures: [],
        curl_cmd:
          "curl -X DELETE -H 'Authorization: Bearer token123' 'https://api.example.com/api/v1/chats/'",
        index: 3,
        line: 3,
        time: 130,
      },
      {
        asserts: [],
        calls: [
          {
            request: {
              cookies: [],
              headers: [
                {
                  name: 'Host',
                  value: 'api.example.com',
                },
                {
                  name: 'Accept',
                  value: '*/*',
                },
                {
                  name: 'Authorization',
                  value: 'Bearer token123',
                },
              ],
              method: 'GET',
              query_string: [],
              url: 'https://api.example.com/api/v1/chats/123',
            },
            response: {
              cookies: [],
              headers: [
                {
                  name: 'content-type',
                  value: 'application/json',
                },
                {
                  name: 'date',
                  value: 'Thu, 27 Feb 2025 20:07:45 GMT',
                },
              ],
              http_version: 'HTTP/1.1',
              status: 200,
              body: JSON.stringify({
                success: true,
                chat: {
                  id: 'chat_123',
                  title: 'Chat Title',
                  created_at: '2025-02-27T20:07:45Z',
                },
              }),
            },
            timings: {
              total: 110,
              begin_call: '2025-02-27T20:07:45.600Z',
              end_call: '2025-02-27T20:07:45.710Z',
            },
          },
        ],
        captures: [],
        curl_cmd:
          "curl -H 'Authorization: Bearer token123' 'https://api.example.com/api/v1/chats/123'",
        index: 4,
        line: 4,
        time: 110,
      },
      {
        asserts: [],
        calls: [
          {
            request: {
              cookies: [],
              headers: [
                {
                  name: 'Host',
                  value: 'api.example.com',
                },
                {
                  name: 'Accept',
                  value: '*/*',
                },
                {
                  name: 'Content-Type',
                  value: 'application/json',
                },
                {
                  name: 'Authorization',
                  value: 'Bearer token123',
                },
              ],
              method: 'PUT',
              query_string: [],
              url: 'https://api.example.com/api/v1/chats/123',
            },
            response: {
              cookies: [],
              headers: [
                {
                  name: 'content-type',
                  value: 'application/json',
                },
                {
                  name: 'date',
                  value: 'Thu, 27 Feb 2025 20:07:45 GMT',
                },
              ],
              http_version: 'HTTP/1.1',
              status: 200,
              body: JSON.stringify({
                success: true,
                chat: {
                  id: 'chat_123',
                  title: 'Updated Chat Title',
                  created_at: '2025-02-27T20:07:45Z',
                  updated_at: '2025-02-27T20:07:45Z',
                },
              }),
            },
            timings: {
              total: 140,
              begin_call: '2025-02-27T20:07:45.800Z',
              end_call: '2025-02-27T20:07:45.940Z',
            },
          },
        ],
        captures: [],
        curl_cmd:
          "curl -X PUT -H 'Content-Type: application/json' -H 'Authorization: Bearer token123' -d '{\"title\":\"Updated Chat Title\"}' 'https://api.example.com/api/v1/chats/123'",
        index: 5,
        line: 5,
        time: 140,
      },
      {
        asserts: [],
        calls: [
          {
            request: {
              cookies: [],
              headers: [
                {
                  name: 'Host',
                  value: 'api.example.com',
                },
                {
                  name: 'Accept',
                  value: '*/*',
                },
                {
                  name: 'Authorization',
                  value: 'Bearer token123',
                },
              ],
              method: 'DELETE',
              query_string: [],
              url: 'https://api.example.com/api/v1/chats/123',
            },
            response: {
              cookies: [],
              headers: [
                {
                  name: 'content-type',
                  value: 'application/json',
                },
                {
                  name: 'date',
                  value: 'Thu, 27 Feb 2025 20:07:45 GMT',
                },
              ],
              http_version: 'HTTP/1.1',
              status: 200,
              body: JSON.stringify({ success: true }),
            },
            timings: {
              total: 125,
              begin_call: '2025-02-27T20:07:46.000Z',
              end_call: '2025-02-27T20:07:46.125Z',
            },
          },
        ],
        captures: [],
        curl_cmd:
          "curl -X DELETE -H 'Authorization: Bearer token123' 'https://api.example.com/api/v1/chats/123'",
        index: 6,
        line: 6,
        time: 125,
      },
    ],
    cookies: [],
    filename: 'api-explorer.hurl',
    success: true,
    time: 775,
  };

  return <HurlExplorer data={data} />;
}
