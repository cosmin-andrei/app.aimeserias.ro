"use client";

import { Building2, LayoutGrid, User, Users, type LucideIcon } from "lucide-react";
import { ListingSelect, type ListingSelectOption } from "./ListingSelect";

const TYPE_ICONS: Record<string, LucideIcon> = {
    toate: LayoutGrid,
    individual: User,
    pfa: User,
    firma: Building2,
};

function TypeIconBadge({ type, active }: { type: string; active: boolean }) {
    const Icon = TYPE_ICONS[type] ?? Users;

    return (
        <span
            className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-md ${
                active ? "bg-[#0060f0] text-white" : "bg-[#0060f0]/10 text-[#0060f0]"
            }`}
        >
            <Icon className="h-3.5 w-3.5" aria-hidden />
        </span>
    );
}

type MeseriasTypeSelectProps = {
    value: string;
    options: ListingSelectOption[];
    onChange: (value: string) => void;
};

export function MeseriasTypeSelect({ value, options, onChange }: MeseriasTypeSelectProps) {
    return (
        <ListingSelect
            value={value}
            options={options}
            onChange={onChange}
            ariaLabel="Tip meseriaș"
            renderLeading={(option, active) => (
                <TypeIconBadge type={option.value} active={active} />
            )}
        />
    );
}

export default MeseriasTypeSelect;
