import { NextRequest, NextResponse } from "next/server";

import { auth } from "@/app/(auth)/auth";

export async function PUT(request: Request) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");
  const session = await auth();

  if (!id) {
    return new Response("Project ID is required", { status: 400 });
  }

  if (!session || !session.user) {
    return new Response("Unauthorized", { status: 401 });
  }

  try {
    const projectData = await request.json();
    const response = await fetch(`${process.env.BACKEND_HOST}/api/v1/projects/${id}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        // @ts-ignore
        Authorization: `Bearer ${session.user.accessToken}`,
      },
      body: JSON.stringify(projectData),
    });

    if (!response.ok) {
      throw new Error("Failed to update project");
    }

    const updatedProject = await response.json();
    return new Response(JSON.stringify(updatedProject), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Failed to update project:", error);
    return new Response("An error occurred while updating the project", { status: 500 });
  }
}

export async function DELETE(request: Request) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");

  if (!id) {
    return new Response("Project ID is required", { status: 400 });
  }

  const session = await auth();

  if (!session || !session.user) {
    return new Response("Unauthorized", { status: 401 });
  }

  try {
    const response = await fetch(`${process.env.BACKEND_HOST}/api/v1/projects/${id}`, {
      method: "DELETE",
      headers: {
        accept: "application/json",
        // @ts-ignore
        Authorization: `Bearer ${session.user.accessToken}`,
      },
    });

    if (!response.ok) {
      return new Response("Unauthorized", { status: 401 });
    }

    return new Response("Project deleted", { status: 200 });
  } catch (error) {
    console.error("Error deleting project:", error);
    return new Response("An error occurred while processing your request", {
      status: 500,
    });
  }
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");
  const teamId = searchParams.get("teamId");
  const session = await auth();

  if (!id) {
    return new Response("Project ID is required", { status: 400 });
  }

  if (!teamId) {
    return new Response("Team ID is required", { status: 400 });
  }

  if (!session || !session.user) {
    return new Response("Unauthorized", { status: 401 });
  }

  try {
    const response = await fetch(`${process.env.BACKEND_HOST}/api/v1/projects/${id}?teamId=${teamId}`, {
      headers: {
        accept: "application/json",
        // @ts-ignore
        Authorization: `Bearer ${session.user.accessToken}`,
      },
    });

    if (!response.ok) {
      throw new Error("Failed to fetch project");
    }

    const project = await response.json();
    return new Response(JSON.stringify(project), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Failed to fetch project:", error);
    return new Response("An error occurred while fetching the project", { status: 500 });
  }
}
