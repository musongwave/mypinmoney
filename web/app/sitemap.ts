import { readFileSync } from "fs";
import { join } from "path";
import type { MetadataRoute } from "next";
import type { Pin } from "@/types";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://mypinmoney.vercel.app";

export default function sitemap(): MetadataRoute.Sitemap {
  const pins: Pin[] = JSON.parse(
    readFileSync(join(process.cwd(), "public", "pins.json"), "utf-8")
  );

  const pinPages = pins.map((pin) => ({
    url: `${SITE_URL}/pin/${pin.id}`,
    lastModified: new Date(pin.created_at),
    changeFrequency: "monthly" as const,
    priority: 0.7,
  }));

  return [
    { url: SITE_URL, lastModified: new Date(), changeFrequency: "daily", priority: 1 },
    ...pinPages,
  ];
}
