import { Connection } from '@/lib/types'
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogCancel,
  AlertDialogAction
} from '@radix-ui/react-alert-dialog'
import { Label } from '@radix-ui/react-label'
import { Separator } from '@radix-ui/react-separator'
import { TabsContent } from '@radix-ui/react-tabs'
import { AddConnectionForm } from './add-connection'
import { ModeToggle } from './mode-toggle'
import { AlertDialogHeader, AlertDialogFooter } from './ui/alert-dialog'
import { Badge } from './ui/badge'
import { Button } from './ui/button'
import { Card, CardContent, CardFooter } from './ui/card'
import { IconTrash, IconSpinner, IconPlus } from './ui/icons'
import {
  Sheet,
  SheetTrigger,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetFooter,
  SheetClose
} from './ui/sheet'
import {
  Table,
  TableHeader,
  TableRow,
  TableHead,
  TableBody,
  TableCell
} from './ui/table'
import { useSettings } from '@/lib/hooks/use-settings'
import { useState } from 'react'
import React from 'react'
import { toast } from 'sonner'
import Link from 'next/link'

export function AccountSettings() {
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
    <>
      <div className="flex text-bold text-xl mt-10 mb-4">General</div>
      <Separator className="mb-4" />


      <Card>
        <CardContent className="grid gap-6 mt-6">
          <div className="flex items-center justify-between space-x-2">
            <Label htmlFor="necessary" className="flex flex-col space-y-1">
              <span className="text-bold text-lg">Appearance</span>
              <span className="font-normal leading-snug text-muted-foreground">
                Set your preferred theme for OpenAstra.
              </span>
            </Label>
            <ModeToggle />
          </div>
        </CardContent>
      </Card>
      <div className="flex text-xl mt-6 mb-4">Providers</div>
      <Separator className="mb-4" />
      <Card>
        <CardContent className="mt-6">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Provider</TableHead>
                <TableHead>Name</TableHead>
                <TableHead className="hidden md:table-cell">Key</TableHead>
                <TableHead className="hidden md:table-cell">Created</TableHead>
                <TableHead>
                  <span className="sr-only">Actions</span>
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {settings?.data?.general?.connections &&
                settings!.data.general!.connections.map(
                  (connection: Connection) => (
                    <TableRow key={connection.id}>
                      <TableCell className="font-medium">
                        {connection.name}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">{connection.type}</Badge>
                      </TableCell>
                      <TableCell className="hidden md:table-cell">
                        {connection.data.key}
                      </TableCell>

                      <TableCell className="hidden md:table-cell">
                        {connection!.createdAt
                          ? connection!.createdAt.toISOString()
                          : 'None'}
                      </TableCell>
                      <TableCell>
                        <Button
                          aria-haspopup="true"
                          size="icon"
                          variant="ghost"
                          onClick={() => handleDelete(connection!.id)}
                        >
                          <IconTrash className="size-4" />
                          <span className="sr-only">Delete Connection</span>
                        </Button>
                      </TableCell>
                    </TableRow>
                  )
                )}
            </TableBody>
          </Table>
          <AlertDialog
            open={deleteDialogOpen}
            onOpenChange={setDeleteDialogOpen}
          >
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                <AlertDialogDescription>
                  This will delete the connection.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel disabled={isRemovePending}>
                  Cancel
                </AlertDialogCancel>
                <AlertDialogAction
                  disabled={isRemovePending}
                  onClick={confirmDelete}
                >
                  {isRemovePending && (
                    <IconSpinner className="mr-2 animate-spin" />
                  )}
                  Delete
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </CardContent>
        <CardFooter>
          <Sheet>
            <SheetTrigger asChild>
              <Button className="mt-6">
                <IconPlus className="mr-2 size-4" /> Create Key
              </Button>
            </SheetTrigger>
            <SheetContent>
              <SheetHeader>
                <SheetTitle className="pb-6">Add Connection</SheetTitle>
                <SheetDescription></SheetDescription>
              </SheetHeader>
              <AddConnectionForm
                onConnectionAdded={async (connection: Connection) => {
                  ;(settings['data']['general'].connections =
                    settings['data']['general'].connections || []).push(
                    connection
                  )
                  updateSettings('general', settings['data']['general'])
                }}
              />
              <SheetFooter>
                <SheetClose asChild></SheetClose>
              </SheetFooter>
            </SheetContent>
          </Sheet>
        </CardFooter>
      </Card>
    </>
  )
}
