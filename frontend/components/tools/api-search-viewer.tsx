import { FC, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { ChevronUp, ChevronDown, Play } from "lucide-react";
import type { SearchResult } from "@/lib/ai/tools/types";
import React from "react";
import { useChatStore } from "@/lib/store/chat-store";

interface APISearchViewerProps {
  result?: SearchResult;
  loading?: boolean;
}

// Add isExpanded state for each result card
interface ResultCardState {
  [key: string]: boolean;
}

export const APISearchViewer: FC<APISearchViewerProps> = ({ result, loading }) => {
  const setPendingMessage = useChatStore((state) => state.setPendingMessage);
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
        <ScrollArea className={`${results.length <= 5 ? "h-auto" : "h-[400px]"} `}>
          {results.map((item, index) => {
            const endpoint = item.endpoint;
            const cardKey = `${endpoint.request?.method}-${endpoint.request?.url.raw}-${index}`;
            const isExpanded = expandedCards[cardKey] || false;

            return (
              <Card key={cardKey} className={`${index !== results.length - 1 ? "mb-2" : ""}`}>
                <CardHeader className="pt-2 pb-2">
                  <div className="grid grid-cols-[auto_1fr_auto_auto_auto] items-center gap-2">
                    <Badge
                      className={
                        endpoint.request?.method === "GET"
                          ? "bg-emerald-500 hover:bg-emerald-600"
                          : endpoint.request?.method === "POST"
                            ? "bg-amber-500 hover:bg-amber-600"
                            : endpoint.request?.method === "PUT"
                              ? "bg-blue-500 hover:bg-blue-600"
                              : endpoint.request?.method === "PATCH"
                                ? "bg-purple-500 hover:bg-purple-600"
                                : endpoint.request?.method === "DELETE"
                                  ? "bg-red-500 hover:bg-red-600"
                                  : ""
                      }
                    >
                      {endpoint.request?.method}
                    </Badge>
                    <code className="text-sm font-mono break-words min-w-0">
                      {(endpoint.request?.url.host ?? []).join(".") +
                        "/" +
                        (endpoint.request?.url.path ?? []).join("/")}
                    </code>
                    {item.score !== undefined && (
                      <Badge variant="secondary">{Math.round((1 - Math.abs(item.score)) * 100)}% match</Badge>
                    )}
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        const method = endpoint.request?.method;
                        const path = (endpoint.request?.url.path ?? []).join("/");
                        setPendingMessage(`Run ${method} /${path}`);
                      }}
                      className="text-green-500 hover:text-green-600 hover:bg-green-100"
                    >
                      <Play className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setExpandedCards((prev) => ({ ...prev, [cardKey]: !prev[cardKey] }))}
                      aria-expanded={isExpanded}
                    >
                      {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                    </Button>
                  </div>
                  <CardDescription>
                    <div>{endpoint.name}</div>
                  </CardDescription>
                </CardHeader>
                {isExpanded && (
                  <>
                    {endpoint.request?.description?.content && (
                      <CardContent className="pt-0 pb-2">
                        <p className="text-sm text-muted-foreground">{endpoint.request.description.content}</p>
                      </CardContent>
                    )}
                    <CardContent className="pt-2">
                      <Tabs defaultValue="params">
                        <TabsList>
                          <TabsTrigger value="params">Parameters</TabsTrigger>
                          <TabsTrigger value="headers">Headers</TabsTrigger>
                          {endpoint.request?.auth && <TabsTrigger value="auth">Auth</TabsTrigger>}
                          {endpoint.request?.body && <TabsTrigger value="body">Body</TabsTrigger>}
                          {endpoint.response && endpoint.response.length > 0 && (
                            <TabsTrigger value="response">Response</TabsTrigger>
                          )}
                        </TabsList>

                        <TabsContent value="params">
                          <div className="space-y-6">
                            {/* Query Parameters Section */}
                            <div>
                              <h4 className="text-sm font-medium mb-2">Query Params</h4>
                              {endpoint.request?.url.query && endpoint.request.url.query.length > 0 ? (
                                <div className="grid grid-cols-2 gap-2">
                                  <div className="font-medium text-sm text-muted-foreground">Key</div>
                                  <div className="font-medium text-sm text-muted-foreground">Value</div>
                                  {endpoint.request.url.query.map((param: any, idx) => (
                                    <React.Fragment key={idx}>
                                      <div className="text-sm">
                                        <code className="text-xs">{param.key}</code>
                                      </div>
                                      <div className="text-sm text-muted-foreground">{param.value || "<string>"}</div>
                                    </React.Fragment>
                                  ))}
                                </div>
                              ) : (
                                <div className="text-sm text-muted-foreground">No query parameters</div>
                              )}
                            </div>

                            {/* Path Variables Section */}
                            <div>
                              <h4 className="text-sm font-medium mb-2">Path Variables</h4>
                              {endpoint.request?.url.variable && endpoint.request.url.variable.length > 0 ? (
                                <div className="grid grid-cols-2 gap-2">
                                  <div className="font-medium text-sm text-muted-foreground">Key</div>
                                  <div className="font-medium text-sm text-muted-foreground">Value</div>
                                  {endpoint.request.url.variable.map((param: any, idx) => (
                                    <React.Fragment key={idx}>
                                      <div className="text-sm">
                                        <code className="text-xs">{param.key}</code>
                                      </div>
                                      <div className="text-sm text-muted-foreground">{param.value || "<string>"}</div>
                                    </React.Fragment>
                                  ))}
                                </div>
                              ) : (
                                <div className="text-sm text-muted-foreground">No path variables</div>
                              )}
                            </div>
                          </div>
                        </TabsContent>

                        <TabsContent value="headers">
                          <div className="space-y-4">
                            {endpoint.request?.header && endpoint.request.header.length > 0 ? (
                              <div className="grid grid-cols-2 gap-2">
                                {endpoint.request.header.map((header, idx) => (
                                  <div key={idx} className="text-sm">
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

                        {endpoint.request?.auth && (
                          <TabsContent value="auth">
                            <div className="space-y-4">
                              {Object.entries(endpoint.request.auth).map(([key, value]) => (
                                <div key={key} className="text-sm">
                                  <div className="font-medium mb-1">{key}</div>
                                  {typeof value === "object" ? (
                                    <div className="grid grid-cols-2 gap-2 pl-4">
                                      {Object.entries(value).map(([subKey, subValue]) => (
                                        <React.Fragment key={subKey}>
                                          <code className="text-xs">{JSON.stringify(subKey)}</code>
                                          <span className="text-muted-foreground">{JSON.stringify(subValue)}</span>
                                        </React.Fragment>
                                      ))}
                                    </div>
                                  ) : (
                                    <span className="text-muted-foreground pl-4">{String(value)}</span>
                                  )}
                                </div>
                              ))}
                            </div>
                          </TabsContent>
                        )}

                        {endpoint.request?.body && (
                          <TabsContent value="body">
                            <div>
                              {endpoint.request.body.mode === "raw" && endpoint.request.body.raw && (
                                <code className="block bg-muted p-2 rounded-md text-xs overflow-auto whitespace-pre">
                                  {endpoint.request.body.raw}
                                </code>
                              )}
                              {endpoint.request.body.mode === "urlencoded" && endpoint.request.body.urlencoded && (
                                <div className="grid grid-cols-3 gap-2">
                                  <div className="font-medium text-sm text-muted-foreground">Key</div>
                                  <div className="font-medium text-sm text-muted-foreground">Value</div>
                                  <div className="font-medium text-sm text-muted-foreground">Description</div>
                                  {Array.isArray(endpoint.request.body.urlencoded) &&
                                    endpoint.request.body.urlencoded
                                      .filter((param) => !param.disabled)
                                      .map((param, idx) => (
                                        <React.Fragment key={idx}>
                                          <div className="text-sm">
                                            <code className="text-xs">{param.key}</code>
                                          </div>
                                          <div className="text-sm text-muted-foreground">{param.value}</div>
                                          <div className="text-sm text-muted-foreground">
                                            {param.description?.content}
                                          </div>
                                        </React.Fragment>
                                      ))}
                                </div>
                              )}
                              {endpoint.request.body.mode === "formdata" && endpoint.request.body.formdata && (
                                <div className="grid grid-cols-4 gap-2">
                                  <div className="font-medium text-sm text-muted-foreground">Key</div>
                                  <div className="font-medium text-sm text-muted-foreground">Value</div>
                                  <div className="font-medium text-sm text-muted-foreground">Type</div>
                                  <div className="font-medium text-sm text-muted-foreground">Description</div>
                                  {Array.isArray(endpoint.request.body.formdata) &&
                                    endpoint.request.body.formdata.map((param, idx) => (
                                      <React.Fragment key={idx}>
                                        <div className="text-sm">
                                          <code className="text-xs">{param.key}</code>
                                        </div>
                                        <div className="text-sm text-muted-foreground">{param.value}</div>
                                        <div className="text-sm text-muted-foreground">
                                          <Badge variant="outline" className="text-xs">
                                            {param.type}
                                          </Badge>
                                        </div>
                                        <div className="text-sm text-muted-foreground">
                                          {param.description?.content}
                                        </div>
                                      </React.Fragment>
                                    ))}
                                </div>
                              )}
                              {!endpoint.request.body.mode && endpoint.request.body.raw && (
                                <code className="block bg-muted p-2 rounded-md text-xs overflow-auto whitespace-pre">
                                  {endpoint.request.body.raw}
                                </code>
                              )}
                            </div>
                          </TabsContent>
                        )}

                        {endpoint.response && endpoint.response.length > 0 && (
                          <TabsContent value="response">
                            <div className="space-y-4">
                              {endpoint.response.map((response, idx) => (
                                <div key={idx} className="border rounded-lg p-3">
                                  <div className="flex items-center justify-between mb-2">
                                    <span className="font-medium text-sm">
                                      {response.name || `Response ${idx + 1}`}
                                    </span>
                                    {response.code && (
                                      <Badge variant={response.code < 300 ? "secondary" : "destructive"}>
                                        {response.code}
                                      </Badge>
                                    )}
                                  </div>
                                  {response.header && response.header.length > 0 && (
                                    <div className="mb-2">
                                      <div className="text-xs font-medium mb-1">Headers:</div>
                                      <div className="grid grid-cols-2 gap-1">
                                        {response.header.map((header, hidx) => (
                                          <div key={hidx} className="text-xs">
                                            <code>{header.key}:</code>{" "}
                                            <span className="text-muted-foreground">{header.value}</span>
                                          </div>
                                        ))}
                                      </div>
                                    </div>
                                  )}
                                  {response.body && (
                                    <div>
                                      <div className="text-xs font-medium mb-1">Response Body:</div>
                                      <code className="block bg-muted p-2 rounded-md text-xs overflow-auto whitespace-pre">
                                        {response.body}
                                      </code>
                                    </div>
                                  )}
                                </div>
                              ))}
                            </div>
                          </TabsContent>
                        )}
                      </Tabs>
                    </CardContent>
                  </>
                )}
              </Card>
            );
          })}
        </ScrollArea>

        <div className="mt-4 p-3 bg-muted rounded-md text-sm text-muted-foreground">
          <p>Available actions:</p>
          <ul className="list-disc ml-5 mt-1">
            <li>
              Click the <Play className="h-3 w-3 inline" /> button next to any endpoint to run it
            </li>
            <li>Refine your search query to find different endpoints</li>
            <li>
              Click the <ChevronDown className="h-3 w-3 inline" /> button to view endpoint details
            </li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
};
