import { Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function ThemeToggle() {
  const { theme, setTheme } = useTheme();

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={() => setTheme(theme === "light" ? "dark" : "light")}
      className={cn(
        "relative w-10 h-10 rounded-full",
        "hover:bg-muted/50 transition-all duration-300",
        "hover:scale-110 active:scale-95"
      )}
      aria-label="Toggle theme"
    >
      <Sun className={cn(
        "h-5 w-5 rotate-0 scale-100 transition-all duration-300",
        "dark:-rotate-90 dark:scale-0"
      )} />
      <Moon className={cn(
        "absolute h-5 w-5 rotate-90 scale-0 transition-all duration-300",
        "dark:rotate-0 dark:scale-100"
      )} />
    </Button>
  );
}
