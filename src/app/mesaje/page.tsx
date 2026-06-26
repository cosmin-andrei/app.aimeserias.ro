import { Suspense } from "react";
import { MesajeView } from "./MesajeView";
import { Skeleton } from "@/components/ui/skeleton";

function MesajeFallback() {
    return (
        <div className="mx-auto flex w-full max-w-6xl flex-col gap-3 px-4 py-6">
            <Skeleton className="h-8 w-32" />
            <div className="flex min-h-[50vh] overflow-hidden rounded-2xl border border-stroke">
                <Skeleton className="hidden h-full w-80 shrink-0 md:block" />
                <Skeleton className="min-h-[50vh] flex-1" />
            </div>
        </div>
    );
}

export default function MesajePage() {
    return (
        <Suspense fallback={<MesajeFallback />}>
            <MesajeView />
        </Suspense>
    );
}
