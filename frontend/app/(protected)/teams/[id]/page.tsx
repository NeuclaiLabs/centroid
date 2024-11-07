"use client";

import { notFound } from "next/navigation";
import useSWR from "swr";
import { fetcher } from "@/lib/utils";
import { useSession } from "next-auth/react";
import { Team } from "@/components/custom/team";

export default function Page({ params }: { params: any }) {
  const teamId = params.id;
  const { data: session } = useSession();

  const {
    data: {data: members, count},
    mutate: mutateMembers
  } = useSWR(
    session?.user && teamId
      ? [`${process.env.NEXT_PUBLIC_BACKEND_HOST}/api/v1/teams/${teamId}/members`, session?.user?.accessToken]
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
      ? [`${process.env.NEXT_PUBLIC_BACKEND_HOST}/api/v1/teams/${teamId}`, session?.user?.accessToken]
      : null,
    ([url, token]) => fetcher(url, token),
    { fallbackData: {} }
  );

  return (
    <Team
      team={team}
      members={members}
      isLoading={isLoading}
      mutateTeam={mutateTeam}
      mutateMembers={mutateMembers}
      teamId={teamId}
    />
  );
}
