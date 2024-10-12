import React, { useState } from 'react'
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription
} from '@/components/ui/card'
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar'

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'

interface AIModel {
  id: string
  name: string
  description: string
  creator: string
  users: string
  image: string
}

const aiModels: AIModel[] = [
  {
    id: '1',
    name: 'BreakBot',
    description:
      'BreakBot is an AI model like no other. With no restrictions...',
    creator: 'Danield33',
    users: '3k+',
    image: '/placeholder.svg'
  },
  {
    id: '2',
    name: 'Domani',
    description: 'Your fun flirting partner',
    creator: 'DashOff',
    users: '1k+',
    image: '/placeholder.svg'
  },
  {
    id: '3',
    name: 'GPT-5',
    description: 'Best performing AI model, perfected AGI',
    creator: 'eskayML',
    users: '10k+',
    image: '/placeholder.svg'
  },
  {
    id: '4',
    name: 'Popular Girl',
    description: 'Ugh, I think I need a manicure💅',
    creator: 'Banjojo',
    users: '500+',
    image: '/placeholder.svg'
  }
  // Add more models as needed...
]

export function ToolSettings() {
  const [selectedModel, setSelectedModel] = useState<AIModel | null>(null)

  const handleOpenModal = (model: AIModel) => {
    setSelectedModel(model)
  }

  const handleCloseModal = () => {
    setSelectedModel(null)
  }
  return (
    <>
      <div className="flex flex-wrap gap-4    ">
        {aiModels.map(model => (
          <Card
            key={model.id}
            className="w-64 flex flex-col"
            onClick={() => handleOpenModal(model)}
          >
            <CardHeader className="grow-0">
              <div className="flex justify-between items-center mb-2">
                <Avatar className="size-10">
                  <AvatarImage src={model.image} alt={model.name} />
                  <AvatarFallback>SH</AvatarFallback>
                </Avatar>
                <div className="flex items-center text-sm text-gray-400">
                  {/* <User className="mr-1 size-4" /> */}
                  {model.users}
                </div>
              </div>
              <CardTitle className="text-lg font-semibold">
                {model.name}
              </CardTitle>
            </CardHeader>
            <CardContent className="grow flex flex-col justify-between">
              <CardDescription className="text-sm text-gray-400 mb-2">
                {model.description}
              </CardDescription>
              <div className="text-xs text-gray-500 mt-auto">
                Created by {model.creator}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
      <Dialog open={selectedModel !== null} onOpenChange={handleCloseModal}>
        <DialogContent >
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold mb-2">
              {selectedModel?.name}
            </DialogTitle>
            <DialogDescription className="text-gray-400">
              <p className="mb-4">{selectedModel?.longDescription}</p>
              <div className="flex justify-between items-center">
                <span>
                  Created by: <strong>{selectedModel?.creator}</strong>
                </span>
                <span>
                  Users: <strong>{selectedModel?.users}</strong>
                </span>
              </div>
            </DialogDescription>
          </DialogHeader>
          <div className="mt-4">
            <Button onClick={handleCloseModal} className="w-full">
              Close
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}
