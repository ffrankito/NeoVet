"use client";

import { useTheme } from "next-themes";
import { Moon, Sun } from "lucide-react";
import { useEffect, useState } from "react";

export function useThemeToggle() {
  const { resolvedTheme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    // SSR-safe mounted flag for next-themes: until the client effect runs we
    // can't know the resolved theme, so we render a deterministic placeholder
    // to keep the SSR markup and the first client render in sync.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMounted(true);
  }, []);

  const isDark = mounted && resolvedTheme === "dark";
  const toggle = () => setTheme(isDark ? "light" : "dark");
  const Icon = isDark ? Sun : Moon;
  const label = isDark ? "Cambiar a modo claro" : "Cambiar a modo oscuro";

  return { isDark, toggle, Icon, label, mounted };
}
