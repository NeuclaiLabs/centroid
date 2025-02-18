import { Chat } from "@/components/custom/chat";
import { generateUUID } from "@/lib/utils";
import { connection } from "next/server";

export default async function Page() {
  await connection();
  const id = generateUUID();
  return (
    <div className="flex flex-col gap-4 p-4 h-full">
      <Chat key={id} project={undefined} id={id} initialMessages={[]} />
    </div>
  );
}
