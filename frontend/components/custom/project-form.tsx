"use client";

import { Upload, X, Check, ChevronsUpDown } from "lucide-react";
import { useSession } from "next-auth/react";
import * as React from "react";
import { useState, useRef, useEffect } from "react";
import { toast } from "sonner";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import useSWR from "swr";
import { fetcher, getToken } from "@/lib/utils";
import { cn } from "@/lib/utils";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";

import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

import type { CreateProjectData } from "@/lib/types";

interface ProjectFormProps {
  onSubmit: (formData: FormData) => Promise<void>;
  isLoading?: boolean;
  modelsData?: { data: Array<{ id: string; label: string }> };
  initialData?: {
    title: string;
    description?: string;
    model: string;
    instructions?: string;
    files?: string[];
  };
  mode?: "create" | "edit";
  focusField?: string | null;
  onCancel: () => void;
}

export const ProjectForm = ({
  onSubmit,
  isLoading,
  modelsData,
  initialData,
  mode = "create",
  focusField,
  onCancel,
}: ProjectFormProps) => {
  const { data: session } = useSession();
  const token = getToken(session);
  const [formData, setFormData] = useState<CreateProjectData>({
    title: initialData?.title || "",
    description: initialData?.description || "",
    model: initialData?.model || "",
    instructions: initialData?.instructions || "",
  });

  const [newFiles, setNewFiles] = useState<File[]>([]);
  const [existingFiles, setExistingFiles] = useState<string[]>(initialData?.files || []);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const formRef = useRef<HTMLFormElement>(null);

  const MAX_FILE_SIZE = 500 * 1024; // 500KB in bytes
  const MAX_FILES = 5;

  const [progress, setProgress] = useState(0);

  // Add effect to focus the specified field
  useEffect(() => {
    if (focusField && formRef.current) {
      const element = formRef.current.querySelector(`[name="${focusField}"]`) as HTMLElement;
      if (element) {
        element.focus();
      }
    }
  }, [focusField]);

  // Add effect to handle progress animation when loading
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isLoading) {
      setProgress(0);

      // Calculate total size in KB
      const totalKB = newFiles.reduce((sum, file) => sum + file.size / 1024, 0);

      // Base calculations:
      // - 500KB takes ~20 seconds
      // - 2.5MB (2500KB) takes ~100 seconds
      // Scale interval based on total size
      const baseInterval = 1000;
      const intervalTime = Math.max(500, Math.min(2000, (totalKB / 500) * 1000));

      interval = setInterval(() => {
        setProgress((prev) => {
          // Adjust increment to account for longer upload times with larger total size
          // For 2.5MB (2500KB), we want ~100 updates of ~1% each
          // For 500KB, we want ~20 updates of ~5% each
          const increment = Math.max(0.2, Math.floor((100 - prev) / (totalKB / 25)));
          // Round to 1 decimal place
          const next = Math.min(95, Number((prev + increment).toFixed(1)));
          return next;
        });
      }, intervalTime);
    } else {
      setProgress(0);
    }
    return () => clearInterval(interval);
  }, [isLoading, newFiles]);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files) {
      const newFiles = Array.from(event.target.files);

      if (newFiles.length > MAX_FILES) {
        toast.error(`Maximum ${MAX_FILES} files allowed`);
        return;
      }

      const oversizedFiles = newFiles.filter((file) => file.size > MAX_FILE_SIZE);

      if (oversizedFiles.length > 0) {
        toast.error(`Files must be under 500KB. Skipping: ${oversizedFiles.map((f) => f.name).join(", ")}`);
        const validFiles = newFiles.filter((file) => file.size <= MAX_FILE_SIZE);
        setNewFiles(validFiles);
      } else {
        setNewFiles(newFiles);
      }
    }
  };

  const handleRemoveFile = (fileToRemove: File | string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (typeof fileToRemove === "string") {
      setExistingFiles((prevFiles) => prevFiles.filter((file) => file !== fileToRemove));
    } else {
      setNewFiles((prevFiles) => prevFiles.filter((file) => file !== fileToRemove));
    }
  };

  const handleUploadClick = (e: React.MouseEvent) => {
    e.preventDefault();
    fileInputRef.current?.click();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.model) {
      toast.error("Please select an AI model to continue.");
      return;
    }

    const submitFormData = new FormData();

    if (mode === "create") {
      // For create mode, just send the basic form data and files
      submitFormData.append("title", formData.title);
      submitFormData.append("description", formData.description || "");
      submitFormData.append("model", formData.model);
      submitFormData.append("instructions", formData.instructions || "");

      // Add new files
      newFiles.forEach((file) => {
        submitFormData.append("files", file);
      });
    } else {
      // For edit mode, include all fields directly in FormData
      submitFormData.append("title", formData.title);
      submitFormData.append("description", formData.description || "");
      submitFormData.append("model", formData.model);
      submitFormData.append("instructions", formData.instructions || "");
      submitFormData.append("files", existingFiles.join(","));

      // Add new files
      newFiles.forEach((file) => {
        submitFormData.append("new_files", file);
      });
    }

    await onSubmit(submitFormData);
  };

  return (
    <>
      <form id="create-project-form" className="space-y-6" onSubmit={handleSubmit} ref={formRef}>
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
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                role="combobox"
                className={cn("w-full justify-between mt-2", !formData.model && "text-muted-foreground")}
              >
                {formData.model
                  ? modelsData?.data.find((model) => model.id === formData.model)?.label
                  : "Select a model"}
                <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-full p-0">
              <Command>
                <CommandInput placeholder="Search models..." className="h-9" />
                <CommandList>
                  <CommandEmpty>No models found.</CommandEmpty>
                  <CommandGroup>
                    {modelsData?.data.map((model) => (
                      <CommandItem
                        key={model.id}
                        value={model.label}
                        onSelect={() => {
                          setFormData({ ...formData, model: model.id });
                        }}
                      >
                        {model.label}
                        <Check
                          className={cn("ml-auto h-4 w-4", model.id === formData.model ? "opacity-100" : "opacity-0")}
                        />
                      </CommandItem>
                    ))}
                  </CommandGroup>
                </CommandList>
              </Command>
            </PopoverContent>
          </Popover>
        </div>

        <div>
          <Label htmlFor="instructions">Custom Instructions (optional)</Label>
          <p className="text-sm text-muted-foreground mt-1">
            Give instructions to the AI that affects every thread in this space.
          </p>
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
          <p className="text-sm text-muted-foreground mt-1">
            Upload up to {MAX_FILES} files (max 500KB each) to provide context for the AI.
          </p>
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
          {(existingFiles.length > 0 || newFiles.length > 0) && (
            <ul className="mt-2 space-y-1">
              {existingFiles.map((file) => (
                <li key={file} className="flex items-center justify-between text-sm">
                  <span>{file.split("/").pop()?.slice(16)}</span>
                  <Button variant="ghost" size="sm" type="button" onClick={(e) => handleRemoveFile(file, e)}>
                    <X className="size-4" />
                    <span className="sr-only">Remove</span>
                  </Button>
                </li>
              ))}
              {newFiles.map((file, index) => (
                <li key={`new-${index}`} className="flex items-center justify-between text-sm">
                  <span>{file.name}</span>
                  <Button variant="ghost" size="sm" type="button" onClick={(e) => handleRemoveFile(file, e)}>
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
        <Button variant="secondary" onClick={onCancel}>
          Cancel
        </Button>
        <Button
          type="submit"
          form="create-project-form"
          disabled={isLoading}
          className={isLoading ? "opacity-50 cursor-not-allowed" : ""}
        >
          {isLoading
            ? `${mode === "create" ? "Creating" : "Saving"}... ${progress}%`
            : mode === "create"
              ? "Continue"
              : "Save Changes"}
        </Button>
      </DialogFooter>
    </>
  );
};
