// API Search Types
export interface URLVariable {
  key: string;
  value?: string;
}

export interface URL {
  raw?: string;
  path?: string[];
  host?: string[];
  query?: { [key: string]: any }[];
  variable?: { [key: string]: any }[];
}

export interface Header {
  key: string;
  value: string;
}

export interface Request {
  name?: string;
  description?: { [key: string]: string };
  method: string;
  header?: Header[];
  body?: {
    mode?: string;
    raw?: string;
    [key: string]: any; // To match dict[str, Any] from Python
  };
  url: URL;
  auth?: { [key: string]: any };
}

export interface Response {
  id?: string;
  name?: string;
  originalRequest?: Request;
  status?: string;
  code?: number;
  body?: string;
  header?: Header[];
  cookie?: any[];
  _postman_previewlanguage?: string;
}

export interface Item {
  name: string;
  request: Request;
  response?: Response[];
  relevanceScore?: number;
  matchReasoning?: string;
}

export interface Endpoint {
  id: string;
  name?: string;
  event?: any[];
  folder?: string;
  request?: Request;
  response?: Response[];
}

export interface SearchResultItem {
  endpoint: Endpoint;
  metadata: {
    file_id: string;
    folder: string;
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
  message?: string;
}
