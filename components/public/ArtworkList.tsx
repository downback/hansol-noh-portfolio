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
    caption?: string
  }[]
}

type ArtworkListProps = {
  items?: Artwork[]
}

export default function ArtworkList({ items = [] }: ArtworkListProps) {
  return (
    <div className="w-full flex flex-col justify-center items-center">
      {items.map((item) => (
        <div key={item.id} className="mx-auto w-full md:w-lg xl:w-2xl">

          <div className="text-left px-1 text-sm md:text-[14px] font-bold whitespace-pre-wrap mb-2">
            {item.title}
          </div>

          <div className="w-full mb-2">
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

          <div className="text-left px-1 text-xs md:text-[14px] font-light whitespace-pre-wrap">
            {item.caption}
          </div>

          <div className="flex flex-col gap-6 mt-6 md:mt-10 md:gap-10">
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
                {image.caption?.trim() ? (
                  <div className="text-left px-1 pt-2 text-xs md:text-[14px] font-light whitespace-pre-wrap">
                    {image.caption}
                  </div>
                ) : null}
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}
