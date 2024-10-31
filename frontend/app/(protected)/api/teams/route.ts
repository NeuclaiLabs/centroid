import { auth } from "@/app/(auth)/auth";

export async function POST(request: Request) {
  const session = await auth();

  if (!session || !session.user) {
    return new Response("Unauthorized", { status: 401 });
  }

  try {
    const teamData = await request.json();
    const response = await fetch(`${process.env.BACKEND_HOST}/api/v1/teams/`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        // @ts-ignore
        Authorization: `Bearer ${session.user.accessToken}`
      },
      body: JSON.stringify(teamData)
    });

    if (!response.ok) {
      throw new Error("Failed to create team");
    }

    const createdTeam = await response.json();
    return new Response(JSON.stringify(createdTeam), {
      status: 201,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error("Failed to create team:", error);
    return new Response("An error occurred while creating the team", { status: 500 });
  }
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");
  const session = await auth();

  if (!session || !session.user) {
    return new Response("Unauthorized", { status: 401 });
  }

  try {
    const url = `${process.env.BACKEND_HOST}/api/v1/teams/`

    const response = await fetch(url, {
      method: 'GET',
      headers: {
        accept: 'application/json',
        // @ts-ignore
        Authorization: `Bearer ${session.user.accessToken}`,
      },
    });

    if (!response.ok) {
      if (response.status === 404) {
        return new Response("Team not found", { status: 404 });
      }
      return new Response("Unauthorized", { status: 401 });
    }

    const teamData = (await response.json())['data'];
    return new Response(JSON.stringify(teamData), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error("Error fetching team(s):", error);
    return new Response("An error occurred while processing your request", {
      status: 500,
    });
  }
}

export async function DELETE(request: Request) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");

  if (!id) {
    return new Response("Team ID is required", { status: 400 });
  }

  const session = await auth();

  if (!session || !session.user) {
    return new Response("Unauthorized", { status: 401 });
  }

  try {
    const response = await fetch(`${process.env.BACKEND_HOST}/api/v1/teams/${id}`, {
      method: 'DELETE',
      headers: {
        accept: 'application/json',
        // @ts-ignore
        Authorization: `Bearer ${session.user.accessToken}`,
      },
    });

    if (!response.ok) {
      return new Response("Unauthorized", { status: 401 });
    }

    return new Response("Team deleted", { status: 200 });
  } catch (error) {
    console.error("Error deleting team:", error);
    return new Response("An error occurred while processing your request", {
      status: 500,
    });
  }
}
