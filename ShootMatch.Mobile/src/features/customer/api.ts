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
}

export interface Photographer {
  id:                 string;
  displayName:        string;
  phone:              string;
  email:              string;
  region:             string;
  bio:                string;
  avatarUrl:          string;
  coverPhotoUrl:      string;
  instagramUrl:       string;
  minBudget:          number;
  maxBudget:          number;
  rating:             number;
  isPremium:          boolean;
  isAvailable:        boolean;
  verificationStatus: string;
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
        photographerId displayName region
        minBudget maxBudget rating isPremium finalScore
      }
    }
  `, { searchId });
  return data.swipeFeed ?? [];
}

export async function getPhotographers(): Promise<Photographer[]> {
  const data = await gql<{ photographers: Photographer[] }>(`
    query { photographers {
      id displayName region bio avatarUrl coverPhotoUrl
      minBudget maxBudget rating isPremium isAvailable verificationStatus
    }}
  `);
  return data.photographers ?? [];
}

export async function getPhotographer(id: string): Promise<Photographer | null> {
  const data = await gql<{ photographer: Photographer | null }>(`
    query GetPhotographer($id: UUID!) {
      photographer(id: $id) {
        id displayName region bio avatarUrl coverPhotoUrl instagramUrl
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
      id matchId customerId photographerId status createdAt lastMessageAt
    }}
  `);
  return data.myConversations ?? [];
}
