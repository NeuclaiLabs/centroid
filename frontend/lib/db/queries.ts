import 'server-only';
import type {
  User,
  DBMessage,
  Suggestion,
  Chat,
  Document,
  Vote,
} from './schema';
import type { ArtifactKind } from '@/components/artifact';
import { auth } from '@/app/(auth)/auth';
// Simplified path
const API_BASE_URL =
  `${process.env.NEXT_PUBLIC_API_URL}/api/v1` || 'http://localhost:8000/api';

// Helper for type-safe API calls
async function fetchApi<T>(
  endpoint: string,
  options?: RequestInit,
): Promise<T> {
  const session = await auth();
  // @ts-ignore
  const token = session?.user?.token;

  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token && { Authorization: `Bearer ${token}` }),
      ...options?.headers,
    },
  });

  if (!response.ok) {
    const error = await response
      .json()
      .catch(() => ({ message: response.statusText }));
    throw new Error(error.message || 'API call failed');
  }

  return response.json();
}

export async function getUser(email: string): Promise<Array<User>> {
  try {
    return await fetchApi<Array<User>>(
      `/users?email=${encodeURIComponent(email)}`,
    );
  } catch (error) {
    console.error('Failed to get user');
    throw error;
  }
}

export async function createUser(
  email: string,
  password: string,
): Promise<User> {
  try {
    return await fetchApi<User>('/users', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
  } catch (error) {
    console.error('Failed to create user');
    throw error;
  }
}

export async function saveChat({
  id,
  userId,
  title,
}: {
  id: string;
  userId: string;
  title: string;
}): Promise<Chat> {
  try {
    return await fetchApi<Chat>('/chats', {
      method: 'POST',
      body: JSON.stringify({ id, userId, title }),
    });
  } catch (error) {
    console.error('Failed to save chat');
    throw error;
  }
}

export async function deleteChatById({ id }: { id: string }): Promise<void> {
  try {
    console.log('Deleting chat', id);
    const result = await fetchApi<void>(`/chats/${id}`, {
      method: 'DELETE',
    });
    console.log('Chat deleted', result);
    return result;
  } catch (error) {
    console.error('Failed to delete chat');
    throw error;
  }
}

export async function getChatsByUserId({ id }: { id: string }) {
  try {
    const response = await fetchApi<{ data: Chat[]; count: number }>('/chats/');
    return response.data;
  } catch (error) {
    console.error('Failed to get user chats');
    throw error;
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
    console.error('Failed to get chat by id from database');
    return null;
  }
}

export async function saveMessages({
  messages,
}: {
  messages: Array<DBMessage>;
}): Promise<DBMessage[]> {
  try {
    const transformedMessages = messages.map(
      ({ createdAt, chatId, ...rest }) => ({
        ...rest,
        chat_id: chatId,
        attachments:
          Array.isArray(rest.attachments) && rest.attachments.length > 0
            ? rest.attachments
            : null,
      }),
    );

    return await fetchApi<DBMessage[]>('/messages', {
      method: 'POST',
      body: JSON.stringify(transformedMessages),
    });
  } catch (error) {
    console.error('Failed to save messages');
    throw error;
  }
}

export async function getMessagesByChatId({ id }: { id: string }) {
  try {
    return await fetchApi<DBMessage[]>(`/chats/${id}/messages`);
  } catch (error) {
    console.error('Failed to get chat messages');
    throw error;
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
    return await fetchApi<Vote>(`/chats/${chatId}/messages/${messageId}/vote`, {
      method: 'POST',
      body: JSON.stringify({ type }),
    });
  } catch (error) {
    console.error('Failed to vote on message');
    throw error;
  }
}

export async function getVotesByChatId({
  id,
}: {
  id: string;
}): Promise<Vote[]> {
  try {
    return await fetchApi<Vote[]>(`/chats/${id}/votes`);
  } catch (error) {
    console.error('Failed to get chat votes');
    throw error;
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
}): Promise<Document> {
  try {
    return await fetchApi<Document>('/documents', {
      method: 'POST',
      body: JSON.stringify({ id, title, kind, content, userId }),
    });
  } catch (error) {
    console.error('Failed to save document');
    throw error;
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
    console.error('Failed to get documents');
    throw error;
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
    console.error('Failed to get document');
    throw error;
  }
}

export async function deleteDocumentsByIdAfterTimestamp({
  id,
  timestamp,
}: {
  id: string;
  timestamp: Date;
}): Promise<void> {
  try {
    return await fetchApi<void>(`/documents/${id}`, {
      method: 'DELETE',
      body: JSON.stringify({ timestamp: timestamp.toISOString() }),
    });
  } catch (error) {
    console.error('Failed to delete documents');
    throw error;
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
    console.error('Failed to save suggestions');
    throw error;
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
    console.error('Failed to get document suggestions');
    throw error;
  }
}

export async function getMessageById({ id }: { id: string }) {
  try {
    return await fetchApi(`/messages/${id}`);
  } catch (error) {
    console.error('Failed to get message');
    throw error;
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
    console.error('Failed to delete messages');
    throw error;
  }
}

export async function updateChatVisiblityById({
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
    console.error('Failed to update chat visibility');
    throw error;
  }
}
