import type { Metadata, Viewport } from "next";
import {
  Outfit,
  Playfair_Display,
  Montserrat,
  Great_Vibes,
  Cormorant_Garamond,
  Inter,
} from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/contexts/AuthContext";
import { SalonDataProvider } from "@/contexts/SalonDataContext";
import { FinanceProvider } from "@/contexts/FinanceContext";
import { NotificationProvider } from "@/contexts/NotificationContext";
import { ToastProvider } from "@/contexts/ToastContext";
import { SuppressHydrationWarning } from "./suppress-hydration-warning";
import { GlobalSoundProvider } from "@/components/GlobalSoundProvider";

const fontInter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

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
  title: "BellaMais — Plataforma Completa de Gestão para Salões de Beleza",
  description:
    "Sistema SaaS profissional para salões de beleza, manicures, cabeleireiras, esteticistas, designers de sobrancelhas e maquiadoras com integração ao WhatsApp.",
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
    <html lang="pt-BR" suppressHydrationWarning style={{ colorScheme: "light" }}>
      <body
        className={`${fontInter.variable} ${fontOutfit.variable} ${fontPlayfair.variable} ${fontMontserrat.variable} ${fontGreatVibes.variable} ${fontCormorant.variable} antialiased`}
        suppressHydrationWarning
      >
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                try {
                  var saved = localStorage.getItem('bellamais_theme_mode') || localStorage.getItem('agendly_theme_mode');
                  if (saved === 'dark') {
                    document.documentElement.classList.add('dark');
                    document.documentElement.setAttribute('data-theme', 'dark');
                    document.documentElement.style.colorScheme = 'dark';
                  } else {
                    document.documentElement.classList.remove('dark');
                    document.documentElement.setAttribute('data-theme', 'light');
                    document.documentElement.style.colorScheme = 'light';
                  }
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
        <AuthProvider>
          <NotificationProvider>
            <SalonDataProvider>
              <FinanceProvider>
                <ToastProvider>
                  <GlobalSoundProvider>{children}</GlobalSoundProvider>
                </ToastProvider>
              </FinanceProvider>
            </SalonDataProvider>
          </NotificationProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
