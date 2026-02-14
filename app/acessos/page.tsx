import { ShieldCheck } from "lucide-react";
import type { Metadata } from "next";
import { Suspense } from "react";

import { getTickets } from "@/actions/get-tickets";
import { AccessControlTable } from "@/components/access-control-table";

export const metadata: Metadata = {
  title: "Controle de Acessos — II Show de Massas",
  description: "Gerencie a chegada dos convidados ao evento",
};

async function TicketsList() {
  const tickets = await getTickets();
  return <AccessControlTable tickets={tickets} />;
}

export default function AcessosPage() {
  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-card">
        <div className="mx-auto max-w-4xl px-4 py-6 sm:px-6 sm:py-8">
          <div className="flex items-center gap-3">
            <div className="flex size-10 items-center justify-center rounded-xl bg-primary/10 ring-1 ring-primary/20">
              <ShieldCheck className="size-5 text-primary" />
            </div>
            <div>
              <h1 className="text-lg sm:text-xl font-bold text-foreground tracking-tight text-pretty">
                Controle de Acessos
              </h1>
              <p className="text-xs text-muted-foreground font-medium">
                II Show de Massas · 14 de Fevereiro, 2026
              </p>
            </div>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-4xl px-4 py-6 sm:px-6 sm:py-8">
        <Suspense
          fallback={
            <div className="flex flex-col items-center justify-center py-32">
              <div className="size-8 animate-spin rounded-full border-2 border-border border-t-primary" />
              <p className="mt-4 text-sm text-muted-foreground font-medium">
                Carregando convidados…
              </p>
            </div>
          }
        >
          <TicketsList />
        </Suspense>
      </main>
    </div>
  );
}
