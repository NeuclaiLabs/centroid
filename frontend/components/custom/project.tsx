"use client";

import { MoreHorizontal, PenLine, Plus, Timer, Upload, Bot, Sparkles, Trash2 } from "lucide-react";
import * as React from "react";
import { useState } from "react";
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

interface ProjectProps {
  data?: Project;
  isLoading?: boolean;
}

export function Project({ isLoading, data }: ProjectProps) {
  const { updateProject, deleteProject } = useProject();

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
        [field]: editedValues[field as keyof typeof editedValues]
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
        [field]: data?.[field as keyof Project] || ""
      });
    }
  };

  if (isLoading) {
    return (
      <div className="flex min-h-screen flex-col lg:flex-row p-6">
        {/* Main Content Skeleton */}
        <div className="flex-1 p-6 border-r">
          {/* Title skeleton */}
          <Skeleton className="h-8 w-48 mb-8" />

          {/* New thread input skeleton */}
          <Skeleton className="h-32 mb-8" />

          {/* Threads skeleton */}
          <div className="space-y-6">
            <Skeleton className="h-6 w-24" />
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="p-4 space-y-4 border rounded-lg">
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="h-4 w-full" />
                  <div className="flex justify-between">
                    <Skeleton className="h-4 w-24" />
                    <Skeleton className="h-4 w-8" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Sidebar Skeleton */}
        <div className="w-full lg:w-80 p-6 bg-muted/30">
          <div className="space-y-8">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="space-y-2">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-4 w-full" />
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col lg:flex-row p-6">
      {/* Main Content */}
      <div className="flex-1 p-6 border-r overflow-y-auto">
        <h1 className="text-3xl font-semibold mb-8">{data?.title}</h1>

        {/* New Thread Input */}
        <Card className="p-4 mb-8">
          <div className="space-y-4">
            <Input className="text-lg border-0 px-0 focus-visible:ring-0" placeholder="New Thread" />
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <Button variant="ghost" size="sm">
                  None
                </Button>
                <Button variant="ghost" size="sm">
                  <Upload className="size-4 mr-2" />
                  Attach
                </Button>
              </div>
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2 bg-muted p-1 rounded-full">
                  <Bot className="size-5" />
                  <Sparkles className="size-5" />
                </div>
                <div className="flex items-center gap-2">
                  {/* <Switch /> */}
                  <span>Pro</span>
                </div>
                <Button size="sm">
                  <PenLine className="size-4 mr-2" />
                  Start
                </Button>
              </div>
            </div>
          </div>
        </Card>

        {/* Threads Section */}
        <div className="space-y-6">
          <div className="flex items-center gap-2">
            <PenLine className="size-4" />
            <h2 className="text-lg font-semibold">Threads</h2>
          </div>

          {threads?.map((thread) => (
            <Card key={thread.id} className="p-4">
              <div className="space-y-4">
                <div className="font-medium">{thread.content}</div>
                <div className="pl-4 border-l-2">{thread.response}</div>
                <div className="flex items-center justify-between text-sm text-muted-foreground">
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-1">
                      <Timer className="size-4" />
                      <span>{thread.timestamp}</span>
                    </div>
                    <span>{thread.status}</span>
                  </div>
                  <Button variant="ghost" size="icon">
                    <MoreHorizontal className="size-4" />
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      </div>

      {/* Right Sidebar */}
      <div className="w-full lg:w-80 p-6 bg-muted/30 border-t lg:border-t-0">
        <div className="space-y-6">
          {/* Title Section */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <h2 className="font-semibold">Title</h2>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleEditClick('title')}
              >
                {editingField === 'title' ? 'Cancel' : 'Edit'}
              </Button>
            </div>
            {editingField === 'title' ? (
              <div className="flex gap-2">
                <Input
                  value={editedValues.title}
                  onChange={(e) => setEditedValues({ ...editedValues, title: e.target.value })}
                  className="text-sm"
                />
                <Button size="sm" onClick={() => handleSave('title')}>Save</Button>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">{data?.title}</p>
            )}
          </div>

          <Separator />

          {/* Description Section */}
          {(data?.description || editingField === 'description') && (
            <>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <h2 className="font-semibold">Description</h2>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleEditClick('description')}
                  >
                    {editingField === 'description' ? 'Cancel' : 'Edit'}
                  </Button>
                </div>
                {editingField === 'description' ? (
                  <div className="flex flex-col gap-2">
                    <Textarea
                      value={editedValues.description}
                      onChange={(e) => setEditedValues({ ...editedValues, description: e.target.value })}
                      className="text-sm"
                    />
                    <Button size="sm" onClick={() => handleSave('description')}>Save</Button>
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">{data?.description}</p>
                )}
              </div>
              <Separator />
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

          <Separator />

          {/* Instructions Section */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <PenLine className="size-4" />
                <h2 className="font-semibold">Instructions</h2>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleEditClick('instructions')}
              >
                {editingField === 'instructions' ? 'Cancel' : 'Edit'}
              </Button>
            </div>
            {editingField === 'instructions' ? (
              <div className="flex flex-col gap-2">
                <Textarea
                  value={editedValues.instructions}
                  onChange={(e) => setEditedValues({ ...editedValues, instructions: e.target.value })}
                  className="text-sm"
                />
                <Button size="sm" onClick={() => handleSave('instructions')}>Save</Button>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">{data?.instructions || "No custom instructions added."}</p>
            )}
          </div>

          <Separator />

          {/* Files Section */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Upload className="size-4" />
                <h2 className="font-semibold">Files</h2>
              </div>
              <Button size="icon" variant="ghost">
                <Plus className="size-4" />
              </Button>
            </div>
            {data?.files && data?.files.length > 0 ? (
              <ul className="space-y-2">
                {data?.files.map((file, index) => (
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
                      <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
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
