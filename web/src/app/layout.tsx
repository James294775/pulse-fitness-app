import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { cookies } from "next/headers";
import "./globals.css";

const inter = Inter({
  variable: "--font-sans-family",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Pulse",
  description: "Train on data.",
};

export default async function RootLayout({ children }: LayoutProps<"/">) {
  const cookieStore = await cookies();
  const theme = cookieStore.get("pulse_theme")?.value === "light" ? "light" : "dark";

  return (
    <html lang="en" data-theme={theme} className={`${inter.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col bg-bg text-text">{children}</body>
    </html>
  );
}
