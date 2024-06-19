'use client'

import { cn } from '@/lib/utils'

import React, { useEffect, useState, cache } from 'react'
import { type Connection } from '@/lib/types'
import { Badge } from '@/components/ui/badge'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter
} from '@/components/ui/card'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuPortal,
  DropdownMenuSeparator,
  DropdownMenuShortcut,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu'
import { ModeToggle } from '@/components/mode-toggle'
import { Input } from '@/components/ui/input'
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetTrigger
} from '@/components/ui/sheet'
import { toast } from 'sonner'

import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { AddConnectionForm } from '@/components/add-connection'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  IconMoreHorizontal,
  IconSpinner,
  IconTrash,
  IconPlus
} from './ui/icons'

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle
} from '@/components/ui/alert-dialog'
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
                <TabsTrigger value="code">Code Interpreter</TabsTrigger>
              </div>
            </TabsList>
          </div>
          <TabsContent value="account">
            <div className="flex text-bold text-xl mt-10 mb-4">General</div>
            <Separator className="mb-4" />

            <Card>
              <CardContent className="grid gap-6 mt-6">
                <div className="flex items-center justify-between space-x-2">
                  <Label
                    htmlFor="necessary"
                    className="flex flex-col space-y-1"
                  >
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
                      <TableHead className="hidden md:table-cell">
                        Key
                      </TableHead>
                      <TableHead className="hidden md:table-cell">
                        Created
                      </TableHead>
                      <TableHead>
                        <span className="sr-only">Actions</span>
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {settings.data.general &&
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
                                <span className="sr-only">
                                  Delete Connection
                                </span>
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
                      <AlertDialogTitle>
                        Are you absolutely sure?
                      </AlertDialogTitle>
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
          </TabsContent>
          <TabsContent value="code">
            <Card x-chunk="A list of products in a table with actions. Each row has an image, name, status, price, total sales, created at and actions.">
              <CardHeader>
                <CardTitle>Products</CardTitle>
                <CardDescription>
                  Manage your products and view their sales performance.
                </CardDescription>
              </CardHeader>
              <CardContent className="mt-10">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="hidden w-[100px] sm:table-cell">
                        <span className="sr-only">Image</span>
                      </TableHead>
                      <TableHead>Name</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="hidden md:table-cell">
                        Price
                      </TableHead>
                      <TableHead className="hidden md:table-cell">
                        Total Sales
                      </TableHead>
                      <TableHead className="hidden md:table-cell">
                        Created at
                      </TableHead>
                      <TableHead>
                        <span className="sr-only">Actions</span>
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    <TableRow>
                      <TableCell className="hidden sm:table-cell"></TableCell>
                      <TableCell className="font-medium">
                        Laser Lemonade Machine
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">Draft</Badge>
                      </TableCell>
                      <TableCell className="hidden md:table-cell">
                        $499.99
                      </TableCell>
                      <TableCell className="hidden md:table-cell">25</TableCell>
                      <TableCell className="hidden md:table-cell">
                        2023-07-12 10:42 AM
                      </TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button
                              aria-haspopup="true"
                              size="icon"
                              variant="ghost"
                            >
                              <IconMoreHorizontal className="size-4" />
                              <span className="sr-only">Toggle menu</span>
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuLabel>Actions</DropdownMenuLabel>
                            <DropdownMenuItem>Edit</DropdownMenuItem>
                            <DropdownMenuItem>Delete</DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </CardContent>
              <CardFooter>
                <div className="text-xs text-muted-foreground">
                  Showing <strong>1-10</strong> of <strong>32</strong> products
                </div>
              </CardFooter>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
