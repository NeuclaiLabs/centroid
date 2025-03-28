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

    const response = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/api/v1/connections/?${params}`,
      {
        headers: {
          accept: 'application/json',
          // Authorization: `Bearer ${getToken(session)}`,
        },
      },
    );

    if (!response.ok) {
      throw new Error('Failed to fetch connections');
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('Failed to fetch connections:', error);
    return NextResponse.json(
      { error: 'Failed to fetch connections' },
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
      `${process.env.NEXT_PUBLIC_API_URL}/api/v1/connections/`,
      {
        method: 'POST',
        headers: {
          accept: 'application/json',
          'Content-Type': 'application/json',
          // Authorization: `Bearer ${getToken(session)}`,
        },
        body: JSON.stringify(body),
      },
    );

    if (!response.ok) {
      throw new Error('Failed to create connection');
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('Failed to create connection:', error);
    return NextResponse.json(
      { error: 'Failed to create connection' },
      { status: 500 },
    );
  }
}


interface RouteParams {
  params: {
    id: string;
  };
}

// export async function GET(_request: NextRequest, { params }: RouteParams) {
//   try {
//     const session = await auth();
//     if (!session) {
//       return new Response('Unauthorized', { status: 401 });
//     }

//     const response = await fetch(
//       `${process.env.NEXT_PUBLIC_API_URL}/api/v1/connections/${params.id}`,
//       {
//         headers: {
//           accept: 'application/json',
//           Authorization: `Bearer ${getToken(session)}`,
//         },
//       },
//     );

//     if (!response.ok) {
//       throw new Error('Failed to fetch connection');
//     }

//     const data = await response.json();
//     return NextResponse.json(data);
//   } catch (error) {
//     console.error('Failed to fetch connection:', error);
//     return NextResponse.json(
//       { error: 'Failed to fetch connection' },
//       { status: 500 },
//     );
//   }
// }

// export async function PUT(request: NextRequest, { params }: RouteParams) {
//   try {
//     const session = await auth();
//     if (!session) {
//       return new Response('Unauthorized', { status: 401 });
//     }

//     const body = await request.json();
//     const response = await fetch(
//       `${process.env.NEXT_PUBLIC_API_URL}/api/v1/connections/${params.id}`,
//       {
//         method: 'PUT',
//         headers: {
//           accept: 'application/json',
//           'Content-Type': 'application/json',
//           // Authorization: `Bearer ${getToken(session)}`,
//         },
//         body: JSON.stringify(body),
//       },
//     );

//     if (!response.ok) {
//       throw new Error('Failed to update connection');
//     }

//     const data = await response.json();
//     return NextResponse.json(data);
//   } catch (error) {
//     console.error('Failed to update connection:', error);
//     return NextResponse.json(
//       { error: 'Failed to update connection' },
//       { status: 500 },
//     );
//   }
// }

// export async function DELETE(_request: NextRequest, { params }: RouteParams) {
//   try {
//     const session = await auth();
//     if (!session) {
//       return new Response('Unauthorized', { status: 401 });
//     }

//     const response = await fetch(
//       `${process.env.NEXT_PUBLIC_API_URL}/api/v1/connections/${params.id}`,
//       {
//         method: 'DELETE',
//         headers: {
//           accept: 'application/json',
//           Authorization: `Bearer ${getToken(session)}`,
//         },
//       },
//     );

//     if (!response.ok) {
//       throw new Error('Failed to delete connection');
//     }

//     return NextResponse.json({ message: 'Connection deleted successfully' });
//   } catch (error) {
//     console.error('Failed to delete connection:', error);
//     return NextResponse.json(
//       { error: 'Failed to delete connection' },
//       { status: 500 },
//     );
//   }
// }
