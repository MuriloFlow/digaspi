"use client";

import { BRANDS, Brand } from "@/lib/constants";

type Props = {
  value: Brand;
  onChange: (value: Brand) => void;
};

export function BrandSelect({ value, onChange }: Props) {
  return (
    <select
      className="h-12 w-full rounded-md border border-digaspi-line bg-white px-3 font-bold outline-none focus:border-digaspi-blue"
      value={value}
      onChange={(event) => onChange(event.target.value as Brand)}
    >
      {BRANDS.map((brand) => (
        <option key={brand} value={brand}>
          {brand}
        </option>
      ))}
    </select>
  );
}
