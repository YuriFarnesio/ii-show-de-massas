import { EventHero } from "@/components/event-hero";
import TicketForm from "@/components/ticket-form";

export default function Page() {
  return (
    <div className="w-full min-h-screen bg-background">
      <EventHero />

      <main className="relative max-w-2xl px-4 pb-4 md:pb-8 -mt-8 md:-mt-24 xl:-mt-36 mx-auto z-20">
        <TicketForm />
      </main>
    </div>
  );
}
