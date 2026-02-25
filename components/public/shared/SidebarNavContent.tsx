"use client"

import Link from "next/link"
import {
  worksYearRangeDisplay,
  worksYearRangeEnd,
  worksYearRangeStart,
  worksYearRangeValue,
} from "@/lib/constants"
import { cn } from "@/lib/utils"

type ExhibitionItem = {
  title: string
  slug: string
}

type NavLink = {
  href: string
  label: string
}

type SidebarNavContentProps = {
  worksYears: string[]
  soloExhibitions: ExhibitionItem[]
  groupExhibitions: ExhibitionItem[]
  navLinks: NavLink[]
  pathname: string
  className?: string
  onNavigate?: () => void
}

export default function SidebarNavContent({
  worksYears,
  soloExhibitions,
  groupExhibitions,
  navLinks,
  pathname,
  className,
  onNavigate,
}: SidebarNavContentProps) {
  const rangeStart = worksYearRangeStart
  const rangeEnd = worksYearRangeEnd
  const rangeLabel = worksYearRangeDisplay
  const rangeSlug = worksYearRangeValue
  const workLinks = worksYears
    .filter((year) => year.trim().length > 0)
    .reduce<{ label: string; href: string; key: string }[]>((acc, year) => {
      const yearValue = Number(year)
      if (
        Number.isInteger(yearValue) &&
        yearValue >= rangeStart &&
        yearValue <= rangeEnd
      ) {
        const alreadyAdded = acc.some((item) => item.key === rangeSlug)
        if (!alreadyAdded) {
          acc.push({
            label: rangeLabel,
            href: `/works/${rangeSlug}`,
            key: rangeSlug,
          })
        }
        return acc
      }

      acc.push({
        label: year,
        href: `/works/${year}`,
        key: year,
      })
      return acc
    }, [])

  return (
    <nav className={cn("flex flex-col h-full font-light", className)}>
      <div className="flex flex-col">
        {navLinks
          .filter((link) => link.href !== "/works")
          .map((link) => (
            <Link
              key={link.href}
              className={cn(
                "transition-colors hover:font-normal text-base md:text-[14px] ",
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
        <div className="flex flex-col">
          {workLinks.map((item) => (
            <Link
              key={item.key}
              className={cn(
                "inline-block transition-colors hover:font-normal text-base md:text-[14px] font-light",
                pathname === item.href && "font-medium",
              )}
              href={item.href}
              onClick={onNavigate}
            >
              {item.label}
            </Link>
          ))}
        </div>
      </div>

      <div className="space-y-2">
        <span className="text-sm inline-block w-full border-b-[0.9px] border-black">
          exhibitions
        </span>
        <div className="flex flex-col gap-2">
          <div className="flex flex-row justify-start gap-2">
            <span className="inline-block min-w-30 text-sm font-light">
              solo exhibitions
            </span>
            <div className="flex min-w-0 flex-col text-base md:text-[14px] font-light">
              {soloExhibitions.map((item) => (
                <Link
                  key={item.slug}
                  className={cn(
                    "block truncate transition-colors hover:font-normal capitalize",
                    pathname === `/exhibitions/solo/${item.slug}` &&
                      "font-medium",
                  )}
                  href={`/exhibitions/solo/${item.slug}`}
                  onClick={onNavigate}
                >
                  {item.title}
                </Link>
              ))}
            </div>
          </div>
          <div className="flex flex-row justify-start gap-2">
            <span className="inline-block min-w-30 text-sm font-light">
              group exhibitions
            </span>
            <div className="flex min-w-0 flex-col text-base md:text-[14px] font-light">
              {groupExhibitions.map((item) => (
                <Link
                  key={item.slug}
                  className={cn(
                    "block truncate transition-colors hover:font-normal capitalize",
                    pathname === `/exhibitions/group/${item.slug}` &&
                      "font-medium",
                  )}
                  href={`/exhibitions/group/${item.slug}`}
                  onClick={onNavigate}
                >
                  {item.title}
                </Link>
              ))}
            </div>
          </div>
        </div>
      </div>
    </nav>
  )
}
