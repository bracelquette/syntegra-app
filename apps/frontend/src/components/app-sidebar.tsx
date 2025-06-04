"use client";

import * as React from "react";
import { BarChart3, Brain, User2 } from "lucide-react";

import { NavMain } from "@/components/nav-main";
import { NavUser } from "@/components/nav-user";
import { TeamSwitcher } from "@/components/team-switcher";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarRail,
} from "@/components/ui/sidebar";

// Data untuk sistem psikotes
const data = {
  user: {
    name: "Ahmad Fauzi Rahman",
    email: "ahmadfauzi@gmail.com",
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
      url: "/participant/dashboard",
      icon: BarChart3,
      isActive: true,
    },
    {
      title: "Psikotes",
      url: "/participant/test",
      icon: Brain,
    },
    {
      title: "Profile",
      url: "/participant/profile",
      icon: User2,
    },
  ],
};

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader>
        <TeamSwitcher company={data.company} />
      </SidebarHeader>
      <SidebarContent>
        <NavMain items={data.navMain} />
      </SidebarContent>
      <SidebarFooter>
        <NavUser user={data.user} />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  );
}
