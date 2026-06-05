"use client";

import Image from "next/image";
import Link from "next/link";
import type { Pin } from "@/types";

interface Props {
  pin: Pin;
}

export default function PinCard({ pin }: Props) {
  return (
    <Link
      href={`/pin/${pin.id}`}
      className="group relative block overflow-hidden rounded-lg bg-[#1a1a1a] dark:bg-[#1a1a1a] aspect-square"
    >
      <Image
        src={pin.cloudinary_url}
        alt={`Wallpaper ${pin.id}`}
        fill
        sizes="(max-width: 640px) 50vw, (max-width: 1024px) 25vw, 20vw"
        className="object-cover transition-transform duration-300 group-hover:scale-105"
      />
      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors duration-300 flex items-center justify-center opacity-0 group-hover:opacity-100">
        <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
        </svg>
      </div>
    </Link>
  );
}
