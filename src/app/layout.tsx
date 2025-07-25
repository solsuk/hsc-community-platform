import type { Metadata } from "next";
import "./globals.css";
import LayoutClient from '../components/LayoutClient';
import StagewiseInit from '../components/StagewiseInit';

export const metadata: Metadata = {
  title: "Hillsmere Shores Classifieds",
  description: "A community-focused classifieds platform for Hillsmere Shores, Annapolis",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        {/* No script here */}
      </head>
      <body suppressHydrationWarning>
        <StagewiseInit />
        <LayoutClient>
          {children}
        </LayoutClient>
      </body>
    </html>
  );
}
