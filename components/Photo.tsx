import { Image, ImageContentFit } from 'expo-image';

// All remote imagery goes through expo-image: memory+disk cache, fade-in,
// and (when Supabase image transforms are enabled) right-sized variants.
export function storageUrl(url: string | null | undefined, width?: number) {
  if (!url) return undefined;
  // Supabase public object URLs can be served through the render endpoint
  // with a width transform. Requires the image-transform add-on; falls back
  // to the original object URL otherwise (worker rewrites are 1:1).
  if (width && url.includes('/storage/v1/object/public/')) {
    return `${url.replace('/storage/v1/object/public/', '/storage/v1/render/image/public/')}?width=${width}&quality=75`;
  }
  return url;
}

export function Photo({
  uri,
  width,
  className,
  contentFit = 'cover',
  accessibilityLabel,
}: {
  uri: string | null | undefined;
  width?: number;
  className?: string;
  contentFit?: ImageContentFit;
  accessibilityLabel?: string;
}) {
  if (!uri) return null;
  return (
    <Image
      source={{ uri: storageUrl(uri, width) }}
      className={className}
      contentFit={contentFit}
      transition={150}
      cachePolicy="memory-disk"
      accessibilityLabel={accessibilityLabel}
    />
  );
}
