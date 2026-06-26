type FilterSectionProps = {
    title: string;
    children: React.ReactNode;
};

export function FilterSection({ title, children }: FilterSectionProps) {
    return (
        <div className="border-b border-gray-100 px-6 py-3.5 last:border-b-0 dark:border-white/[0.06]">
            <h3 className="mb-2.5 text-[13px] font-semibold text-[#002050] dark:text-white">{title}</h3>
            {children}
        </div>
    );
}

export default FilterSection;
