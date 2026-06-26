"use client";

import { useEffect } from "react";
import { Loader2 } from "lucide-react";
import { usePathname, useRouter } from "next/navigation";
import { useUser } from "@/hooks/useUser";
import {
    getCompanyOnboardingPath,
    isCompanyAccountActive,
    isCompanyAccount,
} from "@/lib/company-account";

export function CompanyAccountGuard() {
    const { user, loading } = useUser();
    const pathname = usePathname();
    const router = useRouter();

    const onboardingPath = getCompanyOnboardingPath();
    const onOnboarding =
        pathname === onboardingPath || pathname.startsWith(`${onboardingPath}/`);

    const blockForOnboarding =
        !loading &&
        Boolean(user) &&
        isCompanyAccount(user) &&
        !isCompanyAccountActive(user) &&
        !onOnboarding;

    const blockForDashboard =
        !loading &&
        Boolean(user) &&
        isCompanyAccountActive(user) &&
        onOnboarding;

    useEffect(() => {
        if (loading || !user) return;

        if (blockForOnboarding) {
            router.replace(onboardingPath);
            return;
        }

        if (blockForDashboard) {
            router.replace("/");
        }
    }, [user, loading, blockForOnboarding, blockForDashboard, onboardingPath, router]);

    if (blockForOnboarding || blockForDashboard) {
        return (
            <div className="fixed inset-0 z-[200] flex items-center justify-center bg-[#0f1115]">
                <Loader2 className="size-8 animate-spin text-[#2eb8f0]" aria-hidden />
            </div>
        );
    }

    return null;
}
