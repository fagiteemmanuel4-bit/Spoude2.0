import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
<<<<<<< HEAD
import { Outlet, Link, createRootRouteWithContext, useRouter } from "@tanstack/react-router";
import { useEffect } from "react";

import { reportError } from "../lib/error-reporting";
import { Toaster } from "@/components/ui/sonner";
import { auth } from "@/lib/firebase";
import { onAuthStateChanged } from "firebase/auth";
import { ThemeProvider } from "@/lib/theme";
import { DomainChangeBanner } from "@/components/DomainChangeBanner";
=======
import {
  Outlet,
  Link,
  createRootRouteWithContext,
  useRouter,
  HeadContent,
  Scripts,
} from "@tanstack/react-router";
import { useEffect, type ReactNode } from "react";

import appCss from "../styles.css?url";
import { reportLovableError } from "../lib/lovable-error-reporting";
import { Toaster } from "@/components/ui/sonner";
import { supabase } from "@/integrations/supabase/client";
import { ThemeProvider, themeInitScript } from "@/lib/theme";
>>>>>>> 6eb08cd852ad86633840258078184b8cf02d3132

function NotFoundComponent() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-7xl font-bold text-foreground">404</h1>
        <h2 className="mt-4 text-xl font-semibold text-foreground">Page not found</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          The page you're looking for doesn't exist or has been moved.
        </p>
        <div className="mt-6">
          <Link
            to="/"
            className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Go home
          </Link>
        </div>
      </div>
    </div>
  );
}

function ErrorComponent({ error, reset }: { error: Error; reset: () => void }) {
  console.error(error);
  const router = useRouter();
  useEffect(() => {
<<<<<<< HEAD
    reportError(error, { boundary: "root_error_component" });
=======
    reportLovableError(error, { boundary: "tanstack_root_error_component" });
>>>>>>> 6eb08cd852ad86633840258078184b8cf02d3132
  }, [error]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-xl font-semibold tracking-tight text-foreground">
          This page didn't load
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Something went wrong on our end. You can try refreshing or head back home.
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-2">
          <button
            onClick={() => {
              router.invalidate();
              reset();
            }}
            className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Try again
          </button>
          <a
            href="/"
            className="inline-flex items-center justify-center rounded-md border border-input bg-background px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-accent"
          >
            Go home
          </a>
        </div>
      </div>
    </div>
  );
}

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()({
<<<<<<< HEAD
=======
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1, viewport-fit=cover" },
      { name: "theme-color", content: "#3646d9" },
      { name: "apple-mobile-web-app-capable", content: "yes" },
      { name: "apple-mobile-web-app-title", content: "Lumio" },
      { name: "apple-mobile-web-app-status-bar-style", content: "black-translucent" },
      { title: "Lumio — Your study, illuminated" },
      { name: "description", content: "Lumio is the calm, organized home for your class notes, homework and past exams. Built for personal academic growth." },
      { name: "author", content: "Lumio" },
      { property: "og:title", content: "Lumio — Your study, illuminated" },
      { property: "og:description", content: "Lumio is the calm, organized home for your class notes, homework and past exams. Built for personal academic growth." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { name: "twitter:title", content: "Lumio — Your study, illuminated" },
      { name: "twitter:description", content: "Lumio is the calm, organized home for your class notes, homework and past exams. Built for personal academic growth." },
      { property: "og:image", content: "https://pub-bb2e103a32db4e198524a2e9ed8f35b4.r2.dev/62e830e6-83ed-4ddb-a57b-cb05751e503d/id-preview-3c192c3d--08555808-a10e-457e-8e41-b427242f611c.lovable.app-1782773736777.png" },
      { name: "twitter:image", content: "https://pub-bb2e103a32db4e198524a2e9ed8f35b4.r2.dev/62e830e6-83ed-4ddb-a57b-cb05751e503d/id-preview-3c192c3d--08555808-a10e-457e-8e41-b427242f611c.lovable.app-1782773736777.png" },
    ],
    links: [
      {
        rel: "stylesheet",
        href: appCss,
      },
      { rel: "preconnect", href: "https://fonts.googleapis.com" },
      { rel: "preconnect", href: "https://fonts.gstatic.com", crossOrigin: "anonymous" },
      { rel: "stylesheet", href: "https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Plus+Jakarta+Sans:wght@500;600;700;800&display=swap" },
      { rel: "icon", type: "image/svg+xml", href: "/favicon.svg" },
      { rel: "apple-touch-icon", href: "/apple-touch-icon.png" },
      { rel: "manifest", href: "/manifest.webmanifest" },
    ],
  }),
  shellComponent: RootShell,
>>>>>>> 6eb08cd852ad86633840258078184b8cf02d3132
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
  errorComponent: ErrorComponent,
});

<<<<<<< HEAD
=======
function RootShell({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeInitScript }} />
        <HeadContent />
      </head>
      <body>
        {children}
        <Scripts />
      </body>
    </html>
  );
}

>>>>>>> 6eb08cd852ad86633840258078184b8cf02d3132
function RootComponent() {
  const { queryClient } = Route.useRouteContext();
  const router = useRouter();

  useEffect(() => {
<<<<<<< HEAD
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      router.invalidate();
      queryClient.invalidateQueries();
    });
    return () => unsubscribe();
=======
    const { data: sub } = supabase.auth.onAuthStateChange((event) => {
      if (event !== "SIGNED_IN" && event !== "SIGNED_OUT" && event !== "USER_UPDATED") return;
      router.invalidate();
      if (event !== "SIGNED_OUT") queryClient.invalidateQueries();
    });
    return () => sub.subscription.unsubscribe();
>>>>>>> 6eb08cd852ad86633840258078184b8cf02d3132
  }, [router, queryClient]);

  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        {/* Required: nested routes render here. Removing <Outlet /> breaks all child routes. */}
        <Outlet />
        <Toaster richColors position="top-right" />
<<<<<<< HEAD
        <DomainChangeBanner />
=======
>>>>>>> 6eb08cd852ad86633840258078184b8cf02d3132
      </ThemeProvider>
    </QueryClientProvider>
  );
}
