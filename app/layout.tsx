"use client";
import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Provider } from "react-redux";
import { CounterProvider } from "./store/store";
import { Suspense, useEffect } from "react";
import Head from "next/head"; // Import Head component for injecting scripts
import * as Sentry from "@sentry/browser";

const inter = Inter({ subsets: ["latin"] });

import { Toaster } from "react-hot-toast";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  useEffect(() => {
    // Add the Telegram Web App SDK script dynamically after the component mounts
    const script = document.createElement("script");
    script.src = "https://telegram.org/js/telegram-web-app.js";
    script.async = true;
    document.head.appendChild(script);

    return () => {
      document.head.removeChild(script); // Clean up the script when the component unmounts
    };
  }, []);
  Sentry.init({ dsn: "https://243e28cf2f5049929980e1dd1f44faff@glitchtip.abelayalew.dev/2" });

  return (
    <html lang="en">
      <body className={inter.className}>
        <Suspense fallback={<div>Loading...</div>}>
          <CounterProvider>
            {children}
            <Toaster position="top-left" reverseOrder={false} />{" "}
          </CounterProvider>
        </Suspense>
      </body>
    </html>
  );
}
