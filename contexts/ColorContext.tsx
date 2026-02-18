"use client";

import React, { createContext, useContext, useState, useEffect } from "react";

type ColorTheme = "pink" | "purple" | "red" | "green";

interface ColorContextType {
  colorTheme: ColorTheme;
  setColorTheme: (theme: ColorTheme) => void;
}

const ColorContext = createContext<ColorContextType>({
  colorTheme: "pink",
  setColorTheme: () => {},
});

export function ColorProvider({ children }: { children: React.ReactNode }) {
  const [colorTheme, setColorTheme] = useState<ColorTheme>("pink");

  useEffect(() => {
    // Load saved theme on mount
    const savedTheme = localStorage.getItem(
      "agendly-color-theme",
    ) as ColorTheme;
    if (savedTheme) {
      setTimeout(() => {
        setColorTheme(savedTheme);
      }, 0);
      document.documentElement.setAttribute("data-color", savedTheme);
    } else {
      document.documentElement.setAttribute("data-color", "pink");
    }
  }, []);

  const setTheme = (theme: ColorTheme) => {
    setColorTheme(theme);
    localStorage.setItem("agendly-color-theme", theme);
    document.documentElement.setAttribute("data-color", theme);
  };

  return (
    <ColorContext.Provider value={{ colorTheme, setColorTheme: setTheme }}>
      {children}
    </ColorContext.Provider>
  );
}

export const useColor = () => useContext(ColorContext);
