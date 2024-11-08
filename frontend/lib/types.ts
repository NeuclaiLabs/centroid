export interface User extends Record<string, any> {
  id: string;
  email: string;
  password: string;
  salt: string;
  accessToken: string;
}

export interface Vote extends Record<string, any> {
  id: string;
  userId: string;
  messageId: string;
  isUpvoted: boolean;
}

export interface Project {
  id: string;
  title: string;
  description: string;
  model: string;
  instructions: string;
  files: string[];
  threads: string[];
  created_at: Date;
  updated_at: Date;
}
