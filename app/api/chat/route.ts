import { OpenAIStream, StreamingTextResponse } from "ai"
import OpenAI from "openai"

// Create an OpenAI API client (that's edge friendly!)
const openai = new OpenAI({
  apiKey:
    process.env.OPENAI_API_KEY ||
    "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",
  baseURL: "https://api.groq.com/openai/v1",
})

// Set the runtime to edge for best performance
export const runtime = "edge"

export async function POST(req: Request) {
  const { messages } = await req.json()
  // Ask OpenAI for a streaming chat completion given the prompt
  const response = await openai.chat.completions.create({
    model: "mixtral-8x7b-32768",
    stream: true,
    messages,
  })
  console.log(messages, response)

  // Convert the response into a friendly text-stream
  const stream = OpenAIStream(response)
  // Respond with the stream
  return new StreamingTextResponse(stream)
}
