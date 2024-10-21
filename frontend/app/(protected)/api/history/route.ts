import { auth } from "@/app/(auth)/auth";

export async function GET() {
  const session = await auth();

  if (!session || !session.user) {
    return Response.json("Unauthorized!", { status: 401 });
  }

  try {
    console.log("Backend host: ", process.env.BACKEND_HOST)
    const response = await fetch(
      `${process.env.BACKEND_HOST}/api/v1/chats/?skip=0&limit=100`,
      {
        method: 'GET',
        headers: {
          accept: 'application/json',
          // @ts-ignore
          Authorization: `Bearer ${(await auth())?.user?.accessToken}`
        }
      }
    )

    if (!response.ok) {
      throw new Error('Network response was not ok')
    }

    const res = await response.json()
    console.log(res['data'])
    return Response.json(res['data'])
  } catch (error) {
    console.error('There was a problem with your fetch operation:', error)
    return Response.json({ error: 'An error occurred while fetching data' }, { status: 500 })
  }
}
