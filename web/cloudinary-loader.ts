interface LoaderProps {
  src: string;
  width: number;
  quality?: number;
}

export default function cloudinaryLoader({ src, width, quality }: LoaderProps): string {
  // src is already a full Cloudinary URL — rewrite the transformation segment
  const q = quality ?? 75;
  return src.replace(
    /\/upload\//,
    `/upload/w_${width},q_${q},f_auto/`
  );
}
