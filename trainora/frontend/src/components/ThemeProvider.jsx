import React, { createContext, useContext } from "react";
import { useTheme } from "./useTheme";

const ThemeContext = createContext();

export function ThemeProvider({ children }) {
  const { theme, setTheme } = useTheme();
  return (
    <ThemeContext.Provider value={{ theme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useThemeContext() {
  return useContext(ThemeContext);
}
