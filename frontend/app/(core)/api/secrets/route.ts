import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { auth } from '@/app/(auth)/auth';

export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session) {
      return new Response('Unauthorized', { status: 401 });
    }

    // Forward all search params as-is
    const params = request.nextUrl.searchParams.toString();
    const url = params
      ? `${process.env.NEXT_PUBLIC_API_URL}/api/v1/secrets?${params}`
      : `${process.env.NEXT_PUBLIC_API_URL}/api/v1/secrets`;

    const response = await fetch(url, {
      headers: {
        accept: 'application/json',
        // @ts-ignore
        Authorization: `Bearer ${session.user.token}`,
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch secrets: ${response.statusText}`);
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('Failed to fetch secrets:', error);
    return NextResponse.json(
      { error: 'Failed to fetch secrets' },
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
      `${process.env.NEXT_PUBLIC_API_URL}/api/v1/secrets/`,
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
      const errorData = await response.json().catch(() => ({}));
      return NextResponse.json(
        { error: 'Failed to create secret', detail: errorData.detail },
        { status: response.status },
      );
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('Failed to create secret:', error);
    return NextResponse.json(
      { error: 'Failed to create secret' },
      { status: 500 },
    );
  }
}
