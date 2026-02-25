// "use client"

// import { useMemo } from "react"
// import Image from "next/image"
// import useSWR from "swr"
// import { supabaseBrowser } from "@/lib/client"
// import Loading from "@/components/Loading"

// type HeroProps = {
//   alt?: string
// }

// export default function Hero({ alt = "Hero image" }: HeroProps) {
//   const supabase = useMemo(() => supabaseBrowser(), [])
//   const bucketName = "site-assets"

//   // Fetcher function for SWR
//   const fetcher = async () => {
//     const { data: siteContent, error: siteContentError } = await supabase
//       .from("site_content")
//       .select("hero_asset_id, updated_at, hero_animation_enabled")
//       .eq("singleton_id", true)
//       .maybeSingle()

//     if (siteContentError) {
//       return { url: null, animationEnabled: true }
//     }

//     if (siteContent?.hero_asset_id) {
//       const { data: asset, error: assetError } = await supabase
//         .from("assets")
//         .select("path, caption")
//         .eq("id", siteContent.hero_asset_id)
//         .maybeSingle()

//       if (assetError || !asset?.path) {
//         return { url: null, animationEnabled: true }
//       }

//       const { data } = supabase.storage
//         .from(bucketName)
//         .getPublicUrl(asset.path)

//       const versionTag = siteContent.updated_at
//         ? `?v=${encodeURIComponent(siteContent.updated_at)}`
//         : ""

//       return {
//         url: data?.publicUrl ? `${data.publicUrl}${versionTag}` : null,
//         animationEnabled: siteContent.hero_animation_enabled ?? true,
//         caption: asset.caption ?? null,
//       }
//     }

//     const { data: fallbackAsset, error: fallbackError } = await supabase
//       .from("assets")
//       .select("path, created_at, caption")
//       .eq("asset_kind", "hero_media")
//       .order("created_at", { ascending: false })
//       .limit(1)
//       .maybeSingle()

//     if (fallbackError || !fallbackAsset?.path) {
//       return { url: null, animationEnabled: true }
//     }

//     const { data } = supabase.storage
//       .from(bucketName)
//       .getPublicUrl(fallbackAsset.path)

//     const versionTag = fallbackAsset.created_at
//       ? `?v=${encodeURIComponent(fallbackAsset.created_at)}`
//       : ""

//     return {
//       url: data?.publicUrl ? `${data.publicUrl}${versionTag}` : null,
//       animationEnabled: true,
//       caption: fallbackAsset.caption ?? null,
//     }
//   }

//   // Use SWR with aggressive caching
//   const { data: heroData, isLoading } = useSWR<{
//     url: string | null
//     animationEnabled: boolean
//     caption?: string | null
//   }>("hero-image", fetcher, {
//     revalidateOnFocus: false, // Don't refetch on window focus
//     revalidateOnReconnect: false, // Don't refetch on reconnect
//     dedupingInterval: 3600000, // Dedupe requests within 1 hour
//     fallbackData: { url: null, animationEnabled: true, caption: null },
//   })

//   if (isLoading) {
//     return (
//       <div className="fixed inset-0 md:relative -z-10">
//         <Loading message="Loading image..." height="h-screen md:h-[70vh]" />
//       </div>
//     )
//   }

//   const isAnimationEnabled = heroData?.animationEnabled ?? true

//   return (
//     <div className="fixed inset-0 md:relative -z-10">
//       <div className="flex items-center justify-center w-full min-h-screen md:min-h-screen">
//         <div
//           className={`w-[80vw] h-auto md:w-auto md:h-[70vh] -translate-y-4 ${
//             isAnimationEnabled ? "hero-float" : ""
//           }`}
//         >
//           {heroData?.url ? (
//             <Image
//               src={heroData.url}
//               alt={alt}
//               width={1920}
//               height={1080}
//               className="w-full h-auto md:w-auto md:h-full object-contain"
//               priority
//               sizes="(max-width: 768px) 80vw, 70vh"
//             />
//           ) : (
//             <div className="flex h-[60vh] w-full items-center justify-center rounded-xl border border-dashed border-border bg-muted/40 text-sm text-muted-foreground">
//               No hero image available
//             </div>
//           )}
//           {heroData?.caption ? (
//             <div className="text-center mt-4 text-xs sm:text-sm font-light">
//               {heroData.caption}
//             </div>
//           ) : null}
//         </div>
//       </div>
//     </div>
//   )
// }
