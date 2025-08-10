"use client";

import { ReactNode, useState } from "react";
import { ChevronDownIcon } from "lucide-react";
import {
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandDialog,
  CommandEmpty,
  CommandList,
} from "@/components/ui/command";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
interface Props {
  options: Array<{ id: string; value: string; children: ReactNode }>;
  onSelect: (value: string) => void;
  onSearch?: (value: string) => void;
  value: string;
  placeholder?: string;
  isSearchable?: boolean;
  className?: string;
  isLoading?: boolean;
  emptyMessage?: string;
}
export const CommandSelect = ({
  options,
  onSelect,
  onSearch,
  value,
  placeholder,
  className,
  isLoading = false,
  emptyMessage = "No options found",
}: Props) => {
  const [open, setOpen] = useState(false);
  const selectedOption = options.find((option) => option.value === value);
  return (
    <>
      <Button
        onClick={() => setOpen(true)}
        type="button"
        variant="outline"
        className={cn(
          "w-full justify-between min-w-0",
          !selectedOption && "text-muted-foreground",
          className
        )}
      >
        <div className="flex-1 min-w-0 text-left">
          <div className="truncate">
            {selectedOption ? selectedOption.children : placeholder}
          </div>
        </div>
        <ChevronDownIcon className="h-4 w-4 shrink-0 ml-2" />
      </Button>
      <CommandDialog
        shouldFilter={!onSearch}
        open={open}
        onOpenChange={setOpen}
      >
        <CommandInput placeholder={placeholder} onValueChange={onSearch} />
        <CommandList>
          <CommandEmpty>{isLoading ? "Loading..." : emptyMessage}</CommandEmpty>
          <CommandGroup>
            {options.map((option) => (
              <CommandItem
                key={option.id}
                onSelect={() => {
                  onSelect(option.value);
                  setOpen(false);
                }}
              >
                {option.children}
              </CommandItem>
            ))}
          </CommandGroup>
        </CommandList>
      </CommandDialog>
    </>
  );
};
