import React from "react";
import { useThemeContext } from "../components/ThemeProvider";
import "./css/DarkModeToggle.css"

export default function DarkModeToggle() {
  const { theme, setTheme } = useThemeContext();

  return (
    <fieldset
      style={{
        display: "flex",
        flexDirection: "column",
        gap: "0.75rem",
        border: "none",
        padding: 0,
        margin: 0,
      }}
    >
      <legend style={{ fontWeight: "bold", marginBottom: "0.75rem" }}>Theme wählen:</legend>

      <label style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
        <input
          type="radio"
          name="theme"
          value="light"
          checked={theme === "light"}
          onChange={() => setTheme("light")}
        />
        Hell
      </label>

      <label style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
        <input
          type="radio"
          name="theme"
          value="dark"
          checked={theme === "dark"}
          onChange={() => setTheme("dark")}
        />
        Dunkel
      </label>

      <label style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
        <input
          type="radio"
          name="theme"
          value="system"
          checked={theme === "system"}
          onChange={() => setTheme("system")}
        />
        System (Standard)
      </label>
    </fieldset>
  );
}
