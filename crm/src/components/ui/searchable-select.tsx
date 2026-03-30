"use client";

import { useState, useMemo } from "react";
import { Check, ChevronsUpDown } from "lucide-react";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";

export type SearchableOption = {
  value: string;
  label: string;
  sublabel?: string;
};

type Props = {
  options: SearchableOption[];
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  searchPlaceholder?: string;
  emptyMessage?: string;
  disabled?: boolean;
};

export function SearchableSelect({
  options,
  value,
  onChange,
  placeholder = "Seleccioná una opción",
  searchPlaceholder = "Buscar...",
  emptyMessage = "No se encontraron resultados.",
  disabled = false,
}: Props) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");

  const selected = options.find((o) => o.value === value);

  // Filtramos manualmente y mostramos máximo 50 resultados para no trabar el DOM
  const filtered = useMemo(() => {
    if (!search.trim()) return options.slice(0, 50);
    const q = search.toLowerCase();
    return options
      .filter((o) =>
        o.label.toLowerCase().includes(q) ||
        (o.sublabel?.toLowerCase().includes(q) ?? false)
      )
      .slice(0, 50);
  }, [options, search]);

  return (
    <Popover open={open} onOpenChange={(v) => { setOpen(v); if (!v) setSearch(""); }}>
      <PopoverTrigger
        disabled={disabled}
        className={cn(
          "flex h-9 w-full items-center justify-between rounded-lg border border-input bg-background px-3 py-2 text-sm shadow-xs",
          "hover:bg-accent hover:text-accent-foreground",
          "focus:outline-none focus:ring-1 focus:ring-ring",
          "disabled:pointer-events-none disabled:opacity-50",
          "[&>svg]:hidden", // oculta el ícono nativo del PopoverTrigger
          !selected && "text-muted-foreground"
        )}
      >
        <span className="truncate">
          {selected ? (
            <>
              {selected.label}
              {selected.sublabel && (
                <span className="ml-1 text-muted-foreground text-xs">
                  ({selected.sublabel})
                </span>
              )}
            </>
          ) : (
            placeholder
          )}
        </span>
        <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
      </PopoverTrigger>
      <PopoverContent className="w-[--radix-popover-trigger-width] p-0" align="start">
        <Command shouldFilter={false}>
          <CommandInput
            placeholder={searchPlaceholder}
            value={search}
            onValueChange={setSearch}
          />
          <CommandList className="max-h-60">
            {filtered.length === 0 ? (
              <CommandEmpty>{emptyMessage}</CommandEmpty>
            ) : (
              <CommandGroup>
                {filtered.map((option) => (
                  <CommandItem
                    key={option.value}
                    value={option.value}
                    onSelect={() => {
                      onChange(option.value);
                      setOpen(false);
                      setSearch("");
                    }}
                  >
                    <Check
                      className={cn(
                        "mr-2 h-4 w-4",
                        value === option.value ? "opacity-100" : "opacity-0"
                      )}
                    />
                    <span>{option.label}</span>
                    {option.sublabel && (
                      <span className="ml-1 text-muted-foreground text-xs">
                        ({option.sublabel})
                      </span>
                    )}
                  </CommandItem>
                ))}
              </CommandGroup>
            )}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}