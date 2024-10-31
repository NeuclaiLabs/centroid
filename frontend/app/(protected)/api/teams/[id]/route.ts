import { auth } from "@/app/(auth)/auth";
import { NextResponse } from 'next/server';

export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  const session = await auth();

  if (!session || !session.user) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  try {
    const teamData = await request.json();

    const response = await fetch(`${process.env.BACKEND_HOST}/api/v1/teams/${params.id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        // @ts-ignore
        Authorization: `Bearer ${session.user.accessToken}`
      },
      body: JSON.stringify(teamData)
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error("Error updating team:", error);
    return NextResponse.json(
      { error: "Failed to update team" },
      { status: 500 }
    );
  }
}

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {

  const session = await auth();

  if (!session || !session.user) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  try {
    const response = await fetch(`${process.env.BACKEND_HOST}/api/v1/teams/${params.id}`, {
      headers: {
        // @ts-ignore
        Authorization: `Bearer ${session.user.accessToken}`
      }
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();

    return NextResponse.json(data);
  } catch (error) {
    console.error("Error fetching team:", error);
    return NextResponse.json(
      { error: "Failed to fetch team" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  const session = await auth();

  if (!session || !session.user) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  try {
    const response = await fetch(`${process.env.BACKEND_HOST}/api/v1/teams/${params.id}`, {
      method: 'DELETE',
      headers: {
        // @ts-ignore
        Authorization: `Bearer ${session.user.accessToken}`
      }
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return new NextResponse(null, { status: 204 });
  } catch (error) {
    console.error("Error deleting team:", error);
    return NextResponse.json(
      { error: "Failed to delete team" },
      { status: 500 }
    );
  }
}
