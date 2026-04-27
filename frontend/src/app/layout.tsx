import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "IoT Weather Dashboard",
  description: "Dashboard de monitoreo para riego inteligente con sensores IoT"
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es" className="h-full">
      <body className="h-full min-h-0 overflow-x-hidden">{children}</body>
    </html>
  );
}
