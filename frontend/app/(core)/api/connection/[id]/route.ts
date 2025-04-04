import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { auth } from '@/app/(auth)/auth';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    const session = await auth();
    if (!session) {
      return new Response('Unauthorized', { status: 401 });
    }

    const response = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/api/v1/connections/${params.id}`,
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
          { error: 'Connection not found' },
          { status: 404 },
        );
      }
      throw new Error('Failed to fetch connection');
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('Failed to fetch connection:', error);
    return NextResponse.json(
      { error: 'Failed to fetch connection' },
      { status: 500 },
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    const session = await auth();
    if (!session) {
      return new Response('Unauthorized', { status: 401 });
    }

    const body = await request.json();
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/api/v1/connections/${params.id}`,
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
          { error: 'Connection not found' },
          { status: 404 },
        );
      }
      if (response.status === 403) {
        return NextResponse.json(
          { error: 'Not enough permissions' },
          { status: 403 },
        );
      }
      throw new Error('Failed to update connection');
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('Failed to update connection:', error);
    return NextResponse.json(
      { error: 'Failed to update connection' },
      { status: 500 },
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    const session = await auth();
    if (!session) {
      return new Response('Unauthorized', { status: 401 });
    }

    const response = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/api/v1/connections/${params.id}`,
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
          { error: 'Connection not found' },
          { status: 404 },
        );
      }
      if (response.status === 403) {
        return NextResponse.json(
          { error: 'Not enough permissions' },
          { status: 403 },
        );
      }
      throw new Error('Failed to delete connection');
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('Failed to delete connection:', error);
    return NextResponse.json(
      { error: 'Failed to delete connection' },
      { status: 500 },
    );
  }
}
