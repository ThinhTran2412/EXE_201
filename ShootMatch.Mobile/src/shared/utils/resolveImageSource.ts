import { ImageSourcePropType } from 'react-native';
import { formatImageUrl } from './formatImageUrl';

/** URI từ API hoặc require() local */
export function resolveImageSource(
  source?: string | ImageSourcePropType | null,
): ImageSourcePropType | undefined {
  if (source == null) return undefined;
  if (typeof source === 'number' || (typeof source === 'object' && 'uri' in (source as object))) {
    return source as ImageSourcePropType;
  }
  if (typeof source === 'string' && source.length > 0) {
    return { uri: formatImageUrl(source) };
  }
  return undefined;
}
