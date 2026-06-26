"use client";

import {
  createCalendarEvent,
  updateCalendarEvent,
  type ApiCalendarEventType,
} from "@/lib/api-client";
import {
  CALENDAR_EVENT_TYPE_LABELS,
  calendarEventToFormDefaults,
  formDefaultsToPayload,
  type CalendarEvent,
  type CalendarEventType,
} from "@/lib/worker-calendar";
import { X } from "lucide-react";
import { useEffect, useState } from "react";
import { createPortal } from "react-dom";

type CalendarEventFormModalProps = {
  open: boolean;
  closing: boolean;
  entered: boolean;
  editingEvent?: CalendarEvent | null;
  preset?: { dateKey?: string; time?: string };
  onClose: () => void;
  onSaved: () => void;
};

const EVENT_TYPES = Object.keys(CALENDAR_EVENT_TYPE_LABELS) as CalendarEventType[];

export function CalendarEventFormModal({
  open,
  closing,
  entered,
  editingEvent,
  preset,
  onClose,
  onSaved,
}: CalendarEventFormModalProps) {
  const [mounted, setMounted] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState(() => calendarEventToFormDefaults(editingEvent, preset));

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (open) {
      setForm(calendarEventToFormDefaults(editingEvent, preset));
      setError(null);
    }
  }, [open, editingEvent, preset]);

  useEffect(() => {
    if (!open) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open, onClose]);

  if (!mounted || !open || typeof document === "undefined") return null;

  const isEdit = !!editingEvent?.isCustom && editingEvent.customEventId;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title.trim()) {
      setError("Titlul este obligatoriu.");
      return;
    }

    setSaving(true);
    setError(null);
    const payload = formDefaultsToPayload(form);

    if (isEdit && editingEvent?.customEventId) {
      const { error: saveError } = await updateCalendarEvent(editingEvent.customEventId, payload);
      setSaving(false);
      if (saveError) {
        setError(saveError);
        return;
      }
    } else {
      const { error: saveError } = await createCalendarEvent({
        ...payload,
        event_type: payload.event_type as ApiCalendarEventType,
      });
      setSaving(false);
      if (saveError) {
        setError(saveError);
        return;
      }
    }

    onSaved();
    onClose();
  };

  return createPortal(
    <>
      <div
        className={`fixed inset-0 z-[130] bg-black/50 backdrop-blur-md ${
          closing ? "animate-backdrop-exit" : entered ? "animate-backdrop-enter" : "opacity-0"
        }`}
        aria-hidden
        onClick={onClose}
      />
      <div className="pointer-events-none fixed inset-0 z-[140] flex items-center justify-center p-4">
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="calendar-form-title"
          className={`pointer-events-auto flex max-h-[90vh] w-full max-w-lg flex-col overflow-hidden rounded-2xl bg-white shadow-2xl dark:bg-[#1A1A1A] dark:ring-1 dark:ring-white/[0.08] ${
            closing ? "animate-modal-exit" : entered ? "animate-modal-enter" : "opacity-0 pointer-events-none"
          }`}
        >
          <div className="flex items-center justify-between gap-3 border-b border-stroke/80 px-5 py-4 dark:border-white/[0.08]">
            <h2 id="calendar-form-title" className="text-lg font-semibold text-dark dark:text-white">
              {isEdit ? "Editează lucrarea" : "Adaugă lucrare în calendar"}
            </h2>
            <button
              type="button"
              onClick={onClose}
              className="flex size-9 items-center justify-center rounded-full text-dark-5 hover:bg-gray-2 dark:text-[#9CA3AF] dark:hover:bg-white/10"
              aria-label="Închide"
            >
              <X size={20} />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="custom-scrollbar flex-1 space-y-4 overflow-y-auto p-5">
            <div>
              <label className="mb-1 block text-xs font-medium text-dark-5 dark:text-[#9CA3AF]">
                Titlu *
              </label>
              <input
                value={form.title}
                onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
                className="w-full rounded-xl border border-stroke bg-white px-3 py-2 text-sm dark:border-white/[0.14] dark:bg-[#141414] dark:text-white"
                placeholder="ex. Montaj instalație sanitare"
                maxLength={200}
              />
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <label className="mb-1 block text-xs font-medium text-dark-5 dark:text-[#9CA3AF]">
                  Tip
                </label>
                <select
                  value={form.event_type}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, event_type: e.target.value as CalendarEventType }))
                  }
                  className="w-full rounded-xl border border-stroke bg-white px-3 py-2 text-sm dark:border-white/[0.14] dark:bg-[#141414] dark:text-white"
                >
                  {EVENT_TYPES.map((type) => (
                    <option key={type} value={type}>
                      {CALENDAR_EVENT_TYPE_LABELS[type]}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-dark-5 dark:text-[#9CA3AF]">
                  Data
                </label>
                <input
                  type="date"
                  value={form.dateKey}
                  onChange={(e) => setForm((f) => ({ ...f, dateKey: e.target.value }))}
                  className="w-full rounded-xl border border-stroke bg-white px-3 py-2 text-sm dark:border-white/[0.14] dark:bg-[#141414] dark:text-white"
                />
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <label className="mb-1 block text-xs font-medium text-dark-5 dark:text-[#9CA3AF]">
                  Ora început
                </label>
                <input
                  type="time"
                  value={form.startTime}
                  onChange={(e) => setForm((f) => ({ ...f, startTime: e.target.value }))}
                  className="w-full rounded-xl border border-stroke bg-white px-3 py-2 text-sm dark:border-white/[0.14] dark:bg-[#141414] dark:text-white"
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-dark-5 dark:text-[#9CA3AF]">
                  Ora sfârșit
                </label>
                <input
                  type="time"
                  value={form.endTime}
                  onChange={(e) => setForm((f) => ({ ...f, endTime: e.target.value }))}
                  className="w-full rounded-xl border border-stroke bg-white px-3 py-2 text-sm dark:border-white/[0.14] dark:bg-[#141414] dark:text-white"
                />
              </div>
            </div>

            <div>
              <label className="mb-1 block text-xs font-medium text-dark-5 dark:text-[#9CA3AF]">
                Locație
              </label>
              <input
                value={form.location}
                onChange={(e) => setForm((f) => ({ ...f, location: e.target.value }))}
                className="w-full rounded-xl border border-stroke bg-white px-3 py-2 text-sm dark:border-white/[0.14] dark:bg-[#141414] dark:text-white"
                placeholder="Adresă sau oraș"
              />
            </div>

            <div>
              <label className="mb-1 block text-xs font-medium text-dark-5 dark:text-[#9CA3AF]">
                Descriere
              </label>
              <textarea
                value={form.description}
                onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                rows={3}
                className="w-full resize-y rounded-xl border border-stroke bg-white px-3 py-2 text-sm dark:border-white/[0.14] dark:bg-[#141414] dark:text-white"
                placeholder="Detalii despre lucrare..."
              />
            </div>

            <div>
              <label className="mb-1 block text-xs font-medium text-dark-5 dark:text-[#9CA3AF]">
                Materiale necesare
              </label>
              <textarea
                value={form.materials}
                onChange={(e) => setForm((f) => ({ ...f, materials: e.target.value }))}
                rows={3}
                className="w-full resize-y rounded-xl border border-stroke bg-white px-3 py-2 text-sm dark:border-white/[0.14] dark:bg-[#141414] dark:text-white"
                placeholder="ex. țevi PPR, fitinguri, silicon..."
              />
            </div>

            {error && <p className="text-sm text-red dark:text-red-400">{error}</p>}
          </form>

          <div className="flex gap-2 border-t border-stroke/80 px-5 py-4 dark:border-white/[0.08]">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 rounded-xl border border-stroke px-4 py-2.5 text-sm font-medium dark:border-white/[0.12] dark:text-white"
            >
              Anulează
            </button>
            <button
              type="submit"
              disabled={saving}
              onClick={handleSubmit}
              className="flex-1 rounded-xl bg-[#16366d] px-4 py-2.5 text-sm font-medium text-white hover:bg-[#16366d]/90 disabled:opacity-50 dark:bg-[#f1f6ff] dark:text-[#16366d]"
            >
              {saving ? "Se salvează..." : isEdit ? "Salvează" : "Adaugă"}
            </button>
          </div>
        </div>
      </div>
    </>,
    document.body
  );
}
