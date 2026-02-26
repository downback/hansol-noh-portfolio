"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import SidebarNavContent from "@/components/public/shared/SidebarNavContent"

type ExhibitionItem = {
  title: string
  slug: string
}

type NavLink = {
  href: string
  label: string
}

type SidebarNavDesktopProps = {
  works: ExhibitionItem[]
  soloExhibitions: ExhibitionItem[]
  groupExhibitions: ExhibitionItem[]
  navLinks: NavLink[]
}

export default function SidebarNavDesktop({
  works,
  soloExhibitions,
  groupExhibitions,
  navLinks,
}: SidebarNavDesktopProps) {
  const pathname = usePathname()

  return (
    <aside className="hidden md:flex shrink-0 min-h-screen flex-col ">
      <div className="px-8 pt-8 flex-none">
        <Link href="/" className="text-base font-semibold">
          HANSOL NOH
        </Link>
      </div>
      <div className="flex-auto overflow-y-auto hide-scrollbar">
        <SidebarNavContent
          works={works}
          soloExhibitions={soloExhibitions}
          groupExhibitions={groupExhibitions}
          navLinks={navLinks}
          pathname={pathname}
          className="px-8 pb-6"
        />
      </div>
    </aside>
  )
}
