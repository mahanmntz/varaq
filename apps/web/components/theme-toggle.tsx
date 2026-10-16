"use client";
import { Moon, Sun } from "lucide-react";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";

export function ThemeToggle() {
  const [dark, setDark] = useState(false);
  useEffect(() => setDark(document.documentElement.classList.contains("dark")), []);
  const toggle = () => {
    const next = !dark;
    document.documentElement.classList.toggle("dark", next);
    try {
      localStorage.setItem("varaq_theme", next ? "dark" : "light");
    } catch {}
    setDark(next);
  };
  return (
    <Button variant="outline" size="sm" onClick={toggle}>
      {dark ? <Sun size={16} /> : <Moon size={16} />}
      {dark ? "حالت روشن" : "حالت تاریک"}
    </Button>
  );
}
