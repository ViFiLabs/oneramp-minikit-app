"use client";

interface ExchangeRateDisplayProps {
  fromCurrency: string;
  toCurrency: string;
  rate?: string;
  slippage?: string;
}

export function ExchangeRateDisplay({
  fromCurrency,
  toCurrency,
  rate = "0",
  slippage = "1%",
}: ExchangeRateDisplayProps) {
  return (
    <div className="mx-3 md:mx-4 mb-4 flex items-center justify-between text-sm text-neutral-400">
      <div className="flex items-center gap-1">
        <span>1 {fromCurrency}</span>
        <span>~</span>
        <span>{rate} {toCurrency}</span>
      </div>
      <div className="flex items-center gap-1">
        <span>Max slippage</span>
        <span>~</span>
        <span>{slippage}</span>
      </div>
    </div>
  );
}