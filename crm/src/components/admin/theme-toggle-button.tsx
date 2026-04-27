"use client";

import { Button } from "@/components/ui/button";
import { useThemeToggle } from "@/lib/use-theme-toggle";

export function ThemeToggleButton() {
  const { toggle, Icon, label } = useThemeToggle();

  return (
    <Button
      type="button"
      variant="ghost"
      size="sm"
      onClick={toggle}
      aria-label={label}
      className="w-full justify-start"
    >
      <Icon className="mr-2 h-4 w-4" aria-hidden="true" />
      <span>{label}</span>
    </Button>
  );
}
