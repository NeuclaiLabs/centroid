import { Chat } from "@/components/custom/chat";
import { generateUUID } from "@/lib/utils";

export default function Page() {
  const id = generateUUID();

  return (
    <div className="flex flex-col gap-4 p-4 h-full">
      <Chat key={id} id={id} initialMessages={[]} />
    </div>
  );
}
