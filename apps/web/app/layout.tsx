import type { Metadata } from "next";
import { Geist, Geist_Mono, Inter, JetBrains_Mono, Manrope } from "next/font/google";
import "./globals.css";
import { cn } from "@/lib/utils";

const manropeHeading = Manrope({subsets:['latin'],variable:'--font-heading'});

const inter = Inter({subsets:['latin'],variable:'--font-sans'});

const jetBrainsMono = JetBrains_Mono({ subsets: ["latin"], variable: "--font-code" });

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "HackGuard AI | Hackathons, evaluated with confidence",
  description: "Host secure, fair hackathons at scale with sandboxed code execution, AI-powered evaluation, and human-led decisions.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={cn("h-full", "antialiased", geistSans.variable, geistMono.variable, "font-sans", inter.variable, manropeHeading.variable, jetBrainsMono.variable)}
    >
      <body className="min-h-full flex flex-col dark">{children}</body>
    </html>
  );
}
