import {
  MATERIALS_OPTIONS,
  PROPERTY_CONDITIONS,
  PROPERTY_TYPES,
  URGENCY_OPTIONS,
  VERIFIED_OPTIONS,
} from "./constants";

export type ProjectFormState = {
  categorySlug: string;
  subcategories: string[];
  title: string;
  description: string;
  county: string;
  city: string;
  customCity: string;
  address: string;
  accessDetails: string;
  propertyType: string;
  propertyCondition: string;
  surface: string;
  budgetMin: string;
  budgetMax: string;
  budgetFlexible: boolean;
  materials: string;
  startDate: string;
  deadline: string;
  urgency: string;
  verifiedPreference: string;
  extraNotes: string;
};

export function buildJobDescription(parts: {
  main: string;
  subcategories: string[];
  propertyType: string;
  propertyCondition: string;
  surface: string;
  address: string;
  accessDetails: string;
  materials: string;
  deadline: string;
  urgency: string;
  verifiedPreference: string;
  budgetFlexible: boolean;
  extraNotes: string;
}): string {
  const blocks: string[] = [parts.main.trim()];

  const append = (label: string, value: string) => {
    const v = value.trim();
    if (v) blocks.push(`${label}: ${v}`);
  };

  if (parts.subcategories.length > 0) {
    append("Meserii / lucrări necesare", parts.subcategories.join(", "));
  }

  const propertyTypeLabel = PROPERTY_TYPES.find((p) => p.value === parts.propertyType)?.label;
  if (propertyTypeLabel) append("Tip proprietate", propertyTypeLabel);

  const conditionLabel = PROPERTY_CONDITIONS.find((p) => p.value === parts.propertyCondition)?.label;
  if (conditionLabel) append("Starea spațiului", conditionLabel);

  append("Suprafață", parts.surface ? `${parts.surface} m²` : "");
  append("Adresă", parts.address);
  append("Acces / detalii locație", parts.accessDetails);

  const materialsLabel = MATERIALS_OPTIONS.find((m) => m.value === parts.materials)?.label;
  if (materialsLabel) append("Materiale", materialsLabel);

  append("Termen dorit finalizare", parts.deadline);

  const urgencyLabel = URGENCY_OPTIONS.find((u) => u.value === parts.urgency)?.label;
  if (urgencyLabel) append("Urgență", urgencyLabel);

  const verifiedLabel = VERIFIED_OPTIONS.find((v) => v.value === parts.verifiedPreference)?.label;
  if (verifiedLabel) append("Preferințe meseriaș", verifiedLabel);

  if (parts.budgetFlexible) {
    blocks.push("Buget: flexibil, deschis la negociere.");
  }

  append("Note suplimentare", parts.extraNotes);

  return blocks.filter(Boolean).join("\n\n");
}
