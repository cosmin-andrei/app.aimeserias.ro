"use client";

import Link from "next/link";
import {
  Briefcase,
  Calendar,
  Camera,
  CheckCircle2,
  Clock,
  HelpCircle,
  MapPin,
  Star,
  User,
  Users,
  X,
} from "lucide-react";
import { useEffect, useId, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { BrandGradientPlaceholder } from "@/components/BrandGradientPlaceholder";
import { UserAvatar } from "@/components/UserAvatar";
import { useToast } from "@/contexts/ToastContext";
import { useUser } from "@/hooks/useUser";
import {
  fetchMyWorkerProfile,
  getProfilePictureUrl,
  parseSpecializations,
  uploadWorkerCoverImage,
  upsertMyWorkerProfile,
  type WorkerProfile,
} from "@/lib/api-client";
import { getPublicDisplayName, type SsoAddress, type SsoProfile } from "@/lib/auth-client";
import { resolveProfileAvatarUrl } from "@/lib/media";
import { SpecializationPicker } from "./SpecializationPicker";
import { DomainStudiesBadge } from "@/app/meseriasi/DomainStudiesBadge";
import { MeseriasProfileSidebar } from "@/app/meseriasi/MeseriasProfileSidebar";
import { PortfolioGallery } from "@/app/meseriasi/PortfolioGallery";
import { TeamMembersSection } from "@/app/meseriasi/TeamMembersSection";
import { SpecializationChip } from "@/components/SpecializationChip";
import { PFA_TYPE_LABEL } from "@/lib/meserias";
import type { FirmaTeamMember, PortfolioMedia } from "@/types/meseriasProfile";

const INPUT_CLASS =
  "w-full rounded-xl border border-stroke bg-white px-3.5 py-2.5 text-sm text-dark shadow-sm transition-colors focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/15 dark:border-white/[0.14] dark:bg-[#141414] dark:text-white dark:focus:border-[#4a9fd4] dark:focus:ring-[#2eb8f0]/20";

const MODAL_ANIMATION_MS = 160;

type EditField = "profession" | "description" | "specializations" | "experience" | null;

type FormState = {
  profession: string;
  city: string;
  description: string;
  specializations: string[];
  experience_years: string;
};

const CITY_TOOLTIP_TEXT =
  "Orașul afișat în profilul public provine din adresa de domiciliu sau de reședință pe care o completezi la Informații personale.";

function getAddressesList(user: SsoProfile | null): SsoAddress[] {
  return user?.addresses && Array.isArray(user.addresses) ? user.addresses : [];
}

function getProfileCity(user: SsoProfile | null, fallbackCity: string): string {
  const addresses = getAddressesList(user);
  const domiciliu = addresses.find((a) => a.addressType === "domiciliu");
  if (domiciliu?.city?.trim()) return domiciliu.city.trim();

  const resedinta = addresses.find(
    (a) => a.addressType === "resedinta" || a.addressType === "postala"
  );
  if (resedinta?.city?.trim()) return resedinta.city.trim();

  return fallbackCity.trim();
}

function CityHelpTooltip({ showSetupLink = false }: { showSetupLink?: boolean }) {
  const [open, setOpen] = useState(false);
  const [position, setPosition] = useState<{ top: number; left: number } | null>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const tooltipId = useId();

  useEffect(() => {
    if (!open) return;

    const updatePosition = () => {
      const rect = buttonRef.current?.getBoundingClientRect();
      if (!rect) return;
      setPosition({
        top: rect.bottom + 8,
        left: Math.min(
          Math.max(16, rect.left + rect.width / 2),
          window.innerWidth - 16
        ),
      });
    };

    updatePosition();
    window.addEventListener("resize", updatePosition);
    window.addEventListener("scroll", updatePosition, true);

    const onPointerDown = (event: MouseEvent) => {
      const target = event.target as Node;
      if (buttonRef.current?.contains(target)) return;
      if (document.getElementById(tooltipId)?.contains(target)) return;
      setOpen(false);
    };
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };

    document.addEventListener("mousedown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      window.removeEventListener("resize", updatePosition);
      window.removeEventListener("scroll", updatePosition, true);
      document.removeEventListener("mousedown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open, tooltipId]);

  return (
    <>
      <button
        ref={buttonRef}
        type="button"
        onClick={() => {
          setOpen((prev) => {
            const next = !prev;
            if (!next) setPosition(null);
            return next;
          });
        }}
        className="rounded-full p-0.5 text-[#0060f0]/70 transition-colors hover:bg-[#0060f0]/10 hover:text-[#0060f0] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#0060f0]/40 dark:text-[#5b9fff]/80 dark:hover:bg-[#5b9fff]/10 dark:hover:text-[#5b9fff]"
        aria-expanded={open}
        aria-describedby={open ? tooltipId : undefined}
        aria-label="Informații despre oraș"
      >
        <HelpCircle className="size-3.5" aria-hidden />
      </button>
      {open &&
        position &&
        typeof document !== "undefined" &&
        createPortal(
          <div
            id={tooltipId}
            role="tooltip"
            style={{
              top: position.top,
              left: position.left,
              transform: "translateX(-50%)",
            }}
            className="fixed z-[200] w-[min(18rem,calc(100vw-2rem))] rounded-xl border border-[#002050]/8 bg-white p-3 text-xs leading-relaxed text-gray-600 shadow-lg dark:border-white/[0.08] dark:bg-[#1f1f1f] dark:text-[#C4C7CE]"
          >
            <p>{CITY_TOOLTIP_TEXT}</p>
            {showSetupLink && (
              <Link
                href="/setari?tab=personal"
                className="mt-2 inline-block font-medium text-primary hover:underline"
                onClick={() => setOpen(false)}
              >
                Completează adresa de domiciliu sau reședință
              </Link>
            )}
          </div>,
          document.body
        )}
    </>
  );
}

function formatMemberSince(date: string | null | undefined) {
  if (!date) return "—";
  return new Date(date).toLocaleDateString("ro-RO", { month: "long", year: "numeric" });
}

function workerToForm(worker: WorkerProfile | null, city: string | null): FormState {
  return {
    profession: worker?.profession ?? "",
    city: city ?? "",
    description: worker?.description ?? "",
    specializations: parseSpecializations(worker?.specializations ?? null),
    experience_years:
      worker?.experience_years !== null && worker?.experience_years !== undefined
        ? String(worker.experience_years)
        : "",
  };
}

function SectionHeader({ title, onEdit }: { title: string; onEdit: () => void }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <h4 className="text-lg font-bold text-gray-900 dark:text-white">{title}</h4>
      <button
        type="button"
        onClick={onEdit}
        className="shrink-0 rounded-lg px-2.5 py-1 text-sm font-medium text-primary transition-colors hover:bg-primary/10 dark:hover:bg-primary/15"
      >
        Editează
      </button>
    </div>
  );
}

function modalContentClasses(closed: boolean, entered: boolean) {
  if (closed) return "animate-modal-exit";
  if (entered) return "animate-modal-enter";
  return "opacity-0 pointer-events-none";
}

function modalBackdropClasses(closed: boolean, entered: boolean) {
  if (closed) return "[&::backdrop]:animate-backdrop-exit";
  if (entered) return "[&::backdrop]:animate-backdrop-enter";
  return "[&::backdrop]:opacity-0";
}

const EDIT_TITLES: Record<Exclude<EditField, null>, string> = {
  profession: "Meserie / titlu profesional",
  description: "Despre",
  specializations: "Specializări",
  experience: "Experiență",
};

export function PublicProfileSection() {
  const { user, refetch } = useUser();
  const { addToast } = useToast();
  const dialogRef = useRef<HTMLDialogElement>(null);
  const coverInputRef = useRef<HTMLInputElement>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadingCover, setUploadingCover] = useState(false);
  const [editField, setEditField] = useState<EditField>(null);
  const [isClosing, setIsClosing] = useState(false);
  const [openAnimated, setOpenAnimated] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [worker, setWorker] = useState<WorkerProfile | null>(null);
  const [memberSince, setMemberSince] = useState<string | null>(null);
  const [hasDomainStudies, setHasDomainStudies] = useState(false);
  const [hasPfa, setHasPfa] = useState(false);
  const [studiesVerifiedSpecializations, setStudiesVerifiedSpecializations] = useState<string[]>([]);
  const [saved, setSaved] = useState<FormState>(workerToForm(null, null));
  const [draft, setDraft] = useState<FormState>(workerToForm(null, null));

  const displayName = getPublicDisplayName(user) || user?.name || "Meseriaș";
  const avatarUrl = resolveProfileAvatarUrl(user);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    fetchMyWorkerProfile()
      .then(({ success, data, error: fetchError }) => {
        if (cancelled) return;
        if (!success || !data) {
          addToast("error", fetchError || "Nu am putut încărca profilul public.");
          return;
        }
        setWorker(data.worker);
        setMemberSince(data.user.created_at);
        setHasDomainStudies(!!data.user.has_domain_studies);
        setHasPfa(!!data.user.has_pfa);
        setStudiesVerifiedSpecializations(data.user.studies_verified_specializations ?? []);
        const next = workerToForm(data.worker, data.user.city);
        setSaved(next);
        setDraft(next);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [addToast]);

  const openEdit = (field: Exclude<EditField, null>) => {
    const base = field === "specializations"
      ? {
          ...saved,
          specializations: [
            ...new Set([...saved.specializations, ...studiesVerifiedSpecializations]),
          ],
        }
      : saved;
    setDraft(base);
    setError(null);
    setEditField(field);
    setOpenAnimated(false);
    setIsClosing(false);
  };

  const closeEdit = () => {
    setIsClosing(true);
    setTimeout(() => {
      dialogRef.current?.close();
      setEditField(null);
      setError(null);
      setIsClosing(false);
      setOpenAnimated(false);
    }, MODAL_ANIMATION_MS);
  };

  useEffect(() => {
    if (!editField) return;
    setOpenAnimated(false);
    dialogRef.current?.showModal();
    const id = requestAnimationFrame(() => {
      requestAnimationFrame(() => setOpenAnimated(true));
    });
    return () => cancelAnimationFrame(id);
  }, [editField]);

  const buildPayload = (field: Exclude<EditField, null>, form: FormState) => {
    switch (field) {
      case "profession":
        return { profession: form.profession.trim() };
      case "description":
        return { description: form.description.trim() || null };
      case "specializations":
        return { specializations: form.specializations };
      case "experience":
        return {
          experience_years: form.experience_years.trim()
            ? parseInt(form.experience_years, 10)
            : null,
        };
      default:
        return {};
    }
  };

  const validateField = (field: Exclude<EditField, null>, form: FormState): string | null => {
    if (field === "profession" && !form.profession.trim()) {
      return "Meseria / titlul profesional este obligatoriu.";
    }
    if (field === "experience") {
      if (form.experience_years.trim()) {
        const years = parseInt(form.experience_years, 10);
        if (Number.isNaN(years) || years < 0) {
          return "Anii de experiență nu sunt valizi.";
        }
      }
    }
    return null;
  };

  const handleCoverUpload = async (file: File) => {
    if (!saved.profession.trim() && !worker) {
      addToast("error", "Completează mai întâi meseria în profilul public.");
      return;
    }

    setUploadingCover(true);
    const { success, data, error: uploadError } = await uploadWorkerCoverImage(file);
    setUploadingCover(false);
    if (coverInputRef.current) coverInputRef.current.value = "";

    if (!success || !data) {
      addToast("error", uploadError || "Nu am putut actualiza imaginea de cover.");
      return;
    }

    setWorker(data.worker);
    addToast("success", "Imaginea de cover a fost actualizată.");
  };

  const handleSave = async () => {
    if (!editField) return;
    const validationError = validateField(editField, draft);
    if (validationError) {
      setError(validationError);
      addToast("error", validationError);
      return;
    }

    const payload = buildPayload(editField, draft);
    if (!worker && editField !== "profession" && !saved.profession.trim()) {
      const msg = "Completează mai întâi meseria / titlul profesional.";
      setError(msg);
      addToast("error", msg);
      return;
    }

    setSaving(true);
    const { success, data, error: saveError } = await upsertMyWorkerProfile(payload);
    setSaving(false);

    if (!success || !data) {
      const msg = saveError || "Nu am putut salva.";
      setError(msg);
      addToast("error", msg);
      return;
    }

    setWorker(data.worker);
    setStudiesVerifiedSpecializations(data.user.studies_verified_specializations ?? []);
    const next = workerToForm(data.worker, data.user.city);
    setSaved(next);
    setDraft(next);
    await refetch();
    closeEdit();
    addToast("success", "Modificare salvată.");
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center gap-2 p-12 text-sm text-dark-5 dark:text-[#9CA3AF]">
        <span className="size-5 animate-spin rounded-full border-2 border-primary border-t-transparent" aria-hidden />
        Se încarcă profilul public…
      </div>
    );
  }

  const previewSpecializations = [...saved.specializations].sort((a, b) => {
    const aVerified = studiesVerifiedSpecializations.includes(a);
    const bVerified = studiesVerifiedSpecializations.includes(b);
    if (aVerified && !bVerified) return -1;
    if (!aVerified && bVerified) return 1;
    return a.localeCompare(b, "ro");
  });
  const displayCity = getProfileCity(user, saved.city);
  const coverUrl = getProfilePictureUrl(worker?.cover_image ?? null);
  const isFirma = user?.subscription_plan === "firma";
  const typeLabel = isFirma ? "Firmă" : hasPfa ? PFA_TYPE_LABEL : "Meseriaș";
  const portfolioItems: PortfolioMedia[] = [];
  const teamMembers: FirmaTeamMember[] = [];

  return (
    <div className="space-y-6 p-6">
      <div>
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h2 className="text-lg font-semibold text-dark dark:text-white">Profil public</h2>
            <p className="mt-1 max-w-2xl text-sm text-dark-5 dark:text-[#9CA3AF]">
              Editează informațiile afișate în marketplace. Pentru previzualizare, deschide profilul
              public.
            </p>
          </div>
          <Link
            href="/meseriasi/eu"
            className="inline-flex shrink-0 items-center gap-2 rounded-xl border border-stroke bg-white px-4 py-2.5 text-sm font-semibold text-[#002050] shadow-sm transition-colors hover:bg-gray-1 dark:border-white/[0.12] dark:bg-white/[0.06] dark:text-white dark:hover:bg-white/[0.1]"
          >
            Vezi profilul public
          </Link>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr] lg:items-start lg:gap-8 2xl:grid-cols-[1.35fr_0.65fr] 2xl:gap-10">
      <div className="rounded-2xl bg-white shadow-[0_4px_24px_-10px_rgba(0,32,80,0.1)] dark:bg-[#161616] dark:shadow-none dark:ring-1 dark:ring-white/[0.06]">
        <div className="relative h-40 w-full overflow-hidden rounded-t-2xl sm:h-48 md:h-52">
          {coverUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={coverUrl}
              alt=""
              className="absolute inset-0 h-full w-full object-cover"
            />
          ) : (
            <BrandGradientPlaceholder showBottomOverlay />
          )}
          <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/25 via-transparent to-transparent" />
          {previewSpecializations.length > 0 && (
            <div className="absolute inset-x-0 bottom-0 z-10 flex flex-wrap gap-2 p-4 sm:p-5">
              {previewSpecializations.slice(0, 6).map((trade) => (
                <span
                  key={trade}
                  className="rounded-full bg-white/15 px-3 py-1 text-xs font-medium text-white backdrop-blur-sm ring-1 ring-white/20"
                >
                  {trade}
                </span>
              ))}
            </div>
          )}
          <button
            type="button"
            onClick={() => coverInputRef.current?.click()}
            disabled={uploadingCover}
            className="absolute bottom-3 right-3 z-20 inline-flex items-center gap-2 rounded-full bg-white/95 px-3.5 py-2 text-xs font-semibold text-[#002050] shadow-md transition-colors hover:bg-white disabled:opacity-60 dark:bg-[#1A1A1A]/95 dark:text-white dark:hover:bg-[#222]"
          >
            <Camera className="size-3.5" aria-hidden />
            {uploadingCover ? "Se încarcă…" : coverUrl ? "Actualizează cover" : "Adaugă cover"}
          </button>
          <input
            ref={coverInputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            className="hidden"
            disabled={uploadingCover}
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) void handleCoverUpload(file);
            }}
          />
          {worker?.verified && (
            <span className="absolute right-4 top-4 z-20 inline-flex items-center gap-1 rounded-full bg-green-600 px-3 py-1.5 text-xs font-semibold text-white shadow-sm sm:right-5 sm:top-5">
              <CheckCircle2 className="size-3.5 text-white" aria-hidden />
              Verificat
            </span>
          )}
        </div>

        <div className="relative px-5 pb-6 pt-3 sm:px-8 sm:pb-8 sm:pt-4">
          <div className="flex flex-col gap-5 sm:flex-row sm:items-end sm:gap-5">
            <div className="-mt-10 shrink-0 sm:-mt-12">
              <div className="relative h-[6.5rem] w-[6.5rem] overflow-hidden rounded-full bg-white shadow-[0_4px_16px_-4px_rgba(0,32,80,0.15)] ring-[3px] ring-white sm:h-28 sm:w-28 sm:ring-4 dark:bg-[#161616] dark:ring-[#161616]">
                <UserAvatar src={avatarUrl} alt={displayName} sizes="112px" priority />
              </div>
            </div>

            <div className="min-w-0 flex-1 sm:pb-1 sm:pt-3">
              <h3 className="text-2xl font-bold tracking-tight text-gray-900 dark:text-white md:text-3xl">
                {displayName}
              </h3>
              <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1">
                <p className="text-base text-gray-600 dark:text-[#9CA3AF]">
                  {saved.profession.trim() || "Meserie nespecificată"}
                </p>
                <button
                  type="button"
                  onClick={() => openEdit("profession")}
                  className="text-sm font-medium text-primary hover:underline"
                >
                  Editează
                </button>
              </div>
              <div className="mt-2.5 flex flex-wrap gap-2">
                {isFirma ? (
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-[#0060f0]/10 px-3 py-1 text-xs font-semibold text-[#0060f0] dark:bg-[#0060f0]/15">
                    <Users className="size-2.5" aria-hidden />
                    {typeLabel}
                  </span>
                ) : (
                  <>
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-[#0060f0]/10 px-3 py-1 text-xs font-semibold text-[#0060f0] dark:bg-[#0060f0]/15">
                      <User className="size-2.5" aria-hidden />
                      {typeLabel}
                    </span>
                    {hasDomainStudies && <DomainStudiesBadge />}
                  </>
                )}
              </div>
            </div>
          </div>

          <div className="mt-6 flex flex-wrap gap-x-5 gap-y-2 text-sm text-gray-600 dark:text-[#9CA3AF] sm:mt-7">
            <span className="inline-flex items-center gap-1.5">
              <MapPin className="size-4 shrink-0 text-[#0060f0]" aria-hidden />
              <span>
                <span className="font-medium text-gray-700 dark:text-[#C4C7CE]">Oraș </span>
                <span>{displayCity || "Nespecificat"}</span>
              </span>
              <CityHelpTooltip showSetupLink={!displayCity} />
            </span>
            <span className="flex flex-wrap items-center gap-1.5">
              <Clock className="size-4 shrink-0 text-[#0060f0]" aria-hidden />
              <span className="font-medium text-gray-700 dark:text-[#C4C7CE]">Experiență</span>
              <span>
                {saved.experience_years
                  ? `${saved.experience_years} ${saved.experience_years === "1" ? "an" : "ani"}`
                  : "Nespecificată"}
              </span>
              <button
                type="button"
                onClick={() => openEdit("experience")}
                className="text-sm font-medium text-primary hover:underline"
              >
                Editează
              </button>
            </span>
            <span className="flex items-center gap-1.5 font-semibold text-[#002050] dark:text-white">
              <Star className="size-4 fill-amber-400 text-amber-400" aria-hidden />
              {(worker?.average_rating ?? 0).toFixed(1)} ({worker?.total_reviews ?? 0})
            </span>
            <span className="flex items-center gap-1.5">
              <Briefcase className="size-4" aria-hidden />
              {worker?.completed_jobs ?? 0} proiecte finalizate
            </span>
            <span className="flex items-center gap-1.5">
              <Calendar className="size-4" aria-hidden />
              Membru din {formatMemberSince(memberSince ?? worker?.created_at)}
            </span>
          </div>

          <div className="mt-6 border-t border-gray-100 pt-6 dark:border-white/[0.08]">
            <SectionHeader title="Despre" onEdit={() => openEdit("description")} />
            <p className="mt-2 leading-relaxed text-gray-600 dark:text-[#9CA3AF]">
              {saved.description.trim() || "Nicio descriere încă."}
            </p>
          </div>

          <div className="mt-6 border-t border-gray-100 pt-6 dark:border-white/[0.08]">
            <SectionHeader title="Specializări" onEdit={() => openEdit("specializations")} />
            {previewSpecializations.length > 0 ? (
              <div className="mt-3 flex flex-wrap gap-2">
                {previewSpecializations.map((trade) => (
                  <SpecializationChip
                    key={trade}
                    label={trade}
                    hasStudies={studiesVerifiedSpecializations.includes(trade)}
                  />
                ))}
              </div>
            ) : (
              <p className="mt-2 text-sm text-gray-600 dark:text-[#9CA3AF]">
                Nicio specializare adăugată.
              </p>
            )}
            {studiesVerifiedSpecializations.length > 0 && (
              <p className="mt-2 text-xs text-dark-5 dark:text-[#9CA3AF]">
                Specializările evidențiate cu iconița de studii sunt verificate și nu pot fi eliminate.
              </p>
            )}
          </div>

          <div className="mt-6 border-t border-gray-100 pt-6 dark:border-white/[0.08]">
            <h2 className="text-lg font-bold text-gray-900 dark:text-white">Galerie lucrări</h2>
            {portfolioItems.length > 0 ? (
              <PortfolioGallery items={portfolioItems} variant="embedded" title="" />
            ) : (
              <p className="mt-2 text-sm text-gray-600 dark:text-[#9CA3AF]">
                Nicio imagine sau video adăugat încă.
              </p>
            )}
          </div>

          {isFirma &&
            (teamMembers.length > 0 ? (
              <TeamMembersSection firmaName={displayName} members={teamMembers} />
            ) : (
              <div className="mt-6 border-t border-gray-100 pt-6 dark:border-white/[0.08]">
                <h2 className="text-lg font-bold text-gray-900 dark:text-white">Echipa noastră</h2>
                <p className="mt-2 text-sm text-gray-600 dark:text-[#9CA3AF]">
                  Niciun membru al echipei adăugat încă.
                </p>
              </div>
            ))}
        </div>
      </div>

      <div className="lg:sticky lg:top-24">
        <MeseriasProfileSidebar
          meseriasName={displayName}
          rating={worker?.average_rating ?? 0}
          reviewCount={worker?.total_reviews ?? 0}
          previewReviews={[]}
          phone={user?.phone}
          email={user?.email}
          workerUserId={user?.id}
        />
      </div>
      </div>

      <dialog
        ref={dialogRef}
        className={`fixed inset-0 m-0 flex min-h-[100dvh] max-h-[100dvh] w-full items-center justify-center rounded-none border-0 bg-transparent p-4 outline-none [&:not([open])]:pointer-events-none [&::backdrop]:bg-black/50 [&::backdrop]:backdrop-blur-md ${modalBackdropClasses(isClosing, openAnimated)}`}
        onCancel={closeEdit}
        onClose={() => {
          setEditField(null);
          setIsClosing(false);
          setOpenAnimated(false);
        }}
      >
        <div
          className={`max-h-[calc(100dvh-2rem)] w-full overflow-y-auto rounded-2xl border border-stroke bg-white p-6 shadow-xl dark:border-white/[0.08] dark:bg-[#1A1A1A] ${editField === "specializations" ? "max-w-2xl" : "max-w-md"} ${modalContentClasses(isClosing, openAnimated)}`}
        >
          <div className="flex items-center justify-between gap-3">
            <h3 className="text-lg font-semibold text-dark dark:text-white">
              {editField ? EDIT_TITLES[editField] : ""}
            </h3>
            <button
              type="button"
              onClick={closeEdit}
              className="rounded-lg p-1.5 text-dark-5 transition-colors hover:bg-gray-2 hover:text-dark dark:text-[#9CA3AF] dark:hover:bg-white/[0.08] dark:hover:text-white"
              aria-label="Închide"
            >
              <X className="size-5" />
            </button>
          </div>

          <div className="mt-4 space-y-4">
            {error && (
              <p className="rounded-lg bg-red/10 px-3 py-2 text-sm text-red dark:bg-red/20 dark:text-red-400">
                {error}
              </p>
            )}

            {editField === "profession" && (
              <input
                type="text"
                value={draft.profession}
                onChange={(e) => setDraft((d) => ({ ...d, profession: e.target.value }))}
                placeholder="Ex: Electrician autorizat ANRE"
                className={INPUT_CLASS}
                maxLength={100}
                autoFocus
              />
            )}

            {editField === "description" && (
              <textarea
                value={draft.description}
                onChange={(e) => setDraft((d) => ({ ...d, description: e.target.value }))}
                placeholder="Descrie experiența ta, tipurile de lucrări pe care le realizezi și ce te diferențiază."
                rows={5}
                className={`${INPUT_CLASS} resize-y`}
                autoFocus
              />
            )}

            {editField === "specializations" && (
              <SpecializationPicker
                value={draft.specializations}
                onChange={(specializations) => setDraft((d) => ({ ...d, specializations }))}
                lockedItems={studiesVerifiedSpecializations}
              />
            )}

            {editField === "experience" && (
              <div>
                <label className="mb-1.5 block text-xs font-medium text-dark-5 dark:text-[#9CA3AF]">
                  Ani de experiență
                </label>
                <input
                  type="number"
                  min={0}
                  max={60}
                  value={draft.experience_years}
                  onChange={(e) => setDraft((d) => ({ ...d, experience_years: e.target.value }))}
                  placeholder="Ex: 8"
                  className={INPUT_CLASS}
                  autoFocus
                />
              </div>
            )}
          </div>

          <div className="mt-6 flex flex-wrap justify-end gap-3">
            <button
              type="button"
              onClick={closeEdit}
              disabled={saving}
              className="rounded-xl border border-stroke bg-white px-4 py-2.5 text-sm font-medium text-dark shadow-sm transition-colors hover:bg-gray-1 disabled:opacity-50 dark:border-white/[0.12] dark:bg-white/[0.08] dark:text-white dark:hover:bg-white/[0.12]"
            >
              Anulează
            </button>
            <button
              type="button"
              onClick={handleSave}
              disabled={saving}
              className="rounded-xl bg-primary px-4 py-2.5 text-sm font-medium text-white shadow-sm transition-colors hover:bg-primary/90 disabled:opacity-50"
            >
              {saving ? "Se salvează…" : "Salvează"}
            </button>
          </div>
        </div>
      </dialog>
    </div>
  );
}
