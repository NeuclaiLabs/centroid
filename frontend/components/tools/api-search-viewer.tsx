import { FC, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { ChevronUp, ChevronDown } from "lucide-react";
import type { SearchResult } from "@/lib/ai/tools/types";

interface APISearchViewerProps {
  result?: SearchResult;
  loading?: boolean;
}

// Add isExpanded state for each result card
interface ResultCardState {
  [key: string]: boolean;
}

export const APISearchViewer: FC<APISearchViewerProps> = ({ result, loading }) => {
  const [expandedCards, setExpandedCards] = useState<ResultCardState>({});

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
        <ScrollArea className={`${results.length <= 5 ? "h-auto" : "h-[400px]"} pr-4`}>
          {results.map((item, index) => {
            const cardKey = `${item.endpoint.method}-${item.endpoint.url}-${index}`;
            const isExpanded = expandedCards[cardKey] || false;

            return (
              <Card key={cardKey} className={`${index !== results.length - 1 ? "mb-2" : ""}`}>
                <CardHeader className="pt-2 pb-2">
                  <div className="flex items-center justify-between">
                    <div className="space-y-1">
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
                      <CardDescription>
                        <div>{item.endpoint.name}</div>
                      </CardDescription>
                    </div>
                    <div className="flex items-center gap-2">
                      {item.score !== undefined && (
                        <Badge variant="secondary">{Math.round((1 - Math.abs(item.score)) * 100)}% match</Badge>
                      )}
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setExpandedCards((prev) => ({ ...prev, [cardKey]: !prev[cardKey] }))}
                        aria-expanded={isExpanded}
                      >
                        {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                {isExpanded && (
                  <CardContent className="pt-2">
                    {item.endpoint.description && (
                      <div className="text-sm text-muted-foreground mb-2">{item.endpoint.description}</div>
                    )}
                    <Tabs defaultValue="params">
                      <TabsList>
                        <TabsTrigger value="params">Parameters</TabsTrigger>
                        <TabsTrigger value="headers">Headers</TabsTrigger>
                        {item.endpoint.body && <TabsTrigger value="body">Body</TabsTrigger>}
                        {item.endpoint.auth && <TabsTrigger value="auth">Auth</TabsTrigger>}
                        {item.endpoint.examples && item.endpoint.examples.length > 0 && (
                          <TabsTrigger value="examples">Examples</TabsTrigger>
                        )}
                      </TabsList>

                      <TabsContent value="params">
                        <div className="space-y-4">
                          {item.endpoint.url.includes("?") ? (
                            <div className="grid grid-cols-2 gap-2">
                              {item.endpoint.url
                                .split("?")[1]
                                .split("&")
                                .map((param, idx) => {
                                  const [key, value] = param.split("=");
                                  return (
                                    <div key={idx} className="text-sm">
                                      <code className="text-xs">{key}</code>
                                      <span className="block text-muted-foreground">{value || "No default value"}</span>
                                    </div>
                                  );
                                })}
                            </div>
                          ) : (
                            <div className="text-sm text-muted-foreground">No URL parameters</div>
                          )}
                        </div>
                      </TabsContent>

                      <TabsContent value="headers">
                        <div className="space-y-4">
                          {item.endpoint.headers && item.endpoint.headers.length > 0 ? (
                            <div className="grid grid-cols-2 gap-2">
                              {item.endpoint.headers.map((header) => (
                                <div key={header.key} className="text-sm">
                                  <code className="text-xs">{header.key}</code>
                                  <span className="block text-muted-foreground">{header.value}</span>
                                </div>
                              ))}
                            </div>
                          ) : (
                            <div className="text-sm text-muted-foreground">No headers required</div>
                          )}
                        </div>
                      </TabsContent>

                      {item.endpoint.body && (
                        <TabsContent value="body">
                          <div>
                            <code className="block bg-muted p-2 rounded-md text-xs overflow-auto whitespace-pre">
                              {item.endpoint.body.raw}
                            </code>
                          </div>
                        </TabsContent>
                      )}

                      {item.endpoint.auth && (
                        <TabsContent value="auth">
                          <div className="space-y-2">
                            <div className="text-sm">
                              <span className="font-medium">Auth Type:</span>{" "}
                              <code className="text-xs">{item.endpoint.auth.type}</code>
                            </div>
                            {item.endpoint.auth.oauth2 && (
                              <div className="grid grid-cols-2 gap-2">
                                {item.endpoint.auth.oauth2.map((oauth, idx) => (
                                  <div key={idx} className="text-sm">
                                    <code className="text-xs">{oauth.key}</code>
                                    <span className="block text-muted-foreground">{oauth.value}</span>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        </TabsContent>
                      )}

                      {item.endpoint.examples && item.endpoint.examples.length > 0 && (
                        <TabsContent value="examples">
                          <div className="space-y-4">
                            {item.endpoint.examples.map((example, idx) => (
                              <div key={idx} className="border rounded-lg p-3">
                                <div className="flex items-center justify-between mb-2">
                                  <span className="font-medium text-sm">{example.name}</span>
                                  <Badge variant={example.status < 300 ? "success" : "destructive"}>
                                    {example.status}
                                  </Badge>
                                </div>
                                {example.headers && example.headers.length > 0 && (
                                  <div className="mb-2">
                                    <div className="text-xs font-medium mb-1">Headers:</div>
                                    <div className="grid grid-cols-2 gap-1">
                                      {example.headers.map((header, hidx) => (
                                        <div key={hidx} className="text-xs">
                                          <code>{header.key}:</code>{" "}
                                          <span className="text-muted-foreground">{header.value}</span>
                                        </div>
                                      ))}
                                    </div>
                                  </div>
                                )}
                                <div>
                                  <div className="text-xs font-medium mb-1">Response:</div>
                                  <code className="block bg-muted p-2 rounded-md text-xs overflow-auto whitespace-pre">
                                    {example.body}
                                  </code>
                                </div>
                              </div>
                            ))}
                          </div>
                        </TabsContent>
                      )}
                    </Tabs>
                  </CardContent>
                )}
              </Card>
            );
          })}
        </ScrollArea>
      </CardContent>
    </Card>
  );
};
