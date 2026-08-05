"use client"

import * as React from "react"
import { Link } from "@tanstack/react-router"
import {
  IconCamera,
  IconChartBar,
  IconDashboard,
  IconDatabase,
  IconFileAi,
  IconFileDescription,
  IconFileWord,
  IconFolder,
  IconHelp,
  IconInnerShadowTop,
  IconListDetails,
  IconReport,
  IconSearch,
  IconSettings,
  IconUsers,
} from "@tabler/icons-react"

import { NavDocuments } from "@/components/nav-documents"
import { NavMain } from "@/components/nav-main"
import { NavSecondary } from "@/components/nav-secondary"
import { NavUser } from "@/components/nav-user"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar"
const data = {
  navMain: [
    {
      title: "Dashboard",
      url: "/dashboard",
      icon: IconDashboard,
    },
    {
      title: "Lifecycle",
      url: "/dashboard#lifecycle",
      icon: IconListDetails,
    },
    {
      title: "Analytics",
      url: "/dashboard#analytics",
      icon: IconChartBar,
    },
    {
      title: "Projects",
      url: "/dashboard#projects",
      icon: IconFolder,
    },
    {
      title: "Team",
      url: "/dashboard#team",
      icon: IconUsers,
    },
  ],
  navClouds: [
    {
      title: "Capture",
      icon: IconCamera,
      isActive: true,
      url: "/dashboard#capture",
      items: [
        {
          title: "Active Proposals",
          url: "/dashboard#capture-active-proposals",
        },
        {
          title: "Archived",
          url: "/dashboard#capture-archived",
        },
      ],
    },
    {
      title: "Proposal",
      icon: IconFileDescription,
      url: "/dashboard#proposal",
      items: [
        {
          title: "Active Proposals",
          url: "/dashboard#proposal-active-proposals",
        },
        {
          title: "Archived",
          url: "/dashboard#proposal-archived",
        },
      ],
    },
    {
      title: "Prompts",
      icon: IconFileAi,
      url: "/dashboard#prompts",
      items: [
        {
          title: "Active Proposals",
          url: "/dashboard#prompts-active-proposals",
        },
        {
          title: "Archived",
          url: "/dashboard#prompts-archived",
        },
      ],
    },
  ],
  navSecondary: [
    {
      title: "Settings",
      url: "/dashboard#settings",
      icon: IconSettings,
    },
    {
      title: "Get Help",
      url: "/dashboard#help",
      icon: IconHelp,
    },
    {
      title: "Search",
      url: "/dashboard#search",
      icon: IconSearch,
    },
  ],
  documents: [
    {
      name: "Data Library",
      url: "/dashboard#data-library",
      icon: IconDatabase,
    },
    {
      name: "Reports",
      url: "/dashboard#reports",
      icon: IconReport,
    },
    {
      name: "Word Assistant",
      url: "/dashboard#word-assistant",
      icon: IconFileWord,
    },
  ],
}

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  return (
    <Sidebar collapsible="offcanvas" {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              asChild
              className="data-[slot=sidebar-menu-button]:!p-1.5"
            >
              <Link to="/dashboard">
                <IconInnerShadowTop className="!size-5" />
                <span className="text-base font-semibold">Acme Inc.</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <NavMain items={data.navMain} />
        <NavDocuments items={data.documents} />
        <NavSecondary items={data.navSecondary} className="mt-auto" />
      </SidebarContent>
      <SidebarFooter>
        <NavUser />
      </SidebarFooter>
    </Sidebar>
  )
}
