import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { ToastProvider } from "@/components/ui/Toast";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    default: "TaskReward - Earn Rewards by Completing Tasks",
    template: "%s | TaskReward",
  },
  description: "Complete surveys and tasks to earn real rewards. A gamified platform connecting users with advertisers for mutual benefit.",
  keywords: ["tasks", "rewards", "surveys", "earn money", "gamified", "campaigns"],
  authors: [{ name: "TaskReward Team" }],
  creator: "TaskReward",
  publisher: "TaskReward",
  robots: {
    index: true,
    follow: true,
  },
  openGraph: {
    type: "website",
    locale: "en_US",
    siteName: "TaskReward",
    title: "TaskReward - Earn Rewards by Completing Tasks",
    description: "Complete surveys and tasks to earn real rewards. A gamified platform connecting users with advertisers.",
  },
  twitter: {
    card: "summary_large_image",
    title: "TaskReward - Earn Rewards by Completing Tasks",
    description: "Complete surveys and tasks to earn real rewards.",
  },
  icons: {
    icon: "/favicon.ico",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: "#0a0a0f",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-gradient-radial min-h-screen`}
      >
        <ToastProvider>
          {children}
        </ToastProvider>
      </body>
    </html>
  );
}
