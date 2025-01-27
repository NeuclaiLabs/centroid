import { FC } from "react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface URLVariable {
  key: string;
  value?: string;
}

interface URL {
  raw: string;
  protocol?: string;
  host?: string[];
  path?: string[];
  variable?: URLVariable[];
}

interface Header {
  key: string;
  value: string;
}

interface Request {
  method: string;
  header?: Header[];
  body?: {
    mode?: string;
    raw?: string;
  };
  url: URL;
}

interface Response {
  name?: string;
  status?: number;
  code?: number;
  body?: string;
  header?: Header[];
}

interface Item {
  name: string;
  request: Request;
  response?: Response[];
  relevanceScore?: number;
  matchReasoning?: string;
}

interface Collection {
  info: {
    name: string;
    schema?: string;
  };
  item: Item[];
}

interface SearchResult {
  success: boolean;
  query: string;
  results: Collection;
  metadata?: {
    totalEndpoints: number;
    searchMethod: string;
    timestamp: string;
    searchParameters: {
      includeExamples: boolean;
      categories?: string[];
      limit: number;
    };
  };
  error?: string;
}

interface APISearchViewerProps {
  result?: SearchResult;
  loading?: boolean;
}

export const APISearchViewer: FC<APISearchViewerProps> = ({ result, loading }) => {
  if (loading) {
    return (
      <Card className="w-full animate-pulse">
        <CardHeader>
          <CardTitle className="h-6 bg-muted rounded" />
          <CardDescription className="h-4 bg-muted rounded mt-2" />
        </CardHeader>
      </Card>
    );
  }

  if (!result?.success) {
    return (
      <Card className="w-full">
        <CardHeader>
          <CardTitle className="text-destructive">Search Failed</CardTitle>
          <CardDescription>{result?.error || "Unknown error occurred"}</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  const { results, metadata, query } = result;

  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>API Search Results</CardTitle>
          <Badge variant="secondary">{metadata?.totalEndpoints} endpoints searched</Badge>
        </div>
        <CardDescription>
          <span>Query: "{query}"</span>
          <span className="block mt-2 text-sm">{results.info.name}</span>
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[400px] pr-4">
          {results.item.map((item, index) => (
            <Card key={`${item.request.method}-${item.request.url.raw}-${index}`} className="mb-4">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Badge
                      className={
                        item.request.method === "GET"
                          ? "bg-emerald-500 hover:bg-emerald-600"
                          : item.request.method === "POST"
                            ? "bg-amber-500 hover:bg-amber-600"
                            : item.request.method === "PUT"
                              ? "bg-blue-500 hover:bg-blue-600"
                              : item.request.method === "PATCH"
                                ? "bg-purple-500 hover:bg-purple-600"
                                : item.request.method === "DELETE"
                                  ? "bg-red-500 hover:bg-red-600"
                                  : ""
                      }
                    >
                      {item.request.method}
                    </Badge>
                    <code className="text-sm font-mono">{item.request.url.raw}</code>
                  </div>
                  {item.relevanceScore !== undefined && (
                    <Badge variant="secondary" className="ml-2">
                      {Math.round(item.relevanceScore * 100)}% match
                    </Badge>
                  )}
                </div>
                <CardDescription>
                  <div>{item.name}</div>
                  {item.matchReasoning && (
                    <div className="text-xs text-muted-foreground mt-1">{item.matchReasoning}</div>
                  )}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Tabs defaultValue="details">
                  <TabsList>
                    <TabsTrigger value="details">Details</TabsTrigger>
                    {item.request.body && <TabsTrigger value="request">Request</TabsTrigger>}
                    {item.response && item.response.length > 0 && <TabsTrigger value="response">Response</TabsTrigger>}
                  </TabsList>
                  <TabsContent value="details">
                    <div className="space-y-4">
                      {item.request.url.variable && item.request.url.variable.length > 0 && (
                        <div>
                          <h4 className="font-medium mb-2">URL Parameters</h4>
                          <div className="grid grid-cols-2 gap-2">
                            {item.request.url.variable.map((param) => (
                              <div key={param.key} className="text-sm">
                                <code className="text-xs">{param.key}</code>
                                {param.value && <span className="block text-muted-foreground">{param.value}</span>}
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                      {item.request.header && item.request.header.length > 0 && (
                        <div>
                          <h4 className="font-medium mb-2">Headers</h4>
                          <div className="grid grid-cols-2 gap-2">
                            {item.request.header.map((header) => (
                              <div key={header.key} className="text-sm">
                                <code className="text-xs">{header.key}</code>
                                <span className="block text-muted-foreground">{header.value}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </TabsContent>
                  {item.request.body && (
                    <TabsContent value="request">
                      <div>
                        <h4 className="font-medium mb-2">Request Body</h4>
                        <code className="block bg-muted p-2 rounded-md text-xs overflow-auto whitespace-pre">
                          {item.request.body.raw}
                        </code>
                      </div>
                    </TabsContent>
                  )}
                  {item.response && item.response.length > 0 && (
                    <TabsContent value="response">
                      <div className="space-y-4">
                        {item.response.map((resp, idx) => (
                          <div key={idx}>
                            {resp.name && <h4 className="font-medium mb-2">{resp.name}</h4>}
                            {resp.body && (
                              <code className="block bg-muted p-2 rounded-md text-xs overflow-auto whitespace-pre">
                                {resp.body}
                              </code>
                            )}
                          </div>
                        ))}
                      </div>
                    </TabsContent>
                  )}
                </Tabs>
              </CardContent>
            </Card>
          ))}
        </ScrollArea>
      </CardContent>
    </Card>
  );
};
