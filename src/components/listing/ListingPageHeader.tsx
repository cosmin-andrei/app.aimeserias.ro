type ListingPageHeaderProps = {
    title: string;
    description?: string;
    resultCount?: number;
    resultLabel?: string;
};

export function ListingPageHeader({
    title,
    description,
    resultCount,
    resultLabel = "rezultate",
}: ListingPageHeaderProps) {
    return (
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div>
                <h1 className="text-2xl font-bold tracking-tight text-gray-900 md:text-3xl">{title}</h1>
                {description && (
                    <p className="mt-2 max-w-2xl text-sm leading-relaxed text-gray-600 md:text-base">
                        {description}
                    </p>
                )}
            </div>
            {resultCount != null && (
                <p className="shrink-0 text-sm text-gray-500">
                    <span className="font-semibold text-[#002050]">{resultCount}</span> {resultLabel}
                </p>
            )}
        </div>
    );
}

export default ListingPageHeader;
