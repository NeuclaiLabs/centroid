'use client'

import { useFieldArray } from 'react-hook-form'

import { useApiConfig } from '@/lib/hooks/use-api-config'
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

export function AddProviderForm() {
  const { form, onSubmit } = useApiConfig()

  const { fields, append, remove } = useFieldArray({
    name: 'providers',
    control: form.control
  })

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
        {fields.map((field, index) => (
          <div key={field.id} className="space-y-4 ">
            <div className="flex-row">
              <FormField
                control={form.control}
                name={`providers.${index}.provider`}
                render={({ field }) => (
                  <FormItem className="pb-6">
                    <FormLabel>Provider</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a provider" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="OpenAI">OpenAI</SelectItem>
                        <SelectItem value="Groq">Groq</SelectItem>
                        <SelectItem value="Anthropic">Anthropic</SelectItem>
                        <SelectItem value="Ollama">Ollama</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name={`providers.${index}.name`}
                render={({ field }) => (
                  <FormItem className="pb-6">
                    <FormLabel>Name</FormLabel>
                    <FormControl>
                      <Input placeholder="My Key" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name={`providers.${index}.url`}
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
                name={`providers.${index}.apiKey`}
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
        ))}
        <div>
          <Button type="submit">Save Configuration</Button>
        </div>
      </form>
    </Form>
  )
}
