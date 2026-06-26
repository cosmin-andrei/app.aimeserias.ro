"use client";

import { useUser } from "@/hooks/useUser";
import { pageWidthClass } from "@/lib/page-layout";
import { normalizeUserRole } from "@/lib/site";
import { DashboardSummaryCards } from "./dashboard-summary-cards";
import { LatestProjectsSection } from "./latest-projects-section";
import { MyOffersProjectsSection } from "./my-offers-projects-section";
import { MyProjectsSection } from "./my-projects-section";

export function DashboardContent() {
  const { user, loading } = useUser();
  const role = normalizeUserRole(user?.role);
  const isClient = role === "client";
  const isWorker = role === "worker";

  return (
    <div className={`${pageWidthClass} animate-auth-step-forward space-y-6 pb-8`}>
      <DashboardSummaryCards />

      {!loading && isWorker && <MyOffersProjectsSection />}
      {!loading && isClient && <MyProjectsSection />}

      <LatestProjectsSection />
    </div>
  );
}
