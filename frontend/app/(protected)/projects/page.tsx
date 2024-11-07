"use client";

import useSWR from "swr";
import { Projects } from "@/components/custom/projects";
import { useSession } from "next-auth/react";
import { useTeams } from "@/components/custom/teams-provider";
import { fetcher } from "@/lib/utils";

export default function Page() {
  const { data: session } = useSession();
  const { selectedTeamId } = useTeams();

  const {
    data: res,
    error,
    isLoading,
  } = useSWR(
    session?.user && selectedTeamId
      ? [`${process.env.NEXT_PUBLIC_BACKEND_HOST}/api/v1/projects/?team_id=${selectedTeamId}`, session.user.accessToken]
      : null,
    ([url, token]) => fetcher(url, token)
  );

  if (error) {
    console.error("Error fetching projects:", error);
  }

  return (
    <div className="flex flex-col gap-4 p-4">
      <Projects data={res?.data} count={res?.count} isLoading={isLoading} />
    </div>
  );
}
