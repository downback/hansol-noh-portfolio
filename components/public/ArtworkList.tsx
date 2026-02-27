"use client"

import LightboxImage from "@/components/public/LightboxImage"

type Artwork = {
  id: string
  mainImageSrc: string
  mainImageAlt?: string
  title: string
  caption: string
  detailImages?: {
    id: string
    src: string
    alt: string
  }[]
}

type ArtworkListProps = {
  items?: Artwork[]
}

export default function ArtworkList({ items = [] }: ArtworkListProps) {
  return (
    <div className="w-full flex flex-col justify-center items-center gap-14">
      {items.map((item) => (
        <div
          key={item.id}
          className="mx-auto w-full md:w-lg xl:max-w-3xl space-y-2"
        >
          <div className="w-full">
            <LightboxImage
              src={item.mainImageSrc}
              alt={item.mainImageAlt ?? "Artwork"}
              width={1200}
              height={800}
              sizes="(min-width: 768px) 768px, 100vw"
              className="block h-full w-full"
              imageClassName="h-auto w-full object-cover md:h-auto md:w-full"
            />
          </div>

          <div className="text-left px-1 text-sm md:text-[14px] font-bold whitespace-pre-wrap">
            {item.caption}
          </div>

          <div className="text-left px-1 text-sm md:text-[14px] font-light whitespace-pre-wrap">
            {item.caption}
          </div>

          <div className="flex flex-col gap-6 mt-12 md:mt-16">
            {(item.detailImages ?? []).map((image) => (
              <div key={image.id} className="w-full">
                <LightboxImage
                  src={image.src}
                  alt={image.alt}
                  width={1200}
                  height={800}
                  sizes="(min-width: 768px) 768px, 100vw"
                  className="block h-full w-full"
                  imageClassName="h-auto w-full object-cover md:h-auto md:w-full"
                />
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}
