"use client"

import Link from "next/link"
import { useMemo } from "react"
import { cn } from "@/lib/utils"

type WorkItem = {
  title: string
  slug: string
}

type NavLink = {
  href: string
  label: string
}

type SidebarNavContentProps = {
  works: WorkItem[]
  soloExhibitions: WorkItem[]
  groupExhibitions: WorkItem[]
  navLinks: NavLink[]
  pathname: string
  className?: string
  onNavigate?: () => void
}

type UnifiedWorkLink = {
  label: string
  href: string
  key: string
}

const formatSlugForDisplay = (slug: string) => slug.replace(/-/g, " ")

function buildUnifiedWorkLinks(
  works: WorkItem[],
  soloExhibitions: WorkItem[],
  groupExhibitions: WorkItem[],
): UnifiedWorkLink[] {
  const workLinks: UnifiedWorkLink[] = works.map((item) => ({
    label: formatSlugForDisplay(item.slug),
    href: `/works/${item.slug}`,
    key: `work-${item.slug}`,
  }))
  const soloLinks: UnifiedWorkLink[] = soloExhibitions.map((item) => ({
    label: formatSlugForDisplay(item.slug),
    href: `/exhibitions/${item.slug}`,
    key: `solo-${item.slug}`,
  }))
  const groupLinks: UnifiedWorkLink[] = groupExhibitions.map((item) => ({
    label: formatSlugForDisplay(item.slug),
    href: `/exhibitions/${item.slug}`,
    key: `group-${item.slug}`,
  }))
  return [...workLinks, ...soloLinks, ...groupLinks]
}

export default function SidebarNavContent({
  works,
  soloExhibitions,
  groupExhibitions,
  navLinks,
  pathname,
  className,
  onNavigate,
}: SidebarNavContentProps) {
  const unifiedWorkLinks = useMemo(
    () => buildUnifiedWorkLinks(works, soloExhibitions, groupExhibitions),
    [works, soloExhibitions, groupExhibitions],
  )

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
          {unifiedWorkLinks.length === 0 ? (
            <span className="text-sm text-muted-foreground py-1">
              No works yet
            </span>
          ) : (
            unifiedWorkLinks.map((item) => (
              <Link
                key={item.key}
                className={cn(
                  "block truncate transition-colors hover:text-black/20 text-sm md:text-[12px] font-light capitalize",
                  pathname === item.href && "font-medium hover:text-black",
                )}
                href={item.href}
                onClick={onNavigate}
                title={item.label}
              >
                {item.label}
              </Link>
            ))
          )}
        </div>
      </div>
    </nav>
  )
}
