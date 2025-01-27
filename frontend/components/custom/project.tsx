"use client";

import { PenLine, Plus, Timer, Upload, Bot, Trash2, X, FileIcon } from "lucide-react";
import { useSession } from "next-auth/react";
import * as React from "react";
import { useState, useRef, useCallback } from "react";
import { toast } from "sonner";
import useSWR from "swr";
import { fetcher } from "@/lib/utils";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
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

  const handleSubmit = async (formData: FormData) => {
    if (!data?.id) return;

    try {
      console.log("Form data:", formData);
      await updateProject(data.id, formData);

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
            <p className="text-sm text-muted-foreground">
              {modelsData?.data.find((model: any) => model.id === data?.model)?.label || "Default"}
            </p>
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
            {Array.isArray(data?.files)
              ? data.files.map((file, index) => (
                  <div key={index} className="flex items-center gap-2">
                    <FileIcon className="size-4 text-muted-foreground" />
                    <span className="text-sm text-muted-foreground">{file}</span>
                  </div>
                ))
              : null}
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
                  files: Array.isArray(data?.files) ? data.files : [],
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
