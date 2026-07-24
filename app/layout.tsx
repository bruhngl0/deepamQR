import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = { title: "Deepam by Ananta | Onboarding", description: "Tell us a little about yourself so we can make your visit more personal.", icons: { icon: "/deepam-logo-horizontal.png", apple: "/deepam-logo-horizontal.png" } };
export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) { return <html lang="en"><body>{children}</body></html>; }
