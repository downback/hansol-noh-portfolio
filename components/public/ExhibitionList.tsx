"use client"

import LightboxImage from "@/components/public/LightboxImage"

type Exhibition = {
  id: string
  title: string
  caption: string
  description: string
  mainImageSrc: string
  mainImageAlt?: string
  detailImages?: {
    id: string
    src: string
    alt: string
  }[]
}

export default function ExhibitionList({
  items = [],
}: {
  items?: Exhibition[]
}) {
  return (
    <div className="w-full flex flex-col justify-center items-center text-center">
      {items.map((item) => (
        <div key={item.id} className="mx-auto w-full md:w-lg xl:w-2xl">
          <div className="w-full mb-2">
            <LightboxImage
              src={item.mainImageSrc}
              alt={item.mainImageAlt ?? "Exhibition main image"}
              width={1200}
              height={800}
              sizes="(min-width: 768px) 768px, 100vw"
              className="block h-full w-full"
              imageClassName="h-auto w-full object-cover md:h-auto md:w-full"
            />
          </div>

          <div className="text-left px-1 text-sm md:text-[14px] font-bold whitespace-pre-wrap">
            {item.title}
          </div>
          <div className="text-left px-1 text-sm md:text-[14px] font-light whitespace-pre-wrap">
            {item.caption}
          </div>

          <div className="flex flex-col gap-6 mt-6 md:mt-10 md:gap-10 mb-6 md:mb-10">
            {(item.detailImages ?? []).map((image) => (
              <div key={image.id} className=" w-full">
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

          <div className="text-left px-1 text-sm md:text-[14px] font-light whitespace-pre-wrap">
            {item.description}
          </div>
        </div>
      ))}
    </div>
  )
}
