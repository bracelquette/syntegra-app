"use client";

import * as React from "react";
import {
  BarChart3,
  Users,
  Brain,
  Settings,
  FileText,
  Clock,
} from "lucide-react";

import { NavMain } from "@/components/nav-main";
import { TeamSwitcher } from "@/components/team-switcher";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarRail,
} from "@/components/ui/sidebar";
import { NavUserAdmin } from "./nav-user-admin";

// Data untuk sistem psikotes
const data = {
  user: {
    name: "Admin Demo",
    email: "admin@syntegra-services.com",
    avatar: "/images/syntegra-logo.jpg",
  },
  company: {
    name: "Syntegra Services",
    subTitle: "Sistem Psikotes Digital",
    logo: "/images/syntegra-logo.jpg",
  },
  navMain: [
    {
      title: "Dashboard",
      url: "/dashboard",
      icon: BarChart3,
      isActive: true,
    },
    {
      title: "Manajemen Peserta",
      url: "/participants",
      icon: Users,
    },
    {
      title: "Laporan & Hasil",
      url: "/reports",
      icon: FileText,
    },
    {
      title: "Modul Psikotes",
      url: "/modules",
      icon: Brain,
      items: [
        {
          title: "Semua Modul",
          url: "/modules",
        },
        {
          title: "Template Modul",
          url: "/templates",
        },
      ],
    },
    {
      title: "Jadwal & Sesi",
      url: "/schedule",
      icon: Clock,
    },

    {
      title: "Pengaturan Sistem",
      url: "/settings",
      icon: Settings,
    },
  ],
};

export function AppSidebarAdmin({
  ...props
}: React.ComponentProps<typeof Sidebar>) {
  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader>
        <TeamSwitcher company={data.company} />
      </SidebarHeader>
      <SidebarContent>
        <NavMain items={data.navMain} />
      </SidebarContent>
      <SidebarFooter>
        <NavUserAdmin user={data.user} />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  );
}
