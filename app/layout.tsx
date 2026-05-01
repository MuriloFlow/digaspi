import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Di Gaspi Estoque",
  description: "Rotinas de recebimento e puxada para estoque de loja."
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#214f8f"
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR">
      <body>{children}</body>
    </html>
  );
}
