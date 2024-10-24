import { Attachment, ToolInvocation } from "ai";
import { motion } from "framer-motion";
import { ReactNode } from "react";

import { OpenAstraIcon, UserIcon } from "./icons";
import { Markdown } from "./markdown";
import { PreviewAttachment } from "./preview-attachment";
import { Weather } from "./weather";

export const Message = ({
  role,
  content,
  toolInvocations,
  attachments,
}: {
  role: string;
  content: string | ReactNode;
  toolInvocations: Array<ToolInvocation> | undefined;
  attachments?: Array<Attachment>;
}) => {
  return (
    <motion.div
      className={`flex ${
        role === "assistant" ? "flex-row" : "flex-row-reverse"
      } gap-4 px-4 w-full`}
      initial={{ y: 5, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
    >
      {role === "assistant" && (
        <div className="w-[24px] flex-shrink-0 flex flex-col justify-start items-center">
          <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
            <OpenAstraIcon size={24} />
          </div>
        </div>
      )}

      <div
        className={`flex flex-col ${
          role === "assistant"
            ? "flex-grow rounded-lg pb-3"
            : "ml-auto max-w-[75%] bg-secondary m-4 rounded-full p-4"
        }`}
      >
        {content && (
          <div className="flex flex-col gap-4">
            <Markdown>{content as string}</Markdown>
          </div>
        )}

        {toolInvocations && (
          <div className="flex flex-col gap-4">
            {toolInvocations.map((toolInvocation) => {
              const { toolName, toolCallId, state } = toolInvocation;

              if (state === "result") {
                const { result } = toolInvocation;

                return (
                  <div key={toolCallId}>
                    {toolName === "getWeather" ? (
                      <Weather weatherAtLocation={result} />
                    ) : toolName === "calculator" ? (
                      <div>Calculator Result: {result}</div>
                    ) : null}
                  </div>
                );
              } else {
                return (
                  <div key={toolCallId} className="skeleton">
                    {toolName === "getWeather" ? <Weather /> : null}
                  </div>
                );
              }
            })}
          </div>
        )}

        {attachments && (
          <div className="flex flex-row gap-2 flex-wrap">
            {attachments.map((attachment) => (
              <PreviewAttachment key={attachment.url} attachment={attachment} />
            ))}
          </div>
        )}
      </div>
    </motion.div>
  );
};
