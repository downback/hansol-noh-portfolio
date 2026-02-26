"use client"

import Link from "next/link"
import { cn } from "@/lib/utils"

type SidebarWorkItem = { slug: string; href: string; key: string }

type NavLink = {
  href: string
  label: string
}

type SidebarNavContentProps = {
  sidebarWorkItems: SidebarWorkItem[]
  navLinks: NavLink[]
  pathname: string
  className?: string
  onNavigate?: () => void
}

const formatSlugForDisplay = (slug: string) => slug.replace(/-/g, " ")

export default function SidebarNavContent({
  sidebarWorkItems,
  navLinks,
  pathname,
  className,
  onNavigate,
}: SidebarNavContentProps) {

  return (
    <nav className={cn("flex flex-col h-full font-light space-y-4", className)}>
      <div className="flex flex-col">
        {navLinks
          .filter((link) => link.href !== "/works")
          .map((link) => (
            <Link
              key={link.href}
              className={cn(
                "transition-colors hover:font-normal text-sm md:text-[14px]",
                pathname === link.href && "font-medium",
              )}
              href={link.href}
              onClick={onNavigate}
            >
              {link.label}
            </Link>
          ))}
      </div>

      <div className="">
        <span className="text-sm md:text-[14px] inline-block w-full font-semibold">
          WORKS
        </span>
        <div className="flex flex-col gap-0.5">
          {sidebarWorkItems.length === 0 ? (
            <span className="text-sm text-muted-foreground py-1">
              No works yet
            </span>
          ) : (
            sidebarWorkItems.map((item) => (
              <Link
                key={item.key}
                className={cn(
                  "block truncate transition-colors hover:text-black/20 text-sm md:text-[12px] font-light capitalize",
                  pathname === item.href && "font-medium hover:text-black",
                )}
                href={item.href}
                onClick={onNavigate}
                title={formatSlugForDisplay(item.slug)}
              >
                {formatSlugForDisplay(item.slug)}
              </Link>
            ))
          )}
        </div>
      </div>
    </nav>
  )
}
