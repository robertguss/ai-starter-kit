import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Account",
  robots: { index: false, follow: false },
};

export default function AuthLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <main className="bg-muted/30 grid min-h-screen place-items-center px-6 py-12">
      <div className="flex w-full flex-col items-center gap-6">
        <Link href="/" className="text-sm font-semibold tracking-tight">
          Web App Starter Kit
        </Link>
        {children}
      </div>
    </main>
  );
}
