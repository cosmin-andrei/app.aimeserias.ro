import { type AppUserRole } from "@/lib/site";
import type { ComponentType } from "react";
import type { PropsType } from "../icons";
import * as Icons from "../icons";

export type NavItem = {
  id: string;
  title: string;
  url: string;
  icon: ComponentType<PropsType>;
  external?: boolean;
};

const MESSAGES: NavItem = {
  id: "mesaje",
  title: "Mesaje",
  url: "/mesaje",
  icon: Icons.MessagesIcon,
};

const DASHBOARD: NavItem = {
  id: "dashboard",
  title: "Dashboard",
  url: "/",
  icon: Icons.DashboardIcon,
};

const CALENDAR: NavItem = {
  id: "calendar",
  title: "Calendar",
  url: "/calendar",
  icon: Icons.Calendar,
};

const ACCOUNT_NAV: NavItem[] = [
  {
    id: "setari",
    title: "Setări cont",
    url: "/setari",
    icon: Icons.SettingsIcon,
  },
];

/** Meniu sidebar în funcție de rolul utilizatorului. */
export function getNavData(role: AppUserRole | null): NavItem[] {
  const marketplace: NavItem[] =
    role === "client"
      ? [
          CALENDAR,
          {
            id: "proiectele-mele",
            title: "Proiectele mele",
            url: "/proiecte?view=mine",
            icon: Icons.ProjectsIcon,
          },
          {
            id: "cauta-meseriasi",
            title: "Caută meseriași",
            url: "/meseriasi",
            icon: Icons.WorkersIcon,
          },
          {
            id: "toate-proiectele",
            title: "Toate proiectele",
            url: "/proiecte",
            icon: Icons.ProjectsIcon,
          },
        ]
      : role === "worker"
        ? [
            CALENDAR,
            {
              id: "proiecte-disponibile",
              title: "Proiecte",
              url: "/proiecte",
              icon: Icons.ProjectsIcon,
            },
            {
              id: "meseriasi",
              title: "Meseriași",
              url: "/meseriasi",
              icon: Icons.WorkersIcon,
            },
          ]
        : [
            CALENDAR,
            {
              id: "meseriasi",
              title: "Meseriași",
              url: "/meseriasi",
              icon: Icons.WorkersIcon,
            },
            {
              id: "proiecte",
              title: "Proiecte",
              url: "/proiecte",
              icon: Icons.ProjectsIcon,
            },
          ];

  return [DASHBOARD, MESSAGES, ...marketplace, ...ACCOUNT_NAV];
}
