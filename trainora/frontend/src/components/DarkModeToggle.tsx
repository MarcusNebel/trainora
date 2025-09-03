import React from "react";
import { useThemeContext } from "../components/ThemeProvider";

export default function DarkModeToggle() {
  const { theme, setTheme } = useThemeContext();

  return (
    <div style={{ display: "flex", gap: "0.5rem" }}>
      <button
        onClick={() => setTheme("light")}
        style={{ fontWeight: theme === "light" ? "bold" : "normal" }}
      >
        ☀️ Hell
      </button>
      <button
        onClick={() => setTheme("dark")}
        style={{ fontWeight: theme === "dark" ? "bold" : "normal" }}
      >
        🌙 Dunkel
      </button>
      <button
        onClick={() => setTheme("system")}
        style={{ fontWeight: theme === "system" ? "bold" : "normal" }}
      >
        💻 System
      </button>
    </div>
  );
}
