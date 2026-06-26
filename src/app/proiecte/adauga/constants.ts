export const INPUT_CLASS =
  "w-full rounded-xl border border-stroke bg-white px-3 py-2.5 text-sm outline-none transition-colors focus:border-[#0060f0] focus:ring-2 focus:ring-[#0060f0]/15 dark:border-white/[0.12] dark:bg-[#0f0f11] dark:text-white dark:focus:border-[#5b9fff] dark:focus:ring-[#5b9fff]/20";

export const DESCRIPTION_MAX = 1000;
export const GALLERY_MAX = 12;

export const WIZARD_STEPS = [
  { id: "project", label: "Proiect" },
  { id: "location", label: "Locație" },
  { id: "budget", label: "Buget" },
  { id: "images", label: "Imagini" },
] as const;

export const PROPERTY_TYPES = [
  { value: "apartament", label: "Apartament" },
  { value: "casa", label: "Casă" },
  { value: "comercial", label: "Spațiu comercial" },
  { value: "birou", label: "Birou" },
  { value: "altul", label: "Altul" },
] as const;

export const PROPERTY_CONDITIONS = [
  { value: "nou", label: "Nou / recent finalizat" },
  { value: "partial", label: "Renovat parțial" },
  { value: "renovare", label: "Necesită renovare" },
] as const;

export const MATERIALS_OPTIONS = [
  { value: "client", label: "Materialele sunt asigurate de mine" },
  { value: "meserias", label: "Meseriașul procure materialele" },
  { value: "partial", label: "Parțial" },
  { value: "nedefinit", label: "Nu știu încă" },
] as const;

export const URGENCY_OPTIONS = [
  { value: "normal", label: "Normal" },
  { value: "urgent", label: "Urgent" },
  { value: "flexibil", label: "Flexibil" },
] as const;

export const VERIFIED_OPTIONS = [
  { value: "da", label: "Prefer meseriași verificați" },
  { value: "nu", label: "Nu contează" },
] as const;
