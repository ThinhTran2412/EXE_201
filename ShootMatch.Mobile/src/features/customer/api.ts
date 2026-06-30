import { apiClient } from '../../shared/api/client';
import { gql } from '../../shared/api/graphql';
import { tokenStorage } from '../../shared/storage/tokenStorage';
import { appendFileToFormData } from '../../shared/api/uploadHelper';

export interface AvailabilitySlot {
  specificDate: string;
  startTime: string;
  endTime: string;
  slotType: 'Available' | 'Busy' | 'Blocked';
}

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
  currentLatitude?: number;
  currentLongitude?: number;
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
  equipments?:        any[];
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
  commission:     number;
  scheduledAt:    string;
  createdAt:      string;
  cancellationReason?: string;
  phone?:         string;
  location?:      string;
  note?:          string;
  requirements?:  string;
  servicePackageId?: string | null;
}

function normalizeStatus(status: string): string {
  if (!status) return 'Pending';
  const s = status.toUpperCase();
  if (s === 'PENDING') return 'Pending';
  if (s === 'AWAITINGDEPOSIT' || s === 'AWAITING_DEPOSIT') return 'AwaitingDeposit';
  if (s === 'PROCESSING') return 'Processing';
  if (s === 'CONFIRMED') return 'Confirmed';
  if (s === 'MOVING') return 'Moving';
  if (s === 'ARRIVED') return 'Arrived';
  if (s === 'INPROGRESS' || s === 'IN_PROGRESS') return 'InProgress';
  if (s === 'COMPLETED') return 'Completed';
  if (s === 'CANCELLED') return 'Cancelled';
  if (s === 'DISPUTED') return 'Disputed';
  return status.charAt(0).toUpperCase() + status.slice(1).toLowerCase();
}

export async function getMyBookings(): Promise<Booking[]> {
  const data = await gql<{ myBookings: Booking[] }>(`
    query { myBookings {
      id customerId photographerId matchId status
      agreedPrice commission scheduledAt createdAt cancellationReason
      phone location note requirements servicePackageId
    }}
  `);
  return (data.myBookings ?? []).map((b) => ({
    ...b,
    status: normalizeStatus(b.status),
  }));
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
  authorName?:         string;
  authorAvatarUrl?:    string;
}

export interface PhotographerAvailabilitySlot {
  specificDate: string;
  startTime: string;
  endTime: string;
  slotType: 'Available' | 'Busy' | 'Blocked';
}

function normalizeDateKey(value?: string | null) {
  return value ? String(value).slice(0, 10) : '';
}

function normalizeTimeKey(value?: string | null) {
  return value ? String(value).slice(0, 5) : '';
}

export function normalizeAvailabilitySlot(slot: PhotographerAvailabilitySlot): PhotographerAvailabilitySlot {
  return {
    ...slot,
    specificDate: normalizeDateKey(slot.specificDate),
    startTime: normalizeTimeKey(slot.startTime),
    endTime: normalizeTimeKey(slot.endTime),
  };
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
  styles?:          string[];
  concepts?:        string[];
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

export async function getCustomerById(customerId: string): Promise<CustomerProfile | null> {
  const data = await gql<{ customerById: CustomerProfile | null }>(`
    query GetCustomerById($id: UUID!) {
      customerById(id: $id) {
        id displayName phone email region avatarUrl coverPhotoUrl
        highlightPhoto1Url highlightPhoto2Url highlightPhoto3Url
        rollPreviewPhotos preferredStyles isVerified createdAt
      }
    }
  `, { id: customerId });
  return data.customerById ?? null;
}

export type CustomerPhotoSlot = 'avatar' | 'cover' | 'highlight1' | 'highlight2' | 'highlight3';

export async function updateCustomerProfile(payload: Partial<Pick<CustomerProfile,
  'displayName' | 'phone' | 'email' | 'region' | 'avatarUrl' | 'coverPhotoUrl' | 'highlightPhoto1Url' | 'highlightPhoto2Url' | 'highlightPhoto3Url' | 'rollPreviewPhotos' | 'preferredStyles'>>) {
  await apiClient.post('/api/customers/profile', payload);
}

export async function uploadCustomerRollPreviewPhoto(uri: string, mimeType: string) {
  const filename = uri.split('/').pop() ?? `roll_preview_${Date.now()}.jpg`;
  const form = new FormData();
  await appendFileToFormData(form, 'file', uri, filename, mimeType ?? 'image/jpeg');

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
  await appendFileToFormData(form, 'file', uri, filename, mimeType ?? 'image/jpeg');

  const endpoint = UPLOAD_ENDPOINTS[kind];

  const { data } = await apiClient.post<{ photoUrl: string }>(endpoint, form, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });

  return data.photoUrl;
}

export async function getCustomerHomeFeed(): Promise<CustomerHomeFeed> {
  const data = await gql<{ customerHomeFeed: CustomerHomeFeed }>(`
    query {
      customerHomeFeed(photosPerPhotographer: 5, latestPhotoLimit: 200) {
        featured {
          id displayName region avatarUrl rating isPremium previewPhotos
        }
        latestPhotos {
          photoId imageUrl photographerId photographerName avatarUrl createdAt styles concepts
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

export async function searchPhotographers(params: {
  query?: string;
  region?: string;
  minBudget?: number;
  maxBudget?: number;
  durationHours?: number;
  styles?: string[];
  isEmergency?: boolean;
  locationType?: string | null;
  ageGroup?: string | null;
  groupSize?: string | null;
  colorTone?: string;
}): Promise<PhotographerCard[]> {
  const data = await gql<{ searchPhotographers: PhotographerCard[] }>(`
    query SearchPhotographers(
      $query: String
      $region: String
      $minBudget: Decimal
      $maxBudget: Decimal
      $durationHours: Int
      $styles: [String!]
      $isEmergency: Boolean
      $locationType: LocationType
      $ageGroup: AgeGroup
      $groupSize: GroupSize
      $colorTone: String
    ) {
      searchPhotographers(
        query: $query
        region: $region
        minBudget: $minBudget
        maxBudget: $maxBudget
        durationHours: $durationHours
        styles: $styles
        isEmergency: $isEmergency
        locationType: $locationType
        ageGroup: $ageGroup
        groupSize: $groupSize
        colorTone: $colorTone
      ) {
        photographerId displayName region avatarUrl portfolioPhotos
        minBudget maxBudget rating isPremium similarityScore finalScore
        currentLatitude currentLongitude
      }
    }
  `, params);
  return data.searchPhotographers ?? [];
}


export async function getPhotographer(id: string): Promise<Photographer | null> {
  const data = await gql<{ photographer: Photographer | null }>(`
    query GetPhotographer($id: UUID!) {
      photographer(id: $id) {
        id displayName region bio quote avatarUrl coverPhotoUrl instagramUrl portfolioPhotos
        minBudget maxBudget rating isPremium isAvailable verificationStatus
        equipments {
          id category name description isPrimary
        }
      }
    }
  `, { id });
  return data.photographer;
}

export async function getPhotographerAvailability(
  photographerId: string,
  from?: string,
  to?: string,
): Promise<PhotographerAvailabilitySlot[]> {
  try {
    const { data } = await apiClient.get<PhotographerAvailabilitySlot[]>(
      `/api/photographers/${photographerId}/availability`,
      { params: { from, to } },
    );
    return (data ?? []).map(normalizeAvailabilitySlot);
  } catch {
    return [];
  }
}

export async function getPhotographerServicePackages(photographerId: string): Promise<any[]> {
  try {
    const { data } = await apiClient.get<any>(`/api/photographers/${photographerId}/service-packages`);
    // API returns { value: [...], Count: N } — extract the array
    if (Array.isArray(data)) return data;
    if (data?.value && Array.isArray(data.value)) return data.value;
    return [];
  } catch {
    return [];
  }
}

// ── Matches ───────────────────────────────────────────────────────────────────
export async function getMyMatches(): Promise<Match[]> {
  const data = await gql<{ myMatches: Match[] }>(`
    query { myMatches { id customerId photographerId status matchedAt } }
  `);
  return data.myMatches ?? [];
}

// ── Bookings ──────────────────────────────────────────────────────────────────

export async function createBooking(payload: {
  matchId:          string;
  servicePackageId?: string | null;
  agreedPrice:       number;
  commission:        number;
  scheduledAt:       string;
  phone:             string;
  location:          string;
  note:              string;
  requirements:      string;
}): Promise<string> {
  const { data } = await apiClient.post('/api/bookings', payload);
  return data.bookingId;
}

export async function createPaymentLink(bookingId: string): Promise<string> {
  const { data } = await apiClient.post(`/api/bookings/${bookingId}/create-payment-link`);
  return data.checkoutUrl;
}

export async function cancelBooking(id: string, reason: string) {
  await apiClient.post(`/api/bookings/${id}/cancel`, { reason });
}

export async function confirmBooking(id: string) {
  await apiClient.post(`/api/bookings/${id}/confirm`);
}

export async function completeBooking(id: string) {
  await apiClient.post(`/api/bookings/${id}/complete`);
}

export async function updateBookingSessionStatus(id: string, status: 'Moving' | 'Arrived' | 'InProgress') {
  await apiClient.put(`/api/bookings/${id}/session-status`, { status });
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

export async function getPhotographerReviews(photographerId: string): Promise<Review[]> {
  const data = await gql<{ photographerReviews: Review[] }>(`
    query GetPhotographerReviews($photographerId: UUID!) {
      photographerReviews(photographerId: $photographerId) {
        id bookingId rating comment createdAt authorName authorAvatarUrl
      }
    }
  `, { photographerId });
  return data.photographerReviews ?? [];
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

export interface LookbookTaxonomyStyle {
  id: string;
  name: string;
  description: string;
}

export interface LookbookTaxonomyConcept {
  id: string;
  name: string;
  description: string;
}

export async function getActiveStylesAndConceptsForLookbook(): Promise<{ styles: LookbookTaxonomyStyle[]; concepts: LookbookTaxonomyConcept[] }> {
  const data = await gql<{ styles: LookbookTaxonomyStyle[]; concepts: LookbookTaxonomyConcept[] }>(`
    query {
      styles(status: "Approved") {
        id
        name
        description
      }
      concepts(status: "Approved") {
        id
        name
        description
      }
    }
  `);
  return {
    styles: data.styles ?? [],
    concepts: data.concepts ?? [],
  };
}

