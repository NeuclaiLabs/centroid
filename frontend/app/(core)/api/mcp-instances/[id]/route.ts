import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { auth } from '@/app/(auth)/auth';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    const session = await auth();
    if (!session) {
      return new Response('Unauthorized', { status: 401 });
    }

    const response = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/api/v1/mcp_instances/${params.id}`,
      {
        headers: {
          accept: 'application/json',
          // @ts-ignore
          Authorization: `Bearer ${session.user.token}`,
        },
      },
    );

    if (!response.ok) {
      throw new Error('Failed to fetch MCP instance');
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('Failed to fetch MCP instance:', error);
    return NextResponse.json(
      { error: 'Failed to fetch MCP instance' },
      { status: 500 },
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    const session = await auth();
    if (!session) {
      return new Response('Unauthorized', { status: 401 });
    }

    const body = await request.json();
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/api/v1/mcp_instances/${params.id}`,
      {
        method: 'PUT',
        headers: {
          accept: 'application/json',
          'Content-Type': 'application/json',
          // @ts-ignore
          Authorization: `Bearer ${session.user.token}`,
        },
        body: JSON.stringify(body),
      },
    );

    if (!response.ok) {
      throw new Error('Failed to update MCP instance');
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('Failed to update MCP instance:', error);
    return NextResponse.json(
      { error: 'Failed to update MCP instance' },
      { status: 500 },
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    const session = await auth();
    if (!session) {
      return new Response('Unauthorized', { status: 401 });
    }

    const response = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/api/v1/mcp_instances/${params.id}`,
      {
        method: 'DELETE',
        headers: {
          accept: 'application/json',
          // @ts-ignore
          Authorization: `Bearer ${session.user.token}`,
        },
      },
    );

    if (!response.ok) {
      throw new Error('Failed to delete MCP instance');
    }

    return NextResponse.json({ message: 'MCP instance deleted successfully' });
  } catch (error) {
    console.error('Failed to delete MCP instance:', error);
    return NextResponse.json(
      { error: 'Failed to delete MCP instance' },
      { status: 500 },
    );
  }
}
