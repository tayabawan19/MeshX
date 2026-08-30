/**
 * Cloudinary Dynamic Image Optimization Helper
 * Automatically transforms Cloudinary URLs to request appropriately sized,
 * compressed, and WebP/AVIF auto-formatted assets depending on the display context.
 */

export type ImageTransformContext = 'avatar' | 'thumbnail' | 'card' | 'full';

export const optimizeCloudinaryUrl = (
  url?: string | null,
  context: ImageTransformContext = 'avatar'
): string => {
  if (!url || typeof url !== 'string') {
    return 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=300&q=80';
  }

  // If not a Cloudinary URL, return original
  if (!url.includes('cloudinary.com') || !url.includes('/upload/')) {
    return url;
  }

  let transformParam = 'f_auto,q_auto';

  switch (context) {
    case 'avatar':
      transformParam = 'w_150,h_150,c_fill,g_face,q_auto,f_auto';
      break;
    case 'thumbnail':
      transformParam = 'w_400,h_400,c_limit,q_auto:good,f_auto';
      break;
    case 'card':
      transformParam = 'w_600,c_limit,q_auto:good,f_auto';
      break;
    case 'full':
      transformParam = 'q_auto:best,f_auto';
      break;
  }

  return url.replace('/upload/', `/upload/${transformParam}/`);
};
