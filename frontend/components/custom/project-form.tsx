"use client";

import { Upload, X } from "lucide-react";
import { useSession } from "next-auth/react";
import * as React from "react";
import { useState, useRef, useEffect } from "react";
import { toast } from "sonner";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import useSWR from "swr";
import { fetcher, getToken } from "@/lib/utils";

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
}

export const ProjectForm = ({
  onSubmit,
  isLoading,
  modelsData,
  initialData,
  mode = "create",
  focusField,
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

  // Fetch available models
  const { data: modelsDataFromServer } = useSWR(
    session?.user ? [`${process.env.NEXT_PUBLIC_API_URL}/api/v1/llm/models`, token] : null,
    ([url, token]) => fetcher(url, token)
  );

  const MAX_FILE_SIZE = 500 * 1024; // 500KB in bytes
  const MAX_FILES = 5;

  // Add effect to focus the specified field
  useEffect(() => {
    if (focusField && formRef.current) {
      const element = formRef.current.querySelector(`[name="${focusField}"]`) as HTMLElement;
      if (element) {
        element.focus();
      }
    }
  }, [focusField]);

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

      // Add existing files as a JSON string
      // existingFiles.forEach((file) => {
      //   submitFormData.append("files", file);
      // });

      // Add new files
      // newFiles.forEach((file) => {
      //   submitFormData.append("new_files", file);
      // });
    }

    console.log("Form data:", Object.fromEntries(submitFormData.entries()));
    await onSubmit(submitFormData);
  };

  return (
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
        <Select value={formData.model} onValueChange={(value) => setFormData({ ...formData, model: value })}>
          <SelectTrigger className="mt-2">
            <SelectValue placeholder="Select a model" />
          </SelectTrigger>
          <SelectContent>
            {modelsData?.data.map((model) => (
              <SelectItem key={model.id} value={model.id}>
                {model.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
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
  );
};
