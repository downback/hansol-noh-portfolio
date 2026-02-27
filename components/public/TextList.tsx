"use client"

import TextItem from "@/components/public/TextItem"

type TextEntry = {
  id: string
  year: string
  title: string
  body: string
}

type TextListProps = {
  items?: TextEntry[]
}

export default function TextList({ items = [] }: TextListProps) {
  return (
    <div className="w-full md:w-2xl xl:w-2/3 flex flex-col space-y-6">
      {items.map((item) => (
        <TextItem
          key={item.id}
          year={item.year}
          title={item.title}
          body={item.body}
        />
      ))}
    </div>
  )
}
