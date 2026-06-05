"use client";

import { useState } from "react";
import PinCard from "./PinCard";
import type { Pin } from "@/types";

const PAGE_SIZE = 24;

interface Props {
  pins: Pin[];
}

export default function Gallery({ pins }: Props) {
  const [page, setPage] = useState(0);
  const totalPages = Math.ceil(pins.length / PAGE_SIZE);
  const pagePins = pins.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);

  return (
    <div>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {pagePins.map((pin) => (
          <PinCard key={pin.id} pin={pin} />
        ))}
      </div>

      {totalPages > 1 && (
        <div className="flex justify-center items-center gap-4 mt-8">
          <button
            onClick={() => setPage((p) => p - 1)}
            disabled={page === 0}
            className="px-4 py-2 rounded bg-[#e60023] text-white disabled:opacity-30 hover:bg-[#c0001e] transition-colors"
          >
            Prev
          </button>
          <span className="text-sm text-gray-500">
            {page + 1} / {totalPages}
          </span>
          <button
            onClick={() => setPage((p) => p + 1)}
            disabled={page === totalPages - 1}
            className="px-4 py-2 rounded bg-[#e60023] text-white disabled:opacity-30 hover:bg-[#c0001e] transition-colors"
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
}
