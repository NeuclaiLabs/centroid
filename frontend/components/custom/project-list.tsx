import { Search } from "lucide-react"

import { Input } from "@/components/ui/input"

interface Message {
  id: string
  sender: string
  subject: string
  preview: string
  tags: string[]
  timestamp: string
}

const messages: Message[] = [
  {
    id: "1",
    sender: "William Smith",
    subject: "Meeting Tomorrow",
    preview: "Hi, let's have a meeting tomorrow to discuss the project. I've been reviewing the project details and have some ideas I'd like to share. It's crucial that we align on our next steps to ensure the project's success. Please com...",
    tags: ["meeting", "work", "important"],
    timestamp: "12 months ago"
  },
  {
    id: "2",
    sender: "Alice Smith",
    subject: "Re: Project Update",
    preview: "Thank you for the project update. It looks great! I've gone through the report, and the progress is impressive. The team has done a fantastic job, and I appreciate the hard work everyone has put in. I have a few minor...",
    tags: ["work", "important"],
    timestamp: "12 months ago"
  },
  {
    id: "3",
    sender: "Bob Johnson",
    subject: "Weekend Plans",
    preview: "Any plans for the weekend? I was thinking of going hiking in the nearby mountains. It's been a while since we had some outdoor fun. If you're interested, let me know, and we can plan the details. It'll be a great way to...",
    tags: ["personal"],
    timestamp: "over 1 year ago"
  },
  {
    id: "4",
    sender: "Emily Davis",
    subject: "Re: Question about Budget",
    preview: "I have a question about the budget for the upcoming project. It seems like there's a discrepancy in the allocation of resources. I've reviewed the budget report and identified a few areas where we might be able t...",
    tags: ["work", "budget"],
    timestamp: "over 1 year ago"
  }
]

export default function Component() {
  return (
    <div className="w-full max-w-3xl mx-auto p-4 space-y-4">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-zinc-500" />
        <Input className="pl-10" placeholder="Search" type="search" />
      </div>
      <div className="space-y-4">
        {messages.map((message) => (
          <div key={message.id} className="bg-white dark:bg-zinc-800 rounded-lg shadow p-4 space-y-2">
            <div className="flex justify-between items-start">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-zinc-300">{message.sender}</h3>
              <span className="text-sm text-gray-500 dark:text-zinc-400">{message.timestamp}</span>
            </div>
            <h4 className="font-medium text-gray-800 dark:text-zinc-200">{message.subject}</h4>
            <p className="text-gray-600 dark:text-zinc-300 text-sm">{message.preview}</p>
          </div>
        ))}
      </div>
    </div>
  )
}
