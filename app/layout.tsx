import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "OutRN — Go live a little.",
  description: "Free for a few hours? Find live, locally verified things worth doing nearby. Join OutRN’s neighborhood early-access waitlist.",
  icons: {
    icon: "/favicon.svg",
    shortcut: "/favicon.svg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased">{children}</body>
    </html>
  );
}
