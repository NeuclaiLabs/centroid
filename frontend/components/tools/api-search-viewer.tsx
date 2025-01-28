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

interface Endpoint {
  name: string;
  folder_path: string;
  method: string;
  url: string;
  description?: string;
  headers?: Header[];
  body?: {
    mode?: string;
    raw?: string;
  };
}

interface SearchResultItem {
  endpoint: Endpoint;
  metadata: {
    file_id: string;
    folder_path: string;
    has_auth: boolean;
    has_body: boolean;
    has_examples: boolean;
    method: string;
    name: string;
    url: string;
  };
  score: number;
}

interface SearchResult {
  success: boolean;
  query: string;
  results: SearchResultItem[];
  metadata?: {
    totalEndpoints: number;
    searchMethod: string;
    timestamp: string;
    searchParameters: {
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

  if (!Array.isArray(results)) {
    return (
      <Card className="w-full">
        <CardHeader>
          <CardTitle>Invalid Results Format</CardTitle>
          <CardDescription>The search results are in an unexpected format</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  if (results.length === 0) {
    return (
      <Card className="w-full">
        <CardHeader>
          <CardTitle>No Results Found</CardTitle>
          <CardDescription>No API endpoints matched your search query: "{query}"</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>API Search Results</CardTitle>
          <Badge variant="secondary">{metadata?.totalEndpoints} endpoints searched</Badge>
        </div>
        <CardDescription>
          <span>Query: "{query}"</span>
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[400px] pr-4">
          {results.map((item, index) => (
            <Card key={`${item.endpoint.method}-${item.endpoint.url}-${index}`} className="mb-4">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Badge
                      className={
                        item.endpoint.method === "GET"
                          ? "bg-emerald-500 hover:bg-emerald-600"
                          : item.endpoint.method === "POST"
                            ? "bg-amber-500 hover:bg-amber-600"
                            : item.endpoint.method === "PUT"
                              ? "bg-blue-500 hover:bg-blue-600"
                              : item.endpoint.method === "PATCH"
                                ? "bg-purple-500 hover:bg-purple-600"
                                : item.endpoint.method === "DELETE"
                                  ? "bg-red-500 hover:bg-red-600"
                                  : ""
                      }
                    >
                      {item.endpoint.method}
                    </Badge>
                    <code className="text-sm font-mono">{item.endpoint.url}</code>
                  </div>
                  {item.score !== undefined && (
                    <Badge variant="secondary" className="ml-2">
                      {Math.round((1 - Math.abs(item.score)) * 100)}% match
                    </Badge>
                  )}
                </div>
                <CardDescription>
                  <div>{item.endpoint.name}</div>
                  {item.endpoint.description && (
                    <div className="text-xs text-muted-foreground mt-1">{item.endpoint.description}</div>
                  )}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Tabs defaultValue="details">
                  <TabsList>
                    <TabsTrigger value="details">Details</TabsTrigger>
                    {item.endpoint.body && <TabsTrigger value="request">Request</TabsTrigger>}
                  </TabsList>
                  <TabsContent value="details">
                    <div className="space-y-4">
                      {item.endpoint.headers && item.endpoint.headers.length > 0 && (
                        <div>
                          <h4 className="font-medium mb-2">Headers</h4>
                          <div className="grid grid-cols-2 gap-2">
                            {item.endpoint.headers.map((header) => (
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
                  {item.endpoint.body && (
                    <TabsContent value="request">
                      <div>
                        <h4 className="font-medium mb-2">Request Body</h4>
                        <code className="block bg-muted p-2 rounded-md text-xs overflow-auto whitespace-pre">
                          {item.endpoint.body.raw}
                        </code>
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
