import type { Metadata } from "next";
import { ProjectDetailView } from "../ProjectDetailView";

type PageProps = {
  params: Promise<{ slug: string }>;
};

export const metadata: Metadata = {
  title: "Detalii proiect",
};

export default async function ProjectDetailPage({ params }: PageProps) {
  const { slug } = await params;
  const jobId = Number(slug);

  if (!Number.isFinite(jobId) || jobId <= 0) {
    return <ProjectDetailView jobId={-1} />;
  }

  return <ProjectDetailView jobId={jobId} />;
}
