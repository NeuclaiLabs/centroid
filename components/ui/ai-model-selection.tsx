"use client"

import * as React from "react"

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

export function AiModelSelection() {
  const selectedModel = "mistral:7b-instruct"

  const modelOptions = [
    { value: "openchat/openchat-7b:free", label: "OpenChat 3.5" },
    { value: "nousresearch/nous-capybara-7b:free", label: "Nous: Capybara 7B" },
    {
      value: "mistralai/mistral-7b-instruct:free",
      label: "Mistral 7B Instruct",
    },
    { value: "gryphe/mythomist-7b:free", label: "MythoMist 7B" },
  ]

  return (
    <Select value={selectedModel}>
      <SelectTrigger className="w-[180px]">
        <SelectValue placeholder="Model" />
      </SelectTrigger>
      <SelectContent>
        {modelOptions.map((option) => (
          <SelectItem key={option.value} value={option.value}>
            {option.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}
