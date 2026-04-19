"use client";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { PrimeReactProvider } from "primereact/api";
import { ReduxProvider } from "./provider";
import AuthProvider from "../providers/AuthProvider.provider";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased
                 min-h-screen
            `}
      >
        <PrimeReactProvider>
          <ReduxProvider>
            <AuthProvider>{children}</AuthProvider>
          </ReduxProvider>
        </PrimeReactProvider>
      </body>
    </html>
  );
}
