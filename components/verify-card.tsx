"use client";

import {
  ArrowLeft,
  CheckCircle,
  ExternalLink,
  ReceiptText,
  Ticket,
  X,
} from "lucide-react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { use } from "react";

import type { VerifyPaymentResult } from "@/actions/verify-payment";
import { cn } from "@/lib/utils";

import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export function VerifyCard({
  verifyPromise,
}: {
  verifyPromise: Promise<VerifyPaymentResult>;
}) {
  const searchParams = useSearchParams();
  const result = use(verifyPromise);

  const isPaid = !!result?.paid;

  const orderNsu = searchParams.get("order_nsu");
  const transactionNsu = searchParams.get("transaction_nsu");
  const receiptUrl = searchParams.get("receipt_url");

  if (!isPaid) {
    return (
      <Card className="w-full max-w-md text-center border-t-4 border-t-destructive shadow-xl">
        <CardHeader className="space-y-4">
          <div className="size-16 flex items-center justify-center bg-destructive/10 rounded-full mx-auto">
            <X className="size-10 text-destructive" />
          </div>

          <CardTitle className="text-2xl font-bold">
            Pagamento não confirmado!
          </CardTitle>
        </CardHeader>

        <CardContent className="space-y-6">
          <p className="text-muted-foreground">
            Não conseguimos confirmar seu pagamento. Se houve algum problema,
            entre em contato conosco.
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
    );
  }

  return (
    <Card className="w-full max-w-md text-center border-t-4 border-t-green-500 shadow-xl">
      <CardHeader className="space-y-4">
        <div className="size-16 flex items-center justify-center bg-green-100 rounded-full mx-auto">
          <CheckCircle className="size-10 text-green-600" />
        </div>

        <CardTitle className="text-2xl font-bold">
          Pagamento Confirmado!
        </CardTitle>
      </CardHeader>

      <CardContent className="space-y-6">
        <div className="space-y-2">
          <p className="text-muted-foreground">
            Seus ingressos para o <strong>II Show de Massas</strong> foram
            adquiridos com sucesso.
          </p>

          <p className="text-sm text-muted-foreground bg-blue-50 p-2 rounded-md">
            📧 Enviamos os detalhes e seus ingressos para o e-mail cadastrado.
          </p>
        </div>

        <div className="space-y-3 bg-secondary/30 text-left rounded-lg p-4">
          <div className="flex items-center gap-2 text-primary font-semibold border-b border-border pb-2">
            <Ticket className="size-5" />
            <span>Resumo da Compra</span>
          </div>

          <div className="space-y-1 text-xs font-mono text-muted-foreground">
            <p>NSU Transação: {transactionNsu || "---"}</p>
            <p>Pedido: {orderNsu?.split("-")[0] || "---"}</p>
          </div>

          {receiptUrl && (
            <a
              href={receiptUrl}
              target="_blank"
              rel="noopener noreferrer"
              className={cn(
                buttonVariants({ variant: "outline", size: "sm" }),
                "w-full h-6 px-2 text-xs md:h-7 md:text-[0.8rem] md:px-2.5 mt-2",
              )}
            >
              <ReceiptText className="size-4 mr-2" />
              Ver Comprovante Oficial
              <ExternalLink className="size-3 opacity-50 ml-2" />
            </a>
          )}
        </div>

        <div className="space-y-3">
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

          <p className="text-[10px] text-muted-foreground tracking-widest uppercase">
            Apresente este e-mail ou comprovante na entrada
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
