// import { openai } from "@ai-sdk/openai";
import { createOpenAICompatible } from "@ai-sdk/openai-compatible";
import { experimental_wrapLanguageModel as wrapLanguageModel } from "ai";

import { customMiddleware } from "./custom-middleware";

const ollama = createOpenAICompatible({
  name: "ollama",
  baseURL: "http://localhost:11434/v1/",
});

export const customModel = (apiIdentifier: string) => {
  return wrapLanguageModel({
    model: ollama("llama3.1:latest"),
    middleware: customMiddleware,
  });
};
