"use client";

import { useProject } from "@/components/custom/project-provider";
import { Projects } from "@/components/custom/projects";

export default function Page() {
  const { projects, count, isLoading } = useProject();

  return (
    <div className="flex flex-col gap-4 p-4">
      <Projects data={projects} count={count} isLoading={isLoading} />
    </div>
  );
}
