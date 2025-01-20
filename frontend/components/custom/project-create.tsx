import { Upload, X } from "lucide-react";
import { useSession } from "next-auth/react";
import * as React from "react";
import { useRef, useState } from "react";
import useSWR from "swr";
import useSWRMutation from "swr/mutation";
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
import { Project } from "@/lib/types";
import { fetcher, getToken } from "@/lib/utils";
import { useProject } from "./project-provider";
import { toast } from "sonner";

interface ProjectCreateDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

interface CreateProjectData {
  title: string;
  description: string;
  model: string;
  instructions: string;
  team_id?: string;
  files?: string[];
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
  const [formData, setFormData] = useState<CreateProjectData>({
    title: "",
    description: "",
    model: "",
    instructions: "",
  });

  const projectsKey = session?.user ? [`${process.env.NEXT_PUBLIC_API_URL}/api/v1/projects/`, getToken(session)] : null;
  const { mutate: mutateProjects } = useSWR(projectsKey, ([url, token]) => fetcher(url, token));
  const { trigger: createProject, isMutating: isLoading } = useCreateProject(getToken(session));

  const [files, setFiles] = useState<File[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { data: modelsData } = useSWR(
    session?.user ? [`${process.env.NEXT_PUBLIC_API_URL}/api/v1/llm/models`, getToken(session)] : null,
    ([url, token]) => fetcher(url, token)
  );

  const MAX_FILE_SIZE = 500 * 1024; // 500KB in bytes
  const MAX_FILES = 5;

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files) {
      const newFiles = Array.from(event.target.files);

      // Check if adding new files would exceed the limit
      if (files.length + newFiles.length > MAX_FILES) {
        toast.error(`Maximum ${MAX_FILES} files allowed`);
        return;
      }

      // Check each file's size
      const oversizedFiles = newFiles.filter((file) => file.size > MAX_FILE_SIZE);

      if (oversizedFiles.length > 0) {
        toast.error(`Files must be under 500KB. Skipping: ${oversizedFiles.map((f) => f.name).join(", ")}`);
        // Only add files that are under the size limit
        const validFiles = newFiles.filter((file) => file.size <= MAX_FILE_SIZE);
        setFiles((prevFiles) => [...prevFiles, ...validFiles]);
      } else {
        setFiles((prevFiles) => [...prevFiles, ...newFiles]);
      }
    }
  };

  const handleRemoveFile = (fileToRemove: File) => {
    // Stop event propagation to prevent modal from closing
    event?.stopPropagation();
    setFiles((prevFiles) => prevFiles.filter((file) => file !== fileToRemove));
  };

  const handleUploadClick = (e: React.MouseEvent) => {
    e.preventDefault();
    fileInputRef.current?.click();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const token = getToken(session);
    if (!token) return;

    if (!formData.model) {
      toast.error("Please select an AI model to continue.");
      return;
    }

    try {
      // Create FormData and append all fields from the formData state
      const submitFormData = new FormData();
      submitFormData.append("title", formData.title);
      submitFormData.append("description", formData.description || "");
      submitFormData.append("model", formData.model);
      submitFormData.append("instructions", formData.instructions || "");

      // Append all files
      files.forEach((file) => {
        submitFormData.append("files", file);
      });

      // Create project with files in a single request
      const newProject = await createProject({ formData: submitFormData });

      // Update local projects list
      await mutateProjects((currentData: any) => ({
        ...currentData,
        data: [...(currentData?.data || []), newProject],
        count: (currentData?.count || 0) + 1,
      }));

      // Reset form state
      onOpenChange(false);
      setFormData({
        title: "",
        description: "",
        model: "",
        instructions: "",
      });
      setFiles([]);
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to create project. Please try again.",
      });
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
            <Select value={formData.model} onValueChange={(value) => setFormData({ ...formData, model: value })}>
              <SelectTrigger className="mt-2">
                <SelectValue placeholder="Select a model" />
              </SelectTrigger>
              <SelectContent>
                {modelsData?.data.map((model: { id: string; label: string }) => (
                  <SelectItem key={model.id} value={model.id}>
                    {model.label}
                  </SelectItem>
                ))}
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
              value={formData.instructions}
              onChange={(e) => setFormData({ ...formData, instructions: e.target.value })}
              placeholder="Always respond in a formal tone and prioritize data-driven insights..."
              className="mt-2"
            />
          </div>
          <div className="space-y-2">
            <Label>Knowledge</Label>
            <DialogDescription className="mt-1">
              Upload up to 5 files (max 500KB each) to provide context for the AI.
            </DialogDescription>
            <div>
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileChange}
                className="hidden"
                accept="application/pdf,text/*,image/*,application/json"
                multiple
              />
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
                    <Button
                      variant="ghost"
                      size="sm"
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleRemoveFile(file);
                      }}
                    >
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
