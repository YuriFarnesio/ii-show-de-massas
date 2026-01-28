"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Plus, Ticket, Trash2, User, WheatOff } from "lucide-react";
import { useEffect, useState } from "react";
import { Controller, useFieldArray, useForm, useWatch } from "react-hook-form";
import { toast } from "sonner";

import { getNucleoNames } from "@/actions/get-nucleo-names";
import { formSchema, type FormData } from "@/schemas/form";
import {
  NUCLEO_NAMES,
  PRICES,
  TICKET_LABELS,
  type TicketType,
} from "@/utils/consts";
import { maskCPF, maskPhone } from "@/utils/functions";

import { handlePaymentAction } from "@/actions/handle-payment";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { CreatableCombobox } from "./creatable-combobox";

export default function TicketForm() {
  const [isLoading, setIsLoading] = useState(false);
  const [cpfValue, setCpfValue] = useState("");
  const [phoneValue, setPhoneValue] = useState("");
  const [nucleoOptions, setNucleoOptions] = useState<string[]>([
    ...NUCLEO_NAMES,
  ]);

  const {
    control,
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      buyer: {
        name: "",
        email: "",
        cpf: "",
        phone: "",
      },
      tickets: [],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: "tickets",
  });

  const tickets = useWatch({
    control,
    name: "tickets",
  });

  const total = tickets.reduce((sum, ticket) => sum + PRICES[ticket.type], 0);

  useEffect(() => {
    async function fetchNucleoNames() {
      const dbNucleos = await getNucleoNames();

      const allNucleos = Array.from(new Set([...NUCLEO_NAMES, ...dbNucleos]));

      const sortedNucleos = allNucleos.sort((a, b) =>
        a.localeCompare(b, "pt-BR"),
      );

      setNucleoOptions(sortedNucleos);
    }

    fetchNucleoNames();
  }, []);

  function handleCPFChange(e: React.ChangeEvent<HTMLInputElement>) {
    const masked = maskCPF(e.target.value);
    setCpfValue(masked);
    setValue("buyer.cpf", masked);
  }

  function handlePhoneChange(e: React.ChangeEvent<HTMLInputElement>) {
    const masked = maskPhone(e.target.value);
    setPhoneValue(masked);
    setValue("buyer.phone", masked);
  }

  function addTicket() {
    append({
      name: "",
      type: "inteira",
      isMember: false,
      nucleoName: "",
      glutenIntolerant: false,
      lactoseIntolerant: false,
    });
  }

  async function handleCheckout(data: FormData) {
    setIsLoading(true);

    try {
      const result = await handlePaymentAction(data);

      if (result?.error) {
        toast.error(result.error, { id: "checkout" });
        return;
      }
    } catch (error: unknown) {
      if (error instanceof Error && error.message === "NEXT_REDIRECT") {
        toast.success(
          total === 0 ? "Inscrição confirmada!" : "Redirecionando...",
          { id: "checkout" },
        );
        return;
      }

      toast.error("Erro inesperado. Tente novamente.", { id: "checkout" });
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <Card className="w-full max-w-2xl gap-4 md:gap-6 shadow-xl mx-auto">
      <CardHeader className="gap-0">
        <CardTitle className="flex items-center gap-1 md:gap-2 text-base md:text-lg font-semibold">
          <Ticket className="size-5 text-primary" />
          Comprar Ingressos
        </CardTitle>

        <CardDescription className="text-sm md:text-base">
          Preencha os dados e adicione os participantes
        </CardDescription>
      </CardHeader>

      <CardContent>
        <form
          onSubmit={handleSubmit(handleCheckout)}
          className="space-y-4 md:space-y-6"
        >
          <fieldset className="space-y-3">
            <legend className="flex items-center gap-2 text-xs font-semibold text-muted-foreground tracking-wide uppercase">
              <User className="size-4" />
              Dados Pessoais
            </legend>

            <div className="grid md:grid-cols-2 gap-3 md:gap-4">
              <div>
                <Label htmlFor="buyerName" className="text-xs mb-1">
                  Nome Completo
                </Label>
                <Input
                  id="buyerName"
                  placeholder="Seu nome completo"
                  className="text-sm md:text-xs"
                  {...register("buyer.name")}
                />
                {errors.buyer?.name && (
                  <p className="text-xs text-destructive">
                    {errors.buyer.name.message}
                  </p>
                )}
              </div>

              <div>
                <Label htmlFor="buyerEmail" className="text-xs mb-1">
                  E-mail
                </Label>
                <Input
                  id="buyerEmail"
                  type="email"
                  placeholder="seu@email.com"
                  className="text-sm md:text-xs"
                  {...register("buyer.email")}
                />
                {errors.buyer?.email && (
                  <p className="text-xs text-destructive">
                    {errors.buyer.email.message}
                  </p>
                )}
              </div>

              <div>
                <Label htmlFor="buyerCpf" className="text-xs mb-1">
                  CPF
                </Label>
                <Input
                  id="buyerCpf"
                  type="text"
                  placeholder="000.000.000-00"
                  value={cpfValue}
                  onChange={handleCPFChange}
                  className="text-sm md:text-xs"
                />
                {errors.buyer?.cpf && (
                  <p className="text-xs text-destructive">
                    {errors.buyer.cpf.message}
                  </p>
                )}
              </div>

              <div>
                <Label htmlFor="buyerPhone" className="text-xs mb-1">
                  Telefone
                </Label>
                <Input
                  id="buyerPhone"
                  type="tel"
                  placeholder="(00) 00000-0000"
                  value={phoneValue}
                  onChange={handlePhoneChange}
                  className="text-sm md:text-xs"
                />
                {errors.buyer?.phone && (
                  <p className="text-xs text-destructive">
                    {errors.buyer.phone.message}
                  </p>
                )}
              </div>
            </div>
          </fieldset>

          <fieldset className="min-w-0 space-y-3 border-t border-border pt-2 md:pt-4">
            <div className="flex items-center justify-between">
              <legend className="flex text-lg md:text-xl font-semibold">
                Ingressos
              </legend>
            </div>

            {fields.length === 0 ? (
              <>
                <div className="space-y-3 text-muted-foreground text-center border-2 border-dashed border-border rounded-xl py-4 md:py-8 px-2 md:px-4">
                  <User className="size-8 md:size-12 opacity-50 mx-auto" />
                  <p className="text-sm md:text-base">
                    Nenhum ingresso adicionado
                  </p>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={addTicket}
                    className="h-6 px-2 text-xs md:h-7 md:text-[0.8rem] md:px-2.5"
                  >
                    <Plus className="size-4" />
                    Adicionar Ingresso
                  </Button>
                </div>
                {errors.tickets?.message && (
                  <p className="text-xs text-destructive -mt-2">
                    {errors.tickets.message}
                  </p>
                )}
              </>
            ) : (
              <>
                {fields.map((field, index) => (
                  <fieldset
                    key={field.id}
                    className="min-w-0 space-y-3 bg-muted/50 border border-border rounded-xl shadow-sm p-4"
                  >
                    <div className="flex items-center justify-between">
                      <legend className="text-sm font-medium text-muted-foreground">
                        Ingresso {index + 1}
                      </legend>

                      <Button
                        type="button"
                        variant="outline"
                        size="xs"
                        onClick={() => remove(index)}
                        className="text-destructive hover:text-destructive/80"
                      >
                        <Trash2 className="size-4" />
                      </Button>
                    </div>

                    <div className="grid md:grid-cols-2 gap-3 md:gap-4">
                      <div className="min-w-0">
                        <Label
                          htmlFor={`tickets.${index}.type`}
                          className="text-xs mb-1"
                        >
                          Tipo de Ingresso
                        </Label>
                        <Select
                          id={`tickets.${index}.type`}
                          value={tickets[index]?.type || ""}
                          onValueChange={(value) =>
                            setValue(
                              `tickets.${index}.type`,
                              value as TicketType,
                            )
                          }
                        >
                          <SelectTrigger className="bg-background">
                            <SelectValue placeholder="Selecione o tipo">
                              {tickets[index]?.type
                                ? TICKET_LABELS[tickets[index].type]
                                : "Selecione o tipo"}
                            </SelectValue>
                          </SelectTrigger>

                          <SelectContent>
                            {Object.entries(TICKET_LABELS).map(
                              ([key, value]) => (
                                <SelectItem key={key} value={key}>
                                  {value}
                                </SelectItem>
                              ),
                            )}
                          </SelectContent>
                        </Select>
                        {errors.tickets?.[index]?.type && (
                          <p className="text-xs text-destructive">
                            {errors.tickets[index].type.message}
                          </p>
                        )}
                      </div>

                      <div>
                        <Label
                          htmlFor={`tickets.${index}.name`}
                          className="text-xs mb-1"
                        >
                          Nome Completo
                        </Label>
                        <Input
                          id={`tickets.${index}.name`}
                          placeholder="Nome completo"
                          className="text-sm md:text-xs bg-background"
                          {...register(`tickets.${index}.name`)}
                        />
                        {errors.tickets?.[index]?.name && (
                          <p className="text-xs text-destructive">
                            {errors.tickets[index].name.message}
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="space-y-3 bg-background border border-border rounded-lg p-3">
                      <div className="flex items-center justify-between">
                        <Label
                          htmlFor={`tickets.${index}.isMember`}
                          className="w-full flex items-center gap-2 font-medium cursor-pointer"
                        >
                          <User className="shrink-0 size-4 text-primary" />
                          <span className="text-sm leading-none">
                            É sócio de algum núcleo?{" "}
                            <span className="text-xs font-normal text-muted-foreground">
                              (Marque se for sócio)
                            </span>
                          </span>
                        </Label>
                        <Checkbox
                          id={`tickets.${index}.isMember`}
                          checked={!!tickets[index]?.isMember}
                          onCheckedChange={(checked) =>
                            setValue(`tickets.${index}.isMember`, checked)
                          }
                        />
                      </div>

                      {!!tickets[index]?.isMember && (
                        <div className="min-w-0 border-t border-border pt-2">
                          <Label
                            htmlFor={`tickets.${index}.nucleoName`}
                            className="text-xs mb-1"
                          >
                            Nome do Núcleo
                          </Label>

                          <Controller
                            name={`tickets.${index}.nucleoName`}
                            control={control}
                            render={({ field: { value, onChange, ref } }) => (
                              <CreatableCombobox
                                id={`tickets.${index}.nucleoName`}
                                options={nucleoOptions}
                                value={value || ""}
                                onChange={onChange}
                                placeholder="Selecione ou digite o núcleo"
                                ref={ref}
                              />
                            )}
                          />

                          {errors.tickets?.[index]?.nucleoName && (
                            <p className="text-xs text-destructive">
                              {errors.tickets[index].nucleoName.message}
                            </p>
                          )}
                        </div>
                      )}
                    </div>

                    <div className="space-y-2 bg-background border border-border rounded-lg p-3">
                      <p className="w-full flex items-center gap-2 font-medium">
                        <WheatOff className="shrink-0 size-4 text-primary" />
                        <span className="text-sm leading-none">
                          Intolerâncias Alimentares{" "}
                          <span className="text-xs font-normal text-muted-foreground">
                            (Selecione as que se aplicam)
                          </span>
                        </span>
                      </p>

                      <div className="flex gap-3">
                        <button
                          type="button"
                          onClick={() =>
                            setValue(
                              `tickets.${index}.glutenIntolerant`,
                              !tickets[index]?.glutenIntolerant,
                            )
                          }
                          className={`w-full flex items-center justify-center border rounded-lg cursor-pointer py-1 px-3 transition-colors ${
                            !!tickets[index]?.glutenIntolerant
                              ? "bg-primary/10 text-primary border-primary"
                              : "hover:bg-muted border-border"
                          }`}
                        >
                          <span className="text-xs font-medium">
                            Sem Glúten
                          </span>
                        </button>

                        <button
                          type="button"
                          onClick={() =>
                            setValue(
                              `tickets.${index}.lactoseIntolerant`,
                              !tickets[index]?.lactoseIntolerant,
                            )
                          }
                          className={`w-full flex items-center justify-center border rounded-lg cursor-pointer py-1 px-3 transition-colors ${
                            !!tickets[index]?.lactoseIntolerant
                              ? "bg-primary/10 text-primary border-primary"
                              : "hover:bg-muted border-border"
                          }`}
                        >
                          <span className="text-xs font-medium">
                            Sem Lactose
                          </span>
                        </button>
                      </div>
                    </div>
                  </fieldset>
                ))}

                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={addTicket}
                  className="h-6 px-2 text-xs md:h-7 md:text-[0.8rem] md:px-2.5"
                >
                  <Plus className="size-4" />
                  Adicionar Ingresso
                </Button>
              </>
            )}
          </fieldset>

          <fieldset className="space-y-3 border-t border-border pt-2 md:pt-4">
            <div className="flex items-center justify-between">
              <legend className="text-lg md:text-xl font-semibold">
                Total:
              </legend>
              <span className="text-xl md:text-2xl font-bold text-primary">
                {total === 0
                  ? "Gratuito"
                  : `R$ ${Intl.NumberFormat("pt-BR", {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    }).format(total / 100)}`}
              </span>
            </div>

            <Button
              type="submit"
              size="lg"
              disabled={isLoading || fields.length === 0}
              className="w-full h-9 px-2.5 text-base md:h-10 md:text-lg md:px-3"
            >
              {isLoading
                ? "Carregando..."
                : total === 0
                  ? "Confirmar Inscrição"
                  : "Realizar Pagamento"}
            </Button>
          </fieldset>
        </form>
      </CardContent>
    </Card>
  );
}
