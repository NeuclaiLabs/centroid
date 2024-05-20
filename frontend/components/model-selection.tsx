'use client'

import * as React from 'react'
import { useAvailableModels } from '@/lib/hooks/use-available-models'
import { IconCheck, IconChevronUpDown } from '@/components/ui/icons'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import {
  Command,
  CommandEmpty,
  CommandList,
  CommandGroup,
  CommandInput,
  CommandItem
} from '@/components/ui/command'
import {
  Popover,
  PopoverContent,
  PopoverTrigger
} from '@/components/ui/popover'
import { usePathname } from 'next/navigation'
import { ModelSelectionContext } from '@/lib/hooks/use-model-selection'

export function ModelSelection() {
  const { selectedModel, updateSelectedModel } = React.useContext(
    ModelSelectionContext
  )

  const availableModels = useAvailableModels()
  const [open, setOpen] = React.useState(false)
  const pathName = usePathname()

  return (
    !pathName.includes('settings') && (
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={open}
            className="w-[200px] justify-between"
          >
            <div className="w-[180px] truncate">
              {selectedModel
                ? availableModels.find(
                    model =>
                      model.id.toLowerCase() == selectedModel?.id.toLowerCase()
                  )?.name
                : 'Select model'}
            </div>
            <IconChevronUpDown className="ml-2 size-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-[200px] p-0">
          <Command>
            <CommandInput placeholder="Search models" />
            <CommandList>
              <CommandEmpty>No model found.</CommandEmpty>
              <CommandGroup>
                {availableModels.map(model => (
                  <CommandItem
                    key={model.id}
                    value={model.id}
                    onSelect={currentValue => {
                      updateSelectedModel(currentValue)
                      setOpen(false)
                    }}
                  >
                    <IconCheck
                      className={cn(
                        'mr-2 size-4',
                        selectedModel?.id === model.id.toLowerCase()
                          ? 'opacity-100'
                          : 'opacity-0'
                      )}
                    />
                    {model.name}
                  </CommandItem>
                ))}
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
    )
  )
}

// export function ModelSelection() {
//   const [selectedModel, updateSelectedModel] = useSelectedModel()
//   const availableModels = useAvailableModels()

//   return (
//     <Select
//       defaultValue={selectedModel ? selectedModel.id : ''}
//       onValueChange={updateSelectedModel}
//     >
//       <SelectTrigger className="w-[200px] font-bold text-xl">
//         <SelectValue placeholder="Select Model" />
//       </SelectTrigger>
//       <SelectContent>
//         {availableModels &&
//           availableModels.map(model => (
//             <SelectItem key={model.id} value={model.id}>
//               {model.name}
//             </SelectItem>
//           ))}
//       </SelectContent>
//     </Select>
//   )
// }
