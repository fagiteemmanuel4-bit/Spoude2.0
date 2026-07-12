import { Link } from "@tanstack/react-router";
import { type ReactNode } from "react";
import { SpoudeWordmark } from "@/components/Logo";

<<<<<<< HEAD
export function LegalLayout({
  title,
  updated,
  children,
}: {
  title: string;
  updated: string;
  children: ReactNode;
}) {
=======
export function LegalLayout({ title, updated, children }: { title: string; updated: string; children: ReactNode }) {
>>>>>>> 6eb08cd852ad86633840258078184b8cf02d3132
  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border">
        <div className="max-w-4xl mx-auto px-6 py-5 flex items-center justify-between">
<<<<<<< HEAD
          <SpoudeWordmark />
          <nav className="flex gap-4 text-sm text-muted-foreground">
            <Link to="/terms" className="hover:text-foreground transition-colors">
              Terms
            </Link>
            <Link to="/privacy" className="hover:text-foreground transition-colors">
              Privacy
            </Link>
            <Link to="/disclaimer" className="hover:text-foreground transition-colors">
              Disclaimer
            </Link>
=======
          <SpoudeWordmark to="/lumio" />
          <nav className="flex gap-4 text-sm text-muted-foreground">
            <Link to="/terms" className="hover:text-foreground transition-colors">Terms</Link>
            <Link to="/privacy" className="hover:text-foreground transition-colors">Privacy</Link>
            <Link to="/disclaimer" className="hover:text-foreground transition-colors">Disclaimer</Link>
>>>>>>> 6eb08cd852ad86633840258078184b8cf02d3132
          </nav>
        </div>
      </header>
      <main className="max-w-3xl mx-auto px-6 py-12 animate-fade-up">
        <p className="text-xs uppercase tracking-wider text-primary font-semibold">Legal</p>
        <h1 className="mt-2 text-3xl sm:text-4xl font-bold tracking-tight">{title}</h1>
        <p className="mt-2 text-sm text-muted-foreground">Last updated: {updated}</p>
<<<<<<< HEAD
        <article className="mt-8 prose-spoude space-y-6 text-foreground">{children}</article>
=======
        <article className="mt-8 prose-lumio space-y-6 text-foreground">
          {children}
        </article>
>>>>>>> 6eb08cd852ad86633840258078184b8cf02d3132
      </main>
    </div>
  );
}
