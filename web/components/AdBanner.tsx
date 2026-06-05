"use client";

import { useEffect } from "react";

type AdSize = "leaderboard" | "rectangle";

interface Props {
  size: AdSize;
  adSlot: string;
}

const DIMENSIONS: Record<AdSize, { w: number; h: number }> = {
  leaderboard: { w: 728, h: 90 },
  rectangle: { w: 300, h: 250 },
};

export default function AdBanner({ size, adSlot }: Props) {
  const { w, h } = DIMENSIONS[size];

  useEffect(() => {
    try {
      // @ts-expect-error adsbygoogle is injected by AdSense script
      (window.adsbygoogle = window.adsbygoogle || []).push({});
    } catch {}
  }, []);

  return (
    <div
      data-testid={`ad-${size}`}
      className="overflow-hidden flex justify-center"
      style={{ minHeight: h }}
    >
      <ins
        className="adsbygoogle"
        style={{ display: "block", width: w, height: h }}
        data-ad-client={process.env.NEXT_PUBLIC_ADSENSE_ID}
        data-ad-slot={adSlot}
        data-ad-format="auto"
        data-full-width-responsive="true"
      />
    </div>
  );
}
