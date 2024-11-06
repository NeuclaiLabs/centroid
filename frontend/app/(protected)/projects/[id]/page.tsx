'use client';

import useSWR from "swr";
import { useSession } from "next-auth/react";
import { useTeams } from "@/components/custom/teams-provider";
import { fetcher } from "@/lib/utils";
import { Project } from "@/components/custom/project";

export default function Page({ params }: { params: { id: string } }) {
  const { data: session } = useSession();
  const { currentTeam } = useTeams();

  const { data, error, isLoading } = useSWR(
    session?.user && currentTeam
      ? [`${process.env.NEXT_PUBLIC_BACKEND_HOST}/api/v1/projects/${params.id}`, session.user.accessToken]
      : null,
    ([url, token]) => fetcher(url,  token)
  );

  return (
    <div className="flex flex-col gap-4 p-4">
      <Project isLoading={isLoading} data={data} />
    </div>
  );
}
