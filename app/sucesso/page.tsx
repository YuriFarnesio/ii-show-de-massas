import { ArrowLeft, X } from "lucide-react";
import Link from "next/link";
import { Suspense } from "react";

import { verifyPaymentAction } from "@/actions/verify-payment";
import { cn } from "@/lib/utils";

import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { VerifyCard } from "@/components/verify-card";

export default async function SucessoPage({
  searchParams,
}: {
  searchParams: Promise<{
    order_nsu: string;
    transaction_nsu: string;
    receipt_url: string;
    slug: string;
  }>;
}) {
  const { order_nsu, transaction_nsu, slug } = await searchParams;

  const isFreeRegistration = transaction_nsu === "free" && slug === "free";

  if (!order_nsu || !transaction_nsu || !slug) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-slate-50 p-4">
        <Card className="w-full max-w-md text-center border-t-4 border-t-destructive shadow-xl">
          <CardHeader className="space-y-4">
            <div className="size-16 flex items-center justify-center bg-destructive/10 rounded-full mx-auto">
              <X className="size-10 text-destructive" />
            </div>

            <CardTitle className="text-2xl font-bold">
              {isFreeRegistration
                ? "Inscrição não confirmada!"
                : "Pagamento não confirmado!"}
            </CardTitle>
          </CardHeader>

          <CardContent className="space-y-6">
            <p className="text-muted-foreground">
              {isFreeRegistration
                ? "Dados da inscrição não encontrados."
                : "Dados da transação não encontrados."}
            </p>
            <Link
              href="/"
              className={cn(
                buttonVariants({ size: "lg" }),
                "w-full h-9 px-2.5 text-base md:h-10 md:text-lg md:px-3",
              )}
            >
              <ArrowLeft className="size-5 mr-2" />
              Voltar ao Início
            </Link>
          </CardContent>
        </Card>
      </main>
    );
  }

  const verifyPromise = verifyPaymentAction(order_nsu, transaction_nsu, slug);

  return (
    <main className="min-h-screen flex items-center justify-center bg-slate-50 p-4">
      <Suspense
        fallback={
          <div className="text-sm font-medium text-muted-foreground animate-pulse">
            {isFreeRegistration
              ? "Confirmando sua inscrição..."
              : "Verificando pagamento junto à operadora..."}
          </div>
        }
      >
        <VerifyCard
          verifyPromise={verifyPromise}
          isFreeRegistration={isFreeRegistration}
        />
      </Suspense>
    </main>
  );
}
