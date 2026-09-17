import type { MetadataRoute } from "next";
import { getSuppliers } from "@/lib/data/suppliers";

const siteUrl = "https://gryadka.example";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const suppliers = await getSuppliers();

  const staticRoutes: MetadataRoute.Sitemap = [
    { url: `${siteUrl}/`, changeFrequency: "daily", priority: 1 },
    { url: `${siteUrl}/suppliers`, changeFrequency: "daily", priority: 0.9 },
    { url: `${siteUrl}/map`, changeFrequency: "daily", priority: 0.7 },
    { url: `${siteUrl}/offers`, changeFrequency: "daily", priority: 0.7 },
    { url: `${siteUrl}/suppliers-portal`, changeFrequency: "weekly", priority: 0.5 },
  ];

  const supplierRoutes: MetadataRoute.Sitemap = suppliers.map((s) => ({
    url: `${siteUrl}/supplier/${s.slug}`,
    lastModified: s.updatedAt,
    changeFrequency: "weekly",
    priority: 0.6,
  }));

  return [...staticRoutes, ...supplierRoutes];
}
