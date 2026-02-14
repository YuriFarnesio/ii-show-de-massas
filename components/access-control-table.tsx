"use client";

import { Clock, Milk, Search, UserCheck, Users, Wheat } from "lucide-react";
import { useCallback, useMemo, useState, useTransition } from "react";

import type { TicketWithBuyer } from "@/actions/get-tickets";
import { toggleCheckIn } from "@/actions/toggle-check-in";
import { TICKET_NAMES } from "@/utils/consts";

import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";

type AccessControlTableProps = {
  tickets: TicketWithBuyer[];
};

export function AccessControlTable({
  tickets: initialTickets,
}: AccessControlTableProps) {
  const [tickets, setTickets] = useState(initialTickets);
  const [searchQuery, setSearchQuery] = useState("");
  const [nucleoQuery, setNucleoQuery] = useState("");

  const [togglingId, setTogglingId] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const filteredTickets = useMemo(() => {
    let result = tickets;

    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase().trim();
      result = result.filter(
        (ticket) =>
          ticket.name.toLowerCase().includes(query) ||
          ticket.buyer_name.toLowerCase().includes(query),
      );
    }

    if (nucleoQuery.trim()) {
      const query = nucleoQuery.toLowerCase().trim();
      result = result.filter((ticket) =>
        ticket.nucleo_name?.toLowerCase().includes(query),
      );
    }

    return result;
  }, [tickets, searchQuery, nucleoQuery]);

  const stats = useMemo(() => {
    const total = tickets.length;
    const checkedIn = tickets.filter((t) => t.checked_in).length;
    const pending = total - checkedIn;

    return { total, checkedIn, pending };
  }, [tickets]);

  const handleToggle = useCallback(
    (ticketId: string, currentCheckedIn: boolean) => {
      const newValue = !currentCheckedIn;

      setTickets((prev) =>
        prev.map((t) =>
          t.id === ticketId ? { ...t, checked_in: newValue } : t,
        ),
      );
      setTogglingId(ticketId);

      startTransition(async () => {
        const result = await toggleCheckIn(ticketId, newValue);

        if (!result.success) {
          setTickets((prev) =>
            prev.map((t) =>
              t.id === ticketId ? { ...t, checked_in: currentCheckedIn } : t,
            ),
          );
        }

        setTogglingId(null);
      });
    },
    [],
  );

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-3 gap-3 sm:gap-4">
        <div
          className="group relative overflow-hidden rounded-2xl border border-border bg-card p-4 sm:p-5 transition-all duration-300 hover:shadow-md"
          role="status"
          aria-label={`Total de ${stats.total} convidados`}
        >
          <div className="absolute inset-0 bg-linear-to-br from-primary/5 to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
          <div className="relative">
            <div className="mb-2 flex size-9 items-center justify-center rounded-xl bg-primary/10">
              <Users className="size-4 text-primary" />
            </div>
            <p className="text-2xl font-bold tracking-tight text-foreground tabular-nums">
              {stats.total}
            </p>
            <p className="mt-0.5 text-xs text-muted-foreground font-medium uppercase tracking-wider">
              Total
            </p>
          </div>
        </div>

        <div
          className="group relative overflow-hidden rounded-2xl border border-border bg-card p-4 sm:p-5 transition-all duration-300 hover:shadow-md hover:border-emerald-500/30"
          role="status"
          aria-label={`${stats.checkedIn} convidados presentes`}
        >
          <div className="absolute inset-0 bg-linear-to-br from-emerald-500/5 to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
          <div className="relative">
            <div className="mb-2 flex size-9 items-center justify-center rounded-xl bg-emerald-500/10">
              <UserCheck className="size-4 text-emerald-700" />
            </div>
            <p className="text-2xl font-bold tracking-tight text-foreground tabular-nums">
              {stats.checkedIn}
            </p>
            <p className="mt-0.5 text-xs text-muted-foreground font-medium uppercase tracking-wider">
              Presentes
            </p>
          </div>
        </div>

        <div
          className="group relative overflow-hidden rounded-2xl border border-border bg-card p-4 sm:p-5 transition-all duration-300 hover:shadow-md hover:border-orange-500/30"
          role="status"
          aria-label={`${stats.pending} convidados pendentes`}
        >
          <div className="absolute inset-0 bg-linear-to-br from-orange-500/5 to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
          <div className="relative">
            <div className="mb-2 flex size-9 items-center justify-center rounded-xl bg-orange-500/10">
              <Clock className="size-4 text-orange-700" />
            </div>
            <p className="text-2xl font-bold tracking-tight text-foreground tabular-nums">
              {stats.pending}
            </p>
            <p className="mt-0.5 text-xs text-muted-foreground font-medium uppercase tracking-wider">
              Pendentes
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="relative">
          <Search className="pointer-events-none absolute left-4 top-1/2 size-4 -translate-y-1/2 text-muted-foreground/50" />
          <Input
            type="search"
            placeholder="Buscar por nome ou comprador…"
            aria-label="Buscar por nome ou comprador"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            spellCheck={false}
            autoComplete="off"
            className="h-12 rounded-xl border-border bg-card pl-11 text-sm text-foreground placeholder:text-muted-foreground/50 focus-visible:ring-primary/20 transition-all duration-200"
          />
        </div>
        <div className="relative">
          <Search className="pointer-events-none absolute left-4 top-1/2 size-4 -translate-y-1/2 text-muted-foreground/50" />
          <Input
            type="search"
            placeholder="Filtrar por núcleo…"
            aria-label="Filtrar por núcleo"
            value={nucleoQuery}
            onChange={(e) => setNucleoQuery(e.target.value)}
            spellCheck={false}
            autoComplete="off"
            className="h-12 rounded-xl border-border bg-card pl-11 text-sm text-foreground placeholder:text-muted-foreground/50 focus-visible:ring-primary/20 transition-all duration-200"
          />
        </div>
      </div>

      {(searchQuery || nucleoQuery) && (
        <p
          className="text-sm text-muted-foreground ml-1 font-medium animate-in fade-in slide-in-from-left-2 duration-300"
          role="status"
        >
          {filteredTickets.length}{" "}
          {filteredTickets.length === 1
            ? "resultado encontrado"
            : "resultados encontrados"}
        </p>
      )}

      <div
        className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm"
        role="grid"
        aria-colcount={6}
      >
        <div
          className="grid grid-cols-[3rem_minmax(0,1fr)_auto] md:grid-cols-[3rem_1fr_1fr_4rem_10rem_4rem] items-center gap-3 border-b border-border bg-muted/50 px-4 py-3"
          role="row"
        >
          <span role="columnheader" aria-label="Check-in status" />
          <span
            role="columnheader"
            className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground"
          >
            Convidado
          </span>
          <span
            role="columnheader"
            className="hidden md:block text-[11px] font-semibold uppercase tracking-widest text-muted-foreground"
          >
            Comprador
          </span>
          <span
            role="columnheader"
            className="hidden md:block text-[11px] font-semibold uppercase tracking-widest text-muted-foreground"
          >
            Tipo
          </span>
          <span
            role="columnheader"
            className="hidden md:block text-[11px] font-semibold uppercase tracking-widest text-muted-foreground"
          >
            Núcleo
          </span>
          <span
            role="columnheader"
            className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground text-right md:text-left"
          >
            Restr.
          </span>
        </div>

        {filteredTickets.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-muted-foreground/50">
            <Users className="mb-3 size-10 opacity-40" />
            <p className="text-sm font-medium">Nenhum convidado encontrado</p>
            {(searchQuery || nucleoQuery) && (
              <p className="mt-1 text-xs text-muted-foreground/40">
                Tente outros termos de busca
              </p>
            )}
          </div>
        ) : (
          <div className="divide-y divide-border" role="rowgroup">
            {filteredTickets.map((ticket) => {
              const isToggling = togglingId === ticket.id;

              return (
                <label
                  key={ticket.id}
                  htmlFor={`check-${ticket.id}`}
                  className={`grid grid-cols-[3rem_minmax(0,1fr)_auto] md:grid-cols-[3rem_1fr_1fr_4rem_10rem_4rem] items-center gap-3 px-4 py-3.5 cursor-pointer transition-all duration-200 hover:bg-muted/70 group/row ${
                    ticket.checked_in ? "bg-emerald-50/50" : ""
                  } ${isToggling ? "opacity-70 pointer-events-none" : ""}`}
                  role="row"
                >
                  <div
                    className="flex items-center justify-center"
                    role="gridcell"
                  >
                    <Checkbox
                      id={`check-${ticket.id}`}
                      checked={ticket.checked_in}
                      onCheckedChange={() =>
                        handleToggle(ticket.id, ticket.checked_in)
                      }
                      disabled={isToggling}
                      className="size-5 rounded-lg border-border data-checked:bg-emerald-500 data-checked:border-emerald-500 transition-all duration-200 focus-visible:ring-emerald-500/20"
                      aria-label={`Marcar presença de ${ticket.name}`}
                    />
                  </div>

                  <div className="min-w-0" role="gridcell">
                    <p
                      className={`text-sm font-medium truncate transition-colors duration-200 ${
                        ticket.checked_in
                          ? "text-emerald-700"
                          : "text-foreground"
                      }`}
                    >
                      {ticket.name}
                    </p>
                    <p className="md:hidden mt-0.5 text-[10px] text-muted-foreground truncate">
                      por {ticket.buyer_name}
                    </p>
                  </div>

                  <div className="hidden md:block min-w-0" role="gridcell">
                    <p className="text-xs text-muted-foreground truncate group-hover/row:text-foreground/70 transition-colors">
                      {ticket.buyer_name}
                    </p>
                  </div>

                  <div className="hidden md:block" role="gridcell">
                    <span
                      className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-bold tracking-wide transition-colors ${
                        ticket.type === "infantil"
                          ? "bg-sky-100 text-sky-700"
                          : ticket.type === "juvenil"
                            ? "bg-violet-100 text-violet-700"
                            : "bg-primary/10 text-primary"
                      }`}
                    >
                      {TICKET_NAMES[ticket.type]}
                    </span>
                  </div>

                  <div className="hidden md:block min-w-0" role="gridcell">
                    <p className="text-[11px] text-muted-foreground truncate">
                      {ticket.nucleo_name ?? "—"}
                    </p>
                  </div>

                  <div className="flex items-center gap-1.5" role="gridcell">
                    {ticket.gluten_intolerant || ticket.lactose_intolerant ? (
                      <>
                        {ticket.gluten_intolerant && (
                          <span
                            className="flex items-center justify-center size-6 rounded-md bg-rose-100 transition-transform group-hover/row:scale-110"
                            title="Intolerante a glúten"
                          >
                            <Wheat
                              className="size-3.5 text-rose-500"
                              aria-hidden="true"
                            />
                          </span>
                        )}
                        {ticket.lactose_intolerant && (
                          <span
                            className="flex items-center justify-center size-6 rounded-md bg-sky-100 transition-transform group-hover/row:scale-110"
                            title="Intolerante a lactose"
                          >
                            <Milk
                              className="size-3.5 text-sky-500"
                              aria-hidden="true"
                            />
                          </span>
                        )}
                      </>
                    ) : (
                      <span className="text-xs text-muted-foreground/30">
                        —
                      </span>
                    )}
                  </div>
                </label>
              );
            })}
          </div>
        )}
      </div>

      {isPending && (
        <div
          className="fixed bottom-6 left-1/2 -translate-x-1/2 rounded-full bg-card/90 backdrop-blur-lg border border-border px-5 py-2.5 text-xs text-primary font-bold shadow-xl animate-in fade-in slide-in-from-bottom-4 duration-300 flex items-center gap-2"
          role="status"
          aria-live="polite"
        >
          <div className="size-2 rounded-full bg-primary animate-pulse" />
          Salvando alterações…
        </div>
      )}
    </div>
  );
}
