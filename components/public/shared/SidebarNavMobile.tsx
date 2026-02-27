"use client"

import { useEffect, useRef, useState } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { Menu, X } from "lucide-react"
import Image from "next/image"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import SidebarNavContent from "@/components/public/shared/SidebarNavContent"

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

type SidebarNavMobileProps = {
  sidebarWorkItems: SidebarWorkItem[]
  navLinks: NavLink[]
  heroImageUrl?: string | null
}

export default function SidebarNavMobile({
  sidebarWorkItems,
  navLinks,
  heroImageUrl = null,
}: SidebarNavMobileProps) {
  const pathname = usePathname()
  const [isMobileNavOpen, setIsMobileNavOpen] = useState(false)
  const scrollPositionRef = useRef(0)

  const isHomeRoute = pathname === "/"
  const isNavVisible = isHomeRoute || isMobileNavOpen

  useEffect(() => {
    if (!isMobileNavOpen) {
      return
    }

    const isIos =
      typeof navigator !== "undefined" &&
      /iP(hone|ad|od)/.test(navigator.userAgent)
    const body = document.body

    if (isIos) {
      scrollPositionRef.current = window.scrollY
      body.style.position = "fixed"
      body.style.top = `-${scrollPositionRef.current}px`
      body.style.left = "0"
      body.style.right = "0"
      body.style.width = "100%"
    } else {
      body.style.overflow = "hidden"
    }

    return () => {
      if (isIos) {
        body.style.position = ""
        body.style.top = ""
        body.style.left = ""
        body.style.right = ""
        body.style.width = ""
        window.scrollTo(0, scrollPositionRef.current)
      } else {
        body.style.overflow = ""
      }
    }
  }, [isMobileNavOpen])

  const closeMobileNav = () => setIsMobileNavOpen(false)

  return (
    <div className="w-full md:hidden flex flex-col justify-between">
      <header className="flex items-start justify-between pl-6 pt-8 pb-6">
        <Link
          className="text-base font-semibold"
          href="/"
          onClick={closeMobileNav}
        >
          HANSOL NOH
        </Link>
        <Button
          variant="default"
          size="icon"
          aria-label="Open menu"
          onClick={() => setIsMobileNavOpen(true)}
          className={cn("fixed right-3 top-5 z-50", isHomeRoute && "invisible")}
        >
          <Menu className="h-5 w-5" strokeWidth={1.5} />
        </Button>
      </header>

      {isNavVisible && (
        <aside
          className={cn(
            "fixed inset-0 z-50 md:hidden",
            "w-full bg-white",
            "flex flex-col",
          )}
          style={{ height: "100dvh" }}
        >
          {/* Overlay Header */}
          <div className="flex flex-col gap-4 shrink-0 pl-6 pt-8 pb-4">
            <div className="flex items-start justify-between">
              <div className="text-base font-extrabold">HANSOL NOH</div>
              <Button
                variant="default"
                size="icon"
                aria-label="Close menu"
                onClick={closeMobileNav}
                className={cn(
                  "fixed right-3 top-5 z-50",
                  isHomeRoute && "invisible",
                )}
              >
                <X className="h-5 w-5" strokeWidth={1.5} />
              </Button>
            </div>
            {heroImageUrl ? (
              <div className="relative aspect-video w-full max-w-3/4 overflow-hidden self-start">
                <Image
                  src={heroImageUrl}
                  alt="Hero"
                  fill
                  className="object-contain object-left"
                  sizes="(max-width: 768px) 80vw, 320px"
                />
              </div>
            ) : null}
          </div>

          {/* Scrollable Nav Content (ONLY SCROLL AREA) */}
          <div
            className={cn(
              "flex-1",
              "overflow-y-auto",
              "hide-scrollbar",
              "overscroll-contain", // prevents scroll chaining
              "px-6 pb-6",
            )}
          >
            <SidebarNavContent
              sidebarWorkItems={sidebarWorkItems}
              navLinks={navLinks}
              pathname={pathname}
              onNavigate={closeMobileNav}
            />
          </div>
        </aside>
      )}
    </div>
  )
}
