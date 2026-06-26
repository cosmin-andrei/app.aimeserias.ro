import { Suspense } from "react";
import ProjectsListing from "./ProjectsListing";

function ListingFallback() {
    return (
        <div className="flex min-h-[40vh] items-center justify-center">
            <p className="text-sm text-dark-5 dark:text-[#9CA3AF]">Se încarcă proiectele...</p>
        </div>
    );
}

export default function ProjectsPage() {
    return (
        <Suspense fallback={<ListingFallback />}>
            <ProjectsListing />
        </Suspense>
    );
}
