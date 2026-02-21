"use client";

import { useEffect, useRef } from "react";
import type {
  FieldValues,
  Path,
  PathValue,
  UseFormSetValue,
} from "react-hook-form";

interface UseDebouncedAccountNumberArgs<
  TFieldValues extends FieldValues & { accountNumber: string }
> {
  value: string;
  delayMs?: number;
  clean: (value: string) => string;
  setValue: UseFormSetValue<TFieldValues>;
  onCleaned: (cleaned: string) => void;
  debugLabel?: string;
}

export const useDebouncedAccountNumber = <
  TFieldValues extends FieldValues & { accountNumber: string }
>({
  value,
  delayMs = 400,
  clean,
  setValue,
  onCleaned,
}: UseDebouncedAccountNumberArgs<TFieldValues>) => {
  const cleanRef = useRef(clean);
  const onCleanedRef = useRef(onCleaned);

  useEffect(() => {
    cleanRef.current = clean;
    onCleanedRef.current = onCleaned;
  }, [clean, onCleaned]);

  useEffect(() => {
    const timeout = setTimeout(() => {
      const cleaned = cleanRef.current(value);
      if (!cleaned) return;
      if (cleaned !== value) {
        const fieldName = "accountNumber" as Path<TFieldValues>;
        setValue(
          fieldName,
          cleaned as PathValue<TFieldValues, typeof fieldName>,
          {
            shouldValidate: true,
            shouldDirty: true,
          }
        );
      }
      onCleanedRef.current(cleaned);
    }, delayMs);

    return () => clearTimeout(timeout);
  }, [value, delayMs, setValue]);
};
