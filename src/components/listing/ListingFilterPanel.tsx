import type { ReactNode } from "react";

type ListingFilterPanelProps = {
    children: ReactNode;
};

export function ListingFilterPanel({ children }: ListingFilterPanelProps) {
    return (
        <div className="rounded-2xl border border-[#002050]/[0.07] bg-[#fafcff]/80 p-4 md:p-5">
            {children}
        </div>
    );
}

export default ListingFilterPanel;
