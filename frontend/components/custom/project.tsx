"use client";

import { MoreHorizontal, PenLine, Plus, Timer, Upload, Bot, Sparkles, Trash2 } from "lucide-react";
import * as React from "react";
import { useState, useEffect, useRef, useCallback } from "react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import type { Project } from "@/lib/types";
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
import { useProject } from "./project-provider";
import { toast } from "sonner";

interface ProjectProps {
  data?: Project;
  isLoading?: boolean;
}

export function Project({ isLoading, data }: ProjectProps) {
  const { updateProject, deleteProject } = useProject();
  const [isUploading, setIsUploading] = useState(false);
  const [uploadQueue, setUploadQueue] = useState<Array<string>>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  let threads = null;

  // Add state for editing
  const [editingField, setEditingField] = useState<string | null>(null);
  const [editedValues, setEditedValues] = useState({
    title: data?.title || "",
    description: data?.description || "",
    instructions: data?.instructions || "",
  });

  // Add state for controlling the delete dialog visibility
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);

  // Add handler for saving edits
  const handleSave = async (field: string) => {
    if (!data?.id) return;

    try {
      await updateProject(data.id, {
        [field]: editedValues[field as keyof typeof editedValues],
      });
      setEditingField(null);
    } catch (error) {
      console.error(`Error saving ${field}:`, error);
      // You might want to add error handling UI here
    }
  };

  const handleDelete = async () => {
    if (!data?.id) return;

    try {
      await deleteProject(data.id);
      setIsDeleteDialogOpen(false);
      // The ProjectProvider will handle updating the UI after deletion
    } catch (error) {
      console.error("Error deleting project:", error);
      // You might want to add error handling UI here
    }
  };

  // Update the editingField state handler to also update editedValues
  const handleEditClick = (field: string) => {
    if (editingField === field) {
      setEditingField(null);
    } else {
      setEditingField(field);
      // Update the edited values with current data when starting to edit
      setEditedValues({
        ...editedValues,
        [field]: data?.[field as keyof Project] || "",
      });
    }
  };

  const uploadFile = async (file: File) => {
    const formData = new FormData();
    formData.append("file", file);

    try {
      const response = await fetch(`/api/files/upload`, {
        method: "POST",
        body: formData,
      });

      if (response.ok) {
        const data = await response.json();
        const { pathname } = data;
        return pathname;
      } else {
        const { error } = await response.json();
        toast.error(error);
      }
    } catch (error) {
      toast.error("Failed to upload file, please try again!");
    }
  };

  const handleFileChange = useCallback(
    async (event: React.ChangeEvent<HTMLInputElement>) => {
      const files = Array.from(event.target.files || []);
      const currentFileCount = data?.files?.length || 0;

      if (currentFileCount + files.length > 5) {
        toast.error("You can only upload a maximum of 5 files");
        return;
      }

      setUploadQueue(files.map((file) => file.name));

      try {
        const uploadPromises = files.map((file) => uploadFile(file));
        const uploadedFiles = await Promise.all(uploadPromises);
        const successfulUploads = uploadedFiles.filter((file): file is string => file !== undefined);

        if (successfulUploads.length > 0) {
          await updateProject(data!.id, {
            files: [...(data?.files || []), ...successfulUploads]
          });
          toast.success("Files uploaded successfully");
        }
      } catch (error) {
        console.error("Error uploading files!", error);
        toast.error("Failed to update project with new files");
      } finally {
        setUploadQueue([]);
        if (fileInputRef.current) {
          fileInputRef.current.value = '';
        }
      }
    },
    [data?.files, data?.id, updateProject]
  );

  if (isLoading) {
    return (
      <div className="flex min-h-screen flex-col lg:flex-row p-6 pt-0">
        <div className="w-full p-6 bg-muted/30 border-l overflow-y-auto">
          <div className="space-y-6">
            {/* Title Skeleton */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Skeleton className="h-6 w-20" />
                <Skeleton className="h-8 w-16" />
              </div>
              <Skeleton className="h-4 w-3/4" />
            </div>

            <Separator />

            {/* Description Skeleton */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Skeleton className="h-6 w-24" />
                <Skeleton className="h-8 w-16" />
              </div>
              <Skeleton className="h-20 w-full" />
            </div>

            <Separator />

            {/* Model Skeleton */}
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Skeleton className="h-4 w-4" />
                <Skeleton className="h-6 w-20" />
              </div>
              <Skeleton className="h-4 w-1/4" />
            </div>

            <Separator />

            {/* Instructions Skeleton */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Skeleton className="h-4 w-4" />
                  <Skeleton className="h-6 w-24" />
                </div>
                <Skeleton className="h-8 w-16" />
              </div>
              <Skeleton className="h-20 w-full" />
            </div>

            <Separator />

            {/* Files Skeleton */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Skeleton className="h-4 w-4" />
                  <Skeleton className="h-6 w-16" />
                </div>
                <Skeleton className="h-8 w-8" />
              </div>
              <div className="space-y-2">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="flex items-center justify-between">
                    <Skeleton className="h-4 w-3/4" />
                    <Skeleton className="h-8 w-8" />
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col lg:flex-row p-2 pt-0">
      {/* Right Sidebar */}
      <div className="w-full p-6 bg-secondary  overflow-y-auto">
        <div className="space-y-6">
          {/* Title Section */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <h2 className="font-semibold">Title</h2>
              <Button variant="ghost" size="sm" onClick={() => handleEditClick("title")}>
                {editingField === "title" ? "Cancel" : "Edit"}
              </Button>
            </div>
            {editingField === "title" ? (
              <div className="flex gap-2">
                <Input
                  value={editedValues.title}
                  onChange={(e) => setEditedValues({ ...editedValues, title: e.target.value })}
                  className="text-sm"
                />
                <Button size="sm" onClick={() => handleSave("title")}>
                  Save
                </Button>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">{data?.title}</p>
            )}
          </div>
          <Separator className="bg-primary/20" />
          {/* Description Section */}
          {(data?.description || editingField === "description") && (
            <>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <h2 className="font-semibold">Description</h2>
                  <Button variant="ghost" size="sm" onClick={() => handleEditClick("description")}>
                    {editingField === "description" ? "Cancel" : "Edit"}
                  </Button>
                </div>
                {editingField === "description" ? (
                  <div className="flex flex-col gap-2">
                    <Textarea
                      value={editedValues.description}
                      onChange={(e) => setEditedValues({ ...editedValues, description: e.target.value })}
                      className="text-sm"
                    />
                    <Button size="sm" onClick={() => handleSave("description")}>
                      Save
                    </Button>
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">{data?.description}</p>
                )}
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
              <Button variant="ghost" size="sm" onClick={() => handleEditClick("instructions")}>
                {editingField === "instructions" ? "Cancel" : "Edit"}
              </Button>
            </div>
            {editingField === "instructions" ? (
              <div className="flex flex-col gap-2">
                <Textarea
                  value={editedValues.instructions}
                  onChange={(e) => setEditedValues({ ...editedValues, instructions: e.target.value })}
                  className="text-sm"
                />
                <Button size="sm" onClick={() => handleSave("instructions")}>
                  Save
                </Button>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">{data?.instructions || "No custom instructions added."}</p>
            )}
          </div>

          <Separator className="bg-primary/20" />

          {/* Files Section */}
          <div className="space-y-4">
            <input
              type="file"
              className="hidden"
              ref={fileInputRef}
              multiple
              onChange={handleFileChange}
              accept="application/pdf,text/*,image/*"
            />
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Upload className="size-4" />
                <h2 className="font-semibold">Files</h2>
                <span className="text-xs text-muted-foreground">
                  ({data?.files?.length || 0}/5)
                </span>
              </div>
              <Button
                size="icon"
                variant="ghost"
                onClick={() => fileInputRef.current?.click()}
                disabled={uploadQueue.length > 0 || (data?.files?.length || 0) >= 5}
              >
                <Plus className="size-4" />
              </Button>
            </div>

            {uploadQueue.length > 0 && (
              <div className="space-y-2">
                {uploadQueue.map((filename) => (
                  <div
                    key={filename}
                    className="text-sm text-muted-foreground flex items-center gap-2"
                  >
                    <Timer className="size-4 animate-spin" />
                    <span>Uploading {filename}...</span>
                  </div>
                ))}
              </div>
            )}

            {data?.files && data.files.length > 0 ? (
              <ul className="space-y-2">
                {data.files.map((file, index) => (
                  <li key={index} className="text-sm flex items-center justify-between">
                    <span>{file}</span>
                    <Button variant="ghost" size="icon">
                      <MoreHorizontal className="size-4" />
                    </Button>
                  </li>
                ))}
              </ul>
            ) : (
              <div className="space-y-4">
                <p className="text-sm text-muted-foreground">No files uploaded</p>
                <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
                  <AlertDialogTrigger asChild>
                    <Button variant="destructive" className="w-full">
                      <Trash2 className="size-4 mr-2" />
                      Delete Project
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                      <AlertDialogDescription>
                        This action cannot be undone. This will permanently delete your project and all associated data.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction
                        onClick={handleDelete}
                        className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                      >
                        Delete
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
