// API Search Types
export interface URLVariable {
  key: string;
  value?: string;
}

export interface URL {
  raw: string;
  protocol?: string;
  host?: string[];
  path?: string[];
  variable?: URLVariable[];
}

export interface Header {
  key: string;
  value: string;
}

export interface Request {
  method: string;
  header?: Header[];
  body?: {
    mode?: string;
    raw?: string;
  };
  url: URL;
}

export interface Response {
  name?: string;
  status?: number;
  code?: number;
  body?: string;
  header?: Header[];
}

export interface Item {
  name: string;
  request: Request;
  response?: Response[];
  relevanceScore?: number;
  matchReasoning?: string;
}

export interface Endpoint {
  name: string;
  folder_path: string;
  method: string;
  url: string;
  params?: URLVariable[];
  description?: string;
  headers?: Header[];
  body?: {
    mode?: string;
    raw?: string;
  };
}

export interface SearchResultItem {
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

export interface SearchResult {
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
