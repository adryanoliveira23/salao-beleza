import type { Metadata, Viewport } from "next";
import {
  Outfit,
  Playfair_Display,
  Montserrat,
  Great_Vibes,
  Cormorant_Garamond,
} from "next/font/google";
import "./globals.css";
import { SalonDataProvider } from "@/contexts/SalonDataContext";
import { FinanceProvider } from "@/contexts/FinanceContext";
import { SuppressHydrationWarning } from "./suppress-hydration-warning";

const fontOutfit = Outfit({
  variable: "--font-outfit",
  subsets: ["latin"],
});

const fontPlayfair = Playfair_Display({
  variable: "--font-playfair",
  subsets: ["latin"],
});

const fontMontserrat = Montserrat({
  variable: "--font-montserrat",
  subsets: ["latin"],
  weight: ["400", "700", "800", "900"],
});

const fontGreatVibes = Great_Vibes({
  variable: "--font-great-vibes",
  subsets: ["latin"],
  weight: ["400"],
});

const fontCormorant = Cormorant_Garamond({
  variable: "--font-cormorant",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: "Agendly Glow - Revolução na Gestão de Salões de Beleza",
  description: "Gerenciamento de Salão de Beleza",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR" suppressHydrationWarning>
      <body
        className={`${fontOutfit.variable} ${fontPlayfair.variable} ${fontMontserrat.variable} ${fontGreatVibes.variable} ${fontCormorant.variable} antialiased`}
        suppressHydrationWarning
      >
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                try {
                  if (typeof document !== 'undefined' && document.body) {
                    const body = document.body;
                    if (body.hasAttribute('cz-shortcut-listen')) {
                      body.removeAttribute('cz-shortcut-listen');
                    }
                  }
                } catch(e) {}
              })();
            `,
          }}
        />
        <SuppressHydrationWarning />
        <SalonDataProvider>
          <FinanceProvider>{children}</FinanceProvider>
        </SalonDataProvider>
      </body>
    </html>
  );
}
