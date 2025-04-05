import { NextResponse } from 'next/server';
import { auth } from '@/app/(auth)/auth';

const TOOL_API_BASE = `${process.env.NEXT_PUBLIC_API_URL}/api/v1/tool-definitions`;

export async function GET(request: Request, props: { params: Promise<{ id: string }> }) {
  const params = await props.params;
  try {
    const session = await auth();
    // @ts-ignore
    const token = session?.user?.token;

    const response = await fetch(`${TOOL_API_BASE}/${params.id}`, {
      headers: {
        'Content-Type': 'application/json',
        ...(token && { Authorization: `Bearer ${token}` }),
      },
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || 'Failed to fetch tool definition');
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('Failed to fetch tool definition:', error);
    return NextResponse.json(
      { error: 'Failed to fetch tool definition' },
      { status: 500 },
    );
  }
}
