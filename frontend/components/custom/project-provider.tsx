"use client";

import { createContext, useContext, useState } from "react";
import useSWR, { mutate } from "swr";
import { useSession } from "next-auth/react";
import { useTeams } from "./teams-provider";
import { fetcher } from "@/lib/utils";

type Project = {
  id: string;
  title: string;
  description?: string;
  // ... other project properties
};

type ProjectContextType = {
  projects: Project[];
  isLoading: boolean;
  selectedProject: Project | null;
  setSelectedProject: (project: Project | null) => void;
  updateProject: (id: string, data: Partial<Project>) => Promise<void>;
  deleteProject: (id: string) => Promise<void>;
};

export const ProjectContext = createContext<ProjectContextType | undefined>(undefined);

export function ProjectProvider({ children }: { children: React.ReactNode }) {
  const { data: session } = useSession();
  const { selectedTeamId } = useTeams();
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);

  // Fetch all projects (since we only have max 5)
  const { data: projectsData, isLoading } = useSWR(
    session?.user && selectedTeamId
      ? [`${process.env.NEXT_PUBLIC_BACKEND_HOST}/api/v1/projects/?team_id=${selectedTeamId}`, session.user.accessToken]
      : null,
    ([url, token]) => fetcher(url, token)
  );

  const updateProject = async (projectId: string, updateData: Partial<Project>) => {
    if (!session?.user) return;

    const url = `${process.env.NEXT_PUBLIC_BACKEND_HOST}/api/v1/projects/${projectId}`;

    try {
      const updatedProject = await mutate(
        [url, session.user?.accessToken],
        async () => {
          const response = await fetcher(url, session.user?.accessToken, {
            method: 'PATCH',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(updateData),
          });
          return response;
        },
        {
          revalidate: true,
          populateCache: true,
        }
      );

      // Update selected project if it's the one being edited
      if (selectedProject?.id === projectId) {
        setSelectedProject(updatedProject);
      }
    } catch (error) {
      console.error("Error updating project:", error);
      throw error;
    }
  };

  const deleteProject = async (projectId: string) => {
    if (!session?.user) return;

    const url = `${process.env.NEXT_PUBLIC_BACKEND_HOST}/api/v1/projects/${projectId}`;
    try {
      await fetcher(url, session.user.accessToken, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
        body: ''
      });

      // Clear selected project if it's the one being deleted
      if (selectedProject?.id === projectId) {
        setSelectedProject(null);
      }

      // Revalidate the projects list
      const projectsUrl = `${process.env.NEXT_PUBLIC_BACKEND_HOST}/api/v1/projects/?team_id=${selectedTeamId}`;
      await mutate([projectsUrl, session.user.accessToken]);
    } catch (error) {
      console.error("Error deleting project:", error);
      throw error;
    }
  };

  return (
    <ProjectContext.Provider
      value={{
        projects: projectsData?.data || [],
        isLoading,
        selectedProject,
        setSelectedProject,
        updateProject,
        deleteProject,
      }}
    >
      {children}
    </ProjectContext.Provider>
  );
}

export function useProject() {
  const context = useContext(ProjectContext);
  if (context === undefined) {
    throw new Error("useProject must be used within a ProjectProvider");
  }
  return context;
}
