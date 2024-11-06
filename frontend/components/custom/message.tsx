"use client";

import { Message } from "ai";
import cx from "classnames";
import { motion } from "framer-motion";
import { Sparkles } from "lucide-react";
import { Dispatch, ReactNode, SetStateAction } from "react";

import { Markdown } from "./markdown";
import { PreviewAttachment } from "./preview-attachment";
import { Weather } from "./weather";
import { OpenAstraIcon } from "./icons";
import { MessageActions } from "./message-actions";
import { Vote } from "@/lib/types";

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
          "flex gap-4 group-data-[role=user]/message:px-3 w-full group-data-[role=user]/message:w-fit group-data-[role=user]/message:ml-auto group-data-[role=user]/message:max-w-2xl group-data-[role=user]/message:py-2 rounded-xl",
          {
            "group-data-[role=user]/message:bg-muted": !canvas,
            "group-data-[role=user]/message:bg-zinc-300 dark:group-data-[role=user]/message:bg-zinc-800": canvas,
          }
        )}
      >
        {role === "assistant" && (
          <div className="flex aspect-square size-8 items-center justify-center rounded-lg border border-gray-200 dark:border-gray-700">
            <OpenAstraIcon size={24} />
          </div>
        )}
        <div className="flex flex-col gap-2 w-full">
          {content && (
            <div className="flex flex-col gap-4">
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
                      ) : (
                        <pre>{JSON.stringify(result, null, 2)}</pre>
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
                      {toolName === "getWeather" ? <Weather /> : null}
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
