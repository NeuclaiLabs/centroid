export type User = {
  id: string;
  email: string;
  password: string | null;
  salt: string;
  accessToken: string;
};
export interface Project {
  id: string;
  title: string;
  description: string;
  model: string;
  instructions: string;
  files: string[] | string;
  new_files?: File[];
  threads: string[];
  createdAt: Date;
  updatedAt: Date;
}

export type Chat = {
  id: string;
  createdAt: Date;
  title: string;
  userId: string;
  visibility: 'public' | 'private' | 'shared';
  project?: Project;
};

export type Message = {
  id: string;
  chatId: string;
  role: string;
  content: any; // Using 'any' for the JSON content
  createdAt: Date;
};

export type Vote = {
  chatId: string;
  messageId: string;
  isUpvoted: boolean;
};

export type Document = {
  id: string;
  createdAt: Date;
  title: string;
  content: string | null;
  kind: 'text' | 'code' | 'image' | 'sheet';
  userId: string;
};

export type Suggestion = {
  id: string;
  documentId: string;
  documentCreatedAt: Date;
  originalText: string;
  suggestedText: string;
  description: string | null;
  isResolved: boolean;
  userId: string;
  createdAt: Date;
};

export interface CreateProjectData {
  title: string;
  description: string;
  model: string;
  instructions: string;
  team_id?: string;
  files?: string[];
}

export interface UpdateProjectData {
  title?: string;
  description?: string;
  model?: string;
  instructions?: string;
  files?: string[];
  new_files?: File[];
}
