import { readFileSync } from "fs";
import { join } from "path";
import Gallery from "@/components/Gallery";
import AdBanner from "@/components/AdBanner";
import type { Pin } from "@/types";

function getPins(): Pin[] {
  const filePath = join(process.cwd(), "public", "pins.json");
  return JSON.parse(readFileSync(filePath, "utf-8")) as Pin[];
}

export const revalidate = 86400; // ISR: rebuild once per day

export default function Home() {
  const pins = getPins();

  return (
    <main className="max-w-7xl mx-auto px-4 py-6">
      <AdBanner size="leaderboard" adSlot={process.env.ADSENSE_SLOT_HOME ?? ""} />
      <h1 className="text-2xl font-bold mt-6 mb-4">Free HD Wallpapers</h1>
      <Gallery pins={pins} />
    </main>
  );
}
