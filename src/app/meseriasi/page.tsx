import { Suspense } from "react";
import MeseriasiListing from "./MeseriasiListing";

function ListingFallback() {
    return (
        <div className="flex min-h-[50vh] items-center justify-center">
            <p className="text-sm text-dark-5 dark:text-[#9CA3AF]">Se încarcă meseriașii...</p>
        </div>
    );
}

export default function MeseriasiPage() {
    return (
        <Suspense fallback={<ListingFallback />}>
            <MeseriasiListing />
        </Suspense>
    );
}
