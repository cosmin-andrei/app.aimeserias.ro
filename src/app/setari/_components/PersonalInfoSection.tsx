"use client";

import {
  addAddress,
  confirmEmailChange,
  deleteAddress,
  normalizePhoneForApi,
  sendEmailChangeCode,
  updateAddress,
  updateUserProfile,
  type AddressPayload,
} from "@/lib/api-client";
import { DomainStudiesSection } from "./DomainStudiesSection";
import { PfaSection } from "./PfaSection";
import { setAuthToken } from "@/lib/auth";
import { useUser } from "@/hooks/useUser";
import {
  addEmail,
  addPhone,
  deleteEmail,
  deletePhone,
  resendEmailConfirmationLink,
  sendEmailVerification,
  sendPhoneVerification,
  setPrimaryEmail,
  setEmailVisibility,
  setPhoneVisibility,
  setPrimaryPhone,
  updateSsoProfile,
  verifyEmailCode,
  verifyPhoneCode,
  type SsoAddress,
  type SsoEmail,
  type SsoPhone,
  type SsoProfileUpdate,
  type VisibilityValue,
  getPublicDisplayName,
  uploadAvatar,
} from "@/lib/auth-client";
import { ROMANIAN_COUNTIES } from "@/data/romanian-counties";
import { getLocalitiesForCounty } from "@/data/romanian-localities";
import { useToast } from "@/contexts/ToastContext";
import { DEFAULT_USER_AVATAR, resolveProfileAvatarUrl } from "@/lib/media";
import { cn } from "@/lib/utils";
import { isCompanyAccount } from "@/lib/company-account";
import { Calendar, Camera, CheckCircle2, ChevronDown, ChevronRight, Eye, Globe, Lock, Mail, MapPin, Phone, Plus, Trash2, User, Users, X } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";

function ProfileAvatar({ src, className }: { src: string; className: string }) {
  const [avatarSrc, setAvatarSrc] = useState(src);

  useEffect(() => {
    setAvatarSrc(src);
  }, [src]);

  return (
    <img
      src={avatarSrc}
      alt=""
      className={className}
      onError={() => {
        if (avatarSrc !== DEFAULT_USER_AVATAR) {
          setAvatarSrc(DEFAULT_USER_AVATAR);
        }
      }}
    />
  );
}

const GEN_OPTIONS = [
  { value: "M", label: "Masculin" },
  { value: "F", label: "Feminin" },
  { value: "prefer_sa_nu_spun", label: "Prefer să nu spun" },
];

const SETTINGS_SELECT_CLASS =
  "w-full appearance-none rounded-xl border border-stroke bg-white px-3.5 py-2.5 pr-10 text-sm font-medium text-dark shadow-sm transition-colors focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/15 dark:border-white/[0.14] dark:bg-[#141414] dark:text-white dark:focus:border-[#4a9fd4] dark:focus:ring-[#2eb8f0]/20 [&>option]:bg-white [&>option]:py-2 [&>option]:text-dark dark:[&>option]:bg-[#1A1A1A] dark:[&>option]:text-[#E8EAED]";

function SettingsSelect({
  className,
  children,
  ...props
}: React.SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <div className="relative">
      <select {...props} className={cn(SETTINGS_SELECT_CLASS, className)}>
        {children}
      </select>
      <ChevronDown
        className="pointer-events-none absolute right-3 top-1/2 size-4 -translate-y-1/2 text-dark-5 dark:text-[#9CA3AF]"
        aria-hidden
      />
    </div>
  );
}

const VISIBILITY_OPTIONS: { value: VisibilityValue; label: string; description: string }[] = [
  { value: "me_only", label: "Doar eu", description: "Doar tu poți vedea {ref}." },
  {
    value: "onedu_network",
    label: "În ecosistemul AiMeseriaș",
    description: "Vizibil în aplicația AiMeseriaș.",
  },
];

function normalizeVisibility(value?: VisibilityValue | null): VisibilityValue {
  if (!value || value === "everyone" || value === "platforms_with_profile") {
    return "onedu_network";
  }
  return value === "me_only" ? "me_only" : "onedu_network";
}

function getVisibilityLabel(value?: VisibilityValue | null): string {
  return (
    VISIBILITY_OPTIONS.find((o) => o.value === normalizeVisibility(value))?.label ??
    "Doar eu"
  );
}

/** Moduri pentru numele afișat: dropdown pe front, se trimite un singur display_name pe backend */
type DisplayNameMode = "prenume_nume" | "nume_prenume" | "prenume_initial" | "prenume" | "nume" | "custom";
const DISPLAY_NAME_MODE_OPTIONS: { value: DisplayNameMode; label: string }[] = [
  { value: "prenume_nume", label: "Prenume Nume" },
  { value: "nume_prenume", label: "Nume Prenume" },
  { value: "prenume_initial", label: "Prenume N." },
];

function formatPrenumeInitial(prenume: string, nume: string): string {
  const p = (prenume || "").trim();
  const n = (nume || "").trim();
  if (!p) return n ? `${n.charAt(0).toUpperCase()}.` : "";
  if (!n) return p;
  return `${p} ${n.charAt(0).toUpperCase()}.`;
}

function computeDisplayNameFromMode(
  prenume: string,
  nume: string,
  mode: DisplayNameMode,
  custom: string
): string {
  const p = (prenume || "").trim();
  const n = (nume || "").trim();
  switch (mode) {
    case "nume_prenume":
      return [n, p].filter(Boolean).join(" ") || "";
    case "prenume_initial":
      return formatPrenumeInitial(p, n);
    case "prenume":
      return p || n || "";
    case "nume":
      return n || p || "";
    case "custom":
      return (custom || "").trim();
    default:
      return [p, n].filter(Boolean).join(" ") || "";
  }
}
/** Inferă modul și custom din display_name + prenume/nume (la deschiderea formularului) */
function inferDisplayNameMode(
  displayName: string,
  prenume: string,
  nume: string
): { mode: DisplayNameMode; custom: string } {
  const p = (prenume || "").trim();
  const n = (nume || "").trim();
  const dn = (displayName || "").trim();
  if (!dn) return { mode: "prenume_nume", custom: "" };
  if (dn === [p, n].filter(Boolean).join(" ")) return { mode: "prenume_nume", custom: "" };
  if (dn === [n, p].filter(Boolean).join(" ")) return { mode: "nume_prenume", custom: "" };
  if (dn === formatPrenumeInitial(p, n)) return { mode: "prenume_initial", custom: "" };
  if (dn === p) return { mode: "prenume", custom: "" };
  if (dn === n) return { mode: "nume", custom: "" };
  return { mode: "prenume_nume", custom: "" };
}

/** Data nașterii: vârsta minimă 16 ani – max = acum minus 16 ani */
function getBirthDateLimits(): { min: string; max: string } {
  const today = new Date();
  const max = new Date(today);
  max.setFullYear(max.getFullYear() - 16);
  const min = new Date(today);
  min.setFullYear(min.getFullYear() - 120);
  return {
    min: min.toISOString().slice(0, 10),
    max: max.toISOString().slice(0, 10),
  };
}

const LUNI_RO = [
  "Ianuarie", "Februarie", "Martie", "Aprilie", "Mai", "Iunie",
  "Iulie", "August", "Septembrie", "Octombrie", "Noiembrie", "Decembrie",
];

/** Un prefix telefon (țară) – listă inițială, apoi încărcată din RestCountries */
type PhonePrefixEntry = { code: string; label: string; prefix: string };

const PHONE_PREFIXES_INITIAL: PhonePrefixEntry[] = [
  { code: "RO", label: "România", prefix: "+40" },
  { code: "MD", label: "Moldova", prefix: "+373" },
  { code: "GB", label: "Regatul Unit", prefix: "+44" },
  { code: "DE", label: "Germania", prefix: "+49" },
  { code: "FR", label: "Franța", prefix: "+33" },
  { code: "OTHER", label: "Altă țară", prefix: "" },
];

const MODAL_ANIMATION_MS = 160;
/** Animație la fel ca la modalul de notificări: backdrop + modal enter/exit */
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

/** Valori care par criptate (SSO returnează raw când decriptarea eșuează) – nu le afișăm ca atare */
function looksLikeEncrypted(value: string | null | undefined): boolean {
  if (!value || typeof value !== "string") return false;
  if (value.includes(":") && value.length > 20) return true;
  if (/^[A-Za-z0-9+/=]+$/.test(value) && value.length > 24) return true;
  return false;
}

function formatDisplayDate(value: string | null | undefined): string {
  if (!value) return "—";
  if (looksLikeEncrypted(value)) return "—";
  try {
    const d = new Date(value);
    if (Number.isNaN(d.getTime())) return "—";
    return d.toLocaleDateString("ro-RO", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  } catch {
    return "—";
  }
}

function formatGen(gen: string | null | undefined): string {
  if (!gen || looksLikeEncrypted(gen)) return "Prefer să nu spun";
  if (gen === "altul") return "Prefer să nu spun";
  const o = GEN_OPTIONS.find((x) => x.value === gen || x.label === gen);
  return o?.label ?? gen;
}

function FieldRow({
  label,
  value,
  onClick,
}: {
  label: string;
  value: string;
  onClick?: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex w-full items-center justify-between rounded-xl border border-stroke bg-gray-2/80 py-3 px-4 text-left transition-colors hover:bg-gray-3 dark:border-white/[0.08] dark:bg-white/[0.04] dark:hover:bg-white/[0.06]"
    >
      <div>
        <p className="text-xs font-medium text-dark-5 dark:text-[#9CA3AF]">
          {label}
        </p>
        <p className="mt-0.5 font-medium text-dark dark:text-white">
          {value || "—"}
        </p>
      </div>
      <ChevronRight className="size-5 shrink-0 text-dark-5 dark:text-[#9CA3AF]" />
    </button>
  );
}

type EditField = "nume" | "gen" | "data_nasterii" | "telefon" | null;

/** Liste derivate din profil (emails/phones pot veni goale din SSO) */
function getEmailsList(user: { email?: string; emails?: SsoEmail[]; is_confirmed?: boolean }): SsoEmail[] {
  if (Array.isArray(user.emails)) return user.emails;
  if (user.email)
    return [{
      id: "main",
      email: user.email,
      isPrimary: true,
      verified: Boolean(user.is_confirmed),
    }];
  return [];
}

function getPhonesList(user: { telefon?: string | null; phones?: SsoPhone[] }): SsoPhone[] {
  const list = user.phones && user.phones.length > 0 ? user.phones : null;
  if (list) return list;
  if (user.telefon)
    return [{ id: "legacy", phone: user.telefon, isPrimary: true, verified: false }];
  return [];
}

function formatAddressLine(a: SsoAddress): string {
  const isResedinta = a.addressType === "resedinta" || a.addressType === "postala";
  if (isResedinta && !a.street && !a.number) {
    return [a.city, a.county].filter(Boolean).join(", ") || "Adresă";
  }
  const parts = [
    [a.street, a.number].filter(Boolean).join(" "),
    a.block && `Bl. ${a.block}`,
    a.entrance && `Sc. ${a.entrance}`,
    a.floor && `Et. ${a.floor}`,
    a.apartment && `Ap. ${a.apartment}`,
    a.city,
    a.county,
  ].filter(Boolean);
  return parts.join(", ") || "Adresă";
}

function getAddressesList(user: { addresses?: SsoAddress[] } | null): SsoAddress[] {
  return user?.addresses && Array.isArray(user.addresses) ? user.addresses : [];
}

export function PersonalInfoSection() {
  const { user, loading, refetch } = useUser();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [showEmailConfirmedBanner, setShowEmailConfirmedBanner] = useState(false);
  const [editField, setEditField] = useState<EditField>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { addToast } = useToast();
  const [openAnimated, setOpenAnimated] = useState(false);
  const [isClosing, setIsClosing] = useState(false);
  const dialogRef = useRef<HTMLDialogElement>(null);

  const [form, setForm] = useState<{
    prenume: string;
    nume: string;
    display_name_mode: DisplayNameMode;
    display_name_custom: string;
    gen: string;
    genCustom: string;
    genVisibility: VisibilityValue;
    data_nasterii: string;
    data_nasterii_visibility: VisibilityValue;
    telefon: string;
  }>({
    prenume: "",
    nume: "",
    display_name_mode: "prenume_nume",
    display_name_custom: "",
    gen: "",
    genCustom: "",
    genVisibility: "me_only",
    data_nasterii: "",
    data_nasterii_visibility: "me_only",
    telefon: "",
  });

  const [addEmailValue, setAddEmailValue] = useState("");
  const [addEmailSuccessEmail, setAddEmailSuccessEmail] = useState<string | null>(null);
  const [addEmailSendFailed, setAddEmailSendFailed] = useState(false);
  const [addEmailVisibility, setAddEmailVisibility] = useState<VisibilityValue>("me_only");
  const [resendLinkSuccess, setResendLinkSuccess] = useState(false);
  const [verifyEmailId, setVerifyEmailId] = useState<string | null>(null);
  const [verifyEmailCodeInput, setVerifyEmailCodeInput] = useState("");
  const [addPhoneValue, setAddPhoneValue] = useState("");
  const [addPhonePrefix, setAddPhonePrefix] = useState("+40");
  const [phonePrefixes, setPhonePrefixes] = useState<PhonePrefixEntry[]>(PHONE_PREFIXES_INITIAL);
  const [verifyPhoneId, setVerifyPhoneId] = useState<string | null>(null);
  const [verifyPhoneCodeInput, setVerifyPhoneCodeInput] = useState("");
  const [addressForm, setAddressForm] = useState<AddressPayload & { id?: string; addressType?: "domiciliu" | "resedinta" | "postala" | null }>({});
  const isResedintaAddressForm =
    addressForm.addressType === "resedinta" || addressForm.addressType === "postala";
  const addressLocalityOptions = useMemo(() => {
    const base = getLocalitiesForCounty(addressForm.county);
    if (addressForm.city && !base.includes(addressForm.city)) {
      return [addressForm.city, ...base];
    }
    return base;
  }, [addressForm.county, addressForm.city]);
  const [addressModalMode, setAddressModalMode] = useState<"add" | "edit" | null>(null);
  const [actionModalOpen, setActionModalOpen] = useState<
    "addEmail" | "changePrimaryEmail" | "verifyEmail" | "addPhone" | "verifyPhone" | "addAddress" | "editAddress" | "visibilityEmail" | "visibilityPhone" | null
  >(null);
  const [changePrimaryEmailValue, setChangePrimaryEmailValue] = useState("");
  const [changePrimaryEmailSuccess, setChangePrimaryEmailSuccess] = useState(false);
  const [changeEmailCodeSent, setChangeEmailCodeSent] = useState(false);
  const [changeEmailCodeInput, setChangeEmailCodeInput] = useState("");
  const [visibilityTarget, setVisibilityTarget] = useState<{ id: string; type: "email" | "phone"; current?: VisibilityValue } | null>(null);
  const actionDialogRef = useRef<HTMLDialogElement>(null);
  const [actionOpenAnimated, setActionOpenAnimated] = useState(false);
  const [actionClosing, setActionClosing] = useState(false);
  const [avatarUploading, setAvatarUploading] = useState(false);
  const avatarInputRef = useRef<HTMLInputElement>(null);
  const avatarInfoDialogRef = useRef<HTMLDialogElement>(null);
  const [avatarInfoDialogOpen, setAvatarInfoDialogOpen] = useState(false);
  const [avatarInfoOpenAnimated, setAvatarInfoOpenAnimated] = useState(false);
  const [avatarInfoClosing, setAvatarInfoClosing] = useState(false);
  /** Modal confirmare acțiuni (ștergere email/telefon/adresă) */
  const [confirmModal, setConfirmModal] = useState<{
    type: "deleteEmail" | "deletePhone" | "deleteAddress";
    id: string;
    label?: string;
  } | null>(null);
  const confirmDialogRef = useRef<HTMLDialogElement>(null);
  const [confirmClosing, setConfirmClosing] = useState(false);
  const [confirmOpenAnimated, setConfirmOpenAnimated] = useState(false);

  useEffect(() => {
    if (editField) {
      dialogRef.current?.showModal();
    }
  }, [editField]);

  useEffect(() => {
    if (editField && dialogRef.current?.open) {
      setOpenAnimated(false);
      const id = requestAnimationFrame(() => {
        requestAnimationFrame(() => setOpenAnimated(true));
      });
      return () => cancelAnimationFrame(id);
    }
  }, [editField]);

  useEffect(() => {
    if (searchParams.get("emailConfirmed") === "true") {
      refetch();
      setShowEmailConfirmedBanner(true);
      router.replace("/setari", { scroll: false });
    }
  }, [searchParams, refetch, router]);

  useEffect(() => {
    const primaryEmailChanged = searchParams.get("primaryEmailChanged");
    const primaryEmailChangeExpired = searchParams.get("primaryEmailChangeExpired");
    if (primaryEmailChanged === "true") {
      refetch();
      addToast("success", "Emailul principal a fost actualizat. Te poți conecta de acum cu noul email.");
      router.replace("/setari", { scroll: false });
    } else if (primaryEmailChangeExpired) {
      const msg =
        primaryEmailChangeExpired === "expired"
          ? "Linkul de confirmare a expirat. Reia procedura din Setări (Schimbă emailul principal)."
          : "Link invalid. Reia procedura din Setări.";
      addToast("error", msg);
      router.replace("/setari", { scroll: false });
    }
  }, [searchParams, refetch, router, addToast]);

  useEffect(() => {
    if (avatarInfoDialogOpen) {
      setAvatarInfoOpenAnimated(false);
      avatarInfoDialogRef.current?.showModal();
      const id = requestAnimationFrame(() => {
        requestAnimationFrame(() => setAvatarInfoOpenAnimated(true));
      });
      return () => cancelAnimationFrame(id);
    }
  }, [avatarInfoDialogOpen]);

  const openEdit = (field: EditField) => {
    if (!user) return;
    const rawDate = user.data_nasterii;
    const safeDate =
      rawDate && !looksLikeEncrypted(rawDate)
        ? String(rawDate).slice(0, 10)
        : "";
    const rawGen = user.gen && String(user.gen).trim() ? user.gen : "";
    const genOption = GEN_OPTIONS.find((o) => o.value === rawGen);
    const genVisibilityForForm = normalizeVisibility(
      (user as { gen_visibility?: VisibilityValue }).gen_visibility
    );
    const dataNasteriiVis = normalizeVisibility(
      (user as { data_nasterii_visibility?: VisibilityValue }).data_nasterii_visibility
    );
    const legalName = user.name || [user.prenume, user.nume].filter(Boolean).join(" ") || "";
    const currentDisplay = getPublicDisplayName(user) || legalName;
    const { mode: displayMode, custom: displayCustom } = inferDisplayNameMode(
      currentDisplay,
      user.prenume ?? "",
      user.nume ?? ""
    );
    setForm({
      prenume: user.prenume ?? "",
      nume: user.nume ?? "",
      display_name_mode:
        displayMode === "custom" || displayMode === "prenume" || displayMode === "nume"
          ? "prenume_nume"
          : displayMode,
      display_name_custom: displayCustom,
      gen: genOption ? rawGen : "prefer_sa_nu_spun",
      genCustom: "",
      genVisibility: genVisibilityForForm,
      data_nasterii: safeDate,
      data_nasterii_visibility: dataNasteriiVis,
      telefon: user.telefon ?? "",
    });
    setEditField(field);
    setError(null);
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
    if (confirmModal) {
      setConfirmOpenAnimated(false);
      confirmDialogRef.current?.showModal();
    } else {
      confirmDialogRef.current?.close();
      setConfirmOpenAnimated(false);
    }
  }, [confirmModal]);

  useEffect(() => {
    if (confirmModal && confirmDialogRef.current?.open) {
      const id = requestAnimationFrame(() => {
        requestAnimationFrame(() => setConfirmOpenAnimated(true));
      });
      return () => cancelAnimationFrame(id);
    }
  }, [confirmModal]);

  useEffect(() => {
    if (actionModalOpen) {
      actionDialogRef.current?.showModal();
    }
  }, [actionModalOpen]);

  useEffect(() => {
    if (actionModalOpen && actionDialogRef.current?.open) {
      setActionOpenAnimated(false);
      const id = requestAnimationFrame(() => {
        requestAnimationFrame(() => setActionOpenAnimated(true));
      });
      return () => cancelAnimationFrame(id);
    }
  }, [actionModalOpen]);

  useEffect(() => {
    const url = "https://restcountries.com/v3.1/all?fields=cca2,name,idd";
    fetch(url)
      .then((r) => r.json())
      .then((data: { cca2: string; name: { common: string }; idd?: { root: string; suffixes: string[] } }[]) => {
        const list: PhonePrefixEntry[] = data
          .filter((c) => c.idd?.root && c.cca2)
          .map((c) => {
            const root = c.idd!.root.replace(/\s/g, "");
            const suffix = c.idd!.suffixes?.length === 1 ? c.idd!.suffixes[0] : "";
            const prefix = root + suffix;
            return { code: c.cca2, label: c.name.common, prefix };
          })
          .filter((e) => e.prefix.length > 0);
        list.sort((a, b) => a.label.localeCompare(b.label));
        setPhonePrefixes([...list, { code: "OTHER", label: "Altă țară", prefix: "" }]);
      })
      .catch(() => {});
  }, []);

  const openActionModal = (
    kind: "addEmail" | "changePrimaryEmail" | "verifyEmail" | "addPhone" | "verifyPhone" | "addAddress" | "editAddress" | "visibilityEmail" | "visibilityPhone",
    payload?: {
      emailId?: string;
      phoneId?: string;
      address?: SsoAddress;
      email?: SsoEmail;
      phone?: SsoPhone;
      addressType?: "domiciliu" | "resedinta" | "postala";
    }
  ) => {
    setError(null);
    setActionClosing(false);
    setActionOpenAnimated(false);
    if (kind === "addEmail") {
      setAddEmailSuccessEmail(null);
      setAddEmailSendFailed(false);
      setAddEmailVisibility("me_only");
    }
    if (kind === "changePrimaryEmail") {
      setChangePrimaryEmailValue("");
      setChangePrimaryEmailSuccess(false);
      setChangeEmailCodeSent(false);
      setChangeEmailCodeInput("");
    }
    if (kind === "addPhone") setAddPhonePrefix("+40");
    if (kind === "verifyEmail" && payload?.emailId) {
      setVerifyEmailId(payload.emailId);
      setVerifyEmailCodeInput("");
    }
    if (kind === "verifyPhone" && payload?.phoneId) {
      setVerifyPhoneId(payload.phoneId);
      setVerifyPhoneCodeInput("");
    }
    if (kind === "addAddress") {
      const typeForAdd = payload?.addressType;
      setAddressForm(typeForAdd ? { addressType: typeForAdd } : {});
    }
    if (kind === "editAddress" && payload?.address) {
      setAddressForm({
        id: payload.address.id,
        addressType: payload.address.addressType ?? undefined,
        street: payload.address.street ?? undefined,
        number: payload.address.number ?? undefined,
        block: payload.address.block ?? undefined,
        entrance: payload.address.entrance ?? undefined,
        floor: payload.address.floor ?? undefined,
        apartment: payload.address.apartment ?? undefined,
        city: payload.address.city ?? undefined,
        county: payload.address.county ?? undefined,
        isPrimary: payload.address.isPrimary,
      });
    }
    setAddressModalMode(kind === "addAddress" ? "add" : kind === "editAddress" ? "edit" : null);
    if (kind === "visibilityEmail" && payload?.email) {
      setVisibilityTarget({ id: payload.email.id, type: "email", current: payload.email.visibility });
      setVisibilitySelection(normalizeVisibility(payload.email.visibility));
    } else if (kind === "visibilityPhone" && payload?.phone) {
      setVisibilityTarget({ id: payload.phone.id, type: "phone", current: payload.phone.visibility });
      setVisibilitySelection(normalizeVisibility(payload.phone.visibility));
    } else {
      setVisibilityTarget(null);
    }
    setActionModalOpen(kind);
  };

  const closeActionModal = () => {
    setActionClosing(true);
    setTimeout(() => {
      actionDialogRef.current?.close();
      setActionModalOpen(null);
      setVisibilityTarget(null);
      setAddEmailSuccessEmail(null);
      setVerifyEmailId(null);
      setVerifyPhoneId(null);
      setAddressModalMode(null);
      setActionClosing(false);
      setActionOpenAnimated(false);
      setError(null);
    }, MODAL_ANIMATION_MS);
  };

  const [visibilitySelection, setVisibilitySelection] = useState<VisibilityValue>("me_only");
  const handleSaveVisibility = async () => {
    if (!visibilityTarget) return;
    setSaving(true);
    setError(null);
    const visibilityToSave = normalizeVisibility(visibilitySelection);
    const r =
      visibilityTarget.type === "email"
        ? await setEmailVisibility(visibilityTarget.id, visibilityToSave)
        : await setPhoneVisibility(visibilityTarget.id, visibilityToSave);
    setSaving(false);
    if (r.success) {
      await refetch();
      closeActionModal();
      addToast("success", "Vizibilitate salvată.");
    } else { const msg = r.message ?? "Eroare."; setError(msg); addToast("error", msg); }
  };

  const handleAddEmail = async () => {
    if (!addEmailValue.trim()) return;
    setSaving(true);
    setError(null);
    const emailTrimmed = addEmailValue.trim();
    const r = await addEmail(emailTrimmed, { visibility: addEmailVisibility });
    setSaving(false);
    if (r.success) {
      await refetch();
      setAddEmailValue("");
      setAddEmailSuccessEmail(emailTrimmed);
      setAddEmailSendFailed(r.sendFailed ?? false);
      addToast("success", "Email adăugat. Verifică linkul din email.");
    } else { const msg = r.message ?? "Eroare."; setError(msg); addToast("error", msg); }
  };

  const handleResendEmailConfirmationLink = async (emailId: string) => {
    setError(null);
    setResendLinkSuccess(false);
    const r = await resendEmailConfirmationLink(emailId);
    if (r.success) {
      setResendLinkSuccess(true);
      addToast("success", "Link retrimis.");
      setTimeout(() => setResendLinkSuccess(false), 4000);
    } else { const msg = r.message ?? "Eroare la retrimiterea linkului."; setError(msg); addToast("error", msg); }
  };

  const handleSendEmailVerification = async (emailId: string) => {
    setError(null);
    const r = await sendEmailVerification(emailId);
    if (r.success) {
      openActionModal("verifyEmail", { emailId });
      addToast("success", "Cod trimis pe email. Verifică inbox-ul.");
    } else { const msg = r.message ?? "Eroare la trimiterea codului."; setError(msg); addToast("error", msg); }
  };

  const handleVerifyEmail = async () => {
    if (!verifyEmailId || !verifyEmailCodeInput.trim()) return;
    setSaving(true);
    setError(null);
    const r = await verifyEmailCode(verifyEmailId, verifyEmailCodeInput.trim());
    setSaving(false);
    if (r.success) {
      await refetch();
      closeActionModal();
      addToast("success", "Email verificat.");
    } else { const msg = r.message ?? "Cod invalid."; setError(msg); addToast("error", msg); }
  };

  const handleSetPrimaryEmail = async (emailId: string) => {
    setError(null);
    const r = await setPrimaryEmail(emailId);
    if (r.success) {
      await refetch();
      addToast("success", "Email principal actualizat.");
    } else { const msg = r.message ?? "Eroare."; setError(msg); addToast("error", msg); }
  };

  const handleSendEmailChangeCode = async () => {
    const newEmail = changePrimaryEmailValue.trim();
    if (!newEmail) return;
    setError(null);
    setSaving(true);
    const r = await sendEmailChangeCode(newEmail);
    setSaving(false);
    if (r.success) {
      setChangeEmailCodeSent(true);
      addToast("success", "Cod trimis pe noul email. Verifică inbox-ul.");
    } else {
      const msg = r.error ?? "Eroare la trimiterea codului.";
      setError(msg);
      addToast("error", msg);
    }
  };

  const handleConfirmEmailChange = async () => {
    const newEmail = changePrimaryEmailValue.trim();
    if (!newEmail || !changeEmailCodeInput.trim()) return;
    setError(null);
    setSaving(true);
    const r = await confirmEmailChange(newEmail, changeEmailCodeInput.trim());
    setSaving(false);
    if (r.success && r.access_token) {
      setAuthToken(r.access_token);
      await refetch();
      setChangePrimaryEmailSuccess(true);
      addToast("success", "Email actualizat cu succes.");
    } else {
      const msg = r.error ?? "Cod invalid.";
      setError(msg);
      addToast("error", msg);
    }
  };

  const closeAvatarInfoModal = () => {
    setAvatarInfoClosing(true);
    setTimeout(() => {
      avatarInfoDialogRef.current?.close();
      setAvatarInfoDialogOpen(false);
      setAvatarInfoClosing(false);
      setAvatarInfoOpenAnimated(false);
    }, MODAL_ANIMATION_MS);
  };

  const openAvatarPicker = () => {
    closeAvatarInfoModal();
    setTimeout(() => avatarInputRef.current?.click(), MODAL_ANIMATION_MS);
  };

  const openConfirmDelete = (
    type: "deleteEmail" | "deletePhone" | "deleteAddress",
    id: string,
    label?: string
  ) => {
    setConfirmModal({ type, id, label });
  };

  const closeConfirmModal = () => {
    setConfirmClosing(true);
    setTimeout(() => {
      confirmDialogRef.current?.close();
      setConfirmModal(null);
      setConfirmClosing(false);
      setConfirmOpenAnimated(false);
    }, MODAL_ANIMATION_MS);
  };

  const handleConfirmDelete = async () => {
    if (!confirmModal) return;
    const { type, id } = confirmModal;
    setError(null);
    let r: { success: boolean; message?: string };
    if (type === "deleteEmail") r = await deleteEmail(id);
    else if (type === "deletePhone") r = await deletePhone(id);
    else r = await deleteAddress(id);
    closeConfirmModal();
    if (r.success) {
      await refetch();
      addToast(
        "success",
        type === "deleteEmail" ? "Email șters." : type === "deletePhone" ? "Număr șters." : "Adresă ștearsă."
      );
    } else {
      const msg = String(("error" in r ? r.error : r.message) ?? "Eroare.");
      setError(msg);
      addToast("error", msg);
    }
  };

  const handleDeleteEmail = async (emailId: string, emailLabel?: string) => {
    openConfirmDelete("deleteEmail", emailId, emailLabel);
  };

  const handleAddPhone = async () => {
    let numberOnly = addPhoneValue.replace(/\D/g, "").trim();
    if (!numberOnly) return;
    const prefix = addPhonePrefix ? (addPhonePrefix.startsWith("+") ? addPhonePrefix : `+${addPhonePrefix}`) : "";
    if (prefix && numberOnly.startsWith("0")) numberOnly = numberOnly.replace(/^0+/, "");
    if (!numberOnly) return;
    const fullPhone = prefix ? `${prefix}${numberOnly}` : `+${numberOnly}`;
    setSaving(true);
    setError(null);
    const r = await addPhone(fullPhone);
    setSaving(false);
    if (r.success) {
      await refetch();
      setAddPhoneValue("");
      setAddPhonePrefix("+40");
      closeActionModal();
      addToast("success", "Număr adăugat.");
    } else { const msg = r.message ?? "Eroare."; setError(msg); addToast("error", msg); }
  };

  const handleSendPhoneVerification = async (phoneId: string) => {
    setError(null);
    const r = await sendPhoneVerification(phoneId);
    if (r.success) openActionModal("verifyPhone", { phoneId });
    else { const msg = r.message ?? "Eroare la trimiterea codului."; setError(msg); addToast("error", msg); }
  };

  const handleVerifyPhone = async () => {
    if (!verifyPhoneId || !verifyPhoneCodeInput.trim()) return;
    setSaving(true);
    setError(null);
    const r = await verifyPhoneCode(verifyPhoneId, verifyPhoneCodeInput.trim());
    setSaving(false);
    if (r.success) {
      await refetch();
      closeActionModal();
      addToast("success", "Număr verificat.");
    } else { const msg = r.message ?? "Cod invalid."; setError(msg); addToast("error", msg); }
  };

  const handleSetPrimaryPhone = async (phoneId: string) => {
    setError(null);
    const r = await setPrimaryPhone(phoneId);
    if (r.success) {
      await refetch();
      addToast("success", "Număr principal actualizat.");
    } else { const msg = r.message ?? "Eroare."; setError(msg); addToast("error", msg); }
  };

  const handleDeletePhone = async (phoneId: string, phoneLabel?: string) => {
    openConfirmDelete("deletePhone", phoneId, phoneLabel);
  };

  const handleSaveAddress = async () => {
    const id = addressForm.id;
    const typeVal =
      addressForm.addressType === "domiciliu" ||
      addressForm.addressType === "resedinta" ||
      addressForm.addressType === "postala"
        ? addressForm.addressType === "postala"
          ? "resedinta"
          : addressForm.addressType
        : undefined;

    if (!typeVal) {
      addToast("error", "Tip de adresă invalid.");
      return;
    }

    if (!addressForm.county?.trim()) {
      addToast("error", "Selectează județul.");
      return;
    }
    if (!addressForm.city?.trim()) {
      addToast("error", "Selectează localitatea.");
      return;
    }

    const payload: AddressPayload = {
      addressType: typeVal,
      street: isResedintaAddressForm ? null : addressForm.street ?? null,
      number: isResedintaAddressForm ? null : addressForm.number ?? null,
      block: isResedintaAddressForm ? null : addressForm.block ?? null,
      entrance: isResedintaAddressForm ? null : addressForm.entrance ?? null,
      floor: isResedintaAddressForm ? null : addressForm.floor ?? null,
      apartment: isResedintaAddressForm ? null : addressForm.apartment ?? null,
      city: addressForm.city ?? null,
      county: addressForm.county ?? null,
      isPrimary: addressForm.isPrimary,
    };

    setSaving(true);
    setError(null);
    const r = id ? await updateAddress(id, payload) : await addAddress(payload);
    setSaving(false);
    if (r.success) {
      await refetch();
      closeActionModal();
      addToast("success", id ? "Adresă actualizată." : "Adresă adăugată.");
    } else {
      const msg = r.error ?? "Eroare.";
      setError(msg);
      addToast("error", msg);
    }
  };

  const handleDeleteAddress = async (addressId: string) => {
    openConfirmDelete("deleteAddress", addressId);
  };

  const handleSave = async () => {
    if (!editField) return;
    setError(null);
    if (editField === "data_nasterii" && form.data_nasterii) {
      const { max } = getBirthDateLimits();
      if (form.data_nasterii > max) {
        setError("Trebuie să ai cel puțin 16 ani."); addToast("error", "Trebuie să ai cel puțin 16 ani.");
        return;
      }
    }
    setSaving(true);
    if (editField === "nume") {
      const prenume = form.prenume.trim();
      const nume = form.nume.trim();
      if (!prenume || prenume.length < 2) {
        setSaving(false);
        setError("Prenumele este obligatoriu (minim 2 caractere).");
        addToast("error", "Prenumele este obligatoriu (minim 2 caractere).");
        return;
      }
      if (!nume || nume.length < 2) {
        setSaving(false);
        setError("Numele este obligatoriu (minim 2 caractere).");
        addToast("error", "Numele este obligatoriu (minim 2 caractere).");
        return;
      }
      const displayName = computeDisplayNameFromMode(
        prenume,
        nume,
        form.display_name_mode,
        form.display_name_custom
      ).trim();
      const result = await updateUserProfile({
        first_name: prenume,
        last_name: nume,
        display_name: displayName || null,
      });
      setSaving(false);
      if (result.success) {
        await refetch();
        closeEdit();
        addToast("success", "Date salvate.");
      } else {
        const msg = result.error ?? "Eroare la salvare.";
        setError(msg);
        addToast("error", msg);
      }
      return;
    }
    const body: SsoProfileUpdate = {};
    if (editField === "gen") {
      body.gen = form.gen === "prefer_sa_nu_spun" || !form.gen ? null : form.gen;
      body.gen_visibility = normalizeVisibility(form.genVisibility);
    } else if (editField === "data_nasterii") {
      const dateStr = form.data_nasterii || "";
      const fullDateMatch = /^\d{4}-\d{2}-\d{2}$/.test(dateStr);
      if (!fullDateMatch && dateStr.trim() !== "") {
        setSaving(false);
        setError("Selectează ziua, luna și anul.");
        addToast("error", "Selectează ziua, luna și anul.");
        return;
      }
      body.data_nasterii = fullDateMatch ? dateStr : null;
      body.data_nasterii_visibility = normalizeVisibility(form.data_nasterii_visibility);
    } else if (editField === "telefon") {
      const phone = normalizePhoneForApi(form.telefon);
      if (!form.telefon.trim()) {
        setSaving(false);
        setError("Telefonul este obligatoriu.");
        addToast("error", "Telefonul este obligatoriu.");
        return;
      }
      if (!phone) {
        setSaving(false);
        setError("Format invalid. Folosește 07xxxxxxxx.");
        addToast("error", "Format invalid. Folosește 07xxxxxxxx.");
        return;
      }
      const result = await updateUserProfile({ phone });
      setSaving(false);
      if (result.success) {
        await refetch();
        closeEdit();
        addToast("success", "Telefon actualizat.");
      } else {
        const msg = result.error ?? "Eroare la salvare.";
        setError(msg);
        addToast("error", msg);
      }
      return;
    }
    const result = await updateSsoProfile(body);
    setSaving(false);
    if (result.success) {
      await refetch();
      closeEdit();
      addToast("success", "Date salvate.");
    } else {
      const msg = result.message ?? "Eroare la salvare."; setError(msg); addToast("error", msg);
    }
  };

  if (loading) {
    return (
      <div className="grid gap-8 p-6 md:grid-cols-[280px_1fr]">
        <div className="flex items-center justify-center py-12 text-dark-5 dark:text-[#9CA3AF]">
          Se încarcă...
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="p-6 text-dark-5 dark:text-[#9CA3AF]">
        Nu s-au putut încărca datele. Reîncearcă mai târziu.
      </div>
    );
  }

  const legalName = user.name || [user.prenume, user.nume].filter(Boolean).join(" ") || "—";
  const displayName = getPublicDisplayName(user) || legalName;
  const emailsList = getEmailsList(user);
  const phonesList = getPhonesList(user);
  const profileAvatarUrl = resolveProfileAvatarUrl(user);
  const companyAccount = isCompanyAccount(user);

  return (
    <>
      {showEmailConfirmedBanner && (
        <div className="mx-6 mt-4 flex items-center justify-between gap-3 rounded-xl border border-green/30 bg-green/10 px-4 py-3 text-sm text-green dark:border-green/40 dark:bg-green/15 dark:text-green-400">
          <span className="flex items-center gap-2">
            <CheckCircle2 className="size-5 shrink-0" />
            Email-ul a fost confirmat.
          </span>
          <button
            type="button"
            onClick={() => setShowEmailConfirmedBanner(false)}
            className="rounded p-1 text-green hover:bg-green/20 dark:hover:bg-green/25"
            aria-label="Închide"
          >
            <X className="size-5" />
          </button>
        </div>
      )}
      <div className="grid gap-8 p-6 md:grid-cols-[280px_1fr]">
        {/* Card profil (stânga) */}
        <div className="flex flex-col items-center rounded-xl border border-stroke bg-gray-2/50 p-6 dark:border-white/[0.08] dark:bg-white/[0.03]">
          <ProfileAvatar
            src={profileAvatarUrl}
            className="size-24 rounded-full object-cover"
          />
          <p className="mt-3 font-semibold text-dark dark:text-white">
            {displayName}
          </p>
          <p className="mt-0.5 text-sm text-dark-5 dark:text-[#9CA3AF]">
            {user.email || "—"}
          </p>
          <button
            type="button"
            onClick={() => setAvatarInfoDialogOpen(true)}
            disabled={avatarUploading}
            className="mt-4 flex items-center gap-2 rounded-xl border border-stroke bg-white px-4 py-2.5 text-sm font-medium text-dark shadow-sm transition-all duration-200 hover:bg-gray-1 hover:shadow disabled:opacity-50 dark:border-white/[0.12] dark:bg-white/[0.08] dark:text-white dark:hover:bg-white/[0.12] dark:hover:shadow dark:hover:shadow-black/20"
          >
            <Camera className="size-4" strokeWidth={2} />
            {avatarUploading ? "Se încarcă..." : "Schimbă poza"}
          </button>
          <input
            ref={avatarInputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            className="hidden"
            disabled={avatarUploading}
            onChange={async (e) => {
              const file = e.target.files?.[0];
              if (!file) return;
              setAvatarUploading(true);
              setError(null);
              const r = await uploadAvatar(file);
              setAvatarUploading(false);
              if (avatarInputRef.current) avatarInputRef.current.value = "";
              if (r.success) {
                await refetch();
                addToast("success", "Poză actualizată.");
              } else { const msg = r.message ?? "Eroare la încărcare."; setError(msg); addToast("error", msg); }
            }}
          />
          <p className="mt-2 text-xs text-dark-5 dark:text-[#9CA3AF]">
            JPG, PNG sau WebP. Max 5MB.
          </p>
        </div>

        {/* Câmpuri (dreapta) – date din SSO */}
        <div className="space-y-6">
          <div>
            <FieldRow
              label="Numele tău"
              value={displayName}
              onClick={() => openEdit("nume")}
            />
          </div>
          <div>
            <FieldRow
              label="Gen"
              value={formatGen(user.gen)}
              onClick={() => openEdit("gen")}
            />
          </div>

          {/* Email */}
          <div className="rounded-xl border border-stroke bg-gray-2/80 px-4 py-3 dark:border-white/[0.08] dark:bg-white/[0.04]">
            <p className="text-xs font-medium text-dark-5 dark:text-[#9CA3AF]">
              Email
            </p>
            {resendLinkSuccess && (
              <p className="mt-3 rounded-lg bg-green/10 px-3 py-2 text-sm text-green dark:bg-green/20 dark:text-green-400">
                Linkul de confirmare a fost retrimis. Verifică inbox-ul.
              </p>
            )}
            <ul className="mt-3 space-y-2">
              {emailsList.map((e) => (
                <li
                  key={e.id}
                  className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-stroke/60 bg-white/50 py-2 px-3 dark:border-white/[0.06] dark:bg-white/[0.03]"
                >
                  <div className="flex min-w-0 items-center gap-2">
                    <Mail className="size-4 shrink-0 text-dark-5 dark:text-[#9CA3AF]" />
                    <span className="font-medium text-dark dark:text-white">
                      {looksLikeEncrypted(e.email) ? "—" : e.email}
                    </span>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    {e.verified ? (
                      <span className="rounded-full bg-green/15 px-2 py-0.5 text-xs font-medium text-green dark:text-green-400">
                        Verificat
                      </span>
                    ) : (
                      <>
                        <button
                          type="button"
                          onClick={() => handleSendEmailVerification(e.id)}
                          className="rounded-full bg-amber/15 px-2 py-0.5 text-xs font-medium text-amber transition-colors hover:bg-amber/25 dark:text-amber-400"
                        >
                          Verifică
                        </button>
                        <button
                          type="button"
                          onClick={() => handleResendEmailConfirmationLink(e.id)}
                          className="rounded-full bg-gray-2 px-2 py-0.5 text-xs font-medium text-dark-5 hover:bg-gray-3 dark:bg-white/[0.08] dark:text-[#9CA3AF] dark:hover:bg-white/[0.12]"
                        >
                          Retrimite link
                        </button>
                      </>
                    )}
                    <button
                      type="button"
                      onClick={() => openActionModal("changePrimaryEmail")}
                      className="rounded-full bg-gray-2 px-2 py-0.5 text-xs font-medium text-dark-5 hover:bg-gray-3 dark:bg-white/[0.08] dark:text-[#9CA3AF] dark:hover:bg-white/[0.12]"
                    >
                      Editează
                    </button>
                    <button
                      type="button"
                      onClick={() => openActionModal("visibilityEmail", { email: e })}
                      className="flex items-center gap-1 rounded px-2 py-0.5 text-xs text-dark-5 hover:bg-gray-2 hover:text-dark dark:text-[#9CA3AF] dark:hover:bg-white/[0.06] dark:hover:text-white"
                      title="Cine poate vedea"
                    >
                      <Eye className="size-3.5" />
                      {getVisibilityLabel(e.visibility)}
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          </div>

          {/* Telefon */}
          <div className="rounded-xl border border-stroke bg-gray-2/80 px-4 py-3 dark:border-white/[0.08] dark:bg-white/[0.04]">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <p className="text-xs font-medium text-dark-5 dark:text-[#9CA3AF]">
                    Telefon
                  </p>
                </div>
              </div>
              {phonesList.length === 0 ? (
                <button
                  type="button"
                  onClick={() => openEdit("telefon")}
                  className="flex items-center gap-1.5 rounded-lg border border-stroke bg-white px-3 py-1.5 text-sm font-medium text-dark shadow-sm hover:bg-gray-1 dark:border-white/[0.12] dark:bg-white/[0.08] dark:text-white dark:hover:bg-white/[0.12]"
                >
                  <Plus className="size-4" /> Adaugă număr
                </button>
              ) : null}
            </div>
            <ul className="mt-3 space-y-2">
              {phonesList.map((p) => (
                <li
                  key={p.id}
                  className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-stroke/60 bg-white/50 py-2 px-3 dark:border-white/[0.06] dark:bg-white/[0.03]"
                >
                  <div className="flex min-w-0 items-center gap-2">
                    <Phone className="size-4 shrink-0 text-dark-5 dark:text-[#9CA3AF]" />
                    <span className="font-medium text-dark dark:text-white">
                      {looksLikeEncrypted(p.phone) ? "—" : p.phone}
                    </span>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    {p.verified ? (
                      <span className="rounded-full bg-green/15 px-2 py-0.5 text-xs font-medium text-green dark:text-green-400">
                        Verificat
                      </span>
                    ) : p.id !== "legacy" ? (
                      <button
                        type="button"
                        onClick={() => handleSendPhoneVerification(p.id)}
                        className="rounded-full bg-amber/15 px-2 py-0.5 text-xs font-medium text-amber dark:text-amber-400"
                      >
                        Verifică
                      </button>
                    ) : null}
                    <button
                      type="button"
                      onClick={() => openEdit("telefon")}
                      className="rounded-full bg-gray-2 px-2 py-0.5 text-xs font-medium text-dark-5 hover:bg-gray-3 dark:bg-white/[0.08] dark:text-[#9CA3AF] dark:hover:bg-white/[0.12]"
                    >
                      Editează
                    </button>
                    <button
                      type="button"
                      onClick={() => openActionModal("visibilityPhone", { phone: p })}
                      className="flex items-center gap-1 rounded px-2 py-0.5 text-xs text-dark-5 hover:bg-gray-2 hover:text-dark dark:text-[#9CA3AF] dark:hover:bg-white/[0.06] dark:hover:text-white"
                      title="Cine poate vedea numărul"
                    >
                      <Eye className="size-3.5" />
                      {getVisibilityLabel(p.visibility)}
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <FieldRow
              label="Data de naștere"
              value={user.data_nasterii && !looksLikeEncrypted(user.data_nasterii) ? formatDisplayDate(user.data_nasterii) : "Nu este setată"}
              onClick={() => openEdit("data_nasterii")}
            />
          </div>

          {/* Adrese – adresa de domiciliu și adresa de reședință */}
          {!companyAccount && (
          <div className="rounded-xl border border-stroke bg-gray-2/80 px-4 py-3 dark:border-white/[0.08] dark:bg-white/[0.04]">
            <p className="mb-3 text-xs font-medium text-dark-5 dark:text-[#9CA3AF]">
              Adrese
            </p>
            <div className="space-y-4">
              <div>
                <p className="mb-1.5 text-sm font-medium text-dark dark:text-white">
                  Adresa de domiciliu
                </p>
                {(() => {
                  const addresses = getAddressesList(user);
                  const domiciliu = addresses.find((a) => a.addressType === "domiciliu");
                  if (domiciliu) {
                    return (
                      <div className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-stroke/60 bg-white/50 py-2.5 px-3 dark:border-white/[0.06] dark:bg-white/[0.03]">
                        <div className="flex min-w-0 items-center gap-2">
                          <MapPin className="size-4 shrink-0 text-dark-5 dark:text-[#9CA3AF]" />
                          <span className="text-sm text-dark dark:text-white">
                            {formatAddressLine(domiciliu)}
                          </span>
                        </div>
                        <div className="flex gap-2">
                          <button
                            type="button"
                            onClick={() => openActionModal("editAddress", { address: domiciliu })}
                            className="text-xs font-medium text-[#16366d] hover:underline dark:text-blue-400"
                          >
                            Editează
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteAddress(domiciliu.id)}
                            className="rounded p-1 text-dark-5 hover:bg-gray-2 hover:text-red dark:text-[#9CA3AF] dark:hover:bg-red/20"
                            aria-label="Șterge adresa de domiciliu"
                          >
                            <Trash2 className="size-4" />
                          </button>
                        </div>
                      </div>
                    );
                  }
                  return (
                    <button
                      type="button"
                      onClick={() => openActionModal("addAddress", { addressType: "domiciliu" })}
                      className="flex w-full items-center gap-2 rounded-lg border border-dashed border-stroke py-2.5 px-3 text-left text-sm text-dark-5 transition-colors hover:bg-gray-2 hover:text-dark dark:border-white/[0.12] dark:text-[#9CA3AF] dark:hover:bg-white/[0.06] dark:hover:text-white"
                    >
                      <MapPin className="size-4 shrink-0" />
                      Adaugă adresa
                    </button>
                  );
                })()}
              </div>
              <div>
                <p className="mb-1.5 text-sm font-medium text-dark dark:text-white">
                  Adresa de reședință
                </p>
                {(() => {
                  const addresses = getAddressesList(user);
                  const resedinta = addresses.find((a) => a.addressType === "resedinta" || a.addressType === "postala");
                  if (resedinta) {
                    return (
                      <div className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-stroke/60 bg-white/50 py-2.5 px-3 dark:border-white/[0.06] dark:bg-white/[0.03]">
                        <div className="flex min-w-0 items-center gap-2">
                          <MapPin className="size-4 shrink-0 text-dark-5 dark:text-[#9CA3AF]" />
                          <span className="text-sm text-dark dark:text-white">
                            {formatAddressLine(resedinta)}
                          </span>
                        </div>
                        <div className="flex gap-2">
                          <button
                            type="button"
                            onClick={() => openActionModal("editAddress", { address: resedinta })}
                            className="text-xs font-medium text-[#16366d] hover:underline dark:text-blue-400"
                          >
                            Editează
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteAddress(resedinta.id)}
                            className="rounded p-1 text-dark-5 hover:bg-gray-2 hover:text-red dark:text-[#9CA3AF] dark:hover:bg-red/20"
                            aria-label="Șterge adresa de reședință"
                          >
                            <Trash2 className="size-4" />
                          </button>
                        </div>
                      </div>
                    );
                  }
                  return (
                    <button
                      type="button"
                      onClick={() => openActionModal("addAddress", { addressType: "resedinta" })}
                      className="flex w-full items-center gap-2 rounded-lg border border-dashed border-stroke py-2.5 px-3 text-left text-sm text-dark-5 transition-colors hover:bg-gray-2 hover:text-dark dark:border-white/[0.12] dark:text-[#9CA3AF] dark:hover:bg-white/[0.06] dark:hover:text-white"
                    >
                      <MapPin className="size-4 shrink-0" />
                      Adaugă adresa
                    </button>
                  );
                })()}
              </div>
            </div>
          </div>
          )}

          {user.role === "worker" && !companyAccount && <DomainStudiesSection />}
          {user.role === "worker" && !companyAccount && <PfaSection />}
        </div>
      </div>

      {/* Modal editare informații personale – centrat pe ecran */}
      <dialog
        ref={dialogRef}
        className={`fixed inset-0 m-0 flex w-full min-h-[100dvh] max-h-[100dvh] items-center justify-center rounded-none border-0 bg-transparent p-4 outline-none [&:not([open])]:pointer-events-none ${MODAL_BACKDROP_BASE} ${modalBackdropClasses(isClosing, openAnimated)}`}
        onCancel={closeEdit}
        onClose={() => {
          setEditField(null);
          setOpenAnimated(false);
          setIsClosing(false);
        }}
      >
        <div
          className={`${MODAL_POPUP_BASE} max-h-[calc(100dvh-2rem)] w-full max-w-md overflow-hidden overflow-y-auto rounded-2xl border border-stroke bg-white shadow-xl dark:border-white/[0.08] dark:bg-[#1A1A1A] ${modalContentClasses(isClosing, openAnimated)}`}
        >
        {editField === "nume" ? (
          <>
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-3">
                <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary dark:bg-primary/20">
                  <User className="size-5" strokeWidth={2} />
                </span>
                <div>
                  <h3 className="text-lg font-semibold text-dark dark:text-white">
                    Numele tău
                  </h3>
                </div>
              </div>
              <button
                type="button"
                onClick={closeEdit}
                className="shrink-0 rounded-lg p-1.5 text-dark-5 transition-colors hover:bg-gray-2 hover:text-dark dark:text-[#9CA3AF] dark:hover:bg-white/[0.08] dark:hover:text-white"
                aria-label="Închide"
              >
                <X className="size-5" />
              </button>
            </div>

            <div className="mt-5 space-y-4">
              {error && (
                <p className="rounded-xl bg-red/10 px-4 py-3 text-sm text-red dark:bg-red/20 dark:text-red-400">
                  {error}
                </p>
              )}
              <p className="text-sm font-semibold text-dark dark:text-white">
                Nume legal
              </p>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="mb-2 block text-sm font-medium text-dark-5 dark:text-[#9CA3AF]">Prenume</label>
                  <input
                    type="text"
                    value={form.prenume}
                    onChange={(e) => setForm((f) => ({ ...f, prenume: e.target.value }))}
                    className="w-full rounded-xl border border-stroke bg-gray-2/80 px-3 py-2.5 text-dark dark:border-white/[0.08] dark:bg-white/[0.04] dark:text-white"
                  />
                </div>
                <div>
                  <label className="mb-2 block text-sm font-medium text-dark-5 dark:text-[#9CA3AF]">Nume</label>
                  <input
                    type="text"
                    value={form.nume}
                    onChange={(e) => setForm((f) => ({ ...f, nume: e.target.value }))}
                    className="w-full rounded-xl border border-stroke bg-gray-2/80 px-3 py-2.5 text-dark dark:border-white/[0.08] dark:bg-white/[0.04] dark:text-white"
                  />
                </div>
              </div>
              <p className="text-sm font-semibold text-dark dark:text-white">
                Nume afișat public
              </p>
              <SettingsSelect
                value={form.display_name_mode}
                onChange={(e) =>
                  setForm((f) => ({
                    ...f,
                    display_name_mode: e.target.value as DisplayNameMode,
                  }))
                }
              >
                {DISPLAY_NAME_MODE_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </SettingsSelect>
              <p className="rounded-xl bg-gray-2/80 px-4 py-3 text-sm text-dark-5 dark:bg-white/[0.06] dark:text-[#9CA3AF]">
                Așa vei apărea:{" "}
                <strong className="text-dark dark:text-white">
                  {computeDisplayNameFromMode(
                    form.prenume,
                    form.nume,
                    form.display_name_mode,
                    form.display_name_custom
                  ) || "—"}
                </strong>
              </p>
              <p className="text-sm leading-relaxed text-dark-5 dark:text-[#9CA3AF]">
                Acesta este numele pe care îl vor vedea ceilalți în aplicația AiMeseriaș.
              </p>
            </div>
          </>
        ) : (
          <>
            {editField === "gen" ? (
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                  <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary dark:bg-primary/20">
                    <Users className="size-5" strokeWidth={2} />
                  </span>
                  <div>
                    <h3 className="text-lg font-semibold text-dark dark:text-white">
                      Gen
                    </h3>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={closeEdit}
                  className="shrink-0 rounded-lg p-1.5 text-dark-5 transition-colors hover:bg-gray-2 hover:text-dark dark:text-[#9CA3AF] dark:hover:bg-white/[0.08] dark:hover:text-white"
                  aria-label="Închide"
                >
                  <X className="size-5" />
                </button>
              </div>
            ) : editField === "data_nasterii" ? (
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                  <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary dark:bg-primary/20">
                    <Calendar className="size-5" strokeWidth={2} />
                  </span>
                  <h3 className="text-lg font-semibold text-dark dark:text-white">
                    Data de naștere
                  </h3>
                </div>
                <button
                  type="button"
                  onClick={closeEdit}
                  className="shrink-0 rounded-lg p-1.5 text-dark-5 transition-colors hover:bg-gray-2 hover:text-dark dark:text-[#9CA3AF] dark:hover:bg-white/[0.08] dark:hover:text-white"
                  aria-label="Închide"
                >
                  <X className="size-5" />
                </button>
              </div>
            ) : (
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-dark dark:text-white">
                  {editField === "telefon" && "Telefon"}
                </h3>
                <button
                  type="button"
                  onClick={closeEdit}
                  className="rounded-lg p-1 text-dark-5 hover:bg-gray-2 dark:text-[#9CA3AF] dark:hover:bg-white/[0.06] dark:hover:text-white"
                  aria-label="Închide"
                >
                  <X className="size-5" />
                </button>
              </div>
            )}

        <div className="mt-4 space-y-4">
          {error && (
            <p className="rounded-lg bg-red/10 px-3 py-2 text-sm text-red dark:bg-red/20 dark:text-red-400">
              {error}
            </p>
          )}
          {editField === "gen" && (
            <div className="space-y-6">
              <div>
                <label className="mb-2 block text-sm font-medium text-dark-5 dark:text-[#9CA3AF]">
                  Gen
                </label>
                <SettingsSelect
                  value={form.gen}
                  onChange={(e) => setForm((f) => ({ ...f, gen: e.target.value }))}
                >
                  {GEN_OPTIONS.map((o) => (
                    <option key={o.value} value={o.value}>
                      {o.label}
                    </option>
                  ))}
                </SettingsSelect>
                <p className="mt-3 text-sm leading-relaxed text-dark-5 dark:text-[#9CA3AF]">
                  Genul tău poate fi folosit pentru personalizare experienției, inclusiv pentru modul în care ni te adresăm.
                </p>
              </div>
              <div>
                <p className="mb-2 text-sm font-medium text-dark-5 dark:text-[#9CA3AF]">
                  Cine poate vedea genul
                </p>
                <div className="space-y-2">
                  {VISIBILITY_OPTIONS.map((o) => (
                    <label
                      key={o.value}
                      className={`flex cursor-pointer gap-3 rounded-xl border px-4 py-3 transition-colors ${
                        form.genVisibility === o.value
                          ? "border-primary bg-primary/10 dark:border-primary dark:bg-primary/20"
                          : "border-stroke bg-gray-2/50 hover:border-stroke/80 hover:bg-gray-2/80 dark:border-white/[0.08] dark:bg-white/[0.02] dark:hover:bg-white/[0.04]"
                      }`}
                    >
                      <input
                        type="radio"
                        name="gen_visibility"
                        value={o.value}
                        checked={form.genVisibility === o.value}
                        onChange={() => setForm((f) => ({ ...f, genVisibility: o.value }))}
                        className="mt-0.5 shrink-0 rounded-full border-stroke text-primary focus:ring-2 focus:ring-primary dark:border-white/[0.12] dark:focus:ring-primary"
                      />
                      <div className="min-w-0">
                        <span className="block text-sm font-medium text-dark dark:text-white">
                          {o.label}
                        </span>
                        <span className="mt-0.5 block text-xs text-dark-5 dark:text-[#9CA3AF]">
                          {o.description.replace("{ref}", "genul")}
                        </span>
                      </div>
                    </label>
                  ))}
                </div>
              </div>
            </div>
          )}
          {editField === "data_nasterii" && (() => {
            const today = new Date();
            const maxYear = today.getFullYear() - 16;
            const minYear = today.getFullYear() - 120;
            const parts = (form.data_nasterii || "").split("-");
            const y = parts[0] ?? "";
            const m = parts[1] ?? "";
            const d = parts[2] ?? "";
            const yearNum = y ? parseInt(y, 10) : null;
            const monthNum = m ? parseInt(m, 10) : null;
            const dayNum = d ? parseInt(d, 10) : null;
            const daysInMonth = (month: number, year: number) =>
              new Date(year || maxYear, month, 0).getDate();
            const updateBirthDate = (year: string, month: string, day: string) => {
              setForm((f) => {
                const [ey, em, ed] = (f.data_nasterii || "").split("-");
                const ny = (year !== undefined && year !== "") ? year : (ey ?? "");
                const nm = (month !== undefined && month !== "") ? month : (em ?? "");
                const nd = (day !== undefined && day !== "") ? day : (ed ?? "");
                const pad2 = (x: string) => (x.length >= 2 ? x.slice(0, 2) : x.length === 1 ? "0" + x : x);
                const sy = ny.length === 4 ? ny : ny;
                const sm = nm ? pad2(nm) : "";
                const sd = nd ? pad2(nd) : "";
                return { ...f, data_nasterii: `${sy}-${sm}-${sd}` };
              });
            };
            return (
              <div className="space-y-6">
                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="mb-2 block text-sm font-medium text-dark-5 dark:text-[#9CA3AF]">Zi</label>
                    <SettingsSelect
                      value={d || ""}
                      onChange={(e) => updateBirthDate(y, m, e.target.value)}
                    >
                      <option value="">—</option>
                      {Array.from({ length: 31 }, (_, i) => i + 1).map((n) => (
                        <option key={n} value={String(n).padStart(2, "0")}>
                          {n}
                        </option>
                      ))}
                    </SettingsSelect>
                  </div>
                  <div>
                    <label className="mb-2 block text-sm font-medium text-dark-5 dark:text-[#9CA3AF]">Lună</label>
                    <SettingsSelect
                      value={m || ""}
                      onChange={(e) => {
                        const newMonth = e.target.value;
                        if (!newMonth) {
                          updateBirthDate(y, "", d);
                          return;
                        }
                        const maxD = yearNum ? daysInMonth(parseInt(newMonth, 10), yearNum) : 31;
                        const clampedDay = (d && dayNum) ? String(Math.min(dayNum, maxD)).padStart(2, "0") : (d || "");
                        updateBirthDate(y, newMonth, clampedDay);
                      }}
                    >
                      <option value="">—</option>
                      {LUNI_RO.map((label, i) => (
                        <option key={i} value={String(i + 1).padStart(2, "0")}>
                          {label}
                        </option>
                      ))}
                    </SettingsSelect>
                  </div>
                  <div>
                    <label className="mb-2 block text-sm font-medium text-dark-5 dark:text-[#9CA3AF]">An</label>
                    <SettingsSelect
                      value={y || ""}
                      onChange={(e) => updateBirthDate(e.target.value, m, d)}
                    >
                      <option value="">—</option>
                      {Array.from({ length: maxYear - minYear + 1 }, (_, i) => maxYear - i).map((yr) => (
                        <option key={yr} value={String(yr)}>
                          {yr}
                        </option>
                      ))}
                    </SettingsSelect>
                  </div>
                </div>
                <input
                  type="hidden"
                  aria-hidden
                  value={form.data_nasterii}
                  readOnly
                />
                <p className="text-sm leading-relaxed text-dark-5 dark:text-[#9CA3AF]">
                  Data ta de naștere poate fi folosită pentru personalizarea experienței în aplicația AiMeseriaș.
                </p>
                <div>
                  <p className="mb-2 text-sm font-medium text-dark-5 dark:text-[#9CA3AF]">
                    Cine poate vedea data de naștere
                  </p>
                  <div className="mt-2 space-y-2">
                    {VISIBILITY_OPTIONS.map((o) => (
                      <label
                        key={o.value}
                        className={`flex cursor-pointer gap-3 rounded-xl border px-4 py-3 transition-colors ${
                          form.data_nasterii_visibility === o.value
                            ? "border-primary bg-primary/10 dark:border-primary dark:bg-primary/20"
                            : "border-stroke bg-gray-2/50 hover:border-stroke/80 hover:bg-gray-2/80 dark:border-white/[0.08] dark:bg-white/[0.02] dark:hover:bg-white/[0.04]"
                        }`}
                      >
                        <input
                          type="radio"
                          name="data_nasterii_visibility"
                          value={o.value}
                          checked={form.data_nasterii_visibility === o.value}
                          onChange={() => setForm((f) => ({ ...f, data_nasterii_visibility: o.value }))}
                          className="mt-0.5 shrink-0 rounded-full border-stroke text-primary focus:ring-2 focus:ring-primary dark:border-white/[0.12] dark:focus:ring-primary"
                        />
                        <div className="min-w-0">
                          <span className="block text-sm font-medium text-dark dark:text-white">
                            {o.label}
                          </span>
                          <span className="mt-0.5 block text-xs text-dark-5 dark:text-[#9CA3AF]">
                            {o.description.replace("{ref}", "data de naștere")}
                          </span>
                        </div>
                      </label>
                    ))}
                  </div>
                  <p className="mt-3 text-sm leading-relaxed text-dark-5 dark:text-[#9CA3AF]">
                    Poți alege cine îți poate vedea data de naștere: doar tu sau utilizatorii din aplicația AiMeseriaș.
                  </p>
                </div>
              </div>
            );
          })()}
          {editField === "telefon" && (
            <div>
              <label className="mb-1 block text-sm font-medium text-dark-5 dark:text-[#9CA3AF]">
                Telefon
              </label>
              <input
                type="tel"
                value={form.telefon}
                onChange={(e) =>
                  setForm((f) => ({ ...f, telefon: e.target.value }))
                }
                className="w-full rounded-lg border border-stroke bg-gray-2/80 px-3 py-2 text-dark dark:border-white/[0.08] dark:bg-white/[0.04] dark:text-white"
                placeholder="07xx xxx xxx"
                autoComplete="tel"
              />
              <p className="mt-2 text-xs text-dark-5 dark:text-[#9CA3AF]">
                Format acceptat: 07xxxxxxxx.
              </p>
            </div>
          )}
        </div>
          </>
        )}

        <div className="mt-6 flex flex-wrap justify-end gap-3">
          <button
            type="button"
            onClick={closeEdit}
            className="rounded-xl border border-stroke bg-white px-4 py-2.5 text-sm font-medium text-dark shadow-sm transition-colors hover:bg-gray-1 dark:border-white/[0.12] dark:bg-white/[0.08] dark:text-white dark:hover:bg-white/[0.12]"
          >
            Anulare
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={saving}
            className="rounded-xl bg-primary px-4 py-2.5 text-sm font-medium text-white shadow-sm transition-colors hover:bg-primary/90 disabled:opacity-50 dark:bg-primary dark:hover:bg-primary/90"
          >
            {saving ? "Se salvează…" : "Salvează"}
          </button>
        </div>
        </div>
      </dialog>

      {/* Modal acțiuni: adaugă email, telefon, adrese – centrat pe ecran */}
      <dialog
        ref={actionDialogRef}
        className={`fixed inset-0 m-0 flex w-full min-h-[100dvh] max-h-[100dvh] items-center justify-center rounded-none border-0 bg-transparent p-4 outline-none [&:not([open])]:pointer-events-none ${MODAL_BACKDROP_BASE} ${modalBackdropClasses(actionClosing, actionOpenAnimated)}`}
        onCancel={closeActionModal}
        onClose={() => {
          setActionModalOpen(null);
          setAddEmailSuccessEmail(null);
          setActionClosing(false);
          setActionOpenAnimated(false);
          setError(null);
        }}
      >
        <div
          className={`${MODAL_POPUP_BASE} max-h-[calc(100dvh-2rem)] w-full max-w-md overflow-hidden overflow-y-auto rounded-2xl border border-stroke bg-white shadow-xl dark:border-white/[0.08] dark:bg-[#1A1A1A] ${modalContentClasses(actionClosing, actionOpenAnimated)}`}
        >
          {actionModalOpen === "addEmail" && (
            <>
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                  <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary dark:bg-primary/20">
                    <Mail className="size-5" strokeWidth={2} />
                  </span>
                  <div>
                    <h3 className="text-lg font-semibold text-dark dark:text-white">
                      Adaugă email
                    </h3>
                    <p className="mt-0.5 text-sm text-dark-5 dark:text-[#9CA3AF]">
                      Link de confirmare pe email
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={closeActionModal}
                  className="shrink-0 rounded-lg p-1.5 text-dark-5 transition-colors hover:bg-gray-2 hover:text-dark dark:text-[#9CA3AF] dark:hover:bg-white/[0.08] dark:hover:text-white"
                  aria-label="Închide"
                >
                  <X className="size-5" />
                </button>
              </div>
              {addEmailSuccessEmail ? (
                <div className="mt-5 space-y-4">
                  <p className={`rounded-xl px-4 py-3 text-sm leading-relaxed ${addEmailSendFailed ? "bg-amber/10 text-amber dark:bg-amber/20 dark:text-amber-400" : "bg-green/10 text-green dark:bg-green/20 dark:text-green-400"}`}>
                    {addEmailSendFailed ? (
                      <>Emailul <strong>{addEmailSuccessEmail}</strong> a fost adăugat. Trimitera linkului a eșuat; folosește butonul „Retrimite link” din listă.</>
                    ) : (
                      <>Un link de confirmare a fost trimis la <strong>{addEmailSuccessEmail}</strong>. Deschide linkul din email pentru a verifica adresa. Doar după confirmare va putea fi utilizat.</>
                    )}
                  </p>
                  <div className="flex justify-end">
                    <button
                      type="button"
                      onClick={closeActionModal}
                      className="rounded-xl bg-primary px-4 py-2.5 text-sm font-medium text-white shadow-sm transition-colors hover:bg-primary/90 dark:bg-primary dark:hover:bg-primary/90"
                    >
                      Închide
                    </button>
                  </div>
                </div>
              ) : (
                <>
                  <div className="mt-5 space-y-4">
                    {error && (
                      <p className="rounded-xl bg-red/10 px-4 py-3 text-sm text-red dark:bg-red/20 dark:text-red-400">
                        {error}
                      </p>
                    )}
                    <div>
                      <label className="mb-2 block text-sm font-medium text-dark-5 dark:text-[#9CA3AF]">
                        Email
                      </label>
                      <input
                        type="email"
                        value={addEmailValue}
                        onChange={(e) => setAddEmailValue(e.target.value)}
                        placeholder="exemplu@email.ro"
                        className="w-full rounded-xl border border-stroke bg-gray-2/80 px-3 py-2.5 text-dark dark:border-white/[0.08] dark:bg-white/[0.04] dark:text-white"
                      />
                    </div>
                    <div>
                      <p className="mb-2 text-sm font-medium text-dark-5 dark:text-[#9CA3AF]">
                        Cine poate vedea acest email
                      </p>
                      <div className="space-y-2">
                        {VISIBILITY_OPTIONS.map((o) => (
                          <label
                            key={o.value}
                            className={`flex cursor-pointer gap-3 rounded-xl border px-4 py-3 transition-colors ${
                              addEmailVisibility === o.value
                                ? "border-primary bg-primary/10 dark:border-primary dark:bg-primary/20"
                                : "border-stroke bg-gray-2/50 hover:border-stroke/80 hover:bg-gray-2/80 dark:border-white/[0.08] dark:bg-white/[0.02] dark:hover:bg-white/[0.04]"
                            }`}
                          >
                            <input
                              type="radio"
                              name="add_email_visibility"
                              value={o.value}
                              checked={addEmailVisibility === o.value}
                              onChange={() => setAddEmailVisibility(o.value)}
                              className="mt-1 shrink-0 rounded-full border-stroke text-primary focus:ring-2 focus:ring-primary dark:border-white/[0.12] dark:focus:ring-primary"
                            />
                            <div className="min-w-0">
                              <span className="block text-sm font-medium text-dark dark:text-white">
                                {o.label}
                              </span>
                              <span className="mt-0.5 block text-xs text-dark-5 dark:text-[#9CA3AF]">
                                {o.description.replace("{ref}", "acest email")}
                              </span>
                            </div>
                          </label>
                        ))}
                      </div>
                    </div>
                    <div className="flex flex-wrap justify-end gap-3">
                      <button
                        type="button"
                        onClick={closeActionModal}
                        className="rounded-xl border border-stroke bg-white px-4 py-2.5 text-sm font-medium text-dark shadow-sm transition-colors hover:bg-gray-1 dark:border-white/[0.12] dark:bg-white/[0.08] dark:text-white dark:hover:bg-white/[0.12]"
                      >
                        Anulare
                      </button>
                      <button
                        type="button"
                        onClick={handleAddEmail}
                        disabled={saving || !addEmailValue.trim()}
                        className="rounded-xl bg-primary px-4 py-2.5 text-sm font-medium text-white shadow-sm transition-colors hover:bg-primary/90 disabled:opacity-50 dark:bg-primary dark:hover:bg-primary/90"
                      >
                        {saving ? "Se trimite…" : "Trimite link de confirmare"}
                      </button>
                    </div>
                  </div>
                </>
              )}
            </>
          )}

          {actionModalOpen === "changePrimaryEmail" && (
            <>
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-dark dark:text-white">
                  Schimbă emailul
                </h3>
                <button
                  type="button"
                  onClick={closeActionModal}
                  className="rounded-lg p-1 text-dark-5 hover:bg-gray-2 dark:text-[#9CA3AF] dark:hover:bg-white/[0.06] dark:hover:text-white"
                  aria-label="Închide"
                >
                  <X className="size-5" />
                </button>
              </div>
              {changePrimaryEmailSuccess ? (
                <div className="mt-4 space-y-4">
                  <p className="rounded-lg bg-green/10 px-3 py-3 text-sm text-green dark:bg-green/20 dark:text-green-400">
                    Emailul a fost actualizat la{" "}
                    <strong>{changePrimaryEmailValue}</strong>. La următoarea autentificare
                    folosește noua adresă.
                  </p>
                  <div className="flex justify-end">
                    <button
                      type="button"
                      onClick={closeActionModal}
                      className="rounded-xl bg-[#16366d] px-4 py-2.5 text-sm font-medium text-white hover:bg-[#16366d]/90 dark:bg-[#16366d] dark:hover:bg-[#16366d]/90"
                    >
                      Închide
                    </button>
                  </div>
                </div>
              ) : changeEmailCodeSent ? (
                <div className="mt-4 space-y-4">
                  {error && (
                    <p className="rounded-lg bg-red/10 px-3 py-2 text-sm text-red dark:bg-red/20 dark:text-red-400">
                      {error}
                    </p>
                  )}
                  <p className="text-sm text-dark-5 dark:text-[#9CA3AF]">
                    Am trimis un cod de verificare la{" "}
                    <strong className="text-dark dark:text-white">{changePrimaryEmailValue}</strong>.
                    Introdu codul de 6 cifre pentru a confirma schimbarea.
                  </p>
                  <div>
                    <label className="mb-1 block text-sm font-medium text-dark-5 dark:text-[#9CA3AF]">
                      Cod verificare
                    </label>
                    <input
                      type="text"
                      inputMode="numeric"
                      maxLength={6}
                      value={changeEmailCodeInput}
                      onChange={(e) => setChangeEmailCodeInput(e.target.value.replace(/\D/g, ""))}
                      placeholder="000000"
                      className="w-full rounded-lg border border-stroke bg-gray-2/80 px-3 py-2 tracking-widest text-dark dark:border-white/[0.08] dark:bg-white/[0.04] dark:text-white"
                    />
                  </div>
                  <div className="flex flex-wrap justify-end gap-2">
                    <button
                      type="button"
                      onClick={handleSendEmailChangeCode}
                      disabled={saving}
                      className="rounded-xl border border-stroke px-4 py-2.5 text-sm font-medium text-dark dark:border-white/[0.12] dark:text-white"
                    >
                      Retrimite codul
                    </button>
                    <button
                      type="button"
                      onClick={handleConfirmEmailChange}
                      disabled={saving || changeEmailCodeInput.length < 6}
                      className="rounded-xl bg-[#16366d] px-4 py-2.5 text-sm font-medium text-white hover:bg-[#16366d]/90 disabled:opacity-50 dark:bg-[#16366d] dark:hover:bg-[#16366d]/90"
                    >
                      {saving ? "Se verifică..." : "Confirmă schimbarea"}
                    </button>
                  </div>
                </div>
              ) : (
                <div className="mt-4 space-y-4">
                  <p className="text-sm text-dark-5 dark:text-[#9CA3AF]">
                    Introdu noua adresă de email. Vei primi un cod de verificare pe acea adresă
                    înainte ca schimbarea să fie aplicată.
                  </p>
                  {error && (
                    <p className="rounded-lg bg-red/10 px-3 py-2 text-sm text-red dark:bg-red/20 dark:text-red-400">
                      {error}
                    </p>
                  )}
                  <div>
                    <label className="mb-1 block text-sm font-medium text-dark-5 dark:text-[#9CA3AF]">
                      Email curent
                    </label>
                    <input
                      type="email"
                      value={user?.email ?? ""}
                      readOnly
                      className="w-full cursor-default rounded-lg border border-stroke bg-gray-2/80 px-3 py-2 text-dark opacity-90 dark:border-white/[0.08] dark:bg-white/[0.06] dark:text-white"
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-sm font-medium text-dark-5 dark:text-[#9CA3AF]">
                      Email nou
                    </label>
                    <input
                      type="email"
                      value={changePrimaryEmailValue}
                      onChange={(e) => setChangePrimaryEmailValue(e.target.value)}
                      placeholder="exemplu@email.ro"
                      className="w-full rounded-lg border border-stroke bg-gray-2/80 px-3 py-2 text-dark dark:border-white/[0.08] dark:bg-white/[0.04] dark:text-white"
                    />
                  </div>
                  <div className="flex justify-end gap-2">
                    <button
                      type="button"
                      onClick={closeActionModal}
                      className="rounded-xl border border-stroke px-4 py-2.5 text-sm font-medium text-dark dark:border-white/[0.12] dark:text-white"
                    >
                      Anulare
                    </button>
                    <button
                      type="button"
                      onClick={handleSendEmailChangeCode}
                      disabled={
                        saving ||
                        !changePrimaryEmailValue.trim() ||
                        changePrimaryEmailValue.trim().toLowerCase() ===
                          (user?.email ?? "").toLowerCase()
                      }
                      className="rounded-xl bg-[#16366d] px-4 py-2.5 text-sm font-medium text-white hover:bg-[#16366d]/90 disabled:opacity-50 dark:bg-[#16366d] dark:hover:bg-[#16366d]/90"
                    >
                      {saving ? "Se trimite..." : "Trimite cod de verificare"}
                    </button>
                  </div>
                </div>
              )}
            </>
          )}

          {actionModalOpen === "verifyEmail" && (
            <>
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-dark dark:text-white">
                  Verificare email
                </h3>
                <button
                  type="button"
                  onClick={closeActionModal}
                  className="rounded-lg p-1 text-dark-5 hover:bg-gray-2 dark:text-[#9CA3AF] dark:hover:bg-white/[0.06] dark:hover:text-white"
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
                <p className="text-sm text-dark-5 dark:text-[#9CA3AF]">
                  Introdu codul de 6 cifre trimis la{" "}
                  <strong className="text-dark dark:text-white">
                    {emailsList.find((item) => item.id === verifyEmailId)?.email ?? user?.email ?? "emailul tău"}
                  </strong>
                  .
                </p>
                <input
                  type="text"
                  inputMode="numeric"
                  autoComplete="one-time-code"
                  maxLength={6}
                  value={verifyEmailCodeInput}
                  onChange={(e) => setVerifyEmailCodeInput(e.target.value.replace(/\D/g, "").slice(0, 6))}
                  placeholder="Cod 6 cifre"
                  className="w-full rounded-lg border border-stroke bg-gray-2/80 px-3 py-2 text-dark dark:border-white/[0.08] dark:bg-white/[0.04] dark:text-white"
                />
                <div className="flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={closeActionModal}
                    className="rounded-xl border border-stroke px-4 py-2.5 text-sm font-medium text-dark dark:border-white/[0.12] dark:text-white"
                  >
                    Anulare
                  </button>
                  <button
                    type="button"
                    onClick={handleVerifyEmail}
                    disabled={saving || !verifyEmailCodeInput.trim()}
                    className="rounded-xl bg-[#16366d] px-4 py-2.5 text-sm font-medium text-white hover:bg-[#16366d]/90 disabled:opacity-50 dark:bg-[#16366d] dark:hover:bg-[#16366d]/90"
                  >
                    {saving ? "Se verifică..." : "Verifică"}
                  </button>
                </div>
              </div>
            </>
          )}

          {actionModalOpen === "addPhone" && (
            <>
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                  <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary dark:bg-primary/20">
                    <Phone className="size-5" strokeWidth={2} />
                  </span>
                  <div>
                    <h3 className="text-lg font-semibold text-dark dark:text-white">
                      Adaugă număr de telefon
                    </h3>
                    <p className="mt-0.5 text-sm text-dark-5 dark:text-[#9CA3AF]">
                      Confirmare prin cod SMS după adăugare
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={closeActionModal}
                  className="shrink-0 rounded-lg p-1.5 text-dark-5 transition-colors hover:bg-gray-2 hover:text-dark dark:text-[#9CA3AF] dark:hover:bg-white/[0.08] dark:hover:text-white"
                  aria-label="Închide"
                >
                  <X className="size-5" />
                </button>
              </div>
              <div className="mt-5 space-y-4">
                {error && (
                  <p className="rounded-xl bg-red/10 px-4 py-3 text-sm text-red dark:bg-red/20 dark:text-red-400">
                    {error}
                  </p>
                )}
                <div>
                  <label className="mb-2 block text-sm font-medium text-dark-5 dark:text-[#9CA3AF]">
                    Țara
                  </label>
                  <SettingsSelect
                    value={addPhonePrefix}
                    onChange={(e) => setAddPhonePrefix(e.target.value)}
                  >
                    {phonePrefixes.map((c) => (
                      <option key={c.code} value={c.prefix || ""}>
                        {c.label} {c.prefix ? `(${c.prefix})` : ""}
                      </option>
                    ))}
                  </SettingsSelect>
                </div>
                <div>
                  <label className="mb-2 block text-sm font-medium text-dark-5 dark:text-[#9CA3AF]">
                    Număr de telefon
                  </label>
                  <input
                    type="tel"
                    value={addPhoneValue}
                    onChange={(e) => setAddPhoneValue(e.target.value)}
                    placeholder={addPhonePrefix === "+40" ? "721 123 456" : addPhonePrefix ? "număr fără prefix țară" : "ex. 49170123456"}
                    className="w-full rounded-xl border border-stroke bg-gray-2/80 px-3 py-2.5 text-dark dark:border-white/[0.08] dark:bg-white/[0.04] dark:text-white"
                  />
                </div>
                <div className="flex flex-wrap justify-end gap-3">
                  <button
                    type="button"
                    onClick={closeActionModal}
                    className="rounded-xl border border-stroke bg-white px-4 py-2.5 text-sm font-medium text-dark shadow-sm transition-colors hover:bg-gray-1 dark:border-white/[0.12] dark:bg-white/[0.08] dark:text-white dark:hover:bg-white/[0.12]"
                  >
                    Anulare
                  </button>
                  <button
                    type="button"
                    onClick={handleAddPhone}
                    disabled={saving || !addPhoneValue.replace(/\D/g, "").trim()}
                    className="rounded-xl bg-primary px-4 py-2.5 text-sm font-medium text-white shadow-sm transition-colors hover:bg-primary/90 disabled:opacity-50 dark:bg-primary dark:hover:bg-primary/90"
                  >
                    {saving ? "Se adaugă…" : "Adaugă"}
                  </button>
                </div>
              </div>
            </>
          )}

          {actionModalOpen === "verifyPhone" && (
            <>
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-dark dark:text-white">
                  Verificare telefon
                </h3>
                <button
                  type="button"
                  onClick={closeActionModal}
                  className="rounded-lg p-1 text-dark-5 hover:bg-gray-2 dark:text-[#9CA3AF] dark:hover:bg-white/[0.06] dark:hover:text-white"
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
                <p className="text-sm text-dark-5 dark:text-[#9CA3AF]">
                  Introdu codul primit pe SMS.
                </p>
                <input
                  type="text"
                  value={verifyPhoneCodeInput}
                  onChange={(e) => setVerifyPhoneCodeInput(e.target.value)}
                  placeholder="Cod"
                  className="w-full rounded-lg border border-stroke bg-gray-2/80 px-3 py-2 text-dark dark:border-white/[0.08] dark:bg-white/[0.04] dark:text-white"
                />
                <div className="flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={closeActionModal}
                    className="rounded-xl border border-stroke px-4 py-2.5 text-sm font-medium text-dark dark:border-white/[0.12] dark:text-white"
                  >
                    Anulare
                  </button>
                  <button
                    type="button"
                    onClick={handleVerifyPhone}
                    disabled={saving || !verifyPhoneCodeInput.trim()}
                    className="rounded-xl bg-[#16366d] px-4 py-2.5 text-sm font-medium text-white hover:bg-[#16366d]/90 disabled:opacity-50 dark:bg-[#16366d] dark:hover:bg-[#16366d]/90"
                  >
                    {saving ? "Se verifică..." : "Verifică"}
                  </button>
                </div>
              </div>
            </>
          )}

          {(actionModalOpen === "addAddress" || actionModalOpen === "editAddress") && (
            <>
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                  <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary dark:bg-primary/20">
                    <MapPin className="size-5" strokeWidth={2} />
                  </span>
                  <div>
                    <h3 className="text-lg font-semibold text-dark dark:text-white">
                      {addressModalMode === "edit"
                        ? (addressForm.addressType === "domiciliu"
                          ? "Editează adresa de domiciliu"
                          : addressForm.addressType === "resedinta" || addressForm.addressType === "postala"
                            ? "Editează adresa de reședință"
                            : "Editează adresa")
                        : addressForm.addressType === "domiciliu"
                          ? "Adresa de domiciliu"
                          : addressForm.addressType === "resedinta" || addressForm.addressType === "postala"
                            ? "Adresa de reședință"
                            : "Adaugă adresă"}
                    </h3>
                    <p className="mt-0.5 text-sm text-dark-5 dark:text-[#9CA3AF]">
                      {addressForm.addressType === "domiciliu"
                        ? "Adresa înscrisă în cartea de identitate"
                        : addressForm.addressType === "resedinta" || addressForm.addressType === "postala"
                          ? "Selectează județul și localitatea unde locuiești în prezent"
                          : "Completează datele adresei"}
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={closeActionModal}
                  className="shrink-0 rounded-lg p-1.5 text-dark-5 transition-colors hover:bg-gray-2 hover:text-dark dark:text-[#9CA3AF] dark:hover:bg-white/[0.08] dark:hover:text-white"
                  aria-label="Închide"
                >
                  <X className="size-5" />
                </button>
              </div>
              <div className="mt-5 space-y-4">
                {error && (
                  <p className="rounded-xl bg-red/10 px-4 py-3 text-sm text-red dark:bg-red/20 dark:text-red-400">
                    {error}
                  </p>
                )}
                {!isResedintaAddressForm && (
                  <>
                    <div>
                      <label className="mb-2 block text-sm font-medium text-dark-5 dark:text-[#9CA3AF]">Stradă</label>
                      <input
                        type="text"
                        value={addressForm.street ?? ""}
                        onChange={(e) => setAddressForm((f) => ({ ...f, street: e.target.value }))}
                        placeholder="Ex: Str. Exemplu"
                        className="w-full rounded-xl border border-stroke bg-gray-2/80 px-3 py-2.5 text-dark dark:border-white/[0.08] dark:bg-white/[0.04] dark:text-white"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="mb-2 block text-sm font-medium text-dark-5 dark:text-[#9CA3AF]">Nr.</label>
                        <input
                          type="text"
                          value={addressForm.number ?? ""}
                          onChange={(e) => setAddressForm((f) => ({ ...f, number: e.target.value }))}
                          placeholder="nr."
                          className="w-full rounded-xl border border-stroke bg-gray-2/80 px-3 py-2.5 text-dark dark:border-white/[0.08] dark:bg-white/[0.04] dark:text-white"
                        />
                      </div>
                      <div>
                        <label className="mb-2 block text-sm font-medium text-dark-5 dark:text-[#9CA3AF]">Bl.</label>
                        <input
                          type="text"
                          value={addressForm.block ?? ""}
                          onChange={(e) => setAddressForm((f) => ({ ...f, block: e.target.value }))}
                          placeholder="bloc"
                          className="w-full rounded-xl border border-stroke bg-gray-2/80 px-3 py-2.5 text-dark dark:border-white/[0.08] dark:bg-white/[0.04] dark:text-white"
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="mb-2 block text-sm font-medium text-dark-5 dark:text-[#9CA3AF]">Sc.</label>
                        <input
                          type="text"
                          value={addressForm.entrance ?? ""}
                          onChange={(e) => setAddressForm((f) => ({ ...f, entrance: e.target.value }))}
                          placeholder="scara"
                          className="w-full rounded-xl border border-stroke bg-gray-2/80 px-3 py-2.5 text-dark dark:border-white/[0.08] dark:bg-white/[0.04] dark:text-white"
                        />
                      </div>
                      <div>
                        <label className="mb-2 block text-sm font-medium text-dark-5 dark:text-[#9CA3AF]">Et.</label>
                        <input
                          type="text"
                          value={addressForm.floor ?? ""}
                          onChange={(e) => setAddressForm((f) => ({ ...f, floor: e.target.value }))}
                          placeholder="etaj"
                          className="w-full rounded-xl border border-stroke bg-gray-2/80 px-3 py-2.5 text-dark dark:border-white/[0.08] dark:bg-white/[0.04] dark:text-white"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="mb-2 block text-sm font-medium text-dark-5 dark:text-[#9CA3AF]">Ap.</label>
                      <input
                        type="text"
                        value={addressForm.apartment ?? ""}
                        onChange={(e) => setAddressForm((f) => ({ ...f, apartment: e.target.value }))}
                        placeholder="apartament"
                        className="w-full rounded-xl border border-stroke bg-gray-2/80 px-3 py-2.5 text-dark dark:border-white/[0.08] dark:bg-white/[0.04] dark:text-white"
                      />
                    </div>
                  </>
                )}
                <div className={`grid gap-3 ${isResedintaAddressForm ? "grid-cols-1 sm:grid-cols-2" : "grid-cols-2"}`}>
                  <div>
                    <label className="mb-2 block text-sm font-medium text-dark-5 dark:text-[#9CA3AF]">Județ</label>
                    <SettingsSelect
                      value={addressForm.county ?? ""}
                      onChange={(e) => {
                        const county = e.target.value || null;
                        setAddressForm((f) => ({
                          ...f,
                          county,
                          city: isResedintaAddressForm ? null : f.city,
                        }));
                      }}
                    >
                      <option value="">Alege județul</option>
                      {ROMANIAN_COUNTIES.map((c) => (
                        <option key={c} value={c}>{c}</option>
                      ))}
                    </SettingsSelect>
                  </div>
                  <div>
                    <label className="mb-2 block text-sm font-medium text-dark-5 dark:text-[#9CA3AF]">Localitate</label>
                    {isResedintaAddressForm ? (
                      <SettingsSelect
                        value={addressForm.city ?? ""}
                        onChange={(e) => setAddressForm((f) => ({ ...f, city: e.target.value || null }))}
                        disabled={!addressForm.county}
                      >
                        <option value="">
                          {addressForm.county ? "Alege localitatea" : "Alege mai întâi județul"}
                        </option>
                        {addressLocalityOptions.map((locality) => (
                          <option key={locality} value={locality}>
                            {locality}
                          </option>
                        ))}
                      </SettingsSelect>
                    ) : (
                      <input
                        type="text"
                        value={addressForm.city ?? ""}
                        onChange={(e) => setAddressForm((f) => ({ ...f, city: e.target.value }))}
                        placeholder="Oraș / comună"
                        className="w-full rounded-xl border border-stroke bg-gray-2/80 px-3 py-2.5 text-dark dark:border-white/[0.08] dark:bg-white/[0.04] dark:text-white"
                      />
                    )}
                  </div>
                </div>
                <div className="flex flex-wrap justify-end gap-3 pt-2">
                  <button
                    type="button"
                    onClick={closeActionModal}
                    className="rounded-xl border border-stroke bg-white px-4 py-2.5 text-sm font-medium text-dark shadow-sm transition-colors hover:bg-gray-1 dark:border-white/[0.12] dark:bg-white/[0.08] dark:text-white dark:hover:bg-white/[0.12]"
                  >
                    Anulare
                  </button>
                  <button
                    type="button"
                    onClick={handleSaveAddress}
                    disabled={saving}
                    className="rounded-xl bg-primary px-4 py-2.5 text-sm font-medium text-white shadow-sm transition-colors hover:bg-primary/90 disabled:opacity-50 dark:bg-primary dark:hover:bg-primary/90"
                  >
                    {saving ? "Se salvează…" : "Salvează"}
                  </button>
                </div>
              </div>
            </>
          )}

          {(actionModalOpen === "visibilityEmail" || actionModalOpen === "visibilityPhone") && visibilityTarget && (
            <>
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                  <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary dark:bg-primary/20">
                    {visibilityTarget.type === "email" ? (
                      <Mail className="size-5" strokeWidth={2} />
                    ) : (
                      <Eye className="size-5" strokeWidth={2} />
                    )}
                  </span>
                  <div>
                    <h3 className="text-lg font-semibold text-dark dark:text-white">
                      {visibilityTarget.type === "email"
                        ? "Cine poate vedea acest email"
                        : "Cine poate vedea acest număr"}
                    </h3>
                    {visibilityTarget.type !== "email" && (
                      <p className="mt-0.5 text-sm text-dark-5 dark:text-[#9CA3AF]">
                        Alege cine are dreptul să vadă numărul tău de telefon
                      </p>
                    )}
                  </div>
                </div>
                <button
                  type="button"
                  onClick={closeActionModal}
                  className="shrink-0 rounded-lg p-1.5 text-dark-5 transition-colors hover:bg-gray-2 hover:text-dark dark:text-[#9CA3AF] dark:hover:bg-white/[0.08] dark:hover:text-white"
                  aria-label="Închide"
                >
                  <X className="size-5" />
                </button>
              </div>
              <div className="mt-5 space-y-4">
                {error && (
                  <p className="rounded-xl bg-red/10 px-4 py-3 text-sm text-red dark:bg-red/20 dark:text-red-400">
                    {error}
                  </p>
                )}
                <div className="space-y-2">
                  {VISIBILITY_OPTIONS.map((o) => (
                    <label
                      key={o.value}
                      className={`flex cursor-pointer gap-3 rounded-xl border px-4 py-3 transition-colors ${
                        visibilitySelection === o.value
                          ? "border-primary bg-primary/10 dark:border-primary dark:bg-primary/20"
                          : "border-stroke bg-gray-2/50 hover:border-stroke/80 hover:bg-gray-2/80 dark:border-white/[0.08] dark:bg-white/[0.02] dark:hover:bg-white/[0.04]"
                      }`}
                    >
                      <input
                        type="radio"
                        name="visibility"
                        value={o.value}
                        checked={visibilitySelection === o.value}
                        onChange={() => setVisibilitySelection(o.value)}
                        className="mt-1 shrink-0 rounded-full border-stroke text-primary focus:ring-2 focus:ring-primary dark:border-white/[0.12] dark:focus:ring-primary"
                      />
                      <div className="min-w-0">
                        <span className="block text-sm font-medium text-dark dark:text-white">
                          {o.label}
                        </span>
                        <span className="mt-0.5 block text-xs text-dark-5 dark:text-[#9CA3AF]">
                          {visibilityTarget.type === "email"
                            ? o.description.replace("{ref}", "acest email")
                            : o.description.replace("{ref}", "acest număr")}
                        </span>
                      </div>
                    </label>
                  ))}
                </div>
                <div className="flex flex-wrap justify-end gap-3 pt-2">
                  <button
                    type="button"
                    onClick={closeActionModal}
                    className="rounded-xl border border-stroke bg-white px-4 py-2.5 text-sm font-medium text-dark shadow-sm transition-colors hover:bg-gray-1 dark:border-white/[0.12] dark:bg-white/[0.08] dark:text-white dark:hover:bg-white/[0.12]"
                  >
                    Anulare
                  </button>
                  <button
                    type="button"
                    onClick={handleSaveVisibility}
                    disabled={saving}
                    className="rounded-xl bg-primary px-4 py-2.5 text-sm font-medium text-white shadow-sm transition-colors hover:bg-primary/90 disabled:opacity-50 dark:bg-primary dark:hover:bg-primary/90"
                  >
                    {saving ? "Se salvează…" : "Salvează"}
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </dialog>

      {/* Modal confirmare ștergere – animație ca la notificări */}
      <dialog
        ref={confirmDialogRef}
        className={`fixed inset-0 m-0 flex w-full min-h-[100dvh] max-h-[100dvh] items-center justify-center rounded-none border-0 bg-transparent p-4 outline-none [&:not([open])]:pointer-events-none ${MODAL_BACKDROP_BASE} ${modalBackdropClasses(confirmClosing, confirmOpenAnimated)}`}
        onCancel={closeConfirmModal}
      >
        {confirmModal && (
          <div
            className={`w-full max-w-sm rounded-2xl border border-stroke bg-white p-6 shadow-2xl dark:border-white/[0.08] dark:bg-[#1A1A1A] dark:text-white ${modalContentClasses(confirmClosing, confirmOpenAnimated)}`}
          >
            <div className="mb-4 flex justify-center">
              <span className="flex size-14 items-center justify-center rounded-full bg-red/10 dark:bg-red/20">
                <Trash2 className="size-7 text-red dark:text-red-400" />
              </span>
            </div>
            <h3 className="mb-1 text-center text-lg font-semibold text-dark dark:text-white">
              {confirmModal.type === "deleteEmail" && "Ștergi acest email?"}
              {confirmModal.type === "deletePhone" && "Ștergi acest număr?"}
              {confirmModal.type === "deleteAddress" && "Ștergi această adresă?"}
            </h3>
            <p className="mb-6 text-center text-sm text-dark-5 dark:text-[#9CA3AF]">
              {confirmModal.label ? (
                <>
                  <span className="font-medium text-dark dark:text-white">{confirmModal.label}</span>
                  <br />
                  Această acțiune nu poate fi anulată.
                </>
              ) : (
                "Această acțiune nu poate fi anulată."
              )}
            </p>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={closeConfirmModal}
                className="flex-1 rounded-xl border border-stroke bg-gray-2/80 py-2.5 text-sm font-medium text-dark transition-colors hover:bg-gray-2 dark:border-white/[0.12] dark:bg-white/[0.06] dark:text-white dark:hover:bg-white/[0.1]"
              >
                Anulare
              </button>
              <button
                type="button"
                onClick={() => handleConfirmDelete()}
                className="flex-1 rounded-xl bg-red py-2.5 text-sm font-medium text-white transition-colors hover:bg-red/90 dark:bg-red dark:hover:bg-red/90"
              >
                Șterge
              </button>
            </div>
          </div>
        )}
      </dialog>

      <dialog
        ref={avatarInfoDialogRef}
        className={`fixed inset-0 m-0 flex w-full min-h-[100dvh] max-h-[100dvh] items-center justify-center rounded-none border-0 bg-transparent p-4 outline-none [&:not([open])]:pointer-events-none ${MODAL_BACKDROP_BASE} ${modalBackdropClasses(avatarInfoClosing, avatarInfoOpenAnimated)}`}
        onClick={(e) => e.target === e.currentTarget && closeAvatarInfoModal()}
        onClose={() => { setAvatarInfoDialogOpen(false); setAvatarInfoOpenAnimated(false); setAvatarInfoClosing(false); }}
      >
        <div className={`relative w-full max-w-md max-h-[calc(100dvh-2rem)] overflow-y-auto rounded-2xl border border-stroke bg-white p-6 shadow-2xl dark:border-white/[0.08] dark:bg-[#1A1A1A] dark:text-white ${modalContentClasses(avatarInfoClosing, avatarInfoOpenAnimated)}`}>
          <button
            type="button"
            onClick={closeAvatarInfoModal}
            className="absolute right-4 top-4 flex size-9 items-center justify-center rounded-full text-dark-5 transition-colors hover:bg-gray-2 hover:text-dark dark:text-[#9CA3AF] dark:hover:bg-white/10 dark:hover:text-white"
            aria-label="Închide"
          >
            <X className="size-5" />
          </button>
          <div className="flex size-12 items-center justify-center rounded-2xl bg-primary/10 dark:bg-primary/20">
            <Camera className="size-6 text-primary dark:text-primary" />
          </div>
          <h2 className="mt-4 text-xl font-semibold tracking-tight text-dark dark:text-white">
            Poza de profil
          </h2>
          <p className="mt-4 text-sm leading-relaxed text-dark-5 dark:text-[#9CA3AF]">
            Poza ta de profil este vizibilă pentru toți utilizatorii din aplicația AiMeseriaș. Nu poți restricționa vizibilitatea acesteia.
          </p>
          <div className="mt-6 flex flex-wrap justify-end gap-3">
            <button
              type="button"
              onClick={closeAvatarInfoModal}
              className="rounded-xl border border-stroke bg-white px-4 py-2.5 text-sm font-medium text-dark shadow-sm transition-colors hover:bg-gray-1 dark:border-white/[0.12] dark:bg-white/[0.08] dark:text-white dark:hover:bg-white/[0.12]"
            >
              Anulare
            </button>
            <button
              type="button"
              onClick={openAvatarPicker}
              disabled={avatarUploading}
              className="rounded-xl bg-primary px-4 py-2.5 text-sm font-medium text-white shadow-sm transition-colors hover:bg-primary/90 disabled:opacity-50 dark:bg-primary dark:hover:bg-primary/90"
            >
              Alege o poză
            </button>
          </div>
        </div>
      </dialog>
    </>
  );
}
