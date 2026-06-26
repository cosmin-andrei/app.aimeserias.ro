"use client";

import {
  CheckCircle2,
  Clock,
  Database,
  Download,
  CreditCard,
  Building2,
  ContactRound,
  Info,
  Key,
  Mail,
  Monitor,
  Shield,
  Trash2,
  User,
  X,
} from "lucide-react";
import { useEffect, useMemo, useRef, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { getSecurityActivity, getSessions, redirectToSsoLogin, requestPasswordResetLink, revokeSession, type SecurityActivityItem, type SsoSession } from "@/lib/auth-client";
import { deleteAccount as deleteLocalAccount, updateUserProfile } from "@/lib/api-client";
import { useUser } from "@/hooks/useUser";
import { isCompanyAccount } from "@/lib/company-account";
import { useToast } from "@/contexts/ToastContext";
import { PersonalInfoSection } from "./_components/PersonalInfoSection";
import { CompanyInfoSection } from "./_components/CompanyInfoSection";
import { PublicProfileSection } from "./_components/PublicProfileSection";
import { SubscriptionSection } from "./_components/SubscriptionSection";

const BASE_TABS = [
  { id: "personal", label: "Informații personale", icon: User },
  { id: "company", label: "Informații companie", icon: Building2, companyOnly: true },
  { id: "public", label: "Profil public", icon: ContactRound, workerOnly: true },
  { id: "subscription", label: "Abonament", icon: CreditCard, workerOnly: true },
  { id: "security", label: "Securitate", icon: Shield },
  { id: "data", label: "Datele tale", icon: Database },
] as const;

const SESSIONS_PREVIEW_COUNT = 3;
const ACTIVITY_DAYS = 30;
const ACTIVITY_PAGE_SIZE = 10;
const SESSIONS_PAGE_SIZE = 10;

const SECURITY_ACTIVITY_PREVIEW_COUNT = 3;

/** Opțiuni 2FA – pe viitor se pot adăuga aplicație authenticator, SMS etc. */
const TWO_FA_OPTIONS = [
  {
    id: "email" as const,
    label: "Cod pe email",
    description: "La fiecare conectare primești un cod pe email pe care îl introduci după parolă.",
    icon: Mail,
  },
  // Exemplu pentru viitor: { id: "authenticator", label: "Aplicație authenticator", description: "...", icon: Smartphone },
];

const MODAL_ANIMATION_MS = 160;
const MODAL_POPUP_BASE = "rounded-xl p-6";
const MODAL_BACKDROP_BASE = "[&::backdrop]:bg-black/50 [&::backdrop]:backdrop-blur-md";
function modalBackdropClasses(closed: boolean, entered: boolean) {
  if (closed) return "[&::backdrop]:animate-backdrop-exit";
  if (entered) return "[&::backdrop]:animate-backdrop-enter";
  return "[&::backdrop]:opacity-0";
}
function modalContentClasses(closed: boolean, entered: boolean) {
  if (closed) return "animate-modal-exit";
  if (entered) return "animate-modal-enter";
  return "opacity-0 pointer-events-none";
}

function TabFromQuery({
  allowedTabs,
  onTab,
}: {
  allowedTabs: readonly string[];
  onTab: (tab: string) => void;
}) {
  const searchParams = useSearchParams();
  useEffect(() => {
    const tab = searchParams.get("tab");
    if (tab && allowedTabs.includes(tab)) {
      onTab(tab);
    }
  }, [searchParams, allowedTabs, onTab]);
  return null;
}

function ActivityListItem({ a }: { a: SecurityActivityItem }) {
  return (
    <li className="flex items-start gap-3 rounded-xl border border-stroke/80 bg-white/80 px-4 py-3 transition-colors hover:border-stroke hover:bg-gray-1/80 dark:border-white/[0.1] dark:bg-white/[0.04] dark:hover:bg-white/[0.06]">
      <span
        className={`flex size-9 shrink-0 items-center justify-center rounded-lg ${
          a.icon === "check"
            ? "bg-green-500/15 text-green-600 dark:bg-green-500/20 dark:text-green-400"
            : "bg-gray-2/80 text-dark-5 dark:bg-white/[0.08] dark:text-[#9CA3AF]"
        }`}
      >
        {a.icon === "check" ? (
          <CheckCircle2 className="size-4" strokeWidth={2} />
        ) : (
          <Info className="size-4" strokeWidth={2} />
        )}
      </span>
      <div className="min-w-0 flex-1">
        <p className="font-medium text-dark dark:text-white">{a.type}</p>
        <p className="mt-0.5 text-sm text-dark-5 dark:text-[#9CA3AF] line-clamp-2">
          {a.details}
          {a.ip ? ` · ${a.ip}` : ""}
        </p>
        <p className="mt-1 text-xs text-dark-5 dark:text-[#9CA3AF]">{a.date}</p>
      </div>
    </li>
  );
}

export default function SetariPage() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center p-12 text-sm text-dark-5 dark:text-[#9CA3AF]">
          Se încarcă setările…
        </div>
      }
    >
      <SetariPageContent />
    </Suspense>
  );
}

function SetariPageContent() {
  const { user, refetch } = useUser();
  const [activeTab, setActiveTab] = useState<string>("personal");
  const [securityActivity, setSecurityActivity] = useState<SecurityActivityItem[]>([]);
  const [securityActivityLoading, setSecurityActivityLoading] = useState(false);
  const [securityActivityError, setSecurityActivityError] = useState<string | null>(null);
  const [securityActivityModalOpen, setSecurityActivityModalOpen] = useState(false);
  const [securityActivityAll, setSecurityActivityAll] = useState<SecurityActivityItem[]>([]);
  const [securityActivityAllLoading, setSecurityActivityAllLoading] = useState(false);
  const [securityActivityAllError, setSecurityActivityAllError] = useState<string | null>(null);
  const [securityActivityPage, setSecurityActivityPage] = useState(1);
  const securityActivityDialogRef = useRef<HTMLDialogElement>(null);
  const [twoFAModalOpen, setTwoFAModalOpen] = useState(false);
  const [twoFASaving, setTwoFASaving] = useState(false);
  const [twoFAEnabled, setTwoFAEnabled] = useState(false);
  const twoFADialogRef = useRef<HTMLDialogElement>(null);
  const [passwordResetModalOpen, setPasswordResetModalOpen] = useState(false);
  const [passwordResetSending, setPasswordResetSending] = useState(false);
  const passwordResetDialogRef = useRef<HTMLDialogElement>(null);
  const [sessions, setSessions] = useState<SsoSession[]>([]);
  const [sessionsLoading, setSessionsLoading] = useState(false);
  const [sessionsError, setSessionsError] = useState<string | null>(null);
  const [sessionsModalOpen, setSessionsModalOpen] = useState(false);
  const [sessionsModalLoading, setSessionsModalLoading] = useState(false);
  const [sessionsPage, setSessionsPage] = useState(1);
  const [revokingId, setRevokingId] = useState<string | null>(null);
  const sessionsDialogRef = useRef<HTMLDialogElement>(null);
  const [deleteAccountModalOpen, setDeleteAccountModalOpen] = useState(false);
  const [deleteAccountCheckbox, setDeleteAccountCheckbox] = useState(false);
  const [deleteAccountLoading, setDeleteAccountLoading] = useState(false);
  const [deleteAccountError, setDeleteAccountError] = useState<string | null>(null);
  const deleteAccountDialogRef = useRef<HTMLDialogElement>(null);
  const [securityActivityClosing, setSecurityActivityClosing] = useState(false);
  const [securityActivityOpenAnimated, setSecurityActivityOpenAnimated] = useState(false);
  const [twoFAClosing, setTwoFAClosing] = useState(false);
  const [twoFAOpenAnimated, setTwoFAOpenAnimated] = useState(false);
  const [passwordResetClosing, setPasswordResetClosing] = useState(false);
  const [passwordResetOpenAnimated, setPasswordResetOpenAnimated] = useState(false);
  const [sessionsClosing, setSessionsClosing] = useState(false);
  const [sessionsOpenAnimated, setSessionsOpenAnimated] = useState(false);
  const [deleteAccountClosing, setDeleteAccountClosing] = useState(false);
  const [deleteAccountOpenAnimated, setDeleteAccountOpenAnimated] = useState(false);
  const { addToast } = useToast();

  const tabs = useMemo(() => {
    const isCompany = isCompanyAccount(user);
    return BASE_TABS.filter((tab) => {
      if ("companyOnly" in tab && tab.companyOnly) return isCompany;
      if ("workerOnly" in tab && tab.workerOnly) return user?.role === "worker";
      return true;
    });
  }, [user]);
  const tabIds = useMemo(() => tabs.map((t) => t.id), [tabs]);

  const canConfirmDelete = deleteAccountCheckbox;

  useEffect(() => {
    if (activeTab !== "security") return;
    setSecurityActivityLoading(true);
    setSecurityActivityError(null);
    getSecurityActivity({ limit: SECURITY_ACTIVITY_PREVIEW_COUNT, days: ACTIVITY_DAYS })
      .then(({ activities, error }) => {
        setSecurityActivity(activities);
        setSecurityActivityError(error ?? null);
      })
      .finally(() => setSecurityActivityLoading(false));
  }, [activeTab]);

  useEffect(() => {
    if (activeTab !== "security") return;
    setSessionsLoading(true);
    setSessionsError(null);
    getSessions()
      .then(({ sessions: list, error }) => {
        setSessions(list);
        setSessionsError(error ?? null);
      })
      .finally(() => setSessionsLoading(false));
  }, [activeTab]);

  useEffect(() => {
    if (!securityActivityModalOpen) return;
    setSecurityActivityOpenAnimated(false);
    const id = requestAnimationFrame(() => {
      securityActivityDialogRef.current?.showModal();
      requestAnimationFrame(() => setSecurityActivityOpenAnimated(true));
    });
    return () => cancelAnimationFrame(id);
  }, [securityActivityModalOpen]);

  const openSecurityActivityModal = () => {
    setSecurityActivityModalOpen(true);
    setSecurityActivityPage(1);
    setSecurityActivityAllLoading(true);
    setSecurityActivityAllError(null);
    getSecurityActivity({ limit: 50, days: ACTIVITY_DAYS })
      .then(({ activities, error }) => {
        setSecurityActivityAll(activities);
        setSecurityActivityAllError(error ?? null);
      })
      .finally(() => setSecurityActivityAllLoading(false));
  };

  const closeSecurityActivityModal = () => {
    setSecurityActivityClosing(true);
    setTimeout(() => {
      securityActivityDialogRef.current?.close();
      setSecurityActivityModalOpen(false);
      setSecurityActivityClosing(false);
      setSecurityActivityOpenAnimated(false);
    }, MODAL_ANIMATION_MS);
  };

  useEffect(() => {
    if (!deleteAccountModalOpen) return;
    setDeleteAccountOpenAnimated(false);
    setDeleteAccountCheckbox(false);
    setDeleteAccountError(null);
    deleteAccountDialogRef.current?.showModal();
    const id = requestAnimationFrame(() => {
      requestAnimationFrame(() => setDeleteAccountOpenAnimated(true));
    });
    return () => cancelAnimationFrame(id);
  }, [deleteAccountModalOpen]);

  const openDeleteAccountModal = () => setDeleteAccountModalOpen(true);
  const closeDeleteAccountModal = () => {
    setDeleteAccountClosing(true);
    setTimeout(() => {
      deleteAccountDialogRef.current?.close();
      setDeleteAccountModalOpen(false);
      setDeleteAccountClosing(false);
      setDeleteAccountOpenAnimated(false);
    }, MODAL_ANIMATION_MS);
  };

  const handleConfirmDeleteAccount = async () => {
    if (!canConfirmDelete || deleteAccountLoading) return;
    setDeleteAccountLoading(true);
    setDeleteAccountError(null);
    const { success, message } = await deleteLocalAccount();
    setDeleteAccountLoading(false);
    if (success) {
      closeDeleteAccountModal();
      window.location.assign("/auth/sign-in");
      return;
    }
    setDeleteAccountError(message ?? "Eroare la ștergerea contului.");
  };

  useEffect(() => {
    if (!twoFAModalOpen) return;
    setTwoFAEnabled(!!user?.two_factor_email);
    setTwoFAOpenAnimated(false);
    twoFADialogRef.current?.showModal();
    const id = requestAnimationFrame(() => {
      requestAnimationFrame(() => setTwoFAOpenAnimated(true));
    });
    return () => cancelAnimationFrame(id);
  }, [twoFAModalOpen, user?.two_factor_email]);

  const openTwoFAModal = () => setTwoFAModalOpen(true);
  const closeTwoFAModal = () => {
    setTwoFAClosing(true);
    setTimeout(() => {
      twoFADialogRef.current?.close();
      setTwoFAModalOpen(false);
      setTwoFAClosing(false);
      setTwoFAOpenAnimated(false);
    }, MODAL_ANIMATION_MS);
  };
  const saveTwoFA = async () => {
    setTwoFASaving(true);
    const { success, error } = await updateUserProfile({ two_factor_email: twoFAEnabled });
    setTwoFASaving(false);
    if (success) {
      await refetch();
      addToast(
        "success",
        twoFAEnabled
          ? "Verificarea în doi pași prin email a fost activată."
          : "Verificarea în doi pași prin email a fost dezactivată."
      );
      closeTwoFAModal();
    } else {
      addToast("error", error || "Eroare la salvare.");
    }
  };

  useEffect(() => {
    if (!passwordResetModalOpen) return;
    setPasswordResetOpenAnimated(false);
    passwordResetDialogRef.current?.showModal();
    const id = requestAnimationFrame(() => {
      requestAnimationFrame(() => setPasswordResetOpenAnimated(true));
    });
    return () => cancelAnimationFrame(id);
  }, [passwordResetModalOpen]);

  const openPasswordResetModal = () => setPasswordResetModalOpen(true);
  const closePasswordResetModal = () => {
    setPasswordResetClosing(true);
    setTimeout(() => {
      passwordResetDialogRef.current?.close();
      setPasswordResetModalOpen(false);
      setPasswordResetClosing(false);
      setPasswordResetOpenAnimated(false);
    }, MODAL_ANIMATION_MS);
  };

  const sendPasswordResetLink = async () => {
    if (!user?.email) return;
    setPasswordResetSending(true);
    const { success, message } = await requestPasswordResetLink(user.email);
    setPasswordResetSending(false);
    if (success) {
      addToast("success", `Am trimis un link la ${user.email}. Verifică inbox-ul (și spam). Deschide linkul pentru a seta parola nouă. Linkul expiră în 1 oră.`);
      closePasswordResetModal();
    } else {
      addToast("error", message || "Nu am putut trimite linkul. Încearcă din nou.");
    }
  };

  useEffect(() => {
    if (!sessionsModalOpen) return;
    setSessionsOpenAnimated(false);
    setSessionsPage(1);
    setSessionsModalLoading(true);
    const openId = requestAnimationFrame(() => {
      sessionsDialogRef.current?.showModal();
      requestAnimationFrame(() => setSessionsOpenAnimated(true));
    });
    getSessions()
      .then(({ sessions: list, error }) => {
        setSessions(list);
        setSessionsError(error ?? null);
      })
      .finally(() => setSessionsModalLoading(false));
    return () => cancelAnimationFrame(openId);
  }, [sessionsModalOpen]);

  const openSessionsModal = () => setSessionsModalOpen(true);
  const closeSessionsModal = () => {
    setSessionsClosing(true);
    setTimeout(() => {
      sessionsDialogRef.current?.close();
      setSessionsModalOpen(false);
      setSessionsClosing(false);
      setSessionsOpenAnimated(false);
    }, MODAL_ANIMATION_MS);
  };

  const handleRevokeSession = async (sessionId: string) => {
    setRevokingId(sessionId);
    const { success, message, currentSessionRevoked } = await revokeSession(sessionId);
    setRevokingId(null);
    if (success) {
      if (currentSessionRevoked) {
        addToast("success", "Sesiunea curentă a fost încheiată. Te rugăm să te conectezi din nou.");
        redirectToSsoLogin(typeof window !== "undefined" ? window.location.origin + "/setari" : "/setari");
        return;
      }
      setSessions((prev) => prev.filter((s) => s.id !== sessionId));
      addToast("success", "Sesiunea a fost încheiată.");
    } else {
      if (message?.toLowerCase().includes("autentificat") || message?.toLowerCase().includes("invalid")) {
        addToast("error", "Sesiunea a fost încheiată. Te rugăm să te conectezi din nou.");
        redirectToSsoLogin(typeof window !== "undefined" ? window.location.origin + "/setari" : "/setari");
        return;
      }
      addToast("error", message || "Eroare la încheierea sesiunii.");
    }
  };

  const sessionsPreview = sessions.slice(0, SESSIONS_PREVIEW_COUNT);

  return (
    <div className="w-full">
      <TabFromQuery allowedTabs={tabIds} onTab={setActiveTab} />
      <div className="rounded-xl bg-white shadow-sm ring-1 ring-stroke dark:bg-[#1A1A1A] dark:ring-white/[0.08]">
        <div className="border-b border-stroke px-6 py-5 dark:border-white/[0.08]">
          <h1 className="text-xl font-semibold tracking-tight text-dark dark:text-white sm:text-2xl">
            Setări cont
          </h1>

          <div className="mt-6 flex gap-1">
            {tabs.map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                type="button"
                onClick={() => setActiveTab(id)}
                className={`inline-flex items-center gap-2 rounded-lg px-4 py-2.5 text-sm font-medium transition-colors ${
                  activeTab === id
                    ? "bg-[#16366d]/15 text-[#16366d] dark:bg-[#f1f6ff] dark:text-dark"
                    : "text-dark-5 hover:bg-gray-2 hover:text-dark dark:text-[#9CA3AF] dark:hover:bg-white/[0.06] dark:hover:text-white"
                }`}
              >
                <Icon className="size-4 shrink-0" strokeWidth={2} />
                {label}
              </button>
            ))}
          </div>
        </div>

        {activeTab === "personal" && <PersonalInfoSection />}

        {activeTab === "company" && isCompanyAccount(user) && <CompanyInfoSection />}

        {activeTab === "public" && user?.role === "worker" && <PublicProfileSection />}

        {activeTab === "subscription" && user?.role === "worker" && <SubscriptionSection />}

        {activeTab === "security" && (
          <div className="space-y-8 p-6">
            <h2 className="text-lg font-semibold text-dark dark:text-white">
              Securitate și siguranța contului
            </h2>

            {/* Istoric activitate cont – ultimele 30 de zile */}
            <div className="rounded-xl border border-stroke bg-gray-2/50 px-4 py-4 dark:border-white/[0.08] dark:bg-white/[0.03]">
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <h3 className="font-medium text-dark dark:text-white">
                    Istoric activitate cont
                  </h3>
                  <p className="mt-0.5 text-sm text-dark-5 dark:text-[#9CA3AF]">
                    Activitate din ultimele 30 de zile
                  </p>
                </div>
                <button
                  type="button"
                  onClick={openSecurityActivityModal}
                  className="mt-2 inline-flex shrink-0 items-center gap-2 rounded-xl border border-stroke bg-white px-4 py-2.5 text-sm font-medium text-dark shadow-sm transition-all hover:bg-gray-1 dark:border-white/[0.12] dark:bg-white/[0.08] dark:text-white dark:hover:bg-white/[0.12] sm:mt-0"
                >
                  Vezi toate
                </button>
              </div>
              {securityActivityLoading ? (
                <p className="mt-4 text-sm text-dark-5 dark:text-[#9CA3AF]">Se încarcă...</p>
              ) : securityActivityError ? (
                <p className="mt-4 text-sm text-red dark:text-red-400">{securityActivityError}</p>
              ) : securityActivity.length === 0 ? (
                <p className="mt-4 text-sm text-dark-5 dark:text-[#9CA3AF]">
                  Nu există înregistrări în ultimele 30 de zile.
                </p>
              ) : (
                <ul className="mt-4 space-y-2">
                  {securityActivity.map((a) => (
                    <ActivityListItem key={a.id} a={a} />
                  ))}
                </ul>
              )}
            </div>

            {/* Modal: Istoric activitate cont – centrat pe ecran */}
            {securityActivityModalOpen && (
            <dialog
              ref={securityActivityDialogRef}
              className={`fixed inset-0 m-0 flex w-full min-h-[100dvh] max-h-[100dvh] items-center justify-center rounded-none border-0 bg-transparent p-4 outline-none ${MODAL_BACKDROP_BASE} ${modalBackdropClasses(securityActivityClosing, securityActivityOpenAnimated)}`}
              onCancel={(e) => {
                e.preventDefault();
                closeSecurityActivityModal();
              }}
              onClose={() => {
                setSecurityActivityModalOpen(false);
                setSecurityActivityClosing(false);
                setSecurityActivityOpenAnimated(false);
              }}
            >
              <div className={`${MODAL_POPUP_BASE} max-h-[calc(100dvh-2rem)] w-full max-w-lg overflow-hidden overflow-y-auto rounded-2xl border border-stroke bg-white shadow-xl dark:border-white/[0.08] dark:bg-[#1A1A1A] ${modalContentClasses(securityActivityClosing, securityActivityOpenAnimated)}`}>
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary dark:bg-primary/20">
                      <Clock className="size-5" strokeWidth={2} />
                    </span>
                    <div>
                      <h3 className="text-lg font-semibold text-dark dark:text-white">
                        Istoric activitate cont
                      </h3>
                      <p className="mt-0.5 text-sm text-dark-5 dark:text-[#9CA3AF]">
                        Activitate din ultimele 30 de zile
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={closeSecurityActivityModal}
                    className="shrink-0 rounded-lg p-1.5 text-dark-5 transition-colors hover:bg-gray-2 hover:text-dark dark:text-[#9CA3AF] dark:hover:bg-white/[0.08] dark:hover:text-white"
                    aria-label="Închide"
                  >
                    <X className="size-5" />
                  </button>
                </div>
                {securityActivityAllLoading ? (
                  <div className="mt-5 flex items-center justify-center gap-2 rounded-xl border border-stroke/80 bg-gray-2/50 py-8 dark:border-white/[0.1] dark:bg-white/[0.04]">
                    <span className="size-5 animate-spin rounded-full border-2 border-primary border-t-transparent" aria-hidden />
                    <p className="text-sm text-dark-5 dark:text-[#9CA3AF]">Se încarcă…</p>
                  </div>
                ) : securityActivityAllError ? (
                  <p className="mt-5 rounded-xl bg-red/10 px-4 py-3 text-sm text-red dark:bg-red/20 dark:text-red-400">
                    {securityActivityAllError}
                  </p>
                ) : securityActivityAll.length === 0 ? (
                  <div className="mt-5 rounded-xl border border-stroke/80 bg-gray-2/50 py-8 text-center dark:border-white/[0.1] dark:bg-white/[0.04]">
                    <p className="text-sm text-dark-5 dark:text-[#9CA3AF]">
                      Nu există înregistrări în ultimele 30 de zile.
                    </p>
                  </div>
                ) : (
                  <>
                    <ul className="mt-5 max-h-[65vh] space-y-2 overflow-y-auto pr-1">
                      {securityActivityAll
                        .slice((securityActivityPage - 1) * ACTIVITY_PAGE_SIZE, securityActivityPage * ACTIVITY_PAGE_SIZE)
                        .map((a) => (
                          <ActivityListItem key={a.id} a={a} />
                        ))}
                    </ul>
                    {securityActivityAll.length > ACTIVITY_PAGE_SIZE && (
                      <div className="mt-5 flex flex-wrap items-center justify-between gap-3 border-t border-stroke pt-4 dark:border-white/[0.08]">
                        <p className="text-xs text-dark-5 dark:text-[#9CA3AF]">
                          {securityActivityAll.length} în total · pagina {securityActivityPage} din {Math.ceil(securityActivityAll.length / ACTIVITY_PAGE_SIZE)}
                        </p>
                        <div className="flex gap-2">
                          <button
                            type="button"
                            onClick={() => setSecurityActivityPage((p) => Math.max(1, p - 1))}
                            disabled={securityActivityPage <= 1}
                            className="rounded-xl border border-stroke bg-white px-3 py-2 text-sm font-medium text-dark shadow-sm transition-colors hover:bg-gray-1 disabled:opacity-50 dark:border-white/[0.12] dark:bg-white/[0.08] dark:text-white dark:hover:bg-white/[0.12] dark:disabled:opacity-50"
                          >
                            Înapoi
                          </button>
                          <button
                            type="button"
                            onClick={() => setSecurityActivityPage((p) => Math.min(Math.ceil(securityActivityAll.length / ACTIVITY_PAGE_SIZE), p + 1))}
                            disabled={securityActivityPage >= Math.ceil(securityActivityAll.length / ACTIVITY_PAGE_SIZE)}
                            className="rounded-xl border border-stroke bg-white px-3 py-2 text-sm font-medium text-dark shadow-sm transition-colors hover:bg-gray-1 disabled:opacity-50 dark:border-white/[0.12] dark:bg-white/[0.08] dark:text-white dark:hover:bg-white/[0.12] dark:disabled:opacity-50"
                          >
                            Înainte
                          </button>
                        </div>
                      </div>
                    )}
                  </>
                )}
              </div>
            </dialog>
            )}

            {/* 2FA + Parolă */}
            <div className="space-y-3">
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between rounded-xl border border-stroke bg-gray-2/50 px-4 py-3.5 dark:border-white/[0.08] dark:bg-white/[0.03]">
                <div>
                  <h3 className="font-medium text-dark dark:text-white">
                    Verificare în doi pași (2FA)
                  </h3>
                  <p className="mt-0.5 text-sm text-dark-5 dark:text-[#9CA3AF]">
                    {user?.two_factor_email ? "Activ – cod pe email la conectare" : "Inactiv"}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={openTwoFAModal}
                  className="mt-2 inline-flex shrink-0 items-center gap-2 rounded-xl border border-stroke bg-white px-4 py-2.5 text-sm font-medium text-dark shadow-sm transition-all hover:bg-gray-1 dark:border-white/[0.12] dark:bg-white/[0.08] dark:text-white dark:hover:bg-white/[0.12] sm:mt-0"
                >
                  Gestionează
                </button>
              </div>
              {/* Modal 2FA – centrat pe ecran */}
              <dialog
                ref={twoFADialogRef}
                className={`fixed inset-0 m-0 flex w-full min-h-[100dvh] max-h-[100dvh] items-center justify-center rounded-none border-0 bg-transparent p-4 outline-none [&:not([open])]:pointer-events-none ${MODAL_BACKDROP_BASE} ${modalBackdropClasses(twoFAClosing, twoFAOpenAnimated)}`}
                onCancel={closeTwoFAModal}
                onClose={() => {
                  setTwoFAModalOpen(false);
                  setTwoFAClosing(false);
                  setTwoFAOpenAnimated(false);
                }}
              >
                <div className={`${MODAL_POPUP_BASE} w-full max-w-md max-h-[calc(100dvh-2rem)] overflow-y-auto rounded-2xl border border-stroke bg-white shadow-xl dark:border-white/[0.08] dark:bg-[#1A1A1A] ${modalContentClasses(twoFAClosing, twoFAOpenAnimated)}`}>
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary dark:bg-primary/20">
                        <Shield className="size-5" strokeWidth={2} />
                      </span>
                      <div>
                        <h3 className="text-lg font-semibold text-dark dark:text-white">
                          Verificare în doi pași (2FA)
                        </h3>
                        <p className="mt-0.5 text-sm text-dark-5 dark:text-[#9CA3AF]">
                          Alege una sau mai multe metode de verificare
                        </p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={closeTwoFAModal}
                      className="shrink-0 rounded-lg p-1.5 text-dark-5 transition-colors hover:bg-gray-2 hover:text-dark dark:text-[#9CA3AF] dark:hover:bg-white/[0.08] dark:hover:text-white"
                      aria-label="Închide"
                    >
                      <X className="size-5" />
                    </button>
                  </div>
                  <div className="mt-5 space-y-3">
                    {TWO_FA_OPTIONS.map((opt) => {
                      const Icon = opt.icon;
                      const enabled = opt.id === "email" ? twoFAEnabled : false;
                      return (
                        <label
                          key={opt.id}
                          className="flex cursor-pointer items-center gap-4 rounded-xl border border-stroke/80 bg-gray-2/50 px-4 py-4 transition-colors hover:border-primary/30 hover:bg-primary/[0.06] dark:border-white/[0.1] dark:bg-white/[0.04] dark:hover:border-primary/40 dark:hover:bg-primary/10"
                        >
                          <input
                            type="checkbox"
                            checked={enabled}
                            onChange={(e) => opt.id === "email" && setTwoFAEnabled(e.target.checked)}
                            className="size-4 shrink-0 rounded border-stroke text-primary focus:ring-2 focus:ring-primary focus:ring-offset-2 dark:border-white/[0.2] dark:focus:ring-offset-[#1A1A1A]"
                          />
                          <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-white/80 text-dark-5 dark:bg-white/[0.08] dark:text-[#9CA3AF]">
                            <Icon className="size-4" strokeWidth={2} />
                          </span>
                          <div className="min-w-0 flex-1">
                            <span className="block text-sm font-medium text-dark dark:text-white">
                              {opt.label}
                            </span>
                            <span className="mt-0.5 block text-xs text-dark-5 dark:text-[#9CA3AF]">
                              {opt.description}
                            </span>
                          </div>
                        </label>
                      );
                    })}
                  </div>
                  <div className="mt-6 flex flex-wrap justify-end gap-3">
                    <button
                      type="button"
                      onClick={closeTwoFAModal}
                      className="rounded-xl border border-stroke bg-white px-4 py-2.5 text-sm font-medium text-dark shadow-sm transition-colors hover:bg-gray-1 dark:border-white/[0.12] dark:bg-white/[0.08] dark:text-white dark:hover:bg-white/[0.12]"
                    >
                      Anulare
                    </button>
                    <button
                      type="button"
                      onClick={saveTwoFA}
                      disabled={twoFASaving}
                      className="rounded-xl bg-primary px-4 py-2.5 text-sm font-medium text-white shadow-sm transition-colors hover:bg-primary/90 disabled:opacity-50 dark:bg-primary dark:hover:bg-primary/90"
                    >
                      {twoFASaving ? "Se salvează…" : "Salvează"}
                    </button>
                  </div>
                </div>
              </dialog>
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between rounded-xl border border-stroke bg-gray-2/50 px-4 py-3.5 dark:border-white/[0.08] dark:bg-white/[0.03]">
                <div>
                  <h3 className="font-medium text-dark dark:text-white">Parolă</h3>
                  <p className="mt-0.5 text-sm text-dark-5 dark:text-[#9CA3AF]">
                    Schimbarea parolei se face doar prin link trimis pe email.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={openPasswordResetModal}
                  className="mt-2 inline-flex shrink-0 items-center gap-2 rounded-xl border border-stroke bg-white px-4 py-2.5 text-sm font-medium text-dark shadow-sm transition-all hover:bg-gray-1 dark:border-white/[0.12] dark:bg-white/[0.08] dark:text-white dark:hover:bg-white/[0.12] sm:mt-0"
                >
                  <Key className="size-4" strokeWidth={2} />
                  Schimbă parolă
                </button>
              </div>
              {/* Modal: Schimbă parola – centrat pe ecran */}
              <dialog
                ref={passwordResetDialogRef}
                className={`fixed inset-0 m-0 flex w-full min-h-[100dvh] max-h-[100dvh] items-center justify-center rounded-none border-0 bg-transparent p-4 outline-none [&:not([open])]:pointer-events-none ${MODAL_BACKDROP_BASE} ${modalBackdropClasses(passwordResetClosing, passwordResetOpenAnimated)}`}
                onCancel={closePasswordResetModal}
                onClose={() => {
                  setPasswordResetModalOpen(false);
                  setPasswordResetClosing(false);
                  setPasswordResetOpenAnimated(false);
                }}
              >
                <div className={`${MODAL_POPUP_BASE} w-full max-w-md max-h-[calc(100dvh-2rem)] overflow-y-auto rounded-2xl border border-stroke bg-white shadow-xl dark:border-white/[0.08] dark:bg-[#1A1A1A] ${modalContentClasses(passwordResetClosing, passwordResetOpenAnimated)}`}>
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary dark:bg-primary/20">
                        <Key className="size-5" strokeWidth={2} />
                      </span>
                      <div>
                        <h3 className="text-lg font-semibold text-dark dark:text-white">
                          Schimbă parola
                        </h3>
                        <p className="mt-0.5 text-sm text-dark-5 dark:text-[#9CA3AF]">
                          Link de resetare pe email
                        </p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={closePasswordResetModal}
                      className="shrink-0 rounded-lg p-1.5 text-dark-5 transition-colors hover:bg-gray-2 hover:text-dark dark:text-[#9CA3AF] dark:hover:bg-white/[0.08] dark:hover:text-white"
                      aria-label="Închide"
                    >
                      <X className="size-5" />
                    </button>
                  </div>
                  <p className="mt-4 text-sm leading-relaxed text-dark-5 dark:text-[#9CA3AF]">
                    Schimbarea parolei se face doar prin link pe email. Vom trimite un link la <strong className="text-dark dark:text-white">{user?.email ?? "—"}</strong>. Deschide linkul din email pentru a seta parola nouă. Linkul expiră în 1 oră.
                  </p>
                  <div className="mt-6 flex flex-wrap justify-end gap-3">
                    <button
                      type="button"
                      onClick={closePasswordResetModal}
                      className="rounded-xl border border-stroke bg-white px-4 py-2.5 text-sm font-medium text-dark shadow-sm transition-colors hover:bg-gray-1 dark:border-white/[0.12] dark:bg-white/[0.08] dark:text-white dark:hover:bg-white/[0.12]"
                    >
                      Anulare
                    </button>
                    <button
                      type="button"
                      onClick={sendPasswordResetLink}
                      disabled={passwordResetSending}
                      className="rounded-xl bg-primary px-4 py-2.5 text-sm font-medium text-white shadow-sm transition-colors hover:bg-primary/90 disabled:opacity-50 dark:bg-primary dark:hover:bg-primary/90"
                    >
                      {passwordResetSending ? "Se trimite…" : "Trimite link pe email"}
                    </button>
                  </div>
                </div>
              </dialog>
            </div>

            {/* Dispozitive conectate */}
            <div>
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <h3 className="font-medium text-dark dark:text-white">
                    Dispozitive conectate
                  </h3>
                  <p className="mt-0.5 text-sm text-dark-5 dark:text-[#9CA3AF]">
                    Sesiunile active pe contul tău
                  </p>
                </div>
                <button
                  type="button"
                  onClick={openSessionsModal}
                  className="mt-2 inline-flex shrink-0 items-center gap-2 rounded-xl border border-stroke bg-white px-4 py-2.5 text-sm font-medium text-dark shadow-sm transition-all hover:bg-gray-1 dark:border-white/[0.12] dark:bg-white/[0.08] dark:text-white dark:hover:bg-white/[0.12] sm:mt-0"
                >
                  Vezi toate
                </button>
              </div>
              {sessionsLoading ? (
                <p className="mt-4 text-sm text-dark-5 dark:text-[#9CA3AF]">Se încarcă sesiunile...</p>
              ) : sessionsError ? (
                <p className="mt-4 text-sm text-red dark:text-red-400">{sessionsError}</p>
              ) : sessionsPreview.length === 0 ? (
                <p className="mt-4 text-sm text-dark-5 dark:text-[#9CA3AF]">Nu există sesiuni active.</p>
              ) : (
                <ul className="mt-4 space-y-3">
                  {sessionsPreview.map((s) => (
                  <li
                    key={s.id}
                    className="flex items-center gap-4 rounded-xl border border-stroke bg-gray-2/80 px-4 py-3.5 dark:border-white/[0.08] dark:bg-white/[0.04]"
                  >
                    <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-gray-2 text-dark-5 dark:bg-white/[0.08] dark:text-[#9CA3AF]">
                      <Monitor className="size-5" strokeWidth={2} />
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="font-medium text-dark dark:text-white">
                        {s.clientName}
                        {s.deviceLabel ? ` · ${s.deviceLabel}` : ""}
                      </p>
                      <p className="mt-0.5 text-sm text-dark-5 dark:text-[#9CA3AF]">
                        {s.createdAtLabel ? `Conectat, ${s.createdAtLabel}` : "Conectat"}
                        {s.ipAddress ? ` · ${s.ipAddress}` : ""}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleRevokeSession(s.id)}
                      disabled={revokingId === s.id}
                      className="shrink-0 rounded-lg p-2 text-dark-5 transition-colors hover:bg-gray-2 hover:text-dark dark:text-[#9CA3AF] dark:hover:bg-white/[0.06] dark:hover:text-white disabled:opacity-50"
                      aria-label="Încheie sesiunea"
                    >
                      <X className="size-5" strokeWidth={2} />
                    </button>
                  </li>
                  ))}
                </ul>
              )}
              {sessionsModalOpen && (
              <dialog
                ref={sessionsDialogRef}
                className={`fixed inset-0 m-0 flex w-full min-h-[100dvh] max-h-[100dvh] items-center justify-center rounded-none border-0 bg-transparent p-4 outline-none ${MODAL_BACKDROP_BASE} ${modalBackdropClasses(sessionsClosing, sessionsOpenAnimated)}`}
                onCancel={(e) => {
                  e.preventDefault();
                  closeSessionsModal();
                }}
                onClose={() => {
                  setSessionsModalOpen(false);
                  setSessionsClosing(false);
                  setSessionsOpenAnimated(false);
                }}
              >
                <div className={`${MODAL_POPUP_BASE} max-h-[calc(100dvh-2rem)] w-full max-w-lg overflow-hidden overflow-y-auto rounded-2xl border border-stroke bg-white shadow-xl dark:border-white/[0.08] dark:bg-[#1A1A1A] ${modalContentClasses(sessionsClosing, sessionsOpenAnimated)}`}>
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary dark:bg-primary/20">
                        <Monitor className="size-5" strokeWidth={2} />
                      </span>
                      <div>
                        <h3 className="text-lg font-semibold text-dark dark:text-white">Dispozitive conectate</h3>
                        <p className="mt-0.5 text-sm text-dark-5 dark:text-[#9CA3AF]">
                          Sesiunile active pe contul tău
                        </p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={closeSessionsModal}
                      className="shrink-0 rounded-lg p-1.5 text-dark-5 transition-colors hover:bg-gray-2 hover:text-dark dark:text-[#9CA3AF] dark:hover:bg-white/[0.08] dark:hover:text-white"
                      aria-label="Închide"
                    >
                      <X className="size-5" />
                    </button>
                  </div>
                  {sessionsModalLoading ? (
                    <div className="mt-5 flex items-center justify-center gap-2 rounded-xl border border-stroke/80 bg-gray-2/50 py-8 dark:border-white/[0.1] dark:bg-white/[0.04]">
                      <span className="size-5 animate-spin rounded-full border-2 border-primary border-t-transparent" aria-hidden />
                      <p className="text-sm text-dark-5 dark:text-[#9CA3AF]">Se încarcă…</p>
                    </div>
                  ) : sessions.length === 0 ? (
                    <div className="mt-5 rounded-xl border border-stroke/80 bg-gray-2/50 py-8 text-center dark:border-white/[0.1] dark:bg-white/[0.04]">
                      <p className="text-sm text-dark-5 dark:text-[#9CA3AF]">Nu există sesiuni active.</p>
                    </div>
                  ) : (
                    <>
                      <ul className="mt-5 max-h-[65vh] space-y-2 overflow-y-auto pr-1">
                        {sessions
                          .slice((sessionsPage - 1) * SESSIONS_PAGE_SIZE, sessionsPage * SESSIONS_PAGE_SIZE)
                          .map((s) => (
                            <li key={s.id} className="flex items-center gap-4 rounded-xl border border-stroke/80 bg-white/80 px-4 py-3.5 transition-colors hover:border-stroke hover:bg-gray-1/80 dark:border-white/[0.1] dark:bg-white/[0.04] dark:hover:bg-white/[0.06]">
                              <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-gray-2/80 text-dark-5 dark:bg-white/[0.08] dark:text-[#9CA3AF]">
                                <Monitor className="size-4" strokeWidth={2} />
                              </span>
                              <div className="min-w-0 flex-1">
                                <p className="font-medium text-dark dark:text-white">
                                  {s.clientName}
                                  {s.deviceLabel ? ` · ${s.deviceLabel}` : ""}
                                </p>
                                <p className="mt-0.5 text-sm text-dark-5 dark:text-[#9CA3AF]">
                                  {s.createdAtLabel ? `Conectat, ${s.createdAtLabel}` : "Conectat"}
                                  {s.ipAddress ? ` · IP: ${s.ipAddress}` : ""}
                                </p>
                              </div>
                              <button
                                type="button"
                                onClick={() => handleRevokeSession(s.id)}
                                disabled={revokingId === s.id}
                                className="shrink-0 rounded-xl p-2 text-dark-5 transition-colors hover:bg-red/10 hover:text-red dark:text-[#9CA3AF] dark:hover:bg-red/10 dark:hover:text-red disabled:opacity-50"
                                aria-label="Încheie sesiunea"
                              >
                                <X className="size-5" strokeWidth={2} />
                              </button>
                            </li>
                          ))}
                      </ul>
                      {sessions.length > SESSIONS_PAGE_SIZE && (
                        <div className="mt-5 flex flex-wrap items-center justify-between gap-3 border-t border-stroke pt-4 dark:border-white/[0.08]">
                          <p className="text-xs text-dark-5 dark:text-[#9CA3AF]">
                            {sessions.length} în total · pagina {sessionsPage} din {Math.ceil(sessions.length / SESSIONS_PAGE_SIZE)}
                          </p>
                          <div className="flex gap-2">
                            <button
                              type="button"
                              onClick={() => setSessionsPage((p) => Math.max(1, p - 1))}
                              disabled={sessionsPage <= 1}
                              className="rounded-xl border border-stroke bg-white px-3 py-2 text-sm font-medium text-dark shadow-sm transition-colors hover:bg-gray-1 disabled:opacity-50 dark:border-white/[0.12] dark:bg-white/[0.08] dark:text-white dark:hover:bg-white/[0.12] dark:disabled:opacity-50"
                            >
                              Înapoi
                            </button>
                            <button
                              type="button"
                              onClick={() => setSessionsPage((p) => Math.min(Math.ceil(sessions.length / SESSIONS_PAGE_SIZE), p + 1))}
                              disabled={sessionsPage >= Math.ceil(sessions.length / SESSIONS_PAGE_SIZE)}
                              className="rounded-xl border border-stroke bg-white px-3 py-2 text-sm font-medium text-dark shadow-sm transition-colors hover:bg-gray-1 disabled:opacity-50 dark:border-white/[0.12] dark:bg-white/[0.08] dark:text-white dark:hover:bg-white/[0.12] dark:disabled:opacity-50"
                            >
                              Înainte
                            </button>
                          </div>
                        </div>
                      )}
                    </>
                  )}
                </div>
              </dialog>
              )}
            </div>

            {/* Ștergere cont */}
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between rounded-xl border border-red/20 bg-red/5 px-4 py-4 dark:border-red/30 dark:bg-red/10">
              <div>
                <h3 className="font-medium text-dark dark:text-white">Ștergere cont</h3>
                <p className="mt-1 text-sm text-dark-5 dark:text-[#9CA3AF]">
                  Odată șters, contul tău și toate datele asociate nu mai pot fi recuperate.
                </p>
              </div>
              <button
                type="button"
                onClick={openDeleteAccountModal}
                className="shrink-0 inline-flex items-center gap-2 rounded-xl border border-red/40 bg-red/10 px-4 py-2.5 text-sm font-medium text-red transition-colors hover:bg-red/20 dark:border-red/50 dark:bg-red/15 dark:text-red-400 dark:hover:bg-red/25"
              >
                Solicită ștergerea contului
              </button>
            </div>

            <dialog
              ref={deleteAccountDialogRef}
              onCancel={closeDeleteAccountModal}
              className={`fixed inset-0 m-0 flex w-full min-h-[100dvh] max-h-[100dvh] items-center justify-center rounded-none border-0 bg-transparent p-4 outline-none [&:not([open])]:pointer-events-none ${MODAL_BACKDROP_BASE} ${modalBackdropClasses(deleteAccountClosing, deleteAccountOpenAnimated)}`}
              onClose={() => {
                setDeleteAccountModalOpen(false);
                setDeleteAccountClosing(false);
                setDeleteAccountOpenAnimated(false);
              }}
              aria-labelledby="delete-account-title"
              aria-describedby="delete-account-desc"
            >
              <div className={`${MODAL_POPUP_BASE} w-full max-w-md max-h-[calc(100dvh-2rem)] overflow-y-auto rounded-2xl border border-stroke bg-white shadow-xl dark:border-white/[0.08] dark:bg-[#1A1A1A] ${modalContentClasses(deleteAccountClosing, deleteAccountOpenAnimated)}`}>
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-red/10 text-red dark:bg-red/20">
                      <Trash2 className="size-5" strokeWidth={2} />
                    </span>
                    <div>
                      <h2 id="delete-account-title" className="text-lg font-semibold text-dark dark:text-white">
                        Ștergere definitivă a contului
                      </h2>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={closeDeleteAccountModal}
                    className="shrink-0 rounded-lg p-1.5 text-dark-5 transition-colors hover:bg-gray-2 hover:text-dark dark:text-[#9CA3AF] dark:hover:bg-white/[0.08] dark:hover:text-white"
                    aria-label="Închide"
                  >
                    <X className="size-5" />
                  </button>
                </div>
                <p id="delete-account-desc" className="mt-4 text-sm leading-relaxed text-dark-5 dark:text-[#9CA3AF]">
                  Ești sigur că vrei să îți ștergi contul? Toate datele tale (profil, emailuri, telefoane, adrese, sesiuni) vor fi șterse definitiv și nu pot fi recuperate.
                </p>
                <div className="mt-5 space-y-4">
                  <label
                    className={`flex cursor-pointer items-start gap-3 rounded-xl border px-4 py-3.5 transition-all duration-200 ${
                      deleteAccountCheckbox
                        ? "border-red/40 bg-red/5 dark:border-red/50 dark:bg-red/10"
                        : "border-stroke/80 bg-gray-2/50 hover:border-red/30 hover:bg-red/5 dark:border-white/[0.1] dark:bg-white/[0.04] dark:hover:border-red/40 dark:hover:bg-red/10"
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={deleteAccountCheckbox}
                      onChange={(e) => setDeleteAccountCheckbox(e.target.checked)}
                      className="mt-0.5 size-4 shrink-0 rounded border-stroke text-red focus:ring-2 focus:ring-red focus:ring-offset-2 dark:border-white/20 dark:focus:ring-offset-[#1A1A1A]"
                    />
                    <span className="text-sm font-medium leading-relaxed text-dark dark:text-white">
                      Înțeleg că îmi șterg definitiv contul și toate datele asociate și nu pot anula acțiunea.
                    </span>
                  </label>
                </div>
                {deleteAccountError && (
                  <p className="mt-4 rounded-lg bg-red/10 px-3 py-2 text-sm text-red dark:bg-red/20 dark:text-red-400">
                    {deleteAccountError}
                  </p>
                )}
                <div className="mt-6 flex flex-wrap justify-end gap-3">
                  <button
                    type="button"
                    onClick={closeDeleteAccountModal}
                    disabled={deleteAccountLoading}
                    className="rounded-xl border border-stroke bg-white px-4 py-2.5 text-sm font-medium text-dark shadow-sm transition-colors hover:bg-gray-1 dark:border-white/[0.12] dark:bg-white/[0.08] dark:text-white dark:hover:bg-white/[0.12] disabled:opacity-50"
                  >
                    Anulare
                  </button>
                  <button
                    type="button"
                    onClick={handleConfirmDeleteAccount}
                    disabled={!canConfirmDelete || deleteAccountLoading}
                    className="rounded-xl bg-red px-4 py-2.5 text-sm font-medium text-white shadow-sm transition-colors hover:bg-red/90 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {deleteAccountLoading ? "Se șterge…" : "Șterge contul"}
                  </button>
                </div>
              </div>
            </dialog>
          </div>
        )}

        {activeTab === "data" && (
          <div className="p-6">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between rounded-xl border border-stroke bg-gray-2/50 px-4 py-4 dark:border-white/[0.08] dark:bg-white/[0.03]">
              <div>
                <h3 className="font-medium text-dark dark:text-white">Datele tale</h3>
                <p className="mt-0.5 text-sm text-dark-5 dark:text-[#9CA3AF]">
                  Descarcă o copie a datelor tale asociate contului.
                </p>
              </div>
              <button
                type="button"
                className="inline-flex shrink-0 items-center gap-2 rounded-xl border border-stroke bg-white px-4 py-2.5 text-sm font-medium text-dark shadow-sm transition-all hover:bg-gray-1 dark:border-white/[0.12] dark:bg-white/[0.08] dark:text-white dark:hover:bg-white/[0.12]"
              >
                <Download className="size-4" strokeWidth={2} />
                Descarcă datele
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
