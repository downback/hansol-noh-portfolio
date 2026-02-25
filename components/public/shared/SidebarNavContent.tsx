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

function buildUnifiedWorkLinks(
  works: WorkItem[],
  soloExhibitions: WorkItem[],
  groupExhibitions: WorkItem[],
): UnifiedWorkLink[] {
  const workLinks: UnifiedWorkLink[] = works.map((item) => ({
    label: item.title,
    href: `/works/${item.slug}`,
    key: `work-${item.slug}`,
  }))
  const soloLinks: UnifiedWorkLink[] = soloExhibitions.map((item) => ({
    label: item.title,
    href: `/exhibitions/solo/${item.slug}`,
    key: `solo-${item.slug}`,
  }))
  const groupLinks: UnifiedWorkLink[] = groupExhibitions.map((item) => ({
    label: item.title,
    href: `/exhibitions/group/${item.slug}`,
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
    <nav className={cn("flex flex-col h-full font-light", className)}>
      <div className="flex flex-col">
        {navLinks
          .filter((link) => link.href !== "/works")
          .map((link) => (
            <Link
              key={link.href}
              className={cn(
                "transition-colors hover:font-normal text-base md:text-[14px]",
                pathname === link.href && "font-medium",
              )}
              href={link.href}
              onClick={onNavigate}
            >
              {link.label}
            </Link>
          ))}
      </div>

      <div className="space-y-2">
        <span className="text-sm inline-block w-full border-b-[0.9px] border-black">
          work
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
                  "block truncate py-0.5 transition-colors hover:font-normal text-base md:text-[14px] font-light capitalize",
                  pathname === item.href && "font-medium",
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
