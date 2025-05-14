import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { auth } from '@/app/(auth)/auth';

export async function GET(request: NextRequest) {
  try {
    const session = await auth();

    // Check if user is authenticated
    if (!session) {
      return new Response('Unauthorized', { status: 401 });
    }

    // Get query parameters
    const url = new URL(request.url);
    const logFile = url.searchParams.get('log_file') || 'app.log.json';
    const format = url.searchParams.get('format') || 'json';
    const maxLines = url.searchParams.get('max_lines') || '100';
    const follow = url.searchParams.get('follow') || 'true';

    // Build the backend URL with query parameters
    const backendUrl = new URL(
      `${process.env.NEXT_PUBLIC_API_URL}/api/v1/logs/stream`,
    );
    backendUrl.searchParams.append('log_file', logFile);
    backendUrl.searchParams.append('format', format);
    backendUrl.searchParams.append('max_lines', maxLines);
    backendUrl.searchParams.append('follow', follow);

    // Make the request to the backend
    const response = await fetch(backendUrl.toString(), {
      method: 'GET',
      headers: {
        // @ts-ignore
        Authorization: `Bearer ${session.user.token}`,
      },
    });

    if (!response.ok) {
      // Check for specific error messages from the backend
      try {
        const errorData = await response.json();
        return NextResponse.json(
          { error: errorData.detail || 'Failed to stream logs' },
          { status: response.status },
        );
      } catch {
        // If parsing fails, return the status code with a generic message
        return NextResponse.json(
          { error: 'Failed to stream logs' },
          { status: response.status },
        );
      }
    }

    // Return a streaming response
    const stream = response.body;
    if (!stream) {
      return NextResponse.json(
        { error: 'No log stream available' },
        { status: 500 },
      );
    }

    return new NextResponse(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        Connection: 'keep-alive',
      },
    });
  } catch (error) {
    console.error('Error streaming logs:', error);
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 },
    );
  }
}
