import type { Metadata } from "next";
import { Geist } from "next/font/google";
import { SiteHeader } from "@/components/SiteHeader";
import "./globals.css";

const geist = Geist({ subsets: ["latin"], variable: "--font-geist" });

export const metadata: Metadata = {
  title: { default: "Commonplace | Community Project Sharing", template: "%s | Commonplace" },
  description: "A community library for useful school, programming, and research projects.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={geist.variable} data-scroll-behavior="smooth">
      <body>
        <SiteHeader />
        <main>{children}</main>
        <footer className="site-footer"><div className="page-width footer-inner"><span className="footer-brand">Commonplace<span className="brand-period">.</span></span><span>A shared library for community-made work.</span><span>Learn openly. Build thoughtfully.</span></div></footer>
      </body>
    </html>
  );
}
