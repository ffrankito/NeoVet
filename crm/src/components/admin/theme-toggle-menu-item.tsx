"use client";

import { DropdownMenuItem } from "@/components/ui/dropdown-menu";
import { useThemeToggle } from "@/lib/use-theme-toggle";

export function ThemeToggleMenuItem() {
  const { toggle, Icon, label } = useThemeToggle();

  return (
    <DropdownMenuItem
      closeOnClick={false}
      onClick={toggle}
      aria-label={label}
      className="cursor-pointer"
    >
      <Icon className="mr-2 h-4 w-4" aria-hidden="true" />
      <span>{label}</span>
    </DropdownMenuItem>
  );
}
