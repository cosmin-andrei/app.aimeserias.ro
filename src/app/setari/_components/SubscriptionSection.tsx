"use client";

import { CheckCircle2 } from "lucide-react";
import { useEffect, useState } from "react";
import subscriptions from "@/data/subscriptions.json";
import { useToast } from "@/contexts/ToastContext";
import { useUser } from "@/hooks/useUser";
import { fetchCurrentUser, updateUserProfile } from "@/lib/api-client";
import { cn } from "@/lib/utils";

export type SubscriptionPlanId = "gratuit" | "profesional" | "firma";

type SubscriptionPlan = {
  id: SubscriptionPlanId;
  name: string;
  price: string;
  priceOriginal?: string;
  period: string;
  description: string;
  highlighted: boolean;
  badge?: string;
  features: string[];
};

const PLANS = subscriptions.plans as SubscriptionPlan[];

function PlanPricing({ plan }: { plan: SubscriptionPlan }) {
  return (
    <div className="mt-3">
      {plan.priceOriginal && (
        <span className="text-sm font-medium text-gray-400 line-through dark:text-[#9CA3AF]">
          {plan.priceOriginal}
        </span>
      )}
      <div className={`flex items-end gap-1 ${plan.priceOriginal ? "mt-1" : ""}`}>
        <span className="text-3xl font-bold tracking-tight text-[#002050] dark:text-white">
          {plan.price}
        </span>
        <span className="pb-1 text-sm text-gray-500 dark:text-[#9CA3AF]">{plan.period}</span>
      </div>
    </div>
  );
}

export function SubscriptionSection() {
  const { user, refetch } = useUser();
  const { addToast } = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [currentPlanId, setCurrentPlanId] = useState<SubscriptionPlanId>("gratuit");
  const [selectedPlanId, setSelectedPlanId] = useState<SubscriptionPlanId>("gratuit");

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    fetchCurrentUser()
      .then((appUser) => {
        if (cancelled) return;
        const plan = (appUser?.subscription_plan as SubscriptionPlanId) || "gratuit";
        const valid = PLANS.some((p) => p.id === plan) ? plan : "gratuit";
        setCurrentPlanId(valid);
        setSelectedPlanId(valid);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [user?.id]);

  const currentPlan = PLANS.find((p) => p.id === currentPlanId) ?? PLANS[0];
  const hasChanges = selectedPlanId !== currentPlanId;

  const handleSave = async () => {
    if (!hasChanges || saving) return;
    setSaving(true);
    const { success, error } = await updateUserProfile({ subscription_plan: selectedPlanId });
    setSaving(false);

    if (!success) {
      addToast("error", error || "Nu am putut actualiza abonamentul.");
      return;
    }

    setCurrentPlanId(selectedPlanId);
    await refetch();
    addToast(
      "success",
      selectedPlanId === "gratuit"
        ? "Ai trecut la planul Gratuit."
        : `Planul ${PLANS.find((p) => p.id === selectedPlanId)?.name} a fost activat.`
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center gap-2 p-12 text-sm text-dark-5 dark:text-[#9CA3AF]">
        <span className="size-5 animate-spin rounded-full border-2 border-primary border-t-transparent" aria-hidden />
        Se încarcă abonamentul…
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h2 className="text-lg font-semibold text-dark dark:text-white">Abonament</h2>
        </div>
        {hasChanges && (
          <button
            type="button"
            onClick={handleSave}
            disabled={saving}
            className="inline-flex shrink-0 items-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-medium text-white shadow-sm transition-colors hover:bg-primary/90 disabled:opacity-50"
          >
            {saving ? "Se salvează…" : "Confirmă schimbarea"}
          </button>
        )}
      </div>

      <div className="rounded-xl border border-[#0060f0]/25 bg-[#0060f0]/5 px-4 py-4 dark:border-[#0060f0]/30 dark:bg-[#0060f0]/10">
        <p className="text-xs font-semibold uppercase tracking-wider text-dark-5 dark:text-[#9CA3AF]">
          Planul tău actual
        </p>
        <div className="mt-2 flex flex-wrap items-baseline gap-x-3 gap-y-1">
          <p className="text-xl font-semibold text-dark dark:text-white">{currentPlan.name}</p>
          <p className="text-sm text-dark-5 dark:text-[#9CA3AF]">
            {currentPlan.price}
            {currentPlan.period}
          </p>
        </div>
        <p className="mt-1 text-sm text-dark-5 dark:text-[#9CA3AF]">{currentPlan.description}</p>
      </div>

      <div>
        <p className="mb-4 text-sm font-medium text-dark dark:text-white">Alege un alt plan</p>
        <div className="grid gap-5 lg:grid-cols-3 lg:items-stretch">
          {PLANS.map((plan) => {
            const isCurrent = plan.id === currentPlanId;
            const isSelected = plan.id === selectedPlanId;

            return (
              <article
                key={plan.id}
                className={cn(
                  "relative flex flex-col rounded-2xl border p-5 shadow-sm transition-all md:p-6",
                  isSelected
                    ? "border-[#002050]/40 bg-white ring-2 ring-[#002050]/20 dark:border-[#5b9fff]/40 dark:bg-[#1A1A1A] dark:ring-[#5b9fff]/25"
                    : "border-stroke bg-white hover:border-[#002050]/20 dark:border-white/[0.08] dark:bg-[#1A1A1A] dark:hover:border-white/[0.14]",
                  plan.highlighted && !isSelected && "lg:-translate-y-0.5"
                )}
              >
                {plan.badge && (
                  <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-[#002050] px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-white shadow-sm dark:bg-[#0060f0]">
                    {plan.badge}
                  </span>
                )}

                {isCurrent && (
                  <span className="absolute right-4 top-4 inline-flex items-center gap-1 rounded-full bg-green-600/10 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-green-700 dark:bg-green-500/15 dark:text-green-400">
                    <CheckCircle2 className="size-3" />
                    Activ
                  </span>
                )}

                <div>
                  <h3 className="text-lg font-bold text-gray-900 dark:text-white">{plan.name}</h3>
                  <PlanPricing plan={plan} />
                  <p className="mt-3 text-sm leading-relaxed text-gray-600 dark:text-[#9CA3AF]">
                    {plan.description}
                  </p>
                </div>

                <ul className="mt-5 flex-1 space-y-2">
                  {plan.features.map((feature) => (
                    <li
                      key={feature}
                      className="flex items-start gap-2 text-sm text-gray-700 dark:text-[#C4C7CE]"
                    >
                      <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-[#002050] dark:text-[#5b9fff]" />
                      {feature}
                    </li>
                  ))}
                </ul>

                <button
                  type="button"
                  onClick={() => setSelectedPlanId(plan.id)}
                  disabled={isCurrent && !hasChanges}
                  className={cn(
                    "mt-6 w-full rounded-xl px-4 py-2.5 text-sm font-semibold transition-colors",
                    isSelected
                      ? "bg-[#002050] text-white dark:bg-[#0060f0]"
                      : "border border-stroke bg-white text-dark hover:bg-gray-1 dark:border-white/[0.12] dark:bg-white/[0.06] dark:text-white dark:hover:bg-white/[0.1]",
                    isCurrent && isSelected && "opacity-70"
                  )}
                >
                  {isCurrent ? "Plan curent" : isSelected ? "Selectat" : `Alege ${plan.name}`}
                </button>
              </article>
            );
          })}
        </div>
      </div>

      {selectedPlanId !== "gratuit" && hasChanges && (
        <p className="text-xs text-dark-5 dark:text-[#9CA3AF]">
          Plata online va fi disponibilă în curând. Până atunci, planul selectat se activează imediat în contul
          tău.
        </p>
      )}
    </div>
  );
}
