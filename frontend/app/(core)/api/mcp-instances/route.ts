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

    const params = new URLSearchParams();
    if (skip) params.append('skip', skip);
    if (limit) params.append('limit', limit);

    const response = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/api/v1/mcp-instances/?${params}`,
      {
        headers: {
          accept: 'application/json',
          // @ts-ignore
          Authorization: `Bearer ${session.user.token}`,
        },
      },
    );

    if (!response.ok) {
      throw new Error('Failed to fetch MCP instances');
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('Failed to fetch MCP instances:', error);
    return NextResponse.json(
      { error: 'Failed to fetch MCP instances' },
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
      `${process.env.NEXT_PUBLIC_API_URL}/api/v1/mcp-instances/`,
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
      throw new Error('Failed to create MCP instance');
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('Failed to create MCP instance:', error);
    return NextResponse.json(
      { error: 'Failed to create MCP instance' },
      { status: 500 },
    );
  }
}
