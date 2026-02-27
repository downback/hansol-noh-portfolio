"use client"

import { useState } from "react"

type TextItemProps = {
  year: string
  title: string
  body: string
}

export default function TextItem({ year, title, body }: TextItemProps) {
  const [isExpanded, setIsExpanded] = useState(false)

  return (
    <div className="w-full pb-6">
      <div className="flex items-baseline gap-4 flex-1 min-w-0 mb-4">
        <span className="text-sm font-bold truncate">➤ {title}</span>
        <span className="text-xs font-light">{year}</span>
      </div>
      <div
        className={`text-[14px] font-normal whitespace-pre-wrap ${
          isExpanded ? "" : "line-clamp-4"
        }`}
      >
        {body}
      </div>
      <button
        type="button"
        onClick={() => setIsExpanded((prev) => !prev)}
        className="mt-2 text-sm font-light underline hover:text-black/60 hover:translate-x-0.5 cursor-pointer"
        aria-expanded={isExpanded}
      >
        {isExpanded ? "see less" : "see whole text"}
      </button>
    </div>
  )
}
