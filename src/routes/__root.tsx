import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  Outlet,
  Link,
  createRootRouteWithContext,
  HeadContent,
  Scripts,
} from "@tanstack/react-router";

import appCss from "../styles.css?url";
import { AuthProvider } from "@/lib/auth-context";
import { Toaster } from "@/components/ui/sonner";
import { supabase } from "@/integrations/supabase/client";
import { clearAppStorage, cleanupServiceWorkers } from "@/lib/session-recovery";

function NotFoundComponent() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-7xl font-bold">404</h1>
        <h2 className="mt-4 text-xl font-semibold">Page not found</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          The page you're looking for doesn't exist.
        </p>
        <Link to="/" className="mt-6 inline-flex h-10 items-center rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground">
          Go home
        </Link>
      </div>
    </div>
  );
}

function ErrorComponent({ error, reset }: { error: Error; reset: () => void }) {
  console.error(error);

  const handleRecover = async () => {
    try {
      cleanupServiceWorkers();
      await supabase.auth.signOut();
    } catch (e) {
      console.error("[recovery] signOut failed", e);
    }
    clearAppStorage();
    window.location.href = "/signin";
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-xl font-semibold">Something went wrong loading your session.</h1>
        <p className="mt-2 text-sm text-muted-foreground">{error.message}</p>
        <div className="mt-6 flex items-center justify-center gap-3">
          <button onClick={reset} className="inline-flex h-10 items-center rounded-md border border-input px-4 text-sm font-medium">
            Try again
          </button>
          <button onClick={handleRecover} className="inline-flex h-10 items-center rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground">
            Sign in again
          </button>
        </div>
      </div>
    </div>
  );
}


export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1, maximum-scale=1" },
      { title: "VitalMan — Men's Health Daily Coach" },
      { name: "description", content: "VitalMan: your daily companion for men's vitality. Track sleep, stress, activity, hydration, and supplements." },
      { property: "og:title", content: "VitalMan — Men's Health Daily Coach" },
      { name: "twitter:title", content: "VitalMan — Men's Health Daily Coach" },
      { property: "og:description", content: "VitalMan: your daily companion for men's vitality. Track sleep, stress, activity, hydration, and supplements." },
      { name: "twitter:description", content: "VitalMan: your daily companion for men's vitality. Track sleep, stress, activity, hydration, and supplements." },
      { property: "og:image", content: "https://pub-bb2e103a32db4e198524a2e9ed8f35b4.r2.dev/076c3809-7cbf-4996-a94f-3a770ac1307f/id-preview-6726e098--50158b8f-9b8c-4f09-a854-cd9b50c095ad.lovable.app-1778683672540.png" },
      { name: "twitter:image", content: "https://pub-bb2e103a32db4e198524a2e9ed8f35b4.r2.dev/076c3809-7cbf-4996-a94f-3a770ac1307f/id-preview-6726e098--50158b8f-9b8c-4f09-a854-cd9b50c095ad.lovable.app-1778683672540.png" },
      { name: "twitter:card", content: "summary_large_image" },
      { property: "og:type", content: "website" },
    ],
    links: [{ rel: "stylesheet", href: appCss }],
  }),
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
  errorComponent: ErrorComponent,
});

function RootShell({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head><HeadContent /></head>
      <body>{children}<Scripts /></body>
    </html>
  );
}

function RootComponent() {
  const { queryClient } = Route.useRouteContext();
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <Outlet />
        <Toaster />
      </AuthProvider>
    </QueryClientProvider>
  );
}
