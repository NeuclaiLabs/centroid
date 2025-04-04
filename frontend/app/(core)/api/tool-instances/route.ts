import { NextResponse } from 'next/server';
import { auth } from '@/app/(auth)/auth';

const TOOL_API_BASE = `${process.env.NEXT_PUBLIC_API_URL}/api/v1/tool-instances`;

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

    const params: {
      appId?: string;
      connectionId?: string;
      skip?: number;
      limit?: number;
    } = await request.json();
    const searchParams = new URLSearchParams();
    if (params.skip) searchParams.append('skip', params.skip.toString());
    if (params.limit) searchParams.append('limit', params.limit.toString());
    if (params.appId) searchParams.append('appId', params.appId);
    if (params.connectionId)
      searchParams.append('connectionId', params.connectionId);

    const response = await fetch(`${TOOL_API_BASE}?${searchParams}`, {
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || 'Failed to fetch tool instances');
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('Failed to fetch tool instances:', error);
    return NextResponse.json(
      { error: 'Failed to fetch tool instances' },
      { status: 500 },
    );
  }
}

export async function GET(request: Request) {
  try {
    console.log('GET /api/connection/tool-instances - Start');
    console.log('Request URL:', request.url);

    const session = await auth();
    console.log('Session:', {
      hasSession: !!session,
      hasUser: !!session?.user,
      // @ts-ignore
      hasToken: !!session?.user?.token,
    });

    if (!session?.user) {
      console.log('No session or user found');
      return new NextResponse('Unauthorized', { status: 401 });
    }

    // @ts-ignore
    const token = session.user.token;
    if (!token) {
      console.log('No access token found');
      return new NextResponse('No access token found', { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    console.log('Search params:', Object.fromEntries(searchParams.entries()));

    const skipParam = searchParams.get('skip');
    const limitParam = searchParams.get('limit');
    const appId = searchParams.get('appId');
    const connectionId = searchParams.get('connectionId');

    const queryParams = new URLSearchParams();
    if (skipParam) queryParams.append('skip', skipParam);
    if (limitParam) queryParams.append('limit', limitParam);
    if (appId) queryParams.append('appId', appId);
    if (connectionId) queryParams.append('connectionId', connectionId);

    const apiUrl = `${TOOL_API_BASE}?${queryParams}`;


    const response = await fetch(apiUrl, {
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      const error = await response.json();
      console.error('API error response:', error);
      throw new Error(error.detail || 'Failed to fetch tool instances');
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('Failed to fetch tool instances:', error);
    return NextResponse.json(
      { error: 'Failed to fetch tool instances' },
      { status: 500 },
    );
  }
}
