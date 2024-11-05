"use client";

import { MoreHorizontal, PenLine, Plus, Timer, Upload, Bot, Sparkles } from "lucide-react";
import * as React from "react";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";

interface ProjectProps {
  title: string;
  description?: string;
  model?: string;
  instructions?: string;
  files?: Array<{
    name: string;
  }>;
  threads?: Array<{
    id: string;
    content: string;
    response: string;
    timestamp: string;
    status: string;
  }>;
}

export function Project({
  title = "Test",
  description,
  model = "Default",
  instructions,
  files = [],
  threads = [
    {
      id: "1",
      content: "hi",
      response: "Hello! How can I assist you today?",
      timestamp: "15 minutes ago",
      status: "Writing",
    },
  ],
}: ProjectProps) {
  return (
    <div className="flex min-h-screen flex-col lg:flex-row p-6">
      {/* Main Content */}
      <div className="flex-1 p-6 border-r overflow-y-auto">
        <h1 className="text-3xl font-semibold mb-8">{title}</h1>

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
                  <Switch />
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

          {threads.map((thread) => (
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
            <h2 className="font-semibold">Title</h2>
            <p className="text-sm text-muted-foreground">{title}</p>
          </div>

          <Separator />

          {/* Description Section */}
          {description && (
            <>
              <div className="space-y-2">
                <h2 className="font-semibold">Description</h2>
                <p className="text-sm text-muted-foreground">{description}</p>
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
            <p className="text-sm text-muted-foreground">{model || "Default"}</p>
          </div>

          <Separator />

          {/* Instructions Section */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <PenLine className="size-4" />
                <h2 className="font-semibold">Instructions</h2>
              </div>
              <Button variant="ghost" size="sm">
                Edit
              </Button>
            </div>
            <p className="text-sm text-muted-foreground">{instructions || "No custom instructions added."}</p>
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
            {files && files.length > 0 ? (
              <ul className="space-y-2">
                {files.map((file, index) => (
                  <li key={index} className="text-sm flex items-center justify-between">
                    <span>{file.name}</span>
                    <Button variant="ghost" size="icon">
                      <MoreHorizontal className="size-4" />
                    </Button>
                  </li>
                ))}
              </ul>
            ) : (
              <div className="space-y-4">
                <p className="text-sm text-muted-foreground">0 of 5 free files uploaded</p>
                <Button variant="secondary" className="w-full">
                  Upgrade to Pro
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
