import type { Metadata } from "next";
import type { ReactNode } from "react";
import { ThemeProvider } from "@/shared/theme/ThemeProvider";
import "./globals.css";

export const metadata: Metadata = {
  title: "IoT Weather Dashboard",
  description: "Dashboard de monitoreo para riego inteligente con sensores IoT"
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="es" className="h-full dark">
      <body className="h-full min-h-0 overflow-x-hidden">
        <ThemeProvider>{children}</ThemeProvider>
      </body>
    </html>
  );
}
