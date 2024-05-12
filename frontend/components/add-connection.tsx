'use client'

import { useForm } from 'react-hook-form'
import * as z from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select'
import { type Connection } from '@/lib/types'
import { saveConnection } from '@/app/actions'

const connectionDataSchema = z.object({
  url: z.string().url('URL must be a valid URL'),
  key: z.string().min(1, 'API Key is required')
})

const connectionFormSchema = z.object({
  name: z.string().min(2, {
    message: 'Name must be at least 1 characters.'
  }),
  type: z.enum(['openai', 'ollama', 'groq'], {
    errorMap: issue => {
      switch (issue.code) {
        case 'invalid_enum_value':
          return {
            message: 'Type must be one of "openai", "ollama", or "groq"'
          }
        default:
          return { message: issue.message || 'An error occurred' }
      }
    }
  }),
  data: connectionDataSchema
})
export function AddConnectionForm({
  onConnectionAdded
}: {
  onConnectionAdded: () => void
}) {
  async function onSubmit(data: z.infer<typeof connectionFormSchema>) {
    // Create a new connection
    await saveConnection(data as Connection)
    onConnectionAdded()

    toast('Connection added successfully.')
  }

  const form = useForm<z.infer<typeof connectionFormSchema>>({
    resolver: zodResolver(connectionFormSchema),
    defaultValues: {
      name: 'test',
      type: 'ollama',
      data: {
        url: 'http://localhost:11434',
        apiKey: 'default'
      }
    }
  })

  return (
    <Form {...form}>
      <form className="space-y-8" onSubmit={form.handleSubmit(onSubmit)}>
        <div className="space-y-4 ">
          <div className="flex-row">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem className="pb-6">
                  <FormLabel>Name</FormLabel>
                  <FormControl>
                    <Input placeholder="Name" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="type"
              render={({ field }) => (
                <FormItem className="pb-6">
                  <FormLabel>Provider</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select provider" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="openai">OpenAI</SelectItem>
                      <SelectItem value="groq">Groq</SelectItem>
                      <SelectItem value="anthropic">Anthropic</SelectItem>
                      <SelectItem value="ollama">Ollama</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="data.url"
              render={({ field }) => (
                <FormItem className="pb-6">
                  <FormLabel>API Endpoint</FormLabel>
                  <FormControl>
                    <Input placeholder="https://api.example.com" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name={`data.key`}
              render={({ field }) => (
                <FormItem>
                  <FormLabel>API Key</FormLabel>
                  <FormControl>
                    <Input placeholder="Your API key" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        </div>
        <div>
          <Button type="submit">Save Configuration</Button>
        </div>
      </form>
    </Form>
  )
}
