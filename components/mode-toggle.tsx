import * as React from "react";
import {
  IconCheck,
  IconDeviceDesktop,
  IconMoon,
  IconSun,
} from "@tabler/icons-react";
import { useTheme } from "next-themes";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const themes = [
  { value: "light", label: "Light", icon: IconSun },
  { value: "dark", label: "Dark", icon: IconMoon },
  { value: "system", label: "System", icon: IconDeviceDesktop },
] as const;

export function ModeToggle() {
  const { theme, setTheme } = useTheme();

  const current =
    themes.find((t) => t.value === (theme ?? "system")) ?? themes[2];
  const CurrentIcon = current.icon;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="shrink-0">
          <CurrentIcon className="size-5" />
          <span className="sr-only">Toggle theme</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {themes.map(({ value, label, icon: Icon }) => (
          <DropdownMenuItem
            key={value}
            onClick={() => setTheme(value)}
            className="flex cursor-pointer items-center justify-between gap-6"
          >
            <span className="flex items-center gap-2">
              <Icon className="size-4" />
              {label}
            </span>
            {theme === value && <IconCheck className="size-4" />}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
