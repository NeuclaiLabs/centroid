"use client";

import { notFound } from "next/navigation";
import useSWR from "swr";
import { fetcher } from "@/lib/utils";
import { useSession } from "next-auth/react";
import { Team } from "@/components/custom/team";

export default function Page({ params }: { params: any }) {
  const teamId = params.id;
  const { data: session } = useSession();

  const { data: members, mutate: mutateMembers } = useSWR(
    teamId ? `/api/teams/${teamId}/members` : null,
    fetcher,
    { fallbackData: [] }
  );

  const {
    data: team,
    isLoading,
    mutate: mutateTeam,
  } = useSWR(teamId ? `/api/teams/${teamId}` : null, fetcher, {
    fallbackData: {},
  });

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
