import { useSession } from "next-auth/react";
import * as React from "react";
import useSWR from "swr";
import useSWRMutation from "swr/mutation";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import { Project } from "@/lib/types";
import { fetcher, getToken } from "@/lib/utils";
import { useProject } from "./project-provider";
import { toast } from "sonner";
import { ProjectForm } from "./project-form";

interface ProjectCreateDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

function useCreateProject(token: string | undefined) {
  return useSWRMutation(
    token ? [`${process.env.NEXT_PUBLIC_API_URL}/api/v1/projects/`, token] : null,
    async ([url, token], { arg }: { arg: { formData: FormData } }) => {
      const response = await fetch(url, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: arg.formData,
      });

      if (!response.ok) {
        throw new Error("Failed to create project");
      }

      return response.json() as Promise<Project>;
    }
  );
}

export const ProjectCreate = ({ open, onOpenChange }: ProjectCreateDialogProps) => {
  const { data: session } = useSession();
  const { updateProject } = useProject();

  const projectsKey = session?.user ? [`${process.env.NEXT_PUBLIC_API_URL}/api/v1/projects/`, getToken(session)] : null;
  const { mutate: mutateProjects } = useSWR(projectsKey, ([url, token]) => fetcher(url, token));
  const { trigger: createProject, isMutating: isLoading } = useCreateProject(getToken(session));

  const { data: modelsData } = useSWR(
    session?.user ? [`${process.env.NEXT_PUBLIC_API_URL}/api/v1/llm/models`, getToken(session)] : null,
    ([url, token]) => fetcher(url, token)
  );

  const handleSubmit = async (formData: FormData) => {
    const token = getToken(session);
    if (!token) return;

    try {
      const newProject = await createProject({ formData });

      await mutateProjects((currentData: any) => ({
        ...currentData,
        data: [...(currentData?.data || []), newProject],
        count: (currentData?.count || 0) + 1,
      }));

      onOpenChange(false);
    } catch (error) {
      toast.error("Failed to create project. Please try again.");
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle className="text-2xl">Create Project</DialogTitle>
          </div>
          <Separator className="my-4" />
        </DialogHeader>

        <ProjectForm onSubmit={handleSubmit} isLoading={isLoading} modelsData={modelsData} />

        <DialogFooter className="gap-2 sm:gap-0">
          <Button variant="secondary" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button type="submit" form="create-project-form" disabled={isLoading}>
            Continue
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
