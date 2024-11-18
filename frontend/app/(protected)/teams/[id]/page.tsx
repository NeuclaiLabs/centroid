"use client";

import { useParams } from "next/navigation";
import { useSession } from "next-auth/react";
import useSWR from "swr";

import { Team } from "@/components/custom/team";
import { fetcher, getToken } from "@/lib/utils";

export default function Page() {
  const { id: teamId } = useParams();
  const { data: session } = useSession();

  const {
    data: res,
    mutate: mutateMembers,
    isLoading: isLoadingMembers,
  } = useSWR(
    session?.user && teamId
      ? [`${process.env.NEXT_PUBLIC_BACKEND_HOST}/api/v1/teams/${teamId}/members`, getToken(session)]
      : null,
    ([url, token]) => fetcher(url, token),
    { fallbackData: [] }
  );

  const {
    data: team,
    isLoading,
    mutate: mutateTeam,
  } = useSWR(
    session?.user && teamId
      ? [`${process.env.NEXT_PUBLIC_BACKEND_HOST}/api/v1/teams/${teamId}`, getToken(session)]
      : null,
    ([url, token]) => fetcher(url, token),
    { fallbackData: {} }
  );

  return (
    <Team
      team={team}
      members={res?.data}
      isLoading={isLoading}
      mutateTeam={mutateTeam}
      mutateMembers={mutateMembers}
      teamId={teamId as string}
    />
  );
}
