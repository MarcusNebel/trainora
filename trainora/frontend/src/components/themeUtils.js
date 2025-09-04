export function getCurrentTheme() {
  // Erst aus data-theme lesen (z.B. vom <html> oder <body>)
  const theme = document.documentElement.getAttribute("data-theme") || document.body.getAttribute("data-theme");
  if (theme && theme !== "system") return theme; // "light" oder "dark"

  // Falls "system" (oder kein data-theme): Media Query auswerten
  const isSystemDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
  return isSystemDark ? "dark" : "light";
}