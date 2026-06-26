import { Building2, UserSearch, Wrench } from "lucide-react";
import type { LucideIcon } from "lucide-react";

export type AccountQualityId = "client" | "worker" | "company";

export type AccountQuality = {
  id: AccountQualityId;
  title: string;
  description: string;
  apiRole: "client" | "worker";
  icon: LucideIcon;
};

export const ACCOUNT_QUALITIES: AccountQuality[] = [
  {
    id: "client",
    title: "Client",
    description: "Caut meseriași pentru casa sau afacerea mea",
    apiRole: "client",
    icon: UserSearch,
  },
  {
    id: "worker",
    title: "Meseriaș",
    description: "Ofer servicii ca profesionist autorizat",
    apiRole: "worker",
    icon: Wrench,
  },
  {
    id: "company",
    title: "Companie",
    description: "Reprezint o companie sau o echipă de meseriași",
    apiRole: "worker",
    icon: Building2,
  },
];

export function resolveAccountQuality(role?: string | null): AccountQuality {
  if (role === "client") {
    return ACCOUNT_QUALITIES.find((q) => q.id === "client")!;
  }
  if (role === "company") {
    return ACCOUNT_QUALITIES.find((q) => q.id === "company")!;
  }
  return ACCOUNT_QUALITIES.find((q) => q.id === "worker")!;
}
