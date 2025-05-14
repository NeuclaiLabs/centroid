import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { auth } from '@/app/(auth)/auth';

// API route to handle log-related endpoints
export async function GET(request: NextRequest) {
  try {
    const session = await auth();

    // Check if user is authenticated
    if (!session) {
      return new Response('Unauthorized', { status: 401 });
    }


    // Extract the path from the URL
    const url = new URL(request.url);
    const pathname = url.pathname;

    // Support streaming or files endpoints
    const isFilesEndpoint = pathname.endsWith('/files');
    const isStreamEndpoint = pathname.endsWith('/stream');
    const endpoint = isFilesEndpoint
      ? 'files'
      : isStreamEndpoint
      ? 'stream'
      : null;

    // Build backend URL with appropriate endpoint and query parameters
    const backendUrl = new URL(
      `${process.env.NEXT_PUBLIC_API_URL}/logs${
        endpoint ? `/${endpoint}` : ''
      }`,
    );

    // Add all query parameters to the backend URL
    url.searchParams.forEach((value, key) => {
      backendUrl.searchParams.append(key, value);
    });

    const response = await fetch(backendUrl.toString(), {
      method: 'GET',
      headers: {
        // @ts-ignore - handle potential missing token property
        Authorization: `Bearer ${session.user.token}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      return NextResponse.json(
        { error: 'Failed to fetch logs data' },
        { status: response.status },
      );
    }

    // If it's a streaming response (for log streams)
    if (isStreamEndpoint) {
      const stream = response.body;
      return new NextResponse(stream, {
        headers: {
          'Content-Type': 'text/event-stream',
          'Cache-Control': 'no-cache',
          Connection: 'keep-alive',
          'X-Accel-Buffering': 'no',
        },
      });
    }

    // For JSON responses (files endpoint)
    const data = await response.json();

    return NextResponse.json(data, {
      status: response.status,
      headers: {
        'Cache-Control': 'no-store, max-age=0',
      },
    });
  } catch (error) {
    console.error('Error processing logs request:', error);
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 },
    );
  }
}
