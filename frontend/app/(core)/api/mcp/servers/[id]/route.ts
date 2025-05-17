import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { auth } from '@/app/(auth)/auth';

export async function GET(request: NextRequest, props: { params: Promise<{ id: string }> }) {
  const params = await props.params;
  try {
    const session = await auth();
    if (!session) {
      return new Response('Unauthorized', { status: 401 });
    }

    const id = params.id;
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/api/v1/mcp/servers/${id}`,
      {
        headers: {
          accept: 'application/json',
          // @ts-ignore
          Authorization: `Bearer ${session.user.token}`,
        },
      },
    );

    if (!response.ok) {
      if (response.status === 404) {
        return NextResponse.json(
          { error: 'MCP server not found' },
          { status: 404 },
        );
      }
      throw new Error('Failed to fetch MCP server');
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('Failed to fetch MCP server:', error);
    return NextResponse.json(
      { error: 'Failed to fetch MCP server' },
      { status: 500 },
    );
  }
}

export async function PUT(request: NextRequest, props: { params: Promise<{ id: string }> }) {
  const params = await props.params;
  try {
    const session = await auth();
    if (!session) {
      return new Response('Unauthorized', { status: 401 });
    }

    const id = params.id;
    const body = await request.json();
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/api/v1/mcp/servers/${id}`,
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
      if (response.status === 404) {
        return NextResponse.json(
          { error: 'MCP server not found' },
          { status: 404 },
        );
      }
      if (response.status === 403) {
        return NextResponse.json(
          { error: 'Not enough permissions' },
          { status: 403 },
        );
      }
      throw new Error('Failed to update MCP server');
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('Failed to update MCP server:', error);
    return NextResponse.json(
      { error: 'Failed to update MCP server' },
      { status: 500 },
    );
  }
}

export async function DELETE(request: NextRequest, props: { params: Promise<{ id: string }> }) {
  const params = await props.params;
  try {
    const session = await auth();
    if (!session) {
      return new Response('Unauthorized', { status: 401 });
    }

    const id = params.id;
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/api/v1/mcp/servers/${id}`,
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
      if (response.status === 404) {
        return NextResponse.json(
          { error: 'MCP server not found' },
          { status: 404 },
        );
      }
      if (response.status === 403) {
        return NextResponse.json(
          { error: 'Not enough permissions' },
          { status: 403 },
        );
      }
      throw new Error('Failed to delete MCP server');
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('Failed to delete MCP server:', error);
    return NextResponse.json(
      { error: 'Failed to delete MCP server' },
      { status: 500 },
    );
  }
}
