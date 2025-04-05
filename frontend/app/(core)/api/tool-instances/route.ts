import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/app/(auth)/auth';

const TOOL_API_BASE = `${process.env.NEXT_PUBLIC_API_URL}/api/v1/tool-instances`;

export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    // @ts-ignore
    const token = session?.user?.token;

    const searchParams = request.nextUrl.searchParams;
    const queryString = searchParams.toString();
    const url = queryString ? `${TOOL_API_BASE}?${queryString}` : TOOL_API_BASE;

    const response = await fetch(url, {
      headers: {
        'Content-Type': 'application/json',
        ...(token && { Authorization: `Bearer ${token}` }),
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

export async function POST(request: Request) {
  try {
    const session = await auth();
    // @ts-ignore
    const token = session?.user?.token;
    const body = await request.json();

    const response = await fetch(TOOL_API_BASE, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(token && { Authorization: `Bearer ${token}` }),
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || 'Failed to create tool instance');
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('Failed to create tool instance:', error);
    return NextResponse.json(
      { error: 'Failed to create tool instance' },
      { status: 500 },
    );
  }
}
