import { readFileSync } from "fs";
import { join } from "path";
import { notFound } from "next/navigation";
import Image from "next/image";
import type { Metadata } from "next";
import AdBanner from "@/components/AdBanner";
import type { Pin } from "@/types";

function getPins(): Pin[] {
  const filePath = join(process.cwd(), "public", "pins.json");
  return JSON.parse(readFileSync(filePath, "utf-8")) as Pin[];
}

export async function generateStaticParams() {
  const pins = getPins();
  return pins.map((pin) => ({ id: pin.id }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const pins = getPins();
  const pin = pins.find((p) => p.id === id);
  if (!pin) return {};
  return {
    title: `Free HD Wallpaper — WallDrop`,
    description: "Free HD wallpaper. Download for desktop, phone, or tablet.",
    openGraph: {
      images: [{ url: pin.cloudinary_url }],
    },
  };
}

export const revalidate = 86400;

export default async function PinPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const pins = getPins();
  const pin = pins.find((p) => p.id === id);
  if (!pin) notFound();

  const fullUrl = pin.cloudinary_url.replace(
    /\/upload\//,
    "/upload/w_1920,q_auto/"
  );

  return (
    <main className="max-w-4xl mx-auto px-4 py-8">
      <div className="relative w-full aspect-video rounded-xl overflow-hidden bg-[var(--card-bg)] mb-6">
        <Image
          src={pin.cloudinary_url}
          alt={`Wallpaper ${pin.id}`}
          fill
          sizes="(max-width: 1024px) 100vw, 896px"
          className="object-contain"
          priority
        />
      </div>

      <div className="flex items-center justify-between mb-8">
        <a
          href={fullUrl}
          download
          className="inline-flex items-center gap-2 px-6 py-3 rounded-lg bg-[#e60023] text-white font-semibold hover:bg-[#c0001e] transition-colors"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
          </svg>
          Download Wallpaper
        </a>
        <a href="/" className="text-sm text-gray-500 hover:underline">← Back to gallery</a>
      </div>

      <AdBanner size="rectangle" adSlot={process.env.ADSENSE_SLOT_PIN ?? ""} />
    </main>
  );
}
