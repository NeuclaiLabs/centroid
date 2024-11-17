"use client";

import { useSession } from "next-auth/react";
import useSWR from "swr";

import { Chat } from "@/components/custom/chat";
import { useTeams } from "@/components/custom/teams-provider";
import { fetcher, generateUUID, getToken } from "@/lib/utils";

export default function Page({ params }: { params: any }) {
  const { id } = params;

  const { data: session } = useSession();
  const { selectedTeamId } = useTeams();

  const { data, error, isLoading } = useSWR(
    session?.user && selectedTeamId
      ? [`${process.env.NEXT_PUBLIC_BACKEND_HOST}/api/v1/projects/${id}`, getToken(session)]
      : null,
    ([url, token]) => fetcher(url, token)
  );

  return (
    <div className="flex flex-col gap-4 p-4 h-full">
      <Chat id={generateUUID()} project={data} initialMessages={[]} />
    </div>
  );
}
