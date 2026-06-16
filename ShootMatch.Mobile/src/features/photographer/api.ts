import { apiClient } from '../../shared/api/client';
import { gql } from '../../shared/api/graphql';
import { appendFileToFormData } from '../../shared/api/uploadHelper';

export interface PhotographerAvailabilitySlot {
  id?: string;
  specificDate: string;
  startTime: string;
  endTime: string;
  slotType: 'Blocked' | 'Available';
}

export enum EquipmentCategory {
  Camera = 0,
  Lens = 1,
  Lighting = 2,
  Drone = 3,
  Gimbal = 4,
  Audio = 5,
  Other = 6
}

export interface PhotographerEquipment {
  id: string;
  photographerId: string;
  category: EquipmentCategory;
  name: string;
  description?: string;
  isPrimary: boolean;
}

export interface PhotographerProfile {
  id:                 string;
  displayName:        string;
  phone:              string;
  email:              string;
  region:             string;
  nationalId?:        string;
  personalAddress?:   string;
  verificationDocumentFrontUrl?: string;
  verificationDocumentBackUrl?:  string;
  verificationPortraitUrl?:      string;
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
  portfolioPhotos:    string[];
  acceptsInstantBooking: boolean;
  equipments: PhotographerEquipment[];
}

export interface PBooking {
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
  customerName?:  string;
  customerAvatarUrl?: string;
  servicePackageName?: string;
  servicePackageImageUrl?: string;
}

export async function getPhotographerProfile(): Promise<PhotographerProfile | null> {
  const data = await gql<{ photographerProfile: PhotographerProfile | null }>(`
    query { photographerProfile {
      id displayName phone email region
      nationalId personalAddress
      verificationDocumentFrontUrl verificationDocumentBackUrl verificationPortraitUrl
      bio quote avatarUrl coverPhotoUrl instagramUrl
      minBudget maxBudget rating isPremium isAvailable verificationStatus portfolioPhotos acceptsInstantBooking
      equipments {
        id
        category
        name
        description
        isPrimary
      }
    }}
  `);
  return data.photographerProfile;
}

export async function updateProfile(payload: Partial<PhotographerProfile>) {
  await apiClient.put('/api/photographers/profile', payload);
}

export async function updateEquipments(equipments: Omit<PhotographerEquipment, 'photographerId'>[]) {
  await apiClient.put('/api/photographers/equipments', { equipments });
}

export async function updatePersonalInfo(payload: {
  nationalId?: string;
  phone?: string;
  email?: string;
  region?: string;
  personalAddress?: string;
  verificationDocumentFrontUrl?: string;
  verificationDocumentBackUrl?: string;
  verificationPortraitUrl?: string;
}) {
  await apiClient.put('/api/photographers/personal-info', payload);
}

export async function uploadProfileImage(uri: string, mimeType: string, kind: 'avatar' | 'cover') {
  const ext = mimeType?.split('/')[1] || 'jpg';
  let filename = uri.split('/').pop() ?? `${kind}_${Date.now()}.${ext}`;
  if (!filename.includes('.')) {
    filename = `${filename}.${ext}`;
  }

  const form = new FormData();
  await appendFileToFormData(form, 'file', uri, filename, mimeType ?? 'image/jpeg');

  const endpoint = kind === 'avatar'
    ? '/api/photographers/profile/avatar/upload'
    : '/api/photographers/profile/cover/upload';

  const { data } = await apiClient.post<{ photoUrl: string }>(endpoint, form, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });

  return data.photoUrl;
}

export async function setAvailability(isAvailable: boolean) {
  await apiClient.patch('/api/photographers/availability', { isAvailable });
}

export async function getAvailability(): Promise<PhotographerAvailabilitySlot[]> {
  try {
    const { data } = await apiClient.get<PhotographerAvailabilitySlot[]>('/api/photographers/availability');
    return data ?? [];
  } catch {
    return [];
  }
}

export async function blockAvailability(
  specificDate: string,
  slots: PhotographerAvailabilitySlot[],
): Promise<void> {
  await apiClient.post('/api/photographers/availability/block', {
    specificDate,
    slots,
  });
}

export async function unblockAvailability(
  specificDate: string,
  slots: PhotographerAvailabilitySlot[],
): Promise<void> {
  await apiClient.post('/api/photographers/availability/unblock', {
    specificDate,
    slots,
  });
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

export async function getMyBookingsAsPhotographer(): Promise<PBooking[]> {
  const data = await gql<{ myBookingsAsPhotographer: PBooking[] }>(`
    query { myBookingsAsPhotographer {
      id customerId photographerId matchId status agreedPrice commission scheduledAt createdAt phone location note requirements servicePackageId customerName customerAvatarUrl servicePackageName servicePackageImageUrl
    }}
  `);
  return (data.myBookingsAsPhotographer ?? []).map((b) => ({
    ...b,
    status: normalizeStatus(b.status),
  }));
}

export async function confirmBooking(id: string) {
  await apiClient.post(`/api/bookings/${id}/confirm`);
}

export async function completeBooking(id: string) {
  await apiClient.post(`/api/bookings/${id}/complete`);
}

export async function cancelBooking(id: string, reason: string) {
  await apiClient.post(`/api/bookings/${id}/cancel`, { reason });
}

export async function updateBookingSessionStatus(id: string, status: 'Moving' | 'Arrived' | 'InProgress') {
  await apiClient.put(`/api/bookings/${id}/session-status`, { status });
}

export async function submitVerification() {
  await apiClient.post('/api/photographers/verify');
}

export async function getPortfolioPhotos(): Promise<string[]> {
  const { data } = await apiClient.get<{ photos: string[] }>('/api/photographers/portfolio');
  return data.photos ?? [];
}

/** Upload a portfolio photo. Returns the public Supabase URL. */
export async function uploadPortfolioPhoto(uri: string, mimeType: string): Promise<string> {
  const ext = mimeType?.split('/')[1] || 'jpg';
  let filename = uri.split('/').pop() ?? `photo_${Date.now()}.${ext}`;
  if (!filename.includes('.')) {
    filename = `${filename}.${ext}`;
  }

  const form = new FormData();
  await appendFileToFormData(form, 'file', uri, filename, mimeType ?? 'image/jpeg');

  const { data } = await apiClient.post<{ photoUrl: string }>(
    '/api/photographers/portfolio/upload',
    form,
    { headers: { 'Content-Type': 'multipart/form-data' } },
  );
  return data.photoUrl;
}

export async function uploadServicePackageMedia(uri: string, mimeType: string): Promise<string> {
  const ext = mimeType?.split('/')[1] || 'jpg';
  let filename = uri.split('/').pop() ?? `package_${Date.now()}.${ext}`;
  if (!filename.includes('.')) {
    filename = `${filename}.${ext}`;
  }

  const form = new FormData();
  await appendFileToFormData(form, 'file', uri, filename, mimeType ?? 'image/jpeg');

  const { data } = await apiClient.post<{ photoUrl: string }>(
    '/api/photographers/service-packages/media/upload',
    form,
    { headers: { 'Content-Type': 'multipart/form-data' } },
  );
  return data.photoUrl;
}

/** Delete a portfolio photo by its Supabase public URL. */
export async function deletePortfolioPhoto(photoUrl: string): Promise<void> {
  await apiClient.delete('/api/photographers/portfolio', { data: { photoUrl } });
}

export interface ServicePackageMedia {
  id?: string;
  servicePackageId?: string;
  imageUrl: string;
  sortOrder: number;
}

export interface ServicePackage {
  id: string;
  photographerId: string;
  title: string;
  subtitle: string;
  description: string;
  heroTitle: string;
  heroSubtitle: string;
  callToAction: string;
  price: number;
  durationHours: number;
  isActive: boolean;
  createdAt?: string;
  updatedAt?: string;
  media: ServicePackageMedia[];
}

export async function getMyServicePackages(): Promise<ServicePackage[]> {
  try {
    const { data } = await apiClient.get<ServicePackage[]>('/api/photographers/service-packages');
    return data ?? [];
  } catch {
    return [];
  }
}

export async function saveServicePackage(payload: any): Promise<ServicePackage> {
  if (payload.id) {
    const { data } = await apiClient.put<ServicePackage>(`/api/photographers/service-packages/${payload.id}`, payload);
    return data;
  } else {
    const { data } = await apiClient.post<ServicePackage>('/api/photographers/service-packages', payload);
    return data;
  }
}

export async function deleteServicePackage(id: string): Promise<void> {
  await apiClient.delete(`/api/photographers/service-packages/${id}`);
}

export async function getMyReviewsReceived(): Promise<any[]> {
  const data = await gql<{ myReviewsReceived: any[] }>(`
    query { myReviewsReceived {
      id bookingId rating comment createdAt authorName authorAvatarUrl
    }}
  `);
  return data.myReviewsReceived ?? [];
}

export async function proposeStyle(name: string, description: string, keywords: string): Promise<any> {
  const { data } = await apiClient.post('/api/photographers/styles/propose', {
    name,
    description,
    keywords,
  });
  return data;
}

export async function proposeConcept(name: string, description: string, keywords: string): Promise<any> {
  const { data } = await apiClient.post('/api/photographers/concepts/propose', {
    name,
    description,
    keywords,
  });
  return data;
}

export interface Style {
  id: string;
  name: string;
  description: string;
  keywords: string;
  status: string;
}

export interface Concept {
  id: string;
  name: string;
  description: string;
  keywords: string;
  status: string;
}

export interface DetailedPortfolioPhoto {
  id: string;
  photographerId: string;
  imageUrl: string;
  thumbnailUrl: string;
  displayOrder: number;
  isIndexed: boolean;
  dominantColors: string;
  createdAt: string;
  styles: Style[];
  concepts: Concept[];
}

export async function getMyDetailedPortfolioPhotos(): Promise<DetailedPortfolioPhoto[]> {
  const data = await gql<{ myPortfolioPhotos: DetailedPortfolioPhoto[] }>(`
    query {
      myPortfolioPhotos {
        id
        photographerId
        imageUrl
        thumbnailUrl
        displayOrder
        isIndexed
        dominantColors
        createdAt
        styles {
          id
          name
          description
          keywords
          status
        }
        concepts {
          id
          name
          description
          keywords
          status
        }
      }
    }
  `);
  return data.myPortfolioPhotos ?? [];
}

export async function getActiveStylesAndConcepts(): Promise<{ styles: Style[]; concepts: Concept[] }> {
  const data = await gql<{ styles: Style[]; concepts: Concept[] }>(`
    query {
      styles(status: "Approved") {
        id
        name
        description
        keywords
        status
      }
      concepts(status: "Approved") {
        id
        name
        description
        keywords
        status
      }
    }
  `);
  return {
    styles: data.styles ?? [],
    concepts: data.concepts ?? [],
  };
}

export async function updatePortfolioPhotoTags(
  photoId: string,
  styleIds: string[],
  conceptIds: string[]
): Promise<void> {
  await apiClient.put(`/api/photographers/portfolio/photos/${photoId}/tags`, {
    styleIds,
    conceptIds,
  });
}

