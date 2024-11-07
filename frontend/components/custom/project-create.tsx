import { Upload, X } from "lucide-react";
import * as React from "react";
import { useRef, useState } from "react";
import useSWR from "swr";
import { useSession } from "next-auth/react";
import { useTeams } from "@/components/custom/teams-provider";
import { fetcher } from "@/lib/utils";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import useSWRMutation from "swr/mutation";
import { Project } from "@/lib/types";

interface ProjectCreateDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

interface CreateProjectData {
  title: string;
  description: string;
  model: string;
  instructions: string;
  team_id: string;
}

function useCreateProject(token: string | undefined) {
  return useSWRMutation(
    token ? [`${process.env.NEXT_PUBLIC_BACKEND_HOST}/api/v1/projects/`, token] : null,
    async ([url, token], { arg: data }: { arg: CreateProjectData }) => {
      const response = await fetch(url, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
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
  const { selectedTeamId } = useTeams();
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    model: "default",
    instructions: "",
  });

  // Key for projects list
  const projectsKey =
    session?.user && selectedTeamId
      ? // @ts-ignore
        [`${process.env.NEXT_PUBLIC_BACKEND_HOST}/api/v1/projects/?team_id=${selectedTeamId}`, session.user.accessToken]
      : null;

  // SWR hook for the projects list
  const { mutate: mutateProjects } = useSWR(projectsKey, ([url, token]) => fetcher(url, token));

  // @ts-ignore
  const { trigger: createProject, isMutating: isLoading } = useCreateProject(session?.user?.accessToken);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    // @ts-ignore
    if (!session?.user?.accessToken || !currentTeam) return;

    try {
      const newProject = await createProject({
        ...formData,
        team_id: currentTeam.id,
      });

      await mutateProjects((currentData: any) => ({
        ...currentData,
        data: [...(currentData?.data || []), newProject],
        count: (currentData?.count || 0) + 1,
      }));

      onOpenChange(false);
      setFormData({ title: "", description: "", model: "default", instructions: "" });
    } catch (error) {
      console.error("Error creating project:", error);
    }
  };

  const [files, setFiles] = useState<File[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files) {
      setFiles((prevFiles) => [...prevFiles, ...Array.from(event.target.files as FileList)]);
    }
  };

  const handleRemoveFile = (fileToRemove: File) => {
    setFiles((prevFiles) => prevFiles.filter((file) => file !== fileToRemove));
  };

  const handleUploadClick = (e: React.MouseEvent) => {
    e.preventDefault();
    fileInputRef.current?.click();
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
        <form id="create-project-form" className="space-y-6" onSubmit={handleSubmit}>
          <div className="flex gap-4">
            <div className="flex-1">
              <Label htmlFor="title">Title</Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="Team Space..."
                className="mt-2"
              />
            </div>
          </div>

          <div>
            <Label htmlFor="description">Description (optional)</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="A collaborative space for discussing latest insights..."
              className="mt-2"
            />
          </div>

          <div>
            <Label htmlFor="model">AI Model</Label>
            <Select
              value={formData.model}
              onValueChange={(value) => setFormData({ ...formData, model: value })}
            >
              <SelectTrigger className="mt-2">
                <SelectValue placeholder="Select a model" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="default">Default</SelectItem>
                <SelectItem value="gpt-4">GPT-4</SelectItem>
                <SelectItem value="claude">Claude</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="instructions">Custom Instructions (optional)</Label>
            <DialogDescription className="mt-1">
              Give instructions to the AI that affects every thread in this space.
            </DialogDescription>
            <Textarea
              id="instructions"
              placeholder="Always respond in a formal tone and prioritize data-driven insights..."
              className="mt-2"
            />
          </div>
          <div className="space-y-2">
            <Label>Knowledge</Label>
            <div>
              <input type="file" ref={fileInputRef} onChange={handleFileChange} className="hidden" multiple />
              <Button variant="outline" onClick={handleUploadClick}>
                <Upload className="mr-2 size-4" />
                Upload files
              </Button>
            </div>
            {files.length > 0 && (
              <ul className="mt-2 space-y-1">
                {files.map((file, index) => (
                  <li key={index} className="flex items-center justify-between text-sm">
                    <span>{file.name}</span>
                    <Button variant="ghost" size="sm" onClick={() => handleRemoveFile(file)}>
                      <X className="size-4" />
                      <span className="sr-only">Remove</span>
                    </Button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </form>
        <DialogFooter className="gap-2 sm:gap-0">
          <Button variant="secondary" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button type="submit" form="create-project-form">
            Continue
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
