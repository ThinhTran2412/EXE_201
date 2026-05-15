import { ImageSourcePropType } from 'react-native';
import { FeaturedPhotographerCard, PortfolioFeedItem } from '../api';
import { localPicture, localPictureSlice } from '../../../shared/assets/localPictures';
import { formatImageUrl } from '../../../shared/utils/formatImageUrl';

export type FeaturedDisplay = FeaturedPhotographerCard & {
  slideSources: ImageSourcePropType[];
  coverSource: ImageSourcePropType;
};

export type MomentDisplay = PortfolioFeedItem & {
  imageSource: ImageSourcePropType;
};

function apiSlides(photos: string[]): ImageSourcePropType[] {
  return photos
    .filter(Boolean)
    .slice(0, 5)
    .map(uri => ({ uri: formatImageUrl(uri) }));
}

export function buildFeaturedDisplay(items: FeaturedPhotographerCard[]): FeaturedDisplay[] {
  return items.map((item, index) => {
    const fromApi = apiSlides(item.previewPhotos);
    const slides = fromApi.length >= 2 ? fromApi : localPictureSlice(index * 4, 5);
    return {
      ...item,
      slideSources: slides,
      coverSource: slides[0] ?? localPicture(index),
    };
  });
}

/** Khi API chưa có photographer — dùng ảnh local + id giả */
export function buildFallbackFeatured(count: number): FeaturedDisplay[] {
  return Array.from({ length: count }, (_, index) => ({
    id: `local-featured-${index}`,
    displayName: `Photographer ${index + 1}`,
    region: 'HN',
    rating: 4.5 + (index % 5) * 0.1,
    isPremium: index % 3 === 0,
    previewPhotos: [],
    slideSources: localPictureSlice(index * 4, 5),
    coverSource: localPicture(index),
  }));
}

export function buildMomentDisplay(items: PortfolioFeedItem[]): MomentDisplay[] {
  return items.map((item, index) => ({
    ...item,
    imageSource: item.imageUrl
      ? { uri: formatImageUrl(item.imageUrl) }
      : localPicture(index + 3),
  }));
}

export function buildFallbackMoments(count: number): MomentDisplay[] {
  return Array.from({ length: count }, (_, index) => ({
    photoId: `local-moment-${index}`,
    imageUrl: '',
    photographerId: `local-featured-${index % 7}`,
    photographerName: `Artist ${index + 1}`,
    createdAt: new Date().toISOString(),
    imageSource: localPicture(index + 10),
  }));
}
