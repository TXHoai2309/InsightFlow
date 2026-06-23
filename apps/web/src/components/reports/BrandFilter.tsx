"use client";

import React from "react";

interface BrandFilterProps {
  brands: string[];
  selectedBrand: string;
  onBrandSelect: (brand: string) => void;
}

export function BrandFilter({ brands, selectedBrand, onBrandSelect }: BrandFilterProps) {
  return (
    <div className="flex flex-col gap-2">
      <label className="text-sm font-semibold text-[var(--color-text-muted)] uppercase tracking-wider">
        Lọc theo thương hiệu
      </label>
      <select
        value={selectedBrand}
        onChange={(e) => onBrandSelect(e.target.value)}
        className="w-full md:w-64 px-4 py-2 select-app border border-[var(--color-border)] rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--color-brand)] transition-all"
      >
        <option value="all">Tất cả thương hiệu</option>
        {brands.map((brand) => (
          <option key={brand} value={brand}>
            {brand}
          </option>
        ))}
      </select>
    </div>
  );
}
