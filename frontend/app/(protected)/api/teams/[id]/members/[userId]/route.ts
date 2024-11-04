import { NextRequest, NextResponse } from "next/server";

import { auth } from "@/app/(auth)/auth";

export async function PUT(request: NextRequest) {
  const session = await auth();

  if (!session || !session.user) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  try {
    const { id, userId, ...memberData } = await request.json();

    const response = await fetch(`${process.env.BACKEND_HOST}/api/v1/teams/${id}/members/${userId}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        // @ts-ignore
        Authorization: `Bearer ${session.user.accessToken}`,
      },
      body: JSON.stringify(memberData),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error("Error updating team member:", error);
    return NextResponse.json({ error: "Failed to update team member" }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  const session = await auth();

  if (!session || !session.user) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  try {
    const { id, userId } = await request.json();
    const response = await fetch(`${process.env.BACKEND_HOST}/api/v1/teams/${id}/members/${userId}`, {
      method: "DELETE",
      headers: {
        // @ts-ignore
        Authorization: `Bearer ${session.user.accessToken}`,
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return new NextResponse(null, { status: 204 });
  } catch (error) {
    console.error("Error removing team member:", error);
    return NextResponse.json({ error: "Failed to remove team member" }, { status: 500 });
  }
}
