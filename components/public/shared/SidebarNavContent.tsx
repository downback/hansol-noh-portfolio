"use client"

import Link from "next/link"
import { cn } from "@/lib/utils"

type SidebarWorkItem = {
  slug: string
  href: string
  key: string
  title: string
}

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
                "transition-colors hover:text-black/60 hover:translate-x-0.5 text-sm md:text-[14px] xl:text-[15px] font-normal",
                pathname === link.href &&
                  "font-bold hover:text-black hover:translate-x-0 hover:cursor-default",
              )}
              href={link.href}
              onClick={onNavigate}
            >
              {pathname === link.href && "➤"}
              {link.label}
            </Link>
          ))}
      </div>

      <div className="">
        <span className="text-sm md:text-[14px] xl:text-[15px] inline-block w-full font-extrabold">
          WORKS
        </span>
        <div className="flex flex-col gap-1">
          {sidebarWorkItems.length === 0 ? (
            <span className="text-sm text-muted-foreground py-1">
              No works yet
            </span>
          ) : (
            sidebarWorkItems.map((item) => (
              <Link
                key={item.key}
                className={cn(
                  "block truncate transition-colors hover:text-black/60 hover:translate-x-0.5 text-sm md:text-[13px] font-normal capitalize",
                  pathname === item.href &&
                    "font-bold hover:text-black hover:translate-x-0 hover:cursor-default",
                )}
                href={item.href}
                onClick={onNavigate}
                title={item.title}
              >
                {pathname === item.href && "➤"}
                {item.title}
              </Link>
            ))
          )}
        </div>
      </div>
    </nav>
  )
}
