import { z } from 'zod'

export type ToolDefinition = {
  description: string
  parameters: z.ZodType<any>
}

export type ToolRenderer = {
  render: (params: z.ZodType<any>) => any
}

export type ToolUIComponent<T = any> = {
  component: React.ComponentType<T>
}

export type Tool = ToolDefinition & ToolUIComponent & ToolRenderer
