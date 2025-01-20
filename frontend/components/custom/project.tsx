"use client";

import { PenLine, Plus, Timer, Upload, Bot, Trash2, X } from "lucide-react";
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

  // Reset form when modal closes
  const handleOpenChange = (open: boolean) => {
    setIsEditDialogOpen(open);
    if (!open) {
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

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!data?.id) return;

    try {
      const formData = new FormData();
      formData.append("title", editedValues.title);
      formData.append("description", editedValues.description || "");
      formData.append("model", editedValues.model);
      formData.append("instructions", editedValues.instructions || "");

      files.forEach((file) => {
        formData.append("files", file);
      });

      await updateProject(data.id, editedValues);
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
          {/* Add Edit Button at the top */}
          <div className="flex justify-end">
            <Button onClick={() => setIsEditDialogOpen(true)}>Edit Project</Button>
          </div>

          {/* Display-only sections */}
          <div className="space-y-2">
            <h2 className="font-semibold">Title</h2>
            <p className="text-sm text-muted-foreground">{data?.title}</p>
          </div>
          <Separator className="bg-primary/20" />

          {data?.description && (
            <>
              <div className="space-y-2">
                <h2 className="font-semibold">Description</h2>
                <p className="text-sm text-muted-foreground">{data?.description}</p>
              </div>
              <Separator className="bg-primary/20" />
            </>
          )}

          {/* Model Section */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Bot className="size-4" />
                <h2 className="font-semibold">AI Model</h2>
              </div>
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
            </div>
            <p className="text-sm text-muted-foreground">{data?.instructions || "No custom instructions added."}</p>
          </div>

          <Separator className="bg-primary/20" />

          {/* Edit Dialog */}
          <Dialog open={isEditDialogOpen} onOpenChange={handleOpenChange}>
            <DialogContent className="sm:max-w-[600px]">
              <DialogHeader>
                <div className="flex items-center justify-between">
                  <DialogTitle className="text-2xl">Edit Project</DialogTitle>
                </div>
                <Separator className="my-4" />
              </DialogHeader>
              <form id="edit-project-form" className="space-y-6" onSubmit={handleSave}>
                <div className="flex gap-4">
                  <div className="flex-1">
                    <Label htmlFor="title">Title</Label>
                    <Input
                      id="title"
                      value={editedValues.title}
                      onChange={(e) => setEditedValues({ ...editedValues, title: e.target.value })}
                      className="mt-2"
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="description">Description (optional)</Label>
                  <Textarea
                    id="description"
                    value={editedValues.description}
                    onChange={(e) => setEditedValues({ ...editedValues, description: e.target.value })}
                    className="mt-2"
                  />
                </div>

                <div>
                  <Label htmlFor="model">AI Model</Label>
                  <Select
                    value={editedValues.model}
                    onValueChange={(value) => setEditedValues({ ...editedValues, model: value })}
                  >
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
                    value={editedValues.instructions}
                    onChange={(e) => setEditedValues({ ...editedValues, instructions: e.target.value })}
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
                <Button variant="secondary" onClick={() => setIsEditDialogOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" form="edit-project-form">
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
