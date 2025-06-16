import 'server-only';

import {
  type User,
  type Document,
  type Suggestion,
  Vote,
  type DBMessage,
  type Chat,
} from './schema';
import type { ArtifactKind } from '@/components/artifact';
import { generateUUID } from '../utils';
import { generateHashedPassword } from './utils';
import type { VisibilityType } from '@/components/visibility-selector';
import { ChatSDKError } from '../errors';
import { auth } from '@/app/(auth)/auth';


// Custom error class to preserve HTTP status
class APIError extends Error {
  status: number;

  constructor(message: string, status: number) {
    super(message);
    this.status = status;
    this.name = 'APIError';
  }
}

// Helper for type-safe API calls
async function fetchApi<T>(
  endpoint: string,
  options?: RequestInit,
): Promise<T> {
  const session = await auth();
  // @ts-ignore
  const token = session?.user?.token;

  const response = await fetch(
    `${process.env.NEXT_PUBLIC_API_URL}/api/v1${endpoint}`,
    {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...(token && { Authorization: `Bearer ${token}` }),
        ...options?.headers,
      },
    },
  );

  if (!response.ok) {
    const error = await response
      .json()
      .catch(() => ({ message: response.statusText }));
    throw new APIError(error.message || 'API call failed', response.status);
  }

  return response.json();
}

export async function getUser(email: string): Promise<Array<User>> {
  try {
    return await fetchApi<Array<User>>(
      `/users?email=${encodeURIComponent(email)}`,
    );
  } catch (error) {
    throw new ChatSDKError(
      'bad_request:database',
      'Failed to get user by email',
    );
  }
}

export async function createUser(email: string, password: string) {
  const hashedPassword = generateHashedPassword(password);

  try {
    return await fetchApi('/users', {
      method: 'POST',
      body: JSON.stringify({ email, password: hashedPassword }),
    });
  } catch (error) {
    throw new ChatSDKError('bad_request:database', 'Failed to create user');
  }
}

export async function createGuestUser() {
  const email = `guest-${Date.now()}`;
  const password = generateHashedPassword(generateUUID());

  try {
    return await fetchApi('/users/guest', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
  } catch (error) {
    throw new ChatSDKError(
      'bad_request:database',
      'Failed to create guest user',
    );
  }
}

export async function saveChat({
  id,
  userId,
  title,
  visibility,
}: {
  id: string;
  userId: string;
  title: string;
  visibility: VisibilityType;
}) {
  try {
    const response = await fetchApi<Chat>('/chats', {
      method: 'POST',
      body: JSON.stringify({
        id,
        userId,
        title,
        visibility,
      }),
    });
    console.log(response);
    return response;
  } catch (error) {
    throw new ChatSDKError('bad_request:database', 'Failed to save chat');
  }
}

export async function deleteChatById({ id }: { id: string }) {
  try {
    return await fetchApi(`/chats/${id}`, {
      method: 'DELETE',
    });
  } catch (error) {
    throw new ChatSDKError(
      'bad_request:database',
      'Failed to delete chat by id',
    );
  }
}

export async function getChatsByUserId({
  id,
  limit,
  startingAfter,
  endingBefore,
}: {
  id: string;
  limit: number;
  startingAfter: string | null;
  endingBefore: string | null;
}) {
  try {
    let filteredChats: Array<Chat> = [];
    const response = await fetchApi<{ data: Chat[]; count: number }>('/chats/');
    filteredChats = response.data;

    const hasMore = filteredChats.length > limit;

    return {
      chats: hasMore ? filteredChats.slice(0, limit) : filteredChats,
      hasMore,
    };
  } catch (error) {
    throw new ChatSDKError(
      'bad_request:database',
      'Failed to get chats by user id',
    );
  }
}

export async function getChatById({
  id,
}: {
  id: string;
}): Promise<Chat | null> {
  try {
    return await fetchApi<Chat>(`/chats/${id}`);
  } catch (error) {
    // If chat is not found (404), return null instead of throwing
    if (error instanceof APIError && error.status === 404) {
      return null;
    }
    throw new ChatSDKError('bad_request:database', 'Failed to get chat by id');
  }
}

export async function saveMessages({
  messages,
}: {
  messages: Array<DBMessage>;
}): Promise<DBMessage[]> {
  try {
    return await fetchApi<DBMessage[]>('/messages', {
      method: 'POST',
      body: JSON.stringify(messages),
    });
  } catch (error) {
    throw new ChatSDKError('bad_request:database', 'Failed to save messages');
  }
}

export async function getMessagesByChatId({ id }: { id: string }) {
  try {
    const response = await fetchApi<{ data: DBMessage[]; count: number }>(
      `/messages?chat_id=${id}`,
    );
    return response.data;
  } catch (error) {
    throw new ChatSDKError(
      'bad_request:database',
      'Failed to get messages by chat id',
    );
  }
}

export async function voteMessage({
  chatId,
  messageId,
  type,
}: {
  chatId: string;
  messageId: string;
  type: 'up' | 'down';
}): Promise<Vote> {
  try {
    return await fetchApi<Vote>('/votes', {
      method: 'POST',
      body: JSON.stringify({ chatId, messageId, type }),
    });
  } catch (error) {
    throw new ChatSDKError('bad_request:database', 'Failed to vote message');
  }
}

export async function getVotesByChatId({
  id,
}: {
  id: string;
}): Promise<Vote[]> {
  try {
    const response = await fetchApi<{ data: Vote[]; count: number }>(
      `/votes?chat_id=${id}`,
    );
    return response.data;
  } catch (error) {
    throw new ChatSDKError(
      'bad_request:database',
      'Failed to get votes by chat id',
    );
  }
}

export async function saveDocument({
  id,
  title,
  kind,
  content,
  userId,
}: {
  id: string;
  title: string;
  kind: ArtifactKind;
  content: string;
  userId: string;
}) {
  try {
    return await fetchApi('/documents', {
      method: 'POST',
      body: JSON.stringify({
        id,
        title,
        kind,
        content,
        userId,
        createdAt: new Date().toISOString(),
      }),
    });
  } catch (error) {
    throw new ChatSDKError('bad_request:database', 'Failed to save document');
  }
}

export async function getDocumentsById({
  id,
}: {
  id: string;
}): Promise<Document[]> {
  try {
    return await fetchApi<Document[]>(`/documents/${id}`);
  } catch (error) {
    throw new ChatSDKError(
      'bad_request:database',
      'Failed to get documents by id',
    );
  }
}

export async function getDocumentById({
  id,
}: {
  id: string;
}): Promise<Document> {
  try {
    return await fetchApi<Document>(`/documents/${id}/latest`);
  } catch (error) {
    throw new ChatSDKError(
      'bad_request:database',
      'Failed to get document by id',
    );
  }
}

export async function deleteDocumentsByIdAfterTimestamp({
  id,
  timestamp,
}: {
  id: string;
  timestamp: Date;
}) {
  try {
    return await fetchApi(`/documents/${id}/after-timestamp`, {
      method: 'DELETE',
      body: JSON.stringify({ timestamp: timestamp.toISOString() }),
    });
  } catch (error) {
    throw new ChatSDKError(
      'bad_request:database',
      'Failed to delete documents by id after timestamp',
    );
  }
}

export async function saveSuggestions({
  suggestions,
}: {
  suggestions: Array<Suggestion>;
}) {
  try {
    return await fetchApi('/suggestions', {
      method: 'POST',
      body: JSON.stringify({ suggestions }),
    });
  } catch (error) {
    throw new ChatSDKError(
      'bad_request:database',
      'Failed to save suggestions',
    );
  }
}

export async function getSuggestionsByDocumentId({
  documentId,
}: {
  documentId: string;
}): Promise<Suggestion[]> {
  try {
    return await fetchApi<Suggestion[]>(`/documents/${documentId}/suggestions`);
  } catch (error) {
    throw new ChatSDKError(
      'bad_request:database',
      'Failed to get suggestions by document id',
    );
  }
}

export async function getMessageById({
  id,
}: {
  id: string;
}): Promise<DBMessage> {
  try {
    return await fetchApi<DBMessage>(`/messages/${id}`);
  } catch (error) {
    throw new ChatSDKError(
      'bad_request:database',
      'Failed to get message by id',
    );
  }
}

export async function deleteMessagesByChatIdAfterTimestamp({
  chatId,
  timestamp,
}: {
  chatId: string;
  timestamp: Date;
}) {
  try {
    return await fetchApi(`/chats/${chatId}/messages`, {
      method: 'DELETE',
      body: JSON.stringify({ timestamp: timestamp.toISOString() }),
    });
  } catch (error) {
    throw new ChatSDKError(
      'bad_request:database',
      'Failed to delete messages by chat id after timestamp',
    );
  }
}

export async function updateChatVisibilityById({
  chatId,
  visibility,
}: {
  chatId: string;
  visibility: 'private' | 'public';
}): Promise<{ success: boolean }> {
  try {
    return await fetchApi<{ success: boolean }>(`/chats/${chatId}/visibility`, {
      method: 'PATCH',
      body: JSON.stringify({ visibility }),
    });
  } catch (error) {
    throw new ChatSDKError(
      'bad_request:database',
      'Failed to update chat visibility by id',
    );
  }
}

export async function getMessageCountByUserId({
  id,
  differenceInHours,
}: {
  id: string;
  differenceInHours: number;
}) {
  try {
    const response = await fetchApi<{ count: number }>(
      `/users/${id}/message-count?hours=${differenceInHours}`
    );
    return response.count;
  } catch (error) {
    throw new ChatSDKError(
      'bad_request:database',
      'Failed to get message count by user id',
    );
  }
}

export async function createStreamId({
  streamId,
  chatId,
}: {
  streamId: string;
  chatId: string;
}) {
  try {
    return await fetchApi('/streams', {
      method: 'POST',
      body: JSON.stringify({ 
        id: streamId, 
        chatId, 
        createdAt: new Date().toISOString() 
      }),
    });
  } catch (error) {
    throw new ChatSDKError(
      'bad_request:database',
      'Failed to create stream id',
    );
  }
}

export async function getStreamIdsByChatId({ chatId }: { chatId: string }) {
  try {
    const response = await fetchApi<{ data: { id: string }[] }>(
      `/streams?chat_id=${chatId}`
    );
    return response.data.map(({ id }) => id);
  } catch (error) {
    throw new ChatSDKError(
      'bad_request:database',
      'Failed to get stream ids by chat id',
    );
  }
}
