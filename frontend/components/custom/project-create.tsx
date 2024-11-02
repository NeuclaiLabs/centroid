import * as React from "react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { Textarea } from "@/components/ui/textarea"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Upload, X } from "lucide-react"
import { useRef } from "react"
import { useState } from "react"

interface ProjectCreateDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export const ProjectCreate = ({ open, onOpenChange }: ProjectCreateDialogProps) => {
  const [files, setFiles] =  useState<File[]>([])
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files) {
      setFiles(prevFiles => [...prevFiles, ...Array.from(event.target.files as FileList)])
    }
  }

  const handleRemoveFile = (fileToRemove: File) => {
    setFiles(prevFiles => prevFiles.filter(file => file !== fileToRemove))
  }

  const handleUploadClick = (e: React.MouseEvent) => {
    e.preventDefault()
    fileInputRef.current?.click()
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle className="text-2xl">Create Project</DialogTitle>
          </div>
          <Separator className="my-4" />
        </DialogHeader>
        <form className="space-y-6" onSubmit={(e) => e.preventDefault()}>
          <div className="flex gap-4">
            <div className="flex-1">
              <Label htmlFor="title">Title</Label>
              <Input id="title" placeholder="Team Space..." className="mt-2" />
            </div>
          </div>

          <div>
            <Label htmlFor="description">Description (optional)</Label>
            <Textarea
              id="description"
              placeholder="A collaborative space for discussing latest insights..."
              className="mt-2"
            />
          </div>

          <div>
            <Label htmlFor="model">AI Model</Label>
            <Select defaultValue="default">
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
            <Label htmlFor="instructions">
              Custom Instructions (optional)
            </Label>
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
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileChange}
                className="hidden"
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
                      onClick={() => handleRemoveFile(file)}
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
          <Button>
            Continue
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
