type PaginationProps = {
    currentPage: number;
    totalPages: number;
    onPrev: () => void;
    onNext: () => void;
};

export function Pagination({ currentPage, totalPages, onPrev, onNext }: PaginationProps) {
    return (
        <div className="mb-8 mt-10 flex flex-col items-center justify-center gap-4 px-4 sm:flex-row">
            <button
                type="button"
                onClick={onPrev}
                disabled={currentPage === 1}
                className={`rounded-lg px-5 py-2.5 text-sm font-semibold transition-all ${
                    currentPage === 1
                        ? "cursor-not-allowed border border-stroke bg-gray-2 text-dark-5 dark:border-white/[0.08] dark:bg-white/[0.04] dark:text-[#6B7280]"
                        : "bg-[#002050] text-white shadow-md hover:bg-[#001040] dark:bg-[#f1f6ff] dark:text-[#08080a] dark:hover:bg-white"
                }`}
            >
                &laquo; Pagina anterioară
            </button>
            <span className="text-sm font-semibold text-dark dark:text-[#E5E7EB]">
                Pagina {currentPage} din {totalPages}
            </span>
            <button
                type="button"
                onClick={onNext}
                disabled={currentPage === totalPages}
                className={`rounded-lg px-5 py-2.5 text-sm font-semibold transition-all ${
                    currentPage === totalPages
                        ? "cursor-not-allowed border border-stroke bg-gray-2 text-dark-5 dark:border-white/[0.08] dark:bg-white/[0.04] dark:text-[#6B7280]"
                        : "bg-[#002050] text-white shadow-md hover:bg-[#001040] dark:bg-[#f1f6ff] dark:text-[#08080a] dark:hover:bg-white"
                }`}
            >
                Următoarea pagină &raquo;
            </button>
        </div>
    );
}

export default Pagination;
