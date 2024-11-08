"use client";

import { Projects } from "@/components/custom/projects";
import { useProject } from "@/components/custom/project-provider";

export default function Page() {
  const { projects, isLoading } = useProject();

  return (
    <div className="flex flex-col gap-4 p-4">
      <Projects data={projects} isLoading={isLoading} />
    </div>
  );
}
