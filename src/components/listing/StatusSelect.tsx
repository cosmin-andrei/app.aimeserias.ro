"use client";

import { ListingSelect, type ListingSelectOption } from "@/components/listing/ListingSelect";

const STATUS_DOT_COLORS: Record<string, string> = {
    toate: "bg-gray-300",
    "Caut meseriași": "bg-amber-400",
    "În desfășurare": "bg-[#0060f0]",
    Finalizat: "bg-emerald-500",
};

function StatusDotBadge({ status }: { status: string }) {
    const dotColor = STATUS_DOT_COLORS[status] ?? STATUS_DOT_COLORS.toate;

    return (
        <span
            className={`h-2.5 w-2.5 shrink-0 rounded-full ${dotColor}`}
            aria-hidden
        />
    );
}

type StatusSelectProps = {
    value: string;
    options: ListingSelectOption[];
    onChange: (value: string) => void;
};

export function StatusSelect({ value, options, onChange }: StatusSelectProps) {
    return (
        <ListingSelect
            value={value}
            options={options}
            onChange={onChange}
            ariaLabel="Stadiu proiect"
            renderLeading={(option) => (
                <StatusDotBadge status={option.value} />
            )}
        />
    );
}

export default StatusSelect;
