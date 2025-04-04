import { NextResponse } from 'next/server';
import { auth } from '@/app/(auth)/auth';

const TOOL_API_BASE = `${process.env.NEXT_PUBLIC_API_URL}/api/v1/tool-definitions`;

export async function POST(request: Request) {
  try {
    const session = await auth();
    if (!session?.user) {
      return new NextResponse('Unauthorized', { status: 401 });
    }

    // @ts-ignore
    const token = session.user.token;
    if (!token) {
      return new NextResponse('No access token found', { status: 401 });
    }

    const params:  { appId?: string; skip?: number; limit?: number } =
      await request.json();
    const searchParams = new URLSearchParams();
    if (params.skip) searchParams.append('skip', params.skip.toString());
    if (params.limit) searchParams.append('limit', params.limit.toString());
    if (params.appId) searchParams.append('appId', params.appId);

    const response = await fetch(`${TOOL_API_BASE}?${searchParams}`, {
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || 'Failed to fetch tool definitions');
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('Failed to fetch tool definitions:', error);
    return NextResponse.json(
      { error: 'Failed to fetch tool definitions' },
      { status: 500 },
    );
  }
}

export async function GET(request: Request) {
  try {

    const session = await auth();

    if (!session?.user) {
      return new NextResponse('Unauthorized', { status: 401 });
    }


    const { searchParams } = new URL(request.url);

    const skipParam = searchParams.get('skip');
    const limitParam = searchParams.get('limit');
    const appId = searchParams.get('appId');

    const queryParams = new URLSearchParams();
    if (skipParam) queryParams.append('skip', skipParam);
    if (limitParam) queryParams.append('limit', limitParam);
    if (appId) queryParams.append('appId', appId);

    const apiUrl = `${TOOL_API_BASE}?${queryParams}`;

    const response = await fetch(apiUrl, {
      headers: {
        'Content-Type': 'application/json',
        // @ts-ignore
        Authorization: `Bearer ${session.user.token}`,
      },
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || 'Failed to fetch tool definitions');
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('Failed to fetch tool definitions:', error);
    return NextResponse.json(
      { error: 'Failed to fetch tool definitions' },
      { status: 500 },
    );
  }
}
