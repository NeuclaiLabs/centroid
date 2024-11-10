"use client";

import { createContext, useContext, useState, useMemo, useEffect } from "react";
import useSWR, { mutate } from "swr";
import { useSession } from "next-auth/react";
import { useTeams } from "./teams-provider";
import { fetcher } from "@/lib/utils";

import { Project } from "@/lib/types";

type ProjectContextType = {
  projects: Project[];
  isLoading: boolean;
  isLoadingProject: boolean;
  selectedProject: Project | null;
  count: number;
  error: Error | null;
  setSelectedProjectId: (id: string | null) => void;
  updateProject: (id: string, data: Partial<Project>) => Promise<void>;
  deleteProject: (id: string) => Promise<void>;
  fetchProjectById: (id: string) => Promise<Project | null>;
};

export const ProjectContext = createContext<ProjectContextType | undefined>(undefined);

export function ProjectProvider({ children }: { children: React.ReactNode }) {
  const { data: session } = useSession();
  const { selectedTeamId } = useTeams();
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [isLoadingProject, setIsLoadingProject] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  // Optimize SWR configuration with key factory
  const projectsKey = useMemo(() => {
    if (!session?.user || !selectedTeamId) return null;
    return [`${process.env.NEXT_PUBLIC_BACKEND_HOST}/api/v1/projects/?team_id=${selectedTeamId}`, session.user.accessToken];
  }, [session?.user, selectedTeamId]);

  // Use the memoized key
  const { data: projectsData, isLoading } = useSWR(
    projectsKey,
    ([url, token]) => fetcher(url, token),
    {
      revalidateOnFocus: false,  // Optimize by preventing unnecessary revalidation
      dedupingInterval: 5000,    // Dedupe requests within 5 seconds
    }
  );

  // Effect to update selected project when ID changes
  useEffect(() => {
    const updateSelectedProject = async () => {
      setError(null);

      if (!selectedProjectId) {
        setSelectedProject(null);
        return;
      }

      const projectInList = projectsData?.data?.find(
        (p: Project) => p.id === selectedProjectId
      );

      if (projectInList) {
        setSelectedProject(projectInList);
        return;
      }

      // If not in list, fetch it directly
      setIsLoadingProject(true);
      try {
        const fetchedProject = await fetchProjectById(selectedProjectId);
        setSelectedProject(fetchedProject);
      } catch (err) {
        setError(err instanceof Error ? err : new Error('Failed to fetch project'));
      } finally {
        setIsLoadingProject(false);
      }
    };

    updateSelectedProject();
  }, [selectedProjectId, projectsData?.data]);

  const updateProject = async (projectId: string, updateData: Partial<Project>) => {
    if (!session?.user) throw new Error('No active session');

    const url = `${process.env.NEXT_PUBLIC_BACKEND_HOST}/api/v1/projects/${projectId}`;

    try {
      setError(null);
      const result = await mutate(
        [url, session.user?.accessToken],
        async () => {
          const response = await fetcher(url, session.user?.accessToken, {
            method: "PUT",
            body: JSON.stringify(updateData),
          });
          return response;
        },
        {
          revalidate: true,
          populateCache: true,
          rollbackOnError: true, // Rollback on error
        }
      );

      // Revalidate the projects list after successful update
      if (projectsKey) {
        await mutate(projectsKey);
      }

      return result;
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to update project'));
      throw err;
    }
  };

  const deleteProject = async (projectId: string) => {
    if (!session?.user) throw new Error('No active session');

    try {
      setError(null);
      const url = `${process.env.NEXT_PUBLIC_BACKEND_HOST}/api/v1/projects/${projectId}`;

      await fetcher(url, session.user.accessToken, {
        method: "DELETE",
      });

      // Clear selected project if it's the one being deleted
      if (selectedProject?.id === projectId) {
        setSelectedProjectId(null);
      }

      // Revalidate the projects list
      if (projectsKey) {
        await mutate(projectsKey);
      }
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to delete project'));
      throw err;
    }
  };

  const fetchProjectById = async (projectId: string): Promise<Project | null> => {
    if (!session?.user) return null;

    const url = `${process.env.NEXT_PUBLIC_BACKEND_HOST}/api/v1/projects/${projectId}`;
    try {
      const response = await fetcher(url, session.user.accessToken);
      return response.data;
    } catch (error) {
      console.error("Error fetching project:", error);
      return null;
    }
  };

  return (
    <ProjectContext.Provider
      value={{
        projects: projectsData?.data ?? [],  // Provide default empty array
        isLoading,
        isLoadingProject,
        selectedProject,
        count: projectsData?.count ?? 0,     // Provide default count
        error,
        setSelectedProjectId,
        updateProject,
        deleteProject,
        fetchProjectById,
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
