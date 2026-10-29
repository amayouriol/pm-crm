import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  Outlet,
  Link,
  createRootRouteWithContext,
  useRouter,
  HeadContent,
  Scripts,
  type ErrorComponentProps,
} from "@tanstack/react-router";
import { useEffect, type ReactNode } from "react";

import appCss from "../styles.css?url";
import { reportLovableError } from "../lib/lovable-error-reporting";
import { SessionProvider, useSession } from "../lib/session";
import { Toaster } from "sonner";

function NotFoundComponent() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-6xl font-light text-primary">404</h1>
        <h2 className="mt-4 text-xl">Página no encontrada</h2>
        <div className="mt-6">
          <Link
            to="/"
            className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm text-primary-foreground transition-colors hover:opacity-90"
          >
            Ir al inicio
          </Link>
        </div>
      </div>
    </div>
  );
}

function ErrorComponent({ error, reset }: ErrorComponentProps) {
  console.error(error);
  const router = useRouter();
  useEffect(() => {
    reportLovableError(error, { boundary: "tanstack_root_error_component" });
  }, [error]);
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-xl">Ocurrió un error</h1>
        <p className="mt-2 text-sm text-muted-foreground">{error instanceof Error ? error.message : String(error)}</p>
        <div className="mt-6 flex flex-wrap justify-center gap-2">
          <button
            onClick={() => {
              router.invalidate();
              reset();
            }}
            className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm text-primary-foreground hover:opacity-90"
          >
            Reintentar
          </button>
          <a
            href="/"
            className="inline-flex items-center justify-center rounded-md border border-input bg-background px-4 py-2 text-sm text-foreground hover:bg-accent"
          >
            Inicio
          </a>
        </div>
      </div>
    </div>
  );
}

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { title: "CRM Interno" },
      {
        name: "description",
        content:
          "Internal CRM portal for Women In Finance (WIF) to manage their Mentorship Program.",
      },
      { property: "og:title", content: "CRM Interno" },
      { property: "og:description", content: "Internal CRM portal for Women In Finance (WIF) to manage their Mentorship Program." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { name: "twitter:title", content: "CRM Interno" },
      { name: "twitter:description", content: "Internal CRM portal for Women In Finance (WIF) to manage their Mentorship Program." },
      { property: "og:image", content: "https://pub-bb2e103a32db4e198524a2e9ed8f35b4.r2.dev/eb719ebd-75c1-4a68-a138-d83e6727a286/id-preview-a55ae074--dfcdb57f-5fd8-499a-bbc7-2c7a66547943.lovable.app-1783578882420.png" },
      { name: "twitter:image", content: "https://pub-bb2e103a32db4e198524a2e9ed8f35b4.r2.dev/eb719ebd-75c1-4a68-a138-d83e6727a286/id-preview-a55ae074--dfcdb57f-5fd8-499a-bbc7-2c7a66547943.lovable.app-1783578882420.png" },
    ],
    links: [
      { rel: "stylesheet", href: appCss },
      { rel: "icon", href: "/favicon.ico", type: "image/x-icon" },
    ],
  }),
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
  errorComponent: ErrorComponent,
});

function RootShell({ children }: { children: ReactNode }) {
  return (
    <html lang="es">
      <head>
        <HeadContent />
      </head>
      <body>
        {children}
        <Scripts />
      </body>
    </html>
  );
}

function TopBar() {
  const { session, setSession, isDirectora } = useSession();
  if (!session) return null;
  return (
    <header className="sticky top-0 z-40 border-b border-border bg-background/95 backdrop-blur">
      <div className="mx-auto flex max-w-[1400px] items-center justify-between gap-4 px-6 py-3">
        <Link to="/dashboard" className="flex items-center gap-2">
          <div className="grid h-8 w-8 place-items-center rounded-md bg-primary text-primary-foreground text-sm">
            WIF
          </div>
          <div className="leading-tight">
            <div className="text-sm">Women in Finance</div>
            <div className="text-xs text-muted-foreground">Portal de Mentoría</div>
          </div>
        </Link>
        <nav className="flex items-center gap-2 text-sm">
          <Link
            to="/dashboard"
            activeProps={{ className: "text-primary" }}
            className="rounded-md px-3 py-1.5 hover:bg-accent"
          >
            Panel de Control
          </Link>
          {isDirectora && (
            <Link
              to="/directora"
              activeProps={{ className: "text-primary" }}
              className="rounded-md px-3 py-1.5 hover:bg-accent"
            >
              Vista Directora
            </Link>
          )}
          <span className="ml-2 hidden text-xs text-muted-foreground md:inline">{session.nombreCompleto}</span>
          <button
            onClick={() => setSession(null)}
            className="ml-2 rounded-md border border-border px-3 py-1.5 text-xs hover:bg-accent"
          >
            Salir
          </button>
        </nav>
      </div>
    </header>
  );
}

function RootComponent() {
  const { queryClient } = Route.useRouteContext();
  return (
    <QueryClientProvider client={queryClient}>
      <SessionProvider>
        <TopBar />
        <Outlet />
        <Toaster position="top-right" richColors />
      </SessionProvider>
    </QueryClientProvider>
  );
}
