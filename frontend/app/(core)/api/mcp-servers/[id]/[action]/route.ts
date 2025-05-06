import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { auth } from '@/app/(auth)/auth';

export async function POST(
  request: NextRequest,
  props: { params: Promise<{ id: string; action: string }> },
) {
  const params = await props.params;
  try {
    const session = await auth();
    if (!session) {
      return new Response('Unauthorized', { status: 401 });
    }

    const { id, action } = params;
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/api/v1/mcp-servers/${id}/${action}`,
      {
        method: 'POST',
        headers: {
          accept: 'application/json',
          'Content-Type': 'application/json',
          // @ts-ignore
          Authorization: `Bearer ${session.user.token}`,
        },
      },
    );

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      return NextResponse.json(
        { error: errorData.error || 'Failed to perform action on MCP server' },
        { status: response.status },
      );
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('Failed to perform action on MCP server:', error);
    return NextResponse.json(
      { error: 'Failed to perform action on MCP server' },
      { status: 500 },
    );
  }
}
