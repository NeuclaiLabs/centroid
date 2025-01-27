"use client";

import { Message } from "ai";
import cx from "classnames";
import { motion } from "framer-motion";

import { Vote } from "@/lib/types";

import { OpenAstraIcon } from "./icons";
import { Markdown } from "./markdown";
import { MessageActions } from "./message-actions";
import { PreviewAttachment } from "./preview-attachment";
import { Weather } from "./weather";
import { ApiResponseViewer } from "./api-response-viewer";
import { APISearchViewer } from "./api-search-viewer";

export const PreviewMessage = ({
  message,
  chatId,
  vote,
  isLoading,
}: {
  message: Message;
  chatId: string;
  vote: Vote | undefined;
  isLoading: boolean;
}) => {
  let canvas = undefined;
  let role = message.role;
  let content = message.content;
  let toolInvocations = message.toolInvocations;
  let attachments = message.experimental_attachments;

  return (
    <motion.div
      className="w-full mx-auto max-w-3xl px-4 group/message "
      initial={{ y: 5, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      data-role={role}
    >
      <div
        className={cx(
          "flex gap-4 group-data-[role=user]/message:px-3 w-full group-data-[role=user]/message:w-fit group-data-[role=user]/message:ml-auto group-data-[role=user]/message:max-w-xl group-data-[role=user]/message:py-2 rounded-xl",
          {
            "group-data-[role=user]/message:bg-muted": !canvas,
            "group-data-[role=user]/message:bg-zinc-300 dark:group-data-[role=user]/message:bg-zinc-800": canvas,
          }
        )}
      >
        {role === "assistant" && (
          <div className="flex aspect-square size-6 items-center justify-center rounded-lg border border-gray-200 dark:border-gray-700">
            <OpenAstraIcon size={18} />
          </div>
        )}
        <div className="flex flex-col gap-2 w-full overflow-hidden">
          {content && (
            <div className="flex flex-col gap-4 overflow-hidden">
              <Markdown>{content as string}</Markdown>
            </div>
          )}

          {toolInvocations && toolInvocations.length > 0 && (
            <div className="flex flex-col gap-4">
              {toolInvocations.map((toolInvocation) => {
                const { toolName, toolCallId, state, args } = toolInvocation;

                if (state === "result") {
                  const { result } = toolInvocation;

                  return (
                    <div key={toolCallId}>
                      {toolName === "getWeather" ? (
                        <Weather weatherAtLocation={result} />
                      ) : toolName === "searchAPICollections" ? (
                        <APISearchViewer result={result} />
                      ) : (
                        <ApiResponseViewer response={result.response} meta={result.meta} loading={false} />
                      )}
                    </div>
                  );
                } else {
                  return (
                    <div
                      key={toolCallId}
                      className={cx({
                        skeleton: ["getWeather"].includes(toolName),
                      })}
                    >
                      {toolName === "getWeather" ? (
                        <Weather />
                      ) : toolName === "searchAPICollections" ? (
                        <APISearchViewer loading={true} />
                      ) : (
                        <ApiResponseViewer response={undefined} meta={undefined} loading={true} />
                      )}
                    </div>
                  );
                }
              })}
            </div>
          )}

          {attachments && (
            <div className="flex flex-row gap-2">
              {attachments.map((attachment) => (
                <PreviewAttachment key={attachment.url} attachment={attachment} />
              ))}
            </div>
          )}

          <MessageActions
            key={`action-${message.id}`}
            chatId={chatId}
            message={message}
            vote={vote}
            isLoading={isLoading}
          />
        </div>
      </div>
    </motion.div>
  );
};

export const ThinkingMessage = () => {
  const role = "assistant";
  return (
    <motion.div
      className="w-full mx-auto max-w-3xl px-4 group/message "
      initial={{ y: 5, opacity: 0 }}
      animate={{ y: 0, opacity: 1, transition: { delay: 1 } }}
      data-role={role}
    >
      <div
        className={cx(
          "flex gap-4 group-data-[role=user]/message:px-3 w-full group-data-[role=user]/message:w-fit group-data-[role=user]/message:ml-auto group-data-[role=user]/message:max-w-2xl group-data-[role=user]/message:py-2 rounded-xl",
          {
            "group-data-[role=user]/message:bg-muted": true,
          }
        )}
      >
        <div className="flex aspect-square size-6 items-center justify-center rounded-lg border border-gray-200 dark:border-gray-700">
          <OpenAstraIcon size={18} />
        </div>
        <div className="flex flex-col gap-2 w-full">
          <div className="flex flex-col gap-4 text-muted-foreground">Thinking...</div>
        </div>
      </div>
    </motion.div>
  );
};
