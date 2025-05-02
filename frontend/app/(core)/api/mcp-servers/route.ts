import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { auth } from '@/app/(auth)/auth';

export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session) {
      return new Response('Unauthorized', { status: 401 });
    }

    const searchParams = request.nextUrl.searchParams;
    const skip = searchParams.get('skip');
    const limit = searchParams.get('limit');
    const templateId = searchParams.get('template_id');
    const path = request.nextUrl.pathname;

    // Determine if we're requesting templates endpoint or regular servers
    const isTemplatesRequest = path.endsWith('/templates');

    const params = new URLSearchParams();
    if (skip) params.append('skip', skip);
    if (limit) params.append('limit', limit);
    if (templateId) params.append('template_id', templateId);

    const endpoint = isTemplatesRequest
      ? `${process.env.NEXT_PUBLIC_API_URL}/api/v1/mcp-servers/templates`
      : `${process.env.NEXT_PUBLIC_API_URL}/api/v1/mcp-servers`;

    const response = await fetch(`${endpoint}?${params}`, {
      headers: {
        accept: 'application/json',
        // @ts-ignore
        Authorization: `Bearer ${session.user.token}`,
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch MCP servers: ${response.statusText}`);
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('Failed to fetch MCP servers:', error);
    return NextResponse.json(
      { error: 'Failed to fetch MCP servers' },
      { status: 500 },
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session) {
      return new Response('Unauthorized', { status: 401 });
    }

    const body = await request.json();
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/api/v1/mcp-servers/`,
      {
        method: 'POST',
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
      throw new Error('Failed to create MCP server');
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('Failed to create MCP server:', error);
    return NextResponse.json(
      { error: 'Failed to create MCP server' },
      { status: 500 },
    );
  }
}
