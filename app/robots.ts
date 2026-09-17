import type { MetadataRoute } from "next";

const siteUrl = "https://gryadka.example";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      { userAgent: "*", allow: "/", disallow: ["/admin", "/my-suppliers", "/invitations", "/profile"] },
    ],
    sitemap: `${siteUrl}/sitemap.xml`,
  };
}
