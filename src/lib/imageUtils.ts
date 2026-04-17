import * as ImageManipulator from 'expo-image-manipulator';

/**
 * Compress and resize an image for upload.
 * - Avatar: 256x256, quality 0.7 (~20-50KB)
 * - Post: 1080px max width, quality 0.75 (~100-300KB)
 * - Thumbnail: 400px max width, quality 0.6 (~20-50KB)
 */
export async function compressImage(
  uri: string,
  type: 'avatar' | 'post' | 'thumbnail' = 'post'
): Promise<string> {
  const config = {
    avatar: { width: 256, quality: 0.7 },
    post: { width: 1080, quality: 0.75 },
    thumbnail: { width: 400, quality: 0.6 },
  }[type];

  try {
    const result = await ImageManipulator.manipulateAsync(
      uri,
      [{ resize: { width: config.width } }],
      { compress: config.quality, format: ImageManipulator.SaveFormat.JPEG }
    );
    return result.uri;
  } catch (e) {
    console.warn('Image compression failed, using original:', e);
    return uri; // Fallback to original
  }
}
