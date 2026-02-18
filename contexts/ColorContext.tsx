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
    // Load saved theme
    const savedTheme = localStorage.getItem(
      "agendly-color-theme",
    ) as ColorTheme;
    if (savedTheme && savedTheme !== colorTheme) {
      setColorTheme(savedTheme);
      document.documentElement.setAttribute("data-color", savedTheme);
    } else if (!savedTheme) {
      // Ensure default is set attribute-wise if nothing in storage
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
