import { Calendar, Clock, MapPin } from "lucide-react";
import Image from "next/image";

import heroImage from "@/public/hero-pasta.jpg";

export function EventHero() {
  return (
    <section className="relative flex items-center justify-center overflow-hidden">
      <div className="absolute inset-0">
        <Image
          src={heroImage}
          alt="Delicioso macarrão italiano"
          loading="eager"
          className="size-full object-cover"
        />
        <div className="absolute inset-0 bg-linear-to-b from-background/80 via-background/60 to-background" />
      </div>

      <div className="relative max-w-2xl text-center py-16 md:py-32 xl:py-48 px-4 mx-auto z-10">
        <div className="space-y-4">
          <h1 className="text-4xl md:text-6xl font-bold text-foreground">
            II Show de Massas
          </h1>
          <p className="text-lg md:text-xl font-medium text-foreground/80">
            Um evento para toda a família
          </p>

          <div className="flex flex-wrap items-center justify-center gap-y-4 gap-x-6 pt-4 md:pt-6">
            <div className="flex items-center gap-2 text-foreground/80">
              <Calendar className="size-4 text-primary" />
              <span className="text-sm">14 de Fevereiro, 2026</span>
            </div>
            <div className="flex items-center gap-2 text-foreground/80">
              <Clock className="size-4 text-primary" />
              <span className="text-sm">A partir das 20h</span>
            </div>
            <div className="flex items-center gap-2 text-foreground/80">
              <MapPin className="size-4 text-primary" />
              <span className="text-sm">Núcleo Lagoa da Prata</span>
            </div>
          </div>
        </div>
      </div>

      <div className="h-32 absolute right-0 bottom-0 left-0 bg-linear-to-t from-background to-transparent" />
    </section>
  );
}
