type FilterChip = {
    value: string;
    label: string;
};

type FilterChipsProps = {
    options: FilterChip[];
    value: string;
    onChange: (value: string) => void;
    label?: string;
};

export function FilterChips({ options, value, onChange, label }: FilterChipsProps) {
    return (
        <div>
            {label && (
                <p className="mb-2.5 text-xs font-medium text-gray-500">{label}</p>
            )}
            <div
                className="flex gap-2 overflow-x-auto pb-0.5 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
                role="tablist"
                aria-label={label ?? "Filtre"}
            >
                {options.map((opt) => {
                    const active = value === opt.value;
                    return (
                        <button
                            key={opt.value}
                            type="button"
                            role="tab"
                            aria-selected={active}
                            onClick={() => onChange(opt.value)}
                            className={`shrink-0 rounded-full px-4 py-2 text-sm font-medium transition-all ${
                                active
                                    ? "bg-[#002050] text-white shadow-sm"
                                    : "bg-[#002050]/5 text-[#002050]/80 hover:bg-[#002050]/10"
                            }`}
                        >
                            {opt.label}
                        </button>
                    );
                })}
            </div>
        </div>
    );
}

export default FilterChips;
