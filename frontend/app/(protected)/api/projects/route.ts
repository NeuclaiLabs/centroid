import { auth } from "@/app/(auth)/auth";

export async function POST(request: Request) {
  const session = await auth();

  if (!session || !session.user) {
    return new Response("Unauthorized", { status: 401 });
  }

  try {
    const projectData = await request.json();
    const response = await fetch(`${process.env.BACKEND_HOST}/api/v1/projects/`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        // @ts-ignore
        Authorization: `Bearer ${session.user.accessToken}`,
      },
      body: JSON.stringify(projectData),
    });

    if (!response.ok) {
      throw new Error("Failed to create project");
    }

    const createdProject = await response.json();
    return new Response(JSON.stringify(createdProject), {
      status: 201,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Failed to create project:", error);
    return new Response("An error occurred while creating the project", { status: 500 });
  }
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const teamId = searchParams.get("teamId");
  const skip = searchParams.get("skip") || "0";
  const limit = searchParams.get("limit") || "100";
  const session = await auth();

  if (!session || !session.user) {
    return new Response("Unauthorized", { status: 401 });
  }

  try {
    let url = `${process.env.BACKEND_HOST}/api/v1/projects/`;

   if (teamId) {
      // If teamId is provided, fetch projects for team
      url += `?team_id=${teamId}&skip=${skip}&limit=${limit}`;
    } else {
      return new Response("Team ID is required", { status: 400 });
    }

    const response = await fetch(url, {
      method: "GET",
      headers: {
        accept: "application/json",
        // @ts-ignore
        Authorization: `Bearer ${session.user.accessToken}`,
      },
    });

    if (!response.ok) {
      if (response.status === 404) {
        return new Response("Project not found", { status: 404 });
      }
      return new Response("Unauthorized", { status: 401 });
    }

    const projectData = await response.json();
    return new Response(JSON.stringify(projectData), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error fetching project(s):", error);
    return new Response("An error occurred while processing your request", {
      status: 500,
    });
  }
}
