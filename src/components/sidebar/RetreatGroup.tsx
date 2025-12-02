"use client"

import { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { ChevronDown } from "lucide-react"
import {
  SidebarGroupLabel,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
} from "@/components/ui/sidebar"
import { Collapsible, CollapsibleTrigger, CollapsibleContent } from "@/components/ui/collapsible"
import type { RetreatWithMenus } from "@/types/sidebar"
import { cn } from "@/lib/utils"
import { getIconComponent } from "@/lib/utils/icon-map"

interface RetreatGroupProps {
  retreat: RetreatWithMenus
  isActive: boolean
  currentPath: string
}

export default function RetreatGroup({
  retreat,
  isActive,
  currentPath,
}: RetreatGroupProps) {
  const [isOpen, setIsOpen] = useState(isActive)
  const router = useRouter()

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen}>
      <CollapsibleTrigger className="w-full">
        <SidebarGroupLabel className="flex items-center justify-between px-2 py-2 hover:bg-sidebar-accent rounded-md group">
          <span className="font-semibold">{retreat.name}</span>
          <ChevronDown
            className={cn(
              "h-4 w-4 transition-transform duration-200",
              isOpen && "rotate-180"
            )}
          />
        </SidebarGroupLabel>
      </CollapsibleTrigger>
      <CollapsibleContent>
        <SidebarGroupContent>
          <SidebarMenu>
            {retreat.menuItems.map((item) => {
              const isCurrentPage = currentPath === item.href
              const Icon = getIconComponent(item.icon)

              const handleClick = (e: React.MouseEvent) => {
                e.preventDefault()
                router.push(item.href)
              }

              return (
                <SidebarMenuItem key={item.href}>
                  <SidebarMenuButton asChild isActive={isCurrentPage}>
                    <Link
                      href={item.href}
                      onClick={handleClick}
                    >
                      {Icon && <Icon className="h-4 w-4" />}
                      <span>{item.label}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              )
            })}
          </SidebarMenu>
        </SidebarGroupContent>
      </CollapsibleContent>
    </Collapsible>
  )
}
