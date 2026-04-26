import type { Metadata } from "next";
import "./globals.css";
import { ThemeProvider } from "@/context/ThemeContext";
import { SocketProvider } from "@/context/SocketContext";
import Navbar from "@/components/layout/Navbar";

export const metadata: Metadata = {
  title: "F1 Live | Formula 1 Dashboard & Live Timing",
  description: "Experience Formula 1 like never before. Live race timing, driver standings, team stats, and real-time race simulation with a premium motorsports dashboard.",
  keywords: "Formula 1, F1, racing, live timing, standings, drivers, teams",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className="min-h-full flex flex-col">
        <ThemeProvider>
          <SocketProvider>
            <Navbar />
            <main className="flex-1 pt-16">
              {children}
            </main>
          </SocketProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
