"use client";

import { getMyJobs, getMyReceivedReviews } from "@/lib/api-client";
import { useUnreadMessagesCount } from "@/hooks/useUnreadMessagesCount";
import { DashboardCalendarPopup } from "./DashboardCalendarPopup";
import { DashboardReviewsPopup } from "./DashboardReviewsPopup";
import { loadUpcomingCalendarEvents } from "@/lib/worker-calendar";
import { Calendar, ClipboardList, MessageSquare, Star } from "lucide-react";
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";

type PopupId = "reviews" | "calendar";

type DashboardCard = {
  title: string;
  value: string;
  description: string;
  hoverColor: "red" | "blue" | "green" | "yellow" | "violet" | "brand";
  icon: React.ReactNode;
  iconBg: string;
  iconColor: string;
  href?: string;
  isPopup?: boolean;
  popupId?: PopupId;
};

const STATIC_CARDS: DashboardCard[] = [
  {
    title: "Mesaje",
    value: "0",
    description: "Niciun mesaj necitit",
    href: "/mesaje",
    hoverColor: "blue",
    icon: <MessageSquare size={24} strokeWidth={2} />,
    iconBg: "bg-[#0060f0]/20 dark:bg-[#5b9fff]/20",
    iconColor: "text-[#0060f0] dark:text-[#5b9fff]",
  },
  {
    title: "Proiectele mele",
    value: "0",
    description: "Proiecte în contul tău",
    href: "/proiecte?view=mine",
    hoverColor: "brand",
    icon: <ClipboardList size={24} strokeWidth={2} />,
    iconBg: "bg-[#0060f0]/20 dark:bg-[#5b9fff]/20",
    iconColor: "text-[#0060f0] dark:text-[#5b9fff]",
  },
  {
    title: "Calendarul meu",
    value: "0",
    description: "Evenimente în următoarele 3 zile",
    hoverColor: "violet",
    icon: <Calendar size={24} strokeWidth={2} />,
    iconBg: "bg-violet-500/15 dark:bg-violet-400/15",
    iconColor: "text-violet-600 dark:text-violet-400",
    isPopup: true,
    popupId: "calendar",
  },
  {
    title: "Recenzii",
    value: "0.0",
    description: "Rating mediu",
    hoverColor: "green",
    icon: <Star size={24} strokeWidth={2} className="fill-amber-400 text-amber-400" />,
    iconBg: "bg-green/25 dark:bg-green/35",
    iconColor: "text-green-500 dark:text-green-400",
    isPopup: true,
    popupId: "reviews",
  },
];

const hoverColorClasses = {
  red: "group-hover:before:bg-red/50 dark:group-hover:before:bg-red/40",
  blue: "group-hover:before:bg-blue/50 dark:group-hover:before:bg-blue/40",
  green: "group-hover:before:bg-green/50 dark:group-hover:before:bg-green/40",
  yellow: "group-hover:before:bg-amber-500/50 dark:group-hover:before:bg-amber-400/40",
  violet: "group-hover:before:bg-violet-500/45 dark:group-hover:before:bg-violet-400/35",
  brand: "group-hover:before:bg-[#0060f0]/45 dark:group-hover:before:bg-[#5b9fff]/35",
} as const;

const cardBaseClasses =
  "group relative flex min-w-0 flex-col overflow-hidden rounded-2xl bg-white shadow-lg shadow-black/[0.04] ring-1 ring-black/[0.04] transition-all duration-300 ease-out dark:bg-[#1A1A1A] dark:shadow-none dark:ring-white/[0.06] " +
  "before:pointer-events-none before:absolute before:-top-16 before:right-4 before:z-[1] before:size-40 before:rounded-full before:bg-transparent before:transition-[background-color,opacity] before:duration-300 before:ease-out before:content-[''] sm:before:-top-20 sm:before:right-6 sm:before:size-52 " +
  "hover:shadow-xl hover:shadow-black/[0.06] hover:ring-black/[0.06] dark:hover:bg-[#222] dark:hover:ring-white/[0.08] " +
  "p-5 sm:p-6 lg:p-7";

export function DashboardSummaryCards() {
  const { unreadCount: unreadMessagesCount, loading: unreadMessagesLoading } =
    useUnreadMessagesCount();
  const [activePopup, setActivePopup] = useState<PopupId | null>(null);
  const [popupClosing, setPopupClosing] = useState(false);
  const [popupEntered, setPopupEntered] = useState(false);
  const [reviewsLoading, setReviewsLoading] = useState(true);
  const [reviewsSummary, setReviewsSummary] = useState({ average_rating: 0, total: 0 });
  const [calendarLoading, setCalendarLoading] = useState(true);
  const [calendarEventCount, setCalendarEventCount] = useState(0);
  const [myJobsLoading, setMyJobsLoading] = useState(true);
  const [myJobsCount, setMyJobsCount] = useState(0);

  const loadMyJobsSummary = useCallback(async () => {
    setMyJobsLoading(true);
    const { data } = await getMyJobs();
    setMyJobsCount(data?.length ?? 0);
    setMyJobsLoading(false);
  }, []);

  const loadReviewsSummary = useCallback(async () => {
    setReviewsLoading(true);
    const { data } = await getMyReceivedReviews();
    if (data) {
      setReviewsSummary(data.summary);
    }
    setReviewsLoading(false);
  }, []);

  const loadCalendarSummary = useCallback(async () => {
    setCalendarLoading(true);
    const { totalEvents } = await loadUpcomingCalendarEvents(3);
    setCalendarEventCount(totalEvents);
    setCalendarLoading(false);
  }, []);

  useEffect(() => {
    void loadReviewsSummary();
    void loadCalendarSummary();
    void loadMyJobsSummary();
  }, [loadReviewsSummary, loadCalendarSummary, loadMyJobsSummary]);

  useEffect(() => {
    if (activePopup === "calendar") void loadCalendarSummary();
  }, [activePopup, loadCalendarSummary]);

  const closePopup = () => {
    setPopupClosing(true);
  };

  useEffect(() => {
    if (!activePopup) {
      setPopupEntered(false);
      return;
    }
    const t = requestAnimationFrame(() => {
      requestAnimationFrame(() => setPopupEntered(true));
    });
    return () => cancelAnimationFrame(t);
  }, [activePopup]);

  useEffect(() => {
    if (!popupClosing) return;
    const t = setTimeout(() => {
      setActivePopup(null);
      setPopupClosing(false);
    }, 160);
    return () => clearTimeout(t);
  }, [popupClosing]);

  const getCardDisplay = (card: DashboardCard) => {
    if (card.href === "/mesaje") {
      return {
        value: unreadMessagesLoading ? "—" : String(unreadMessagesCount),
        description:
          unreadMessagesCount > 0
            ? `${unreadMessagesCount} ${unreadMessagesCount === 1 ? "mesaj necitit" : "mesaje necitite"}`
            : "Niciun mesaj necitit",
        badge: unreadMessagesCount > 0 ? unreadMessagesCount : undefined,
      };
    }
    if (card.href === "/proiecte?view=mine") {
      return {
        value: myJobsLoading ? "—" : String(myJobsCount),
        description:
          myJobsCount > 0
            ? `${myJobsCount} ${myJobsCount === 1 ? "proiect în cont" : "proiecte în cont"}`
            : "Niciun proiect publicat încă",
        badge: undefined,
      };
    }
    if (card.popupId === "reviews") {
      return {
        value: reviewsLoading
          ? "—"
          : reviewsSummary.total > 0
            ? reviewsSummary.average_rating.toFixed(1)
            : "0.0",
        description:
          reviewsSummary.total > 0
            ? `${reviewsSummary.total} ${reviewsSummary.total === 1 ? "recenzie primită" : "recenzii primite"}`
            : "Nicio recenzie încă",
        badge: undefined,
      };
    }
    if (card.popupId === "calendar") {
      return {
        value: calendarLoading ? "—" : String(calendarEventCount),
        description:
          calendarEventCount > 0
            ? `${calendarEventCount} ${calendarEventCount === 1 ? "eveniment planificat" : "evenimente planificate"}`
            : "Nimic în următoarele 3 zile",
        badge: calendarEventCount > 0 ? calendarEventCount : undefined,
      };
    }
    return { value: card.value, description: card.description, badge: undefined };
  };

  return (
    <>
      <section className="mb-6 -mx-4 overflow-x-auto px-4 sm:mx-0 sm:overflow-visible sm:px-0">
        <div className="grid min-w-[36rem] grid-cols-4 gap-2 sm:min-w-0 sm:gap-3 lg:gap-4">
        {STATIC_CARDS.map((card) => {
          const hoverClass = hoverColorClasses[card.hoverColor];
          const { value, description, badge } = getCardDisplay(card);
          const highlightUnread = card.href === "/mesaje" && unreadMessagesCount > 0;
          const content = (
            <>
              <div
                key={`${card.title}-icon`}
                className={`absolute right-4 top-4 z-10 flex size-10 items-center justify-center rounded-full transition-all duration-300 ease-out group-hover:scale-105 sm:right-5 sm:top-5 sm:size-11 lg:right-6 lg:top-6 lg:size-12 ${card.iconBg} ${card.iconColor}`}
              >
                {badge != null && badge > 0 ? (
                  <span className="relative inline-block">
                    {card.icon}
                    <span className="absolute -right-0.5 -top-0.5 flex size-4 min-w-4 items-center justify-center rounded-full bg-red text-[9px] font-bold leading-none text-white shadow-sm">
                      {badge}
                    </span>
                  </span>
                ) : (
                  card.icon
                )}
              </div>
              <div key={`${card.title}-content`} className="relative z-[2] flex min-w-0 flex-col pr-11 sm:pr-12 lg:pr-14">
                <h3 className="truncate text-xs font-medium text-dark-5 sm:text-sm dark:text-[#A1A1AA]">{card.title}</h3>
                <p className="mt-2 text-2xl font-bold tabular-nums tracking-tight text-dark dark:text-white sm:mt-3 sm:text-3xl">
                  {value}
                </p>
                <p className="mt-1 line-clamp-2 text-xs text-dark-5 sm:text-sm dark:text-[#9CA3AF]">{description}</p>
              </div>
            </>
          );

          if (card.isPopup && card.popupId) {
            return (
              <button
                key={card.title}
                type="button"
                onClick={() => setActivePopup(card.popupId!)}
                className={`${cardBaseClasses} ${hoverClass} text-left focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary dark:focus-visible:outline-white/40`}
              >
                {content}
              </button>
            );
          }

          return (
            <Link
              key={card.title}
              href={card.href || "/"}
              className={`${cardBaseClasses} ${hoverClass} ${
                highlightUnread
                  ? "ring-2 ring-[#0060f0]/35 dark:ring-[#5b9fff]/40"
                  : ""
              } focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary dark:focus-visible:outline-white/40`}
            >
              {content}
            </Link>
          );
        })}
        </div>
      </section>

      <DashboardReviewsPopup
        open={activePopup === "reviews"}
        closing={popupClosing}
        entered={popupEntered}
        onClose={closePopup}
        onSummaryChange={setReviewsSummary}
      />

      <DashboardCalendarPopup
        open={activePopup === "calendar"}
        closing={popupClosing}
        entered={popupEntered}
        onClose={closePopup}
        onEventCountChange={setCalendarEventCount}
      />
    </>
  );
}
