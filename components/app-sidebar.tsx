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

import { ModeToggle } from "@/components/mode-toggle"
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
      to: "/dashboard" as const,
      icon: IconDashboard,
    },
    {
      title: "Lifecycle",
      to: "/dashboard" as const,
      hash: "lifecycle",
      icon: IconListDetails,
    },
    {
      title: "Analytics",
      to: "/dashboard" as const,
      hash: "analytics",
      icon: IconChartBar,
    },
    {
      title: "Projects",
      to: "/dashboard" as const,
      hash: "projects",
      icon: IconFolder,
    },
    {
      title: "Team",
      to: "/dashboard" as const,
      hash: "team",
      icon: IconUsers,
    },
  ],
  navClouds: [
    {
      title: "Capture",
      icon: IconCamera,
      isActive: true,
      to: "/dashboard" as const,
      hash: "capture",
      items: [
        {
          title: "Active Proposals",
          to: "/dashboard" as const,
          hash: "capture-active-proposals",
        },
        {
          title: "Archived",
          to: "/dashboard" as const,
          hash: "capture-archived",
        },
      ],
    },
    {
      title: "Proposal",
      icon: IconFileDescription,
      to: "/dashboard" as const,
      hash: "proposal",
      items: [
        {
          title: "Active Proposals",
          to: "/dashboard" as const,
          hash: "proposal-active-proposals",
        },
        {
          title: "Archived",
          to: "/dashboard" as const,
          hash: "proposal-archived",
        },
      ],
    },
    {
      title: "Prompts",
      icon: IconFileAi,
      to: "/dashboard" as const,
      hash: "prompts",
      items: [
        {
          title: "Active Proposals",
          to: "/dashboard" as const,
          hash: "prompts-active-proposals",
        },
        {
          title: "Archived",
          to: "/dashboard" as const,
          hash: "prompts-archived",
        },
      ],
    },
  ],
  navSecondary: [
    {
      title: "Settings",
      to: "/dashboard" as const,
      hash: "settings",
      icon: IconSettings,
    },
    {
      title: "Get Help",
      to: "/dashboard" as const,
      hash: "help",
      icon: IconHelp,
    },
    {
      title: "Search",
      to: "/dashboard" as const,
      hash: "search",
      icon: IconSearch,
    },
  ],
  documents: [
    {
      name: "Data Library",
      to: "/dashboard" as const,
      hash: "data-library",
      icon: IconDatabase,
    },
    {
      name: "Reports",
      to: "/dashboard" as const,
      hash: "reports",
      icon: IconReport,
    },
    {
      name: "Word Assistant",
      to: "/dashboard" as const,
      hash: "word-assistant",
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
        <div className="flex items-center justify-between gap-2 p-2 group-data-[collapsible=icon]:justify-center">
          <ModeToggle />
        </div>
        <NavUser />
      </SidebarFooter>
    </Sidebar>
  )
}
