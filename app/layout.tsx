import "./globals.css";
import Link from "next/link";
import { siteName } from "@/lib/config";
import { initScheduler } from "@/lib/scheduler";

initScheduler();

export const metadata = {
  title: siteName,
  description: "Simple, fast classifieds for professional services."
};

export default function RootLayout({
  children
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <header className="site-header">
          <div className="site-title">
            <Link href="/">{siteName}</Link>
          </div>
          <nav className="site-nav">
            <Link href="/">Home</Link>
            <Link href="/browse">Browse</Link>
            <Link href="/post">Post</Link>
            <Link href="/rules">Rules</Link>
          </nav>
        </header>
        <main>{children}</main>
        <footer className="site-footer">
          <p>
            <Link href="/about">About</Link>
          </p>
        </footer>
      </body>
    </html>
  );
}
