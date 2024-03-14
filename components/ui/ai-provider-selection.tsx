import { Settings } from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

export function AIProviderSelection() {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline" className="border-none">
          <Settings className="size-4" />
        </Button>
      </DialogTrigger>
      <DialogContent className="overflow-y-auto sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Configure Provider</DialogTitle>
          <DialogDescription>
            Pick your provider and provide related details. Click save when you
            are done.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4 ">
          <div className="grid grid-cols-4 items-center gap-4 ">
            <Label htmlFor="name" className="text-right">
              Provider
            </Label>
            <Select>
              <SelectTrigger className="col-span-3 ">
                <SelectValue placeholder="Select Provider" />
              </SelectTrigger>
              <SelectContent>
                <SelectGroup>
                  <SelectLabel>Providers</SelectLabel>
                  <SelectItem value="openai">OpenAI</SelectItem>
                  <SelectItem value="anthropic">Anthropic</SelectItem>
                  <SelectItem value="grok">Grok</SelectItem>
                  <SelectItem value="ollama">Ollama</SelectItem>
                </SelectGroup>
              </SelectContent>
            </Select>
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="endpoint" className="text-right">
              Endpoint
            </Label>
            <Input
              id="endpoint"
              defaultValue="https://api.openai.com/v1"
              className="col-span-3"
            />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="username" className="text-right">
              API Key
            </Label>
            <Input
              id="api-key"
              defaultValue=""
              className="col-span-3"
              type="password"
            />
          </div>
        </div>
        <DialogFooter>
          <Button type="submit">Save changes</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
