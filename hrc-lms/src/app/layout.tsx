"use client"
import {Geist, Geist_Mono} from "next/font/google";
import "./globals.css";
import {Provider} from "react-redux";
import {persistor, store} from "@/store/store";
import {PersistGate} from "redux-persist/integration/react";
import {PrimeReactProvider} from "primereact/api";
import Tailwind from "primereact/passthrough/tailwind";

const geistSans = Geist({
    variable: "--font-geist-sans",
    subsets: ["latin"],
});

const geistMono = Geist_Mono({
    variable: "--font-geist-mono",
    subsets: ["latin"],
});

export default function RootLayout({children,}: Readonly<{
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
            <Provider store={store}>
                <PersistGate loading={<div>Loading...</div>} persistor={persistor}>
                    {children}
                </PersistGate>
            </Provider>
        </PrimeReactProvider>
        </body>
        </html>
    );
}
