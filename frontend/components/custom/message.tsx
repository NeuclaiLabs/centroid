import { Attachment, ToolInvocation } from "ai";
import { motion } from "framer-motion";
import { ReactNode } from "react";

import { OpenAstraIcon } from "./icons";
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
      className={`flex ${role === "assistant" ? "flex-row" : "flex-row-reverse"} gap-2 md:gap-4 px-2 md:px-4 w-full`}
      initial={{ y: 5, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
    >
      {role === "assistant" && (
        <div className="shrink-0 flex flex-col justify-start items-center">
          <div className="flex aspect-square items-center justify-center rounded-lg bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
            <OpenAstraIcon size={24} />
          </div>
        </div>
      )}

      <div
        className={`flex flex-col ${
          role === "assistant"
            ? "grow rounded-lg pb-3 max-w-full md:max-w-[85%] lg:max-w-[90%]"
            : "ml-auto max-w-[85%] md:max-w-[75%] bg-secondary m-2 md:m-4 rounded-full p-3 md:p-4"
        }`}
      >
        {content && (
          <div className="flex flex-col gap-2 md:gap-4 break-words">
            <Markdown>{content as string}</Markdown>
          </div>
        )}

        {toolInvocations && (
          <div className="flex flex-col gap-2 md:gap-4">
            {toolInvocations.map((toolInvocation) => {
              const { toolName, toolCallId, state } = toolInvocation;

              if (state === "result") {
                const { result } = toolInvocation;

                return (
                  <div key={toolCallId} className="w-full overflow-x-auto">
                    {toolName === "getWeather" ? (
                      <Weather weatherAtLocation={result} />
                    ) : toolName === "calculator" ? (
                      <div className="break-words">Calculator Result: {result}</div>
                    ) : null}
                  </div>
                );
              } else {
                return (
                  <div key={toolCallId} className="skeleton w-full">
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
              <div key={attachment.url} className="max-w-full">
                <PreviewAttachment attachment={attachment} />
              </div>
            ))}
          </div>
        )}
      </div>
    </motion.div>
  );
};

export default Message;
