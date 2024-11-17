"use client";

import { formatDistanceToNow } from "date-fns";
import { Layers, MoreVertical, Plus, Trash } from "lucide-react";
import { useRouter } from "next/navigation";
import * as React from "react";

import { ProjectCreate } from "@/components/custom/project-create";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardContent, CardFooter } from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Skeleton } from "@/components/ui/skeleton";
import { Project } from "@/lib/types";

import { useProject } from "./project-provider";

interface ProjectsProps {
  data: Project[] | null;
  isLoading: boolean;
  count: number;
}

export const Projects = ({ data, count, isLoading }: ProjectsProps) => {
  const router = useRouter();
  const [open, setOpen] = React.useState(false);
  const { deleteProject } = useProject();
  const [deleteDialogOpen, setDeleteDialogOpen] = React.useState(false);
  const [projectToDelete, setProjectToDelete] = React.useState<string | null>(null);

  const handleDeleteClick = (e: React.MouseEvent, projectId: string) => {
    e.stopPropagation(); // Prevent navigation when clicking delete
    setProjectToDelete(projectId);
    setDeleteDialogOpen(true);
  };

  const handleDelete = async () => {
    if (projectToDelete) {
      try {
        await deleteProject(projectToDelete);
        setDeleteDialogOpen(false);
        setProjectToDelete(null);
      } catch (error) {
        console.error("Failed to delete project:", error);
      }
    }
  };

  return (
    <>
      <div className="relative flex flex-col min-h-screen bg-background">
        <div className="flex-1">
          <div className="max-w-6xl mx-auto p-6 md:px-32">
            <h1 className="text-2xl font-semibold mb-8">Projects</h1>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
              {isLoading || !count ? (
                <>
                  {[1, 2, 3].map((i) => (
                    <Card key={i}>
                      <CardHeader className="p-6 flex flex-row items-center justify-between space-y-0">
                        <Skeleton className="size-8 rounded-full" />
                        <Skeleton className="size-8 rounded-full" />
                      </CardHeader>
                      <CardContent className="px-6 py-2">
                        <Skeleton className="h-6 w-[120px] mb-1" />
                      </CardContent>
                      <CardFooter className="px-6">
                        <Skeleton className="h-4 w-[140px]" />
                      </CardFooter>
                    </Card>
                  ))}
                </>
              ) : (
                <>
                  <Card
                    key="create"
                    onClick={() => setOpen(true)}
                    className="cursor-pointer hover:bg-secondary/50 transition-colors"
                  >
                    <CardHeader className="p-6 flex flex-row items-center justify-between space-y-0">
                      <Button
                        variant="ghost"
                        className="size-8 rounded-full bg-secondary flex items-center justify-center p-0"
                      >
                        <Plus className="size-4" />
                      </Button>
                    </CardHeader>
                    <CardContent className="px-6 py-2">
                      <h3 className="font-semibold text-lg leading-none mb-1">Create Project</h3>
                    </CardContent>
                    <CardFooter className="px-6">
                      <h3 className="text-sm text-primary/50">Start new project</h3>
                    </CardFooter>
                  </Card>
                  {data?.map((project) => (
                    <Card
                      key={project.id}
                      className="cursor-pointer hover:bg-secondary/50 transition-colors"
                      onClick={() => router.push(`/projects/${project.id}`)}
                    >
                      <CardHeader className="p-6 flex flex-row items-center justify-between space-y-0">
                        <div className="size-8 rounded-full bg-secondary flex items-center justify-center">
                          <Layers className="size-5" />
                        </div>
                        <DropdownMenu modal={false}>
                          <DropdownMenuTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="size-8 rounded-full flex items-center justify-center"
                              onClick={(e) => e.stopPropagation()}
                            >
                              <MoreVertical className="size-5" />
                              <span className="sr-only">More options</span>
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem
                              className="text-destructive"
                              onClick={(e) => handleDeleteClick(e, project.id)}
                            >
                              <Trash className="size-4 mr-2" />
                              Delete Project
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </CardHeader>
                      <CardContent className="px-6 py-2">
                        <h3 className="font-semibold text-lg leading-none mb-1">{project.title}</h3>
                      </CardContent>
                      <CardFooter className="px-6">
                        <p className="text-sm text-primary/50">
                          Updated {formatDistanceToNow(new Date(project!.updatedAt), { addSuffix: true })}
                        </p>
                      </CardFooter>
                    </Card>
                  ))}
                </>
              )}
            </div>
          </div>
        </div>

        <ProjectCreate open={open} onOpenChange={setOpen} />
      </div>

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the project and all its associated data.
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
    </>
  );
};
