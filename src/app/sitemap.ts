import type { MetadataRoute } from "next"

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    {
      url: "https://coalwatch.com.au/",
      changeFrequency: "hourly",
      priority: 1,
    },
    {
      url: "https://coalwatch.com.au/history",
      changeFrequency: "hourly",
      priority: 0.7,
    },
  ]
}
