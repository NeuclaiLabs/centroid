import { Attachment, Message } from "ai";
import { MultimodalInput } from "@/components/custom/multimodal-input";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

interface ChatHomeProps {
  input: string;
  setInput: any;
  handleSubmit: any;
  isLoading: boolean;
  stop: any;
  attachments: Array<Attachment>;
  setAttachments: any;
  messages: Array<Message>;
  append: any;
}

export function ChatHome({
  input,
  setInput,
  handleSubmit,
  isLoading,
  stop,
  attachments,
  setAttachments,
  messages,
  append,
}: ChatHomeProps) {

  const suggestions = [
    "Generate a multi-step onboarding flow",
    "How can I schedule cron jobs?",
    "Write code to implement a min heap",
  ];

  return (
    <div className="flex-1 flex items-center justify-center p-4">
      <Card className="w-full max-w-3xl mx-auto p-4 md:p-8 space-y-6 md:space-y-8 bg-background border-none shadow-none">
        <h1 className="text-3xl md:text-5xl font-bold text-center break-words">What can I help you with?</h1>
        <form className="flex flex-col items-center w-full space-y-4" onSubmit={handleSubmit}>
          <div className="w-full">
            <MultimodalInput
              input={input}
              setInput={setInput}
              handleSubmit={handleSubmit}
              isLoading={isLoading}
              stop={stop}
              attachments={attachments}
              setAttachments={setAttachments}
              messages={messages}
              append={append}
            />
          </div>

          <div className="flex flex-wrap justify-center gap-2 pb-20 md:pb-40">
            {suggestions.map((suggestion, index) => (
              <Button
                key={index}
                variant="outline"
                size="sm"
                className="text-xs px-2 py-1 h-auto"
                onClick={() => setInput(suggestion)}
              >
                {suggestion}
              </Button>
            ))}
          </div>
        </form>
      </Card>
    </div>
  );
}
