import { ModeToggle } from '@/components/mode-toggle'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle
} from '@/components/ui/card'
import { IconMoreHorizontal } from '@/components/ui/icons'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '@/components/ui/table'

import { Label } from '@radix-ui/react-label'
import { Separator } from '@radix-ui/react-separator'

export function Settings() {
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
    </>
  )
}
