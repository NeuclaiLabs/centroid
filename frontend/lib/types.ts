export interface User extends Record<string, any> {
  id: string;
  email: string;
  password: string;
  salt: string;
}

export interface Vote extends Record<string, any> {
  id: string;
  userId: string;
  messageId: string;
  isUpvoted: boolean;
}
