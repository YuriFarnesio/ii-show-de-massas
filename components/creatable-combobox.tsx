"use client";

import { PlusCircle } from "lucide-react";
import { forwardRef, useMemo } from "react";

import {
  Combobox,
  ComboboxContent,
  ComboboxInput,
  ComboboxItem,
  ComboboxList,
} from "@/components/ui/combobox";

interface CreatableComboboxProps {
  id?: string;
  options: readonly string[];
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}

export const CreatableCombobox = forwardRef<
  HTMLInputElement,
  CreatableComboboxProps
>(
  (
    { id, options, value, onChange, placeholder = "Selecione ou digite..." },
    ref,
  ) => {
    const isNewValue = useMemo(() => {
      if (!value) return false;
      return !options.some((opt) => opt.toLowerCase() === value.toLowerCase());
    }, [options, value]);

    const filteredOptions = useMemo(() => {
      return options.filter((option) =>
        option.toLowerCase().includes(value.toLowerCase()),
      );
    }, [options, value]);

    return (
      <Combobox
        id={id}
        value={value}
        onValueChange={(value) => onChange(value as string)}
        inputValue={value}
        onInputValueChange={(value) => onChange(value)}
      >
        <ComboboxInput
          ref={ref}
          placeholder={placeholder}
          className="w-full"
          inputClassName="text-sm md:text-xs"
        />
        <ComboboxContent>
          <ComboboxList>
            {filteredOptions.map((option) => (
              <ComboboxItem
                key={option}
                value={option}
                className="text-sm md:text-xs"
              >
                {option}
              </ComboboxItem>
            ))}

            {isNewValue && (
              <ComboboxItem
                value={value}
                className="text-sm md:text-xs font-semibold text-primary cursor-pointer"
              >
                <PlusCircle className="size-4 md:size-3" />
                Criar &ldquo;{value}&rdquo;
              </ComboboxItem>
            )}
          </ComboboxList>
        </ComboboxContent>
      </Combobox>
    );
  },
);

CreatableCombobox.displayName = "CreatableCombobox";
