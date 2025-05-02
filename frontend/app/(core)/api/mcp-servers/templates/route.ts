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

    const url = `${process.env.NEXT_PUBLIC_API_URL}/api/v1/mcp-servers/templates?${params}`;

    const response = await fetch(url, {
      headers: {
        accept: 'application/json',
        // @ts-ignore
        Authorization: `Bearer ${session.user.token}`,
      },
    });

    if (!response.ok) {
      throw new Error(
        `Failed to fetch MCP server templates: ${response.statusText}`,
      );
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to fetch MCP server templates' },
      { status: 500 },
    );
  }
}
