"use client";

import { PenLine, Plus, Timer, Upload, Bot, Trash2, X, FileIcon } from "lucide-react";
import { useSession } from "next-auth/react";
import * as React from "react";
import { useState, useRef, useCallback } from "react";
import { toast } from "sonner";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import useSWR from "swr";
import { fetcher } from "@/lib/utils";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import { getToken } from "@/lib/utils";

import { useProject } from "./project-provider";

import type { Project, CreateProjectData } from "@/lib/types";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { ProjectForm } from "./project-form";

interface ProjectProps {
  data?: Project;
  isLoading?: boolean;
}

export function Project({ isLoading, data }: ProjectProps) {
  const { updateProject, deleteProject } = useProject();
  const { data: session } = useSession();
  const token = getToken(session);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [activeField, setActiveField] = useState<string | null>(null);
  const [editedValues, setEditedValues] = useState<CreateProjectData>({
    title: "",
    description: "",
    model: "",
    instructions: "",
  });
  const [files, setFiles] = useState<File[]>([]);

  // Add this useEffect to update editedValues when modal opens
  React.useEffect(() => {
    if (isEditDialogOpen && data) {
      setEditedValues({
        title: data.title || "",
        description: data.description || "",
        model: data.model || "",
        instructions: data.instructions || "",
      });
    }
  }, [isEditDialogOpen, data]);

  // Handle opening the edit dialog with specific field focused
  const handleEditClick = (field: string) => {
    setActiveField(field);
    setIsEditDialogOpen(true);
  };

  // Reset when dialog closes
  const handleOpenChange = (open: boolean) => {
    setIsEditDialogOpen(open);
    if (!open) {
      setActiveField(null);
      setFiles([]);
    }
  };

  // Fetch available models
  const { data: modelsData } = useSWR(
    session?.user ? [`${process.env.NEXT_PUBLIC_API_URL}/api/v1/llm/models`, token] : null,
    ([url, token]) => fetcher(url, token)
  );

  const MAX_FILE_SIZE = 500 * 1024; // 500KB in bytes
  const MAX_FILES = 5;

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files) {
      const newFiles = Array.from(event.target.files);

      if (files.length + newFiles.length > MAX_FILES) {
        toast.error(`Maximum ${MAX_FILES} files allowed`);
        return;
      }

      const oversizedFiles = newFiles.filter((file) => file.size > MAX_FILE_SIZE);

      if (oversizedFiles.length > 0) {
        toast.error(`Files must be under 500KB. Skipping: ${oversizedFiles.map((f) => f.name).join(", ")}`);
        const validFiles = newFiles.filter((file) => file.size <= MAX_FILE_SIZE);
        setFiles((prevFiles) => [...prevFiles, ...validFiles]);
      } else {
        setFiles((prevFiles) => [...prevFiles, ...newFiles]);
      }
    }
  };

  const handleRemoveFile = (fileToRemove: File) => {
    event?.stopPropagation();
    setFiles((prevFiles) => prevFiles.filter((file) => file !== fileToRemove));
  };

  const handleUploadClick = (e: React.MouseEvent) => {
    e.preventDefault();
    fileInputRef.current?.click();
  };

  const handleSubmit = async (formData: FormData) => {
    if (!data?.id) return;

    try {
      await updateProject(data.id, {
        title: formData.get("title") as string,
        description: formData.get("description") as string,
        model: formData.get("model") as string,
        instructions: formData.get("instructions") as string,
        // Handle files if needed
        // files: JSON.parse(formData.get("files") as string),
        // new_files: formData.getAll("newFiles") as File[],
      });

      setIsEditDialogOpen(false);
      toast.success("Project updated successfully");
    } catch (error) {
      console.error("Error saving project:", error);
      toast.error("Failed to update project");
    }
  };

  return (
    <div className="flex flex-col lg:flex-row p-2 pt-0">
      <Card className="w-full p-6 bg-secondary overflow-y-auto rounded-lg">
        <div className="space-y-6">
          {/* Title Section */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <h2 className="font-semibold">Title</h2>
              <Button variant="ghost" size="icon" onClick={() => handleEditClick("title")}>
                <PenLine className="size-4" />
              </Button>
            </div>
            <p className="text-sm text-muted-foreground">{data?.title}</p>
          </div>
          <Separator className="bg-primary/20" />

          {/* Description Section */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <h2 className="font-semibold">Description</h2>
              <Button variant="ghost" size="icon" onClick={() => handleEditClick("description")}>
                <PenLine className="size-4" />
              </Button>
            </div>
            <p className="text-sm text-muted-foreground">{data?.description}</p>
          </div>
          <Separator className="bg-primary/20" />

          {/* Model Section */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Bot className="size-4" />
                <h2 className="font-semibold">AI Model</h2>
              </div>
              <Button variant="ghost" size="icon" onClick={() => handleEditClick("model")}>
                <PenLine className="size-4" />
              </Button>
            </div>
            <p className="text-sm text-muted-foreground">{data?.model || "Default"}</p>
          </div>
          <Separator className="bg-primary/20" />

          {/* Instructions Section */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <PenLine className="size-4" />
                <h2 className="font-semibold">Instructions</h2>
              </div>
              <Button variant="ghost" size="icon" onClick={() => handleEditClick("instructions")}>
                <PenLine className="size-4" />
              </Button>
            </div>
            <p className="text-sm text-muted-foreground">{data?.instructions || "No custom instructions added."}</p>
          </div>
          <Separator className="bg-primary/20" />

          {/* Files Section */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Upload className="size-4" />
                <h2 className="font-semibold">Files</h2>
              </div>
              <Button variant="ghost" size="icon" onClick={() => handleEditClick("files")}>
                <PenLine className="size-4" />
              </Button>
            </div>
            {data?.files && data.files.length > 0 ? (
              <div className="space-y-2">
                {data.files.map((file, index) => (
                  <div key={index} className="flex items-center gap-2">
                    <FileIcon className="size-4 text-muted-foreground" />
                    <span className="text-sm text-muted-foreground">{file.split("/").pop()?.slice(16)}</span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">No files added.</p>
            )}
          </div>

          {/* Edit Dialog */}
          <Dialog open={isEditDialogOpen} onOpenChange={handleOpenChange}>
            <DialogContent className="sm:max-w-[600px]">
              <DialogHeader>
                <div className="flex items-center justify-between">
                  <DialogTitle className="text-2xl">Edit Project</DialogTitle>
                </div>
                <Separator className="my-4" />
              </DialogHeader>

              <ProjectForm
                onSubmit={handleSubmit}
                isLoading={isLoading}
                modelsData={modelsData}
                mode="edit"
                initialData={{
                  title: data?.title || "",
                  description: data?.description || "",
                  model: data?.model || "",
                  instructions: data?.instructions || "",
                  files: data?.files || [],
                }}
                focusField={activeField}
              />

              <DialogFooter className="gap-2 sm:gap-0">
                <Button variant="secondary" onClick={() => setIsEditDialogOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" form="create-project-form">
                  Save Changes
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </Card>
    </div>
  );
}
