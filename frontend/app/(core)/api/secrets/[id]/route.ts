import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { auth } from '@/app/(auth)/auth';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session) {
      return new Response('Unauthorized', { status: 401 });
    }

    const resolvedParams = await params;
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/api/v1/secrets/${resolvedParams.id}`,
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
          { error: 'Secret not found' },
          { status: 404 },
        );
      }
      throw new Error(`Failed to fetch secret: ${response.statusText}`);
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('Failed to fetch secret:', error);
    return NextResponse.json(
      { error: 'Failed to fetch secret' },
      { status: 500 },
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session) {
      return new Response('Unauthorized', { status: 401 });
    }

    const resolvedParams = await params;
    const body = await request.json();
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/api/v1/secrets/${resolvedParams.id}`,
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
      const errorData = await response.json().catch(() => ({}));
      return NextResponse.json(
        { error: 'Failed to update secret', detail: errorData.detail },
        { status: response.status },
      );
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('Failed to update secret:', error);
    return NextResponse.json(
      { error: 'Failed to update secret' },
      { status: 500 },
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session) {
      return new Response('Unauthorized', { status: 401 });
    }

    const resolvedParams = await params;
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/api/v1/secrets/${resolvedParams.id}`,
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
          { error: 'Secret not found' },
          { status: 404 },
        );
      }
      throw new Error(`Failed to delete secret: ${response.statusText}`);
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('Failed to delete secret:', error);
    return NextResponse.json(
      { error: 'Failed to delete secret' },
      { status: 500 },
    );
  }
}
