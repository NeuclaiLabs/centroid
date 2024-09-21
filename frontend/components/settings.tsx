'use client'

import { cn } from '@/lib/utils'

import React, { useState } from 'react'
import { toast } from 'sonner'

import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'

import { AccountSettings } from '@/components/account-settings'
import { ToolSettings } from '@/components/tool-settings'
import { useSettings } from '@/lib/hooks/use-settings'

export function Settings({ userId }: { userId: string }) {
  const { settings, updateSettings } = useSettings()
  const [deleteDialogOpen, setDeleteDialogOpen] = useState<boolean>(false)
  const [deleteConnectionId, setDeleteConnectionId] = useState<string | null>(
    null
  )

  const [isRemovePending, startRemoveTransition] = React.useTransition()

  const handleDelete = async (id: string) => {
    setDeleteConnectionId(id)
    setDeleteDialogOpen(true)
  }

  const confirmDelete = async () => {
    startRemoveTransition(async () => {
      if (deleteConnectionId) {
        settings.data.general.connections =
          settings.data.general.connections.filter(
            (connection: { id: string }) => connection.id !== deleteConnectionId
          )
        updateSettings('general', settings['data']['general'])
        toast.success('Connection deleted')
        setDeleteDialogOpen(false)
        setDeleteConnectionId(null)
      }
    })
  }
  return (
    <div className="group w-full overflow-auto p-4 sm:px-6 sm:py-0 md:gap-8 peer-[[data-state=open]]:lg:pl-[250px] peer-[[data-state=open]]:xl:pl-[300px]">
      <div className={cn('pb-[200px] p-20 pt-4 md:pt-10')}>
        <Tabs defaultValue="account">
          <div className="flex">
            <TabsList className="flex justify-between">
              <div className="flex items-center text-xl">Settings</div>
              <div className="flex items-center">
                <TabsTrigger value="account">Account</TabsTrigger>
                <TabsTrigger value="tools">Tools</TabsTrigger>
              </div>
            </TabsList>
          </div>
          <TabsContent value="account">
            <AccountSettings />
          </TabsContent>
          <TabsContent value="tools">
            <ToolSettings />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
