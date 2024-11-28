"use client";

import { useSession } from "next-auth/react";
import { createContext, useContext, useState, useMemo, useEffect } from "react";
import useSWR from "swr";
import useSWRMutation from "swr/mutation";

import { Project } from "@/lib/types";
import { fetcher, getToken } from "@/lib/utils";

import { useTeams } from "./teams-provider";

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
  const url = `${process.env.NEXT_PUBLIC_API_URL}/api/v1/projects/`;
  const token = getToken(session);

  // Add memoized key for projects
  const projectsKey = useMemo(() => {
    if (!token || !selectedTeamId) return null;
    return [url, token];
  }, [url, token, selectedTeamId]);

  const { data: projectsData, isLoading } = useSWR(
    projectsKey,
    ([url, token]) => fetcher(url + `?team_id=${selectedTeamId}`, token),
    {
      revalidateOnFocus: false,
      dedupingInterval: 5000,
    }
  );

  // Add SWR mutation hooks for update and delete
  const updateProjectMutation = useSWRMutation(
    [url, token],
    async ([url, token], { arg: { id, data } }: { arg: { id: string; data: Partial<Project> } }) => {
      return fetcher(url + id, token, {
        method: "PUT",
        body: JSON.stringify(data),
      });
    }
  );

  const deleteProjectMutation = useSWRMutation([url, token], async ([url, token], { arg: id }: { arg: string }) => {
    return fetcher(url + id, token, {
      method: "DELETE",
    });
  });

  // Replace existing updateProject function
  const updateProject = async (projectId: string, updateData: Partial<Project>) => {
    if (!session?.user) throw new Error("No active session");

    try {
      setError(null);
      await updateProjectMutation.trigger({ id: projectId, data: updateData });
    } catch (err) {
      setError(err instanceof Error ? err : new Error("Failed to update project"));
      throw err;
    }
  };

  // Replace existing deleteProject function
  const deleteProject = async (projectId: string) => {
    if (!session?.user) throw new Error("No active session");

    try {
      setError(null);
      await deleteProjectMutation.trigger(projectId);

      // Clear selected project if it's the one being deleted
      if (selectedProject?.id === projectId) {
        setSelectedProjectId(null);
      }

      // Revalidate the projects list
      // await mutate(url);
    } catch (err) {
      setError(err instanceof Error ? err : new Error("Failed to delete project"));
      throw err;
    }
  };

  // Modify getProjectByIdKey to check projectsData first
  const getProjectByIdKey = useMemo(() => {
    if (!session?.user || !selectedProjectId) return null;

    // If project exists in the list, don't fetch
    const projectInList = projectsData?.data?.find((p: Project) => p.id === selectedProjectId);
    if (projectInList) return null;

    return [`${process.env.NEXT_PUBLIC_API_URL}/api/v1/projects/${selectedProjectId}`, getToken(session)];
  }, [session?.user, selectedProjectId, projectsData?.data]);

  const { data: singleProjectData } = useSWR(getProjectByIdKey, ([url, token]) => fetcher(url, token), {
    revalidateOnFocus: false,
    dedupingInterval: 5000,
  });

  // Update the useEffect to use singleProjectData
  useEffect(() => {
    const updateSelectedProject = async () => {
      setError(null);

      if (!selectedProjectId) {
        setSelectedProject(null);
        return;
      }

      const projectInList = projectsData?.data?.find((p: Project) => p.id === selectedProjectId);

      if (projectInList) {
        setSelectedProject(projectInList);
        return;
      }

      // Use the data from singleProjectData
      if (singleProjectData?.data) {
        setSelectedProject(singleProjectData.data);
      }
    };

    updateSelectedProject();
  }, [selectedProjectId, projectsData?.data, singleProjectData]);

  return (
    <ProjectContext.Provider
      value={{
        projects: projectsData?.data ?? [], // Provide default empty array
        isLoading,
        isLoadingProject,
        selectedProject,
        count: projectsData?.count ?? 0, // Provide default count
        error,
        setSelectedProjectId,
        updateProject,
        deleteProject,
        fetchProjectById: async (projectId: string): Promise<Project | null> => {
          if (!session?.user) return null;

          const url = `${process.env.NEXT_PUBLIC_API_URL}/api/v1/projects/${projectId}`;
          try {
            const response = await fetcher(url, getToken(session));
            return response.data;
          } catch (error) {
            console.error("Error fetching project:", error);
            return null;
          }
        },
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
