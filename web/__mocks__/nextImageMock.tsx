import React from "react";

interface ImageProps {
  src: string;
  alt: string;
  fill?: boolean;
  sizes?: string;
  className?: string;
  width?: number;
  height?: number;
  priority?: boolean;
  loader?: (props: { src: string; width: number; quality?: number }) => string;
  [key: string]: unknown;
}

export default function Image({ src, alt, className, width, height }: ImageProps) {
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={src} alt={alt} className={className} width={width} height={height} />
  );
}
