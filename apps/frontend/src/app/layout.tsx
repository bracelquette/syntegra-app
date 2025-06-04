import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { QueryProvider } from "@/providers/QueryProvider";
import { AuthProvider } from "@/contexts/AuthContext";
import { Toaster } from "@/components/ui/sonner";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Syntegra Psikotes | Sistem Psikotes Digital",
  description:
    "Platform psikotes digital dengan analitik mendalam untuk proses rekrutmen yang lebih efisien dan akurat.",
  keywords:
    "psikotes digital, tes psikologi online, rekrutmen, HR, analitik psikotes",
  authors: [{ name: "Oknum Studio", url: "https://oknum.studio" }],
  creator: "Oknum Studio",
  publisher: "Syntegra Services",
  robots: "index, follow",
  openGraph: {
    type: "website",
    locale: "id_ID",
    url: "https://syntegra.com",
    title: "Syntegra Psikotes | Sistem Psikotes Digital",
    description:
      "Platform psikotes digital dengan analitik mendalam untuk proses rekrutmen yang lebih efisien dan akurat.",
    siteName: "Syntegra Psikotes",
  },
  twitter: {
    card: "summary_large_image",
    title: "Syntegra Psikotes | Sistem Psikotes Digital",
    description:
      "Platform psikotes digital dengan analitik mendalam untuk proses rekrutmen yang lebih efisien dan akurat.",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <QueryProvider>
          <AuthProvider>
            {children}
            <Toaster />
          </AuthProvider>
        </QueryProvider>
      </body>
    </html>
  );
}
