// Shared types for SDLC tools

// Chat message format compatible with Anthropic's Messages API v1
export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string | Array<{
    type: 'text' | 'tool_use' | 'tool_result';
    text?: string;
    name?: string;
    input?: any;
    tool_use_id?: string;
    content?: any;
  }>;
  id?: string;
  type?: 'message';
  model?: string;
  stop_reason?: 'end_turn' | 'max_tokens' | 'stop_sequence';
  stop_sequence?: string | null;
  usage?: {
    input_tokens: number;
    output_tokens: number;
  };
}

// SDLC Results now return pure Anthropic messages format
export type DeveloperResult = ChatMessage[];

export type PlannerResult = ChatMessage[];
export type ReviewerResult = ChatMessage[];
export type ArchitectResult = ChatMessage[];
export type TesterResult = ChatMessage[];
export type DocumenterResult = ChatMessage[];

export type SDLCResult = ChatMessage[];
