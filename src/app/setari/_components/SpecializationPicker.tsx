"use client";

import { ChevronDown, Lock, Search } from "lucide-react";
import { useMemo, useState } from "react";
import { SPECIALIZATION_CATEGORIES } from "@/data/specializationCategories";
import { cn } from "@/lib/utils";

type SpecializationPickerProps = {
  value: string[];
  onChange: (value: string[]) => void;
  lockedItems?: string[];
};

export function SpecializationPicker({
  value,
  onChange,
  lockedItems = [],
}: SpecializationPickerProps) {
  const [query, setQuery] = useState("");
  const [expanded, setExpanded] = useState<Record<string, boolean>>(() =>
    Object.fromEntries(SPECIALIZATION_CATEGORIES.map((c) => [c.slug, true]))
  );

  const normalizedQuery = query.trim().toLowerCase();
  const lockedSet = useMemo(() => new Set(lockedItems), [lockedItems]);

  const filteredCategories = useMemo(() => {
    if (!normalizedQuery) return SPECIALIZATION_CATEGORIES;
    return SPECIALIZATION_CATEGORIES.map((category) => ({
      ...category,
      specializations: category.specializations.filter((item) =>
        item.toLowerCase().includes(normalizedQuery)
      ),
    })).filter((category) => category.specializations.length > 0);
  }, [normalizedQuery]);

  const toggle = (label: string) => {
    if (value.includes(label)) {
      if (lockedSet.has(label)) return;
      onChange(value.filter((item) => item !== label));
      return;
    }
    onChange([...value, label]);
  };

  return (
    <div className="space-y-4">
      <div className="relative">
        <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-dark-5 dark:text-[#9CA3AF]" />
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Caută specializare..."
          className="w-full rounded-xl border border-stroke bg-white py-2.5 pl-10 pr-3 text-sm text-dark shadow-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/15 dark:border-white/[0.14] dark:bg-[#141414] dark:text-white"
        />
      </div>

      <p className="text-xs text-dark-5 dark:text-[#9CA3AF]">
        {value.length === 0
          ? "Nicio specializare selectată."
          : `${value.length} specializări selectate`}
        {lockedItems.length > 0 && (
          <span className="mt-1 block">
            Specializările cu studii verificate nu pot fi eliminate din profil.
          </span>
        )}
      </p>

      {value.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {value.map((item) => {
            const locked = lockedSet.has(item);
            return (
              <button
                key={item}
                type="button"
                onClick={() => toggle(item)}
                disabled={locked}
                className={cn(
                  "inline-flex items-center gap-1 rounded-md px-2.5 py-1 text-xs font-medium transition-colors",
                  locked
                    ? "cursor-not-allowed bg-emerald-500/12 text-emerald-800 dark:bg-emerald-400/15 dark:text-emerald-100"
                    : "bg-primary/10 text-primary hover:bg-primary/15 dark:bg-primary/20"
                )}
              >
                {locked && <Lock className="size-3 shrink-0" aria-hidden />}
                {item}
                {!locked && <span aria-hidden> ×</span>}
              </button>
            );
          })}
        </div>
      )}

      <div className="max-h-[min(50vh,22rem)] space-y-3 overflow-y-auto pr-1">
        {filteredCategories.map((category) => {
          const isOpen = expanded[category.slug] ?? true;
          return (
            <div
              key={category.slug}
              className="rounded-xl border border-stroke/80 dark:border-white/[0.08]"
            >
              <button
                type="button"
                onClick={() =>
                  setExpanded((prev) => ({ ...prev, [category.slug]: !isOpen }))
                }
                className="flex w-full items-center justify-between gap-2 px-3 py-2.5 text-left"
              >
                <span className="text-sm font-semibold text-dark dark:text-white">
                  {category.label}
                </span>
                <ChevronDown
                  className={cn(
                    "size-4 shrink-0 text-dark-5 transition-transform dark:text-[#9CA3AF]",
                    isOpen && "rotate-180"
                  )}
                />
              </button>
              {isOpen && (
                <ul className="space-y-1 border-t border-stroke/60 px-3 py-2 dark:border-white/[0.06]">
                  {category.specializations.map((item) => {
                    const checked = value.includes(item);
                    const locked = lockedSet.has(item);
                    return (
                      <li key={item}>
                        <label
                          className={cn(
                            "flex items-start gap-2.5 rounded-lg px-1 py-1.5",
                            locked && checked
                              ? "cursor-not-allowed opacity-90"
                              : "cursor-pointer hover:bg-gray-1/80 dark:hover:bg-white/[0.04]"
                          )}
                        >
                          <input
                            type="checkbox"
                            checked={checked}
                            disabled={locked && checked}
                            onChange={() => toggle(item)}
                            className="mt-0.5 size-4 shrink-0 rounded border-stroke text-primary focus:ring-primary/30 disabled:cursor-not-allowed dark:border-white/[0.2]"
                          />
                          <span className="inline-flex items-center gap-1.5 text-sm text-dark dark:text-white">
                            {item}
                            {locked && checked && (
                              <Lock className="size-3 text-emerald-600 dark:text-emerald-400" aria-hidden />
                            )}
                          </span>
                        </label>
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
