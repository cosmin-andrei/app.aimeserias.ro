"use client";

import { useEffect, useMemo, useRef, useState, type ChangeEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  ArrowRight,
  Check,
  ImagePlus,
  Loader2,
  Trash2,
  Upload,
} from "lucide-react";
import { HERO_CATEGORIES } from "@/data/heroCategories";
import { PROJECT_SUBCATEGORIES } from "@/data/projectFilters";
import { ROMANIAN_COUNTIES } from "@/data/romanian-counties";
import { getLocalitiesForCounty } from "@/data/romanian-localities";
import { useUser } from "@/hooks/useUser";
import {
  createJob,
  uploadJobCoverImage,
  uploadJobGalleryImages,
} from "@/lib/api-client";
import { pageWidthClass } from "@/lib/page-layout";
import { cn } from "@/lib/utils";
import {
  DESCRIPTION_MAX,
  GALLERY_MAX,
  INPUT_CLASS,
  MATERIALS_OPTIONS,
  PROPERTY_CONDITIONS,
  PROPERTY_TYPES,
  URGENCY_OPTIONS,
  VERIFIED_OPTIONS,
  WIZARD_STEPS,
} from "./constants";
import { buildJobDescription } from "./form-utils";

function FieldLabel({
  htmlFor,
  children,
  required,
}: {
  htmlFor?: string;
  children: React.ReactNode;
  required?: boolean;
}) {
  return (
    <label htmlFor={htmlFor} className="mb-1.5 block text-sm font-medium text-dark dark:text-white">
      {children}
      {required ? <span className="text-red"> *</span> : null}
    </label>
  );
}

export function AddProjectWizard() {
  const router = useRouter();
  const { user } = useUser();
  const locationInitializedRef = useRef(false);
  const coverInputRef = useRef<HTMLInputElement>(null);
  const galleryInputRef = useRef<HTMLInputElement>(null);

  const [step, setStep] = useState(0);
  const [categorySlug, setCategorySlug] = useState(HERO_CATEGORIES[0]?.slug ?? "");
  const [subcategories, setSubcategories] = useState<string[]>([]);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [county, setCounty] = useState("");
  const [city, setCity] = useState("");
  const [customCity, setCustomCity] = useState("");
  const [address, setAddress] = useState("");
  const [accessDetails, setAccessDetails] = useState("");
  const [propertyType, setPropertyType] = useState<string>(PROPERTY_TYPES[0].value);
  const [propertyCondition, setPropertyCondition] = useState<string>(PROPERTY_CONDITIONS[2].value);
  const [surface, setSurface] = useState("");
  const [budgetMin, setBudgetMin] = useState("");
  const [budgetMax, setBudgetMax] = useState("");
  const [budgetFlexible, setBudgetFlexible] = useState(false);
  const [materials, setMaterials] = useState<string>(MATERIALS_OPTIONS[3].value);
  const [startDate, setStartDate] = useState("");
  const [deadline, setDeadline] = useState("");
  const [urgency, setUrgency] = useState<string>(URGENCY_OPTIONS[0].value);
  const [verifiedPreference, setVerifiedPreference] = useState<string>(VERIFIED_OPTIONS[0].value);
  const [extraNotes, setExtraNotes] = useState("");
  const [coverFile, setCoverFile] = useState<File | null>(null);
  const [galleryFiles, setGalleryFiles] = useState<File[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const categoryLabel = useMemo(
    () => HERO_CATEGORIES.find((c) => c.slug === categorySlug)?.label ?? categorySlug,
    [categorySlug]
  );
  const subcategoryOptions = PROJECT_SUBCATEGORIES[categorySlug] ?? [];
  const localities = useMemo(() => getLocalitiesForCounty(county), [county]);
  const useCustomCity = city === "__custom__";
  const resolvedCity = useCustomCity ? customCity.trim() : city.trim();
  const coverPreview = useMemo(
    () => (coverFile ? URL.createObjectURL(coverFile) : null),
    [coverFile]
  );
  const galleryPreviews = useMemo(
    () => galleryFiles.map((file) => URL.createObjectURL(file)),
    [galleryFiles]
  );

  useEffect(() => {
    return () => {
      if (coverPreview) URL.revokeObjectURL(coverPreview);
      galleryPreviews.forEach((url) => URL.revokeObjectURL(url));
    };
  }, [coverPreview, galleryPreviews]);

  useEffect(() => {
    if (!user || locationInitializedRef.current) return;
    locationInitializedRef.current = true;
    const addresses = user.addresses ?? [];
    const preferred =
      addresses.find((a) => a.isPrimary) ??
      addresses.find((a) => a.addressType === "resedinta") ??
      addresses[0];
    if (preferred?.county && !county) setCounty(preferred.county);
    if (preferred?.city && !city) {
      const localityList = getLocalitiesForCounty(preferred.county);
      if (localityList.includes(preferred.city)) {
        setCity(preferred.city);
      } else {
        setCity("__custom__");
        setCustomCity(preferred.city);
      }
    } else if (user.city && !city) {
      setCity("__custom__");
      setCustomCity(user.city);
    }
  }, [user, county, city]);

  useEffect(() => {
    setSubcategories([]);
  }, [categorySlug]);

  const toggleSubcategory = (value: string) => {
    setSubcategories((prev) =>
      prev.includes(value) ? prev.filter((s) => s !== value) : [...prev, value]
    );
  };

  const validateStep = (index: number): string | null => {
    if (index === 0) {
      if (!title.trim() || title.trim().length < 8) return "Titlul trebuie să aibă cel puțin 8 caractere.";
      if (!description.trim() || description.trim().length < 30) {
        return "Descrierea trebuie să aibă cel puțin 30 de caractere.";
      }
      if (description.length > DESCRIPTION_MAX) {
        return `Descrierea poate avea maximum ${DESCRIPTION_MAX} de caractere.`;
      }
      return null;
    }
    if (index === 1) {
      if (!county.trim()) return "Selectează județul.";
      if (!resolvedCity) return "Completează localitatea.";
      return null;
    }
    if (index === 2) {
      const min = budgetMin.trim() ? Number(budgetMin) : null;
      const max = budgetMax.trim() ? Number(budgetMax) : null;
      if (min != null && (!Number.isFinite(min) || min < 0)) return "Bugetul minim nu este valid.";
      if (max != null && (!Number.isFinite(max) || max < 0)) return "Bugetul maxim nu este valid.";
      if (min != null && max != null && min > max) {
        return "Bugetul minim nu poate fi mai mare decât cel maxim.";
      }
      if (!budgetFlexible && min == null && max == null) {
        return "Indică un buget sau bifează „Buget flexibil”.";
      }
      return null;
    }
    return null;
  };

  const goNext = () => {
    const stepError = validateStep(step);
    if (stepError) {
      setError(stepError);
      return;
    }
    setError(null);
    setStep((s) => Math.min(s + 1, WIZARD_STEPS.length - 1));
  };

  const goBack = () => {
    setError(null);
    setStep((s) => Math.max(s - 1, 0));
  };

  const handleGallerySelect = (event: ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files ?? []);
    if (!files.length) return;
    setGalleryFiles((prev) => [...prev, ...files].slice(0, GALLERY_MAX));
    event.target.value = "";
  };

  const handleSubmit = async () => {
    for (let i = 0; i < WIZARD_STEPS.length - 1; i += 1) {
      const stepError = validateStep(i);
      if (stepError) {
        setError(stepError);
        setStep(i);
        return;
      }
    }

    const min = budgetMin.trim() ? Number(budgetMin) : null;
    const max = budgetMax.trim() ? Number(budgetMax) : null;
    const fullDescription = buildJobDescription({
      main: description,
      subcategories,
      propertyType,
      propertyCondition,
      surface,
      address,
      accessDetails,
      materials,
      deadline,
      urgency,
      verifiedPreference,
      budgetFlexible,
      extraNotes,
    });
    const locationLabel = county === resolvedCity ? resolvedCity : `${resolvedCity}, ${county}`;

    setSubmitting(true);
    setError(null);

    const { success, job_id, error: submitError } = await createJob({
      title: title.trim(),
      description: fullDescription,
      category: categoryLabel,
      city: locationLabel,
      budget_min: min,
      budget_max: max,
      scheduled_at: startDate ? new Date(`${startDate}T12:00:00`).toISOString() : null,
    });

    if (!success || !job_id) {
      setSubmitting(false);
      setError(submitError ?? "Nu am putut publica proiectul.");
      return;
    }

    if (coverFile) {
      const coverResult = await uploadJobCoverImage(job_id, coverFile);
      if (!coverResult.success) {
        setSubmitting(false);
        setError(coverResult.error ?? "Proiectul a fost creat, dar coperta nu s-a încărcat.");
        router.push(`/proiecte/${job_id}`);
        return;
      }
    }

    if (galleryFiles.length > 0) {
      const galleryResult = await uploadJobGalleryImages(job_id, galleryFiles);
      if (!galleryResult.success) {
        setSubmitting(false);
        setError(galleryResult.error ?? "Proiectul a fost creat, dar galeria nu s-a încărcat.");
        router.push(`/proiecte/${job_id}`);
        return;
      }
    }

    setSubmitting(false);
    router.push(`/proiecte/${job_id}`);
  };

  const isLastStep = step === WIZARD_STEPS.length - 1;

  return (
    <section className="pb-10 pt-2 md:pb-14 md:pt-4">
      <div className={cn(pageWidthClass, "px-4 sm:px-6 lg:px-8")}>
        <div className="mx-auto w-full max-w-6xl">
          <Link
            href="/proiecte?view=mine"
            className="mb-5 inline-flex items-center gap-2 text-sm font-medium text-[#0060f0] hover:underline dark:text-[#5b9fff]"
          >
            <ArrowLeft className="size-3.5" aria-hidden />
            Înapoi
          </Link>

          <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-dark dark:text-white md:text-3xl">
                Adaugă proiect
              </h1>
            </div>
            <p className="text-sm text-dark-5 dark:text-[#9CA3AF]">
              Pasul {step + 1} din {WIZARD_STEPS.length}
            </p>
          </div>

          <nav aria-label="Pași formular" className="mb-6">
            <ol className="grid grid-cols-2 gap-2 sm:grid-cols-4">
              {WIZARD_STEPS.map((wizardStep, index) => {
                const done = index < step;
                const active = index === step;
                return (
                  <li key={wizardStep.id}>
                    <div
                      className={cn(
                        "flex items-center gap-2 rounded-xl border px-3 py-2.5 text-sm transition-colors",
                        active
                          ? "border-[#0060f0]/40 bg-[#0060f0]/8 text-[#0060f0] dark:border-[#5b9fff]/40 dark:bg-[#5b9fff]/10 dark:text-[#5b9fff]"
                          : done
                            ? "border-emerald-200/80 bg-emerald-50/80 text-emerald-700 dark:border-emerald-900/40 dark:bg-emerald-950/30 dark:text-emerald-300"
                            : "border-stroke/80 bg-white text-dark-5 dark:border-white/[0.08] dark:bg-[#141414] dark:text-[#9CA3AF]"
                      )}
                    >
                      <span
                        className={cn(
                          "flex size-6 shrink-0 items-center justify-center rounded-full text-xs font-bold",
                          active
                            ? "bg-[#0060f0] text-white dark:bg-[#5b9fff] dark:text-[#08080a]"
                            : done
                              ? "bg-emerald-500 text-white"
                              : "bg-gray-2 text-dark-5 dark:bg-white/[0.08]"
                        )}
                      >
                        {done ? <Check className="size-3.5" /> : index + 1}
                      </span>
                      <span className="font-medium">{wizardStep.label}</span>
                    </div>
                  </li>
                );
              })}
            </ol>
          </nav>

          <div className="rounded-2xl border border-stroke/80 bg-white p-5 shadow-sm dark:border-white/[0.08] dark:bg-[#141414] sm:p-8 lg:p-10">
            {step === 0 && (
              <div className="grid gap-5 lg:grid-cols-2 lg:gap-8">
                <div className="space-y-4">
                  <div>
                    <FieldLabel htmlFor="title" required>
                      Titlu
                    </FieldLabel>
                    <input
                      id="title"
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      className={INPUT_CLASS}
                      placeholder="ex. Renovare baie 6 m²"
                      maxLength={150}
                    />
                  </div>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div>
                      <FieldLabel htmlFor="category" required>
                        Categorie
                      </FieldLabel>
                      <select
                        id="category"
                        value={categorySlug}
                        onChange={(e) => setCategorySlug(e.target.value)}
                        className={INPUT_CLASS}
                      >
                        {HERO_CATEGORIES.map((cat) => (
                          <option key={cat.slug} value={cat.slug}>
                            {cat.label}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <FieldLabel htmlFor="urgency">Urgență</FieldLabel>
                      <select
                        id="urgency"
                        value={urgency}
                        onChange={(e) => setUrgency(e.target.value)}
                        className={INPUT_CLASS}
                      >
                        {URGENCY_OPTIONS.map((opt) => (
                          <option key={opt.value} value={opt.value}>
                            {opt.label}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>
                <div className="space-y-4">
                  {subcategoryOptions.length > 0 && (
                    <div>
                      <FieldLabel>Meserii necesare</FieldLabel>
                      <div className="flex flex-wrap gap-2">
                        {subcategoryOptions.map((sub) => {
                          const active = subcategories.includes(sub);
                          return (
                            <button
                              key={sub}
                              type="button"
                              onClick={() => toggleSubcategory(sub)}
                              className={cn(
                                "rounded-full px-3 py-1.5 text-xs font-medium ring-1 transition-colors",
                                active
                                  ? "bg-[#0060f0]/10 text-[#0060f0] ring-[#0060f0]/25 dark:bg-[#5b9fff]/15 dark:text-[#5b9fff]"
                                  : "bg-gray-1 text-dark-5 ring-stroke dark:bg-[#0f0f11] dark:text-[#9CA3AF] dark:ring-white/[0.12]"
                              )}
                            >
                              {sub}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )}
                  <div>
                    <div className="mb-1.5 flex items-center justify-between gap-2">
                      <FieldLabel htmlFor="description" required>
                        Descriere
                      </FieldLabel>
                      <span
                        className={cn(
                          "text-xs tabular-nums",
                          description.length > DESCRIPTION_MAX
                            ? "text-red"
                            : "text-dark-5 dark:text-[#9CA3AF]"
                        )}
                      >
                        {description.length}/{DESCRIPTION_MAX}
                      </span>
                    </div>
                    <textarea
                      id="description"
                      value={description}
                      onChange={(e) => setDescription(e.target.value.slice(0, DESCRIPTION_MAX))}
                      rows={8}
                      maxLength={DESCRIPTION_MAX}
                      className={INPUT_CLASS}
                      placeholder="Ce lucrări sunt necesare?"
                    />
                  </div>
                </div>
              </div>
            )}

            {step === 1 && (
              <div className="grid gap-5 lg:grid-cols-2 lg:gap-8">
                <div className="space-y-4">
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div>
                      <FieldLabel htmlFor="county" required>
                        Județ
                      </FieldLabel>
                      <select
                        id="county"
                        value={county}
                        onChange={(e) => {
                          setCounty(e.target.value);
                          setCity("");
                          setCustomCity("");
                        }}
                        className={INPUT_CLASS}
                      >
                        <option value="">Alege județul</option>
                        {ROMANIAN_COUNTIES.map((c) => (
                          <option key={c} value={c}>
                            {c}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <FieldLabel htmlFor="city" required>
                        Localitate
                      </FieldLabel>
                      <select
                        id="city"
                        value={city}
                        onChange={(e) => setCity(e.target.value)}
                        disabled={!county}
                        className={INPUT_CLASS}
                      >
                        <option value="">{county ? "Alege localitatea" : "—"}</option>
                        {localities.map((loc) => (
                          <option key={loc} value={loc}>
                            {loc}
                          </option>
                        ))}
                        <option value="__custom__">Altă localitate...</option>
                      </select>
                    </div>
                  </div>
                  {useCustomCity && (
                    <div>
                      <FieldLabel htmlFor="customCity" required>
                        Localitate
                      </FieldLabel>
                      <input
                        id="customCity"
                        value={customCity}
                        onChange={(e) => setCustomCity(e.target.value)}
                        className={INPUT_CLASS}
                      />
                    </div>
                  )}
                  <div>
                    <FieldLabel htmlFor="address">Adresă</FieldLabel>
                    <input
                      id="address"
                      value={address}
                      onChange={(e) => setAddress(e.target.value)}
                      className={INPUT_CLASS}
                      placeholder="Stradă, număr..."
                    />
                  </div>
                  <div>
                    <FieldLabel htmlFor="access">Acces</FieldLabel>
                    <textarea
                      id="access"
                      value={accessDetails}
                      onChange={(e) => setAccessDetails(e.target.value)}
                      rows={2}
                      className={INPUT_CLASS}
                      placeholder="Etaj, lift, parcare..."
                    />
                  </div>
                </div>
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2">
                  <div>
                    <FieldLabel htmlFor="propertyType">Tip spațiu</FieldLabel>
                    <select
                      id="propertyType"
                      value={propertyType}
                      onChange={(e) => setPropertyType(e.target.value)}
                      className={INPUT_CLASS}
                    >
                      {PROPERTY_TYPES.map((opt) => (
                        <option key={opt.value} value={opt.value}>
                          {opt.label}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <FieldLabel htmlFor="condition">Stare</FieldLabel>
                    <select
                      id="condition"
                      value={propertyCondition}
                      onChange={(e) => setPropertyCondition(e.target.value)}
                      className={INPUT_CLASS}
                    >
                      {PROPERTY_CONDITIONS.map((opt) => (
                        <option key={opt.value} value={opt.value}>
                          {opt.label}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="sm:col-span-2 xl:col-span-1">
                    <FieldLabel htmlFor="surface">Suprafață (m²)</FieldLabel>
                    <input
                      id="surface"
                      type="number"
                      min={0}
                      value={surface}
                      onChange={(e) => setSurface(e.target.value)}
                      className={INPUT_CLASS}
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <FieldLabel htmlFor="extraNotes">Note</FieldLabel>
                    <textarea
                      id="extraNotes"
                      value={extraNotes}
                      onChange={(e) => setExtraNotes(e.target.value)}
                      rows={3}
                      className={INPUT_CLASS}
                    />
                  </div>
                </div>
              </div>
            )}

            {step === 2 && (
              <div className="grid gap-5 lg:grid-cols-2 lg:gap-8">
                <div className="space-y-4">
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div>
                      <FieldLabel htmlFor="budgetMin">Buget min (RON)</FieldLabel>
                      <input
                        id="budgetMin"
                        type="number"
                        min={0}
                        value={budgetMin}
                        onChange={(e) => setBudgetMin(e.target.value)}
                        className={INPUT_CLASS}
                      />
                    </div>
                    <div>
                      <FieldLabel htmlFor="budgetMax">Buget max (RON)</FieldLabel>
                      <input
                        id="budgetMax"
                        type="number"
                        min={0}
                        value={budgetMax}
                        onChange={(e) => setBudgetMax(e.target.value)}
                        className={INPUT_CLASS}
                      />
                    </div>
                  </div>
                  <label className="flex cursor-pointer items-center gap-3 rounded-xl border border-stroke/80 px-4 py-3 dark:border-white/[0.1]">
                    <input
                      type="checkbox"
                      checked={budgetFlexible}
                      onChange={(e) => setBudgetFlexible(e.target.checked)}
                      className="size-4 rounded border-stroke text-[#0060f0]"
                    />
                    <span className="text-sm font-medium text-dark dark:text-white">Buget flexibil</span>
                  </label>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div>
                      <FieldLabel htmlFor="materials">Materiale</FieldLabel>
                      <select
                        id="materials"
                        value={materials}
                        onChange={(e) => setMaterials(e.target.value)}
                        className={INPUT_CLASS}
                      >
                        {MATERIALS_OPTIONS.map((opt) => (
                          <option key={opt.value} value={opt.value}>
                            {opt.label}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <FieldLabel htmlFor="verified">Meseriaș</FieldLabel>
                      <select
                        id="verified"
                        value={verifiedPreference}
                        onChange={(e) => setVerifiedPreference(e.target.value)}
                        className={INPUT_CLASS}
                      >
                        {VERIFIED_OPTIONS.map((opt) => (
                          <option key={opt.value} value={opt.value}>
                            {opt.label}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <FieldLabel htmlFor="startDate">Începere</FieldLabel>
                    <input
                      id="startDate"
                      type="date"
                      value={startDate}
                      onChange={(e) => setStartDate(e.target.value)}
                      className={INPUT_CLASS}
                    />
                  </div>
                  <div>
                    <FieldLabel htmlFor="deadline">Finalizare</FieldLabel>
                    <input
                      id="deadline"
                      value={deadline}
                      onChange={(e) => setDeadline(e.target.value)}
                      className={INPUT_CLASS}
                      placeholder="ex. 30 aprilie"
                    />
                  </div>
                </div>
              </div>
            )}

            {step === 3 && (
              <div className="grid gap-6 lg:grid-cols-2 lg:gap-10">
                <div>
                  <FieldLabel>Copertă proiect</FieldLabel>
                  <input
                    ref={coverInputRef}
                    type="file"
                    accept="image/png,image/jpeg,image/webp"
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) setCoverFile(file);
                      e.target.value = "";
                    }}
                  />
                  <button
                    type="button"
                    onClick={() => coverInputRef.current?.click()}
                    className="group relative flex aspect-[16/10] w-full items-center justify-center overflow-hidden rounded-2xl border-2 border-dashed border-stroke bg-gray-1/50 transition-colors hover:border-[#0060f0]/40 dark:border-white/[0.12] dark:bg-white/[0.03]"
                  >
                    {coverPreview ? (
                      <>
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={coverPreview} alt="" className="absolute inset-0 size-full object-cover" />
                        <span className="absolute inset-0 bg-black/0 transition-colors group-hover:bg-black/20" />
                        <span className="relative rounded-full bg-black/50 px-3 py-1.5 text-xs font-medium text-white opacity-0 transition-opacity group-hover:opacity-100">
                          Schimbă imaginea
                        </span>
                      </>
                    ) : (
                      <span className="flex flex-col items-center gap-2 text-dark-5 dark:text-[#9CA3AF]">
                        <Upload className="size-8" aria-hidden />
                        <span className="text-sm font-medium">Încarcă coperta</span>
                      </span>
                    )}
                  </button>
                  {coverFile && (
                    <button
                      type="button"
                      onClick={() => setCoverFile(null)}
                      className="mt-2 inline-flex items-center gap-1.5 text-xs text-red hover:underline"
                    >
                      <Trash2 className="size-3.5" />
                      Elimină coperta
                    </button>
                  )}
                </div>
                <div>
                  <div className="mb-1.5 flex items-center justify-between">
                    <FieldLabel>Galerie foto</FieldLabel>
                    <span className="text-xs text-dark-5 dark:text-[#9CA3AF]">
                      {galleryFiles.length}/{GALLERY_MAX}
                    </span>
                  </div>
                  <input
                    ref={galleryInputRef}
                    type="file"
                    accept="image/png,image/jpeg,image/webp"
                    multiple
                    className="hidden"
                    onChange={handleGallerySelect}
                  />
                  <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
                    {galleryPreviews.map((src, index) => (
                      <div key={src} className="group relative aspect-square overflow-hidden rounded-xl">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={src} alt="" className="size-full object-cover" />
                        <button
                          type="button"
                          onClick={() =>
                            setGalleryFiles((prev) => prev.filter((_, i) => i !== index))
                          }
                          className="absolute right-1 top-1 rounded-full bg-black/55 p-1 text-white opacity-0 transition-opacity group-hover:opacity-100"
                          aria-label="Elimină imaginea"
                        >
                          <Trash2 className="size-3.5" />
                        </button>
                      </div>
                    ))}
                    {galleryFiles.length < GALLERY_MAX && (
                      <button
                        type="button"
                        onClick={() => galleryInputRef.current?.click()}
                        className="flex aspect-square flex-col items-center justify-center gap-1 rounded-xl border-2 border-dashed border-stroke text-dark-5 transition-colors hover:border-[#0060f0]/40 dark:border-white/[0.12] dark:text-[#9CA3AF]"
                      >
                        <ImagePlus className="size-5" aria-hidden />
                        <span className="text-[10px] font-medium">Adaugă</span>
                      </button>
                    )}
                  </div>
                </div>
              </div>
            )}

            {error && (
              <p className="mt-5 rounded-xl border border-red/20 bg-red/5 px-4 py-3 text-sm text-red dark:text-red-400">
                {error}
              </p>
            )}

            <div className="mt-8 flex flex-col-reverse gap-3 border-t border-stroke/80 pt-6 sm:flex-row sm:justify-between dark:border-white/[0.08]">
              <div className="flex gap-3">
                {step > 0 ? (
                  <button
                    type="button"
                    onClick={goBack}
                    disabled={submitting}
                    className="inline-flex items-center justify-center gap-2 rounded-xl border border-stroke px-5 py-3 text-sm font-medium text-dark hover:bg-gray-1 dark:border-white/[0.12] dark:text-white dark:hover:bg-white/[0.06]"
                  >
                    <ArrowLeft className="size-4" />
                    Înapoi
                  </button>
                ) : (
                  <Link
                    href="/proiecte?view=mine"
                    className="inline-flex items-center justify-center rounded-xl border border-stroke px-5 py-3 text-sm font-medium text-dark hover:bg-gray-1 dark:border-white/[0.12] dark:text-white"
                  >
                    Anulează
                  </Link>
                )}
              </div>
              {isLastStep ? (
                <button
                  type="button"
                  onClick={() => void handleSubmit()}
                  disabled={submitting}
                  className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#002050] px-6 py-3 text-sm font-semibold text-white disabled:opacity-60 dark:bg-[#f1f6ff] dark:text-[#08080a]"
                >
                  {submitting ? (
                    <>
                      <Loader2 className="size-4 animate-spin" />
                      Se publică...
                    </>
                  ) : (
                    "Publică proiectul"
                  )}
                </button>
              ) : (
                <button
                  type="button"
                  onClick={goNext}
                  className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#002050] px-6 py-3 text-sm font-semibold text-white dark:bg-[#f1f6ff] dark:text-[#08080a]"
                >
                  Continuă
                  <ArrowRight className="size-4" />
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
