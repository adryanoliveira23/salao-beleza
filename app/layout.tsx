import type { Metadata, Viewport } from "next";
import { Outfit, Playfair_Display } from "next/font/google";
import "./globals.css";
import { SalonDataProvider } from "@/contexts/SalonDataContext";
import { SuppressHydrationWarning } from "./suppress-hydration-warning";

const outfit = Outfit({
  variable: "--font-outfit",
  subsets: ["latin"],
});

const playfair = Playfair_Display({
  variable: "--font-playfair",
  subsets: ["latin"],
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
        className={`${outfit.variable} ${playfair.variable} antialiased`}
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
          {children}
        </SalonDataProvider>
      </body>
    </html>
  );
}
