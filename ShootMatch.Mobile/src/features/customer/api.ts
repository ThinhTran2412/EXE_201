import { apiClient } from '../../shared/api/client';
import { gql } from '../../shared/api/graphql';
import { tokenStorage } from '../../shared/storage/tokenStorage';

// ── Types ─────────────────────────────────────────────────────────────────────
export interface PhotographerCard {
  photographerId: string;
  displayName:    string;
  region:         string;
  minBudget:      number;
  maxBudget:      number;
  rating:         number;
  isPremium:      boolean;
  similarityScore: number;
  finalScore:     number;
  avatarUrl?:     string;
  portfolioPhotos?: string[];
}

export interface Photographer {
  id:                 string;
  displayName:        string;
  phone:              string;
  email:              string;
  region:             string;
  bio:                string;
  quote:              string;
  avatarUrl:          string;
  coverPhotoUrl:      string;
  instagramUrl:       string;
  minBudget:          number;
  maxBudget:          number;
  rating:             number;
  isPremium:          boolean;
  isAvailable:        boolean;
  verificationStatus: string;
  portfolioPhotos?:   string[];
}

export interface Match {
  id:             string;
  customerId:     string;
  photographerId: string;
  status:         string;
  matchedAt:      string;
}

export interface Booking {
  id:             string;
  customerId:     string;
  photographerId: string;
  matchId:        string;
  status:         string;
  agreedPrice:    number;
  scheduledAt:    string;
  createdAt:      string;
  cancellationReason?: string;
}

export interface Conversation {
  id:             string;
  matchId:        string;
  customerId:     string;
  photographerId: string;
  status:         string;
  createdAt:      string;
  lastMessageAt?: string;
  lastMessageContent?:       string;
  lastMessageSenderName?:    string;
  lastMessageSenderRole?:    string;
  unreadCount?:              number;
  customerDisplayName?:      string;
  photographerDisplayName?:  string;
  customerAvatarUrl?:        string;
  photographerAvatarUrl?:    string;
}

export interface Review {
  id:                  string;
  bookingId:           string;
  authorCustomerId:    string;
  targetPhotographerId: string;
  rating:              number;
  comment:             string;
  createdAt:           string;
}

// ── Matching ──────────────────────────────────────────────────────────────────
export async function createSearch(region: string, budget: number): Promise<string> {
  const customerId = await tokenStorage.getUserId();
  const { data } = await apiClient.post('/api/matching/searches', {
    customerId,
    referenceImageUrls: [],
    region,
    budget,
    topK: 20,
  });
  return data.searchId;
}

export async function recordSwipe(
  searchSessionId: string,
  photographerId: string,
  direction: 'Left' | 'Right'
) {
  const customerId = await tokenStorage.getUserId();
  await apiClient.post('/api/matching/swipes', {
    customerId,
    searchSessionId,
    photographerId,
    direction,
  });
}

export async function getSwipeFeed(searchId: string): Promise<PhotographerCard[]> {
  const data = await gql<{ swipeFeed: PhotographerCard[] }>(`
    query SwipeFeed($searchId: UUID!) {
      swipeFeed(searchId: $searchId) {
        photographerId displayName region avatarUrl portfolioPhotos
        minBudget maxBudget rating isPremium finalScore
      }
    }
  `, { searchId });
  return data.swipeFeed ?? [];
}

export interface PortfolioFeedItem {
  photoId:          string;
  imageUrl:         string;
  photographerId:   string;
  photographerName: string;
  avatarUrl?:       string;
  createdAt:        string;
}

export interface FeaturedPhotographerCard {
  id:            string;
  displayName:   string;
  region:        string;
  avatarUrl?:    string;
  rating:        number;
  isPremium:     boolean;
  previewPhotos: string[];
}

export interface CustomerHomeFeed {
  featured:     FeaturedPhotographerCard[];
  latestPhotos: PortfolioFeedItem[];
}

export interface CustomerProfile {
  id:            string;
  displayName:   string;
  phone:         string;
  email:         string;
  region:        string;
  avatarUrl:          string;
  coverPhotoUrl:      string;
  highlightPhoto1Url: string;
  highlightPhoto2Url: string;
  highlightPhoto3Url: string;
  rollPreviewPhotos?: string;
  preferredStyles?:   string;
  isVerified:         boolean;
  /** ISO — từ GraphQL `me` */
  createdAt?:    string;
}

export async function getCustomerProfile(): Promise<CustomerProfile | null> {
  try {
    const { data } = await apiClient.get<CustomerProfile>('/api/customers/me');
    return data ?? null;
  } catch (restError) {
    try {
      const data = await gql<{ me: CustomerProfile | null }>(`
        query { me { id displayName phone email region avatarUrl coverPhotoUrl highlightPhoto1Url highlightPhoto2Url highlightPhoto3Url rollPreviewPhotos preferredStyles isVerified createdAt } }
      `);
      return data.me;
    } catch {
      throw restError;
    }
  }
}

export type CustomerPhotoSlot = 'avatar' | 'cover' | 'highlight1' | 'highlight2' | 'highlight3';

export async function updateCustomerProfile(payload: Partial<Pick<CustomerProfile,
  'displayName' | 'phone' | 'email' | 'region' | 'avatarUrl' | 'coverPhotoUrl' | 'highlightPhoto1Url' | 'highlightPhoto2Url' | 'highlightPhoto3Url' | 'rollPreviewPhotos' | 'preferredStyles'>>) {
  await apiClient.post('/api/customers/profile', payload);
}

export async function uploadCustomerRollPreviewPhoto(uri: string, mimeType: string) {
  const filename = uri.split('/').pop() ?? `roll_preview_${Date.now()}.jpg`;
  const form = new FormData();
  form.append('file', {
    uri,
    name: filename,
    type: mimeType ?? 'image/jpeg',
  } as any);

  const { data } = await apiClient.post<{ photoUrl: string }>('/api/customers/profile/roll-preview/upload', form, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });

  return data.photoUrl;
}

const UPLOAD_ENDPOINTS: Record<CustomerPhotoSlot, string> = {
  avatar:     '/api/customers/profile/avatar/upload',
  cover:      '/api/customers/profile/cover/upload',
  highlight1: '/api/customers/profile/highlight-1/upload',
  highlight2: '/api/customers/profile/highlight-2/upload',
  highlight3: '/api/customers/profile/highlight-3/upload',
};

export async function uploadCustomerProfileImage(uri: string, mimeType: string, kind: CustomerPhotoSlot) {
  const filename = uri.split('/').pop() ?? `${kind}_${Date.now()}.jpg`;
  const form = new FormData();
  form.append('file', {
    uri,
    name: filename,
    type: mimeType ?? 'image/jpeg',
  } as any);

  const endpoint = UPLOAD_ENDPOINTS[kind];

  const { data } = await apiClient.post<{ photoUrl: string }>(endpoint, form, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });

  return data.photoUrl;
}

export async function getCustomerHomeFeed(): Promise<CustomerHomeFeed> {
  const data = await gql<{ customerHomeFeed: CustomerHomeFeed }>(`
    query {
      customerHomeFeed(photosPerPhotographer: 5, latestPhotoLimit: 20) {
        featured {
          id displayName region avatarUrl rating isPremium previewPhotos
        }
        latestPhotos {
          photoId imageUrl photographerId photographerName avatarUrl createdAt
        }
      }
    }
  `);
  return data.customerHomeFeed ?? { featured: [], latestPhotos: [] };
}

export async function getPhotographers(): Promise<Photographer[]> {
  const data = await gql<{ photographers: Photographer[] }>(`
    query { photographers {
      id displayName region bio quote avatarUrl coverPhotoUrl portfolioPhotos
      minBudget maxBudget rating isPremium isAvailable verificationStatus
    }}
  `);
  return data.photographers ?? [];
}

export async function getPhotographer(id: string): Promise<Photographer | null> {
  const data = await gql<{ photographer: Photographer | null }>(`
    query GetPhotographer($id: UUID!) {
      photographer(id: $id) {
        id displayName region bio quote avatarUrl coverPhotoUrl instagramUrl portfolioPhotos
        minBudget maxBudget rating isPremium isAvailable verificationStatus
      }
    }
  `, { id });
  return data.photographer;
}

// ── Matches ───────────────────────────────────────────────────────────────────
export async function getMyMatches(): Promise<Match[]> {
  const data = await gql<{ myMatches: Match[] }>(`
    query { myMatches { id customerId photographerId status matchedAt } }
  `);
  return data.myMatches ?? [];
}

// ── Bookings ──────────────────────────────────────────────────────────────────
export async function getMyBookings(): Promise<Booking[]> {
  const data = await gql<{ myBookings: Booking[] }>(`
    query { myBookings {
      id customerId photographerId matchId status
      agreedPrice scheduledAt createdAt cancellationReason
    }}
  `);
  return data.myBookings ?? [];
}

export async function createBooking(payload: {
  matchId:     string;
  agreedPrice: number;
  scheduledAt: string;
}): Promise<string> {
  const { data } = await apiClient.post('/api/bookings', payload);
  return data.bookingId;
}

export async function cancelBooking(id: string, reason: string) {
  await apiClient.post(`/api/bookings/${id}/cancel`, { reason });
}

// ── Reviews ───────────────────────────────────────────────────────────────────
export async function getMyReviews(): Promise<Review[]> {
  const data = await gql<{ myReviews: Review[] }>(`
    query { myReviews { id bookingId rating comment createdAt } }
  `);
  return data.myReviews ?? [];
}

export async function submitReview(payload: {
  bookingId: string;
  rating:    number;
  comment:   string;
}) {
  await apiClient.post('/api/reviews', payload);
}

// ── Conversations ─────────────────────────────────────────────────────────────
export async function getMyConversations(): Promise<Conversation[]> {
  const data = await gql<{ myConversations: Conversation[] }>(`
    query { myConversations {
      id matchId customerId photographerId status createdAt lastMessageAt lastMessageContent lastMessageSenderName lastMessageSenderRole
      customerDisplayName photographerDisplayName customerAvatarUrl photographerAvatarUrl
    }}
  `);
  return data.myConversations ?? [];
}
