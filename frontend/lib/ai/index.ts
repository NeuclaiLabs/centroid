import { createOpenAI } from "@ai-sdk/openai";
import { experimental_wrapLanguageModel as wrapLanguageModel } from "ai";

import { customMiddleware } from "./custom-middleware";

const openai_compatible = createOpenAI({
  baseURL: process.env.LLM_BASE_URL,
  apiKey: process.env.LLM_API_KEY,
});

export const customModel = (apiIdentifier: string) => {
  return wrapLanguageModel({
    model: openai_compatible(apiIdentifier),
    middleware: customMiddleware,
  });
};
