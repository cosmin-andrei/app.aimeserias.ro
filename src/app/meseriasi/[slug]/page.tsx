import type { Metadata } from "next";
import { CompanyDetailView } from "../CompanyDetailView";
import { MeseriasDetailView } from "../MeseriasDetailView";
import { parseCompanySlug } from "@/lib/marketplace-mappers";

type PageProps = {
  params: Promise<{ slug: string }>;
};

export const metadata: Metadata = {
  title: "Profil meseriaș",
};

export default async function MeseriasDetailPage({ params }: PageProps) {
  const { slug } = await params;
  const companyUserId = parseCompanySlug(slug);

  if (companyUserId) {
    return <CompanyDetailView companyUserId={companyUserId} />;
  }

  const workerId = Number(slug);

  if (!Number.isFinite(workerId) || workerId <= 0) {
    return <MeseriasDetailView workerId={-1} />;
  }

  return <MeseriasDetailView workerId={workerId} />;
}
