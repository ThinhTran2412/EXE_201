import { apiClient } from '../../shared/api/client';
import { gql } from '../../shared/api/graphql';

export interface PhotographerProfile {
  id:                 string;
  displayName:        string;
  phone:              string;
  email:              string;
  region:             string;
  personalAddress?: string;
  nationalId?:        string;
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
  verificationDocumentFrontUrl?: string;
  verificationDocumentBackUrl?: string;
  verificationPortraitUrl?: string;
}

export interface PBooking {
  id:             string;
  customerId:     string;
  matchId:        string;
  status:         string;
  agreedPrice:    number;
  commission:     number;
  scheduledAt:    string;
  createdAt:      string;
  cancellationReason?: string;
}

export async function getPhotographerProfile(): Promise<PhotographerProfile | null> {
  const data = await gql<{ photographerProfile: PhotographerProfile | null }>(`
    query { photographerProfile {
      id displayName phone email region bio quote avatarUrl coverPhotoUrl instagramUrl
      minBudget maxBudget rating isPremium isAvailable verificationStatus portfolioPhotos acceptsInstantBooking
      nationalId personalAddress
      verificationDocumentFrontUrl verificationDocumentBackUrl verificationPortraitUrl
    }}
  `);
  return data.photographerProfile;
}

export async function updateProfile(payload: Partial<PhotographerProfile>) {
  await apiClient.put('/api/photographers/profile', payload);
}

export async function updatePersonalInfo(payload: {
  nationalId?: string;
  phone?: string;
  email?: string;
  personalAddress?: string;
  verificationDocumentFrontUrl?: string;
  verificationDocumentBackUrl?: string;
  verificationPortraitUrl?: string;
}) {
  await apiClient.put('/api/photographers/personal-info', payload);
}

export async function uploadProfileImage(uri: string, mimeType: string, kind: 'avatar' | 'cover') {
  const filename = uri.split('/').pop() ?? `${kind}_${Date.now()}.jpg`;
  const form = new FormData();
  form.append('file', {
    uri,
    name: filename,
    type: mimeType ?? 'image/jpeg',
  } as any);

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

export async function getMyBookingsAsPhotographer(): Promise<PBooking[]> {
  const data = await gql<{ myBookingsAsPhotographer: PBooking[] }>(`
    query { myBookingsAsPhotographer {
      id customerId matchId status agreedPrice commission scheduledAt createdAt
    }}
  `);
  return data.myBookingsAsPhotographer ?? [];
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

export async function submitVerification() {
  await apiClient.post('/api/photographers/verify');
}

export async function getPortfolioPhotos(): Promise<string[]> {
  const { data } = await apiClient.get<{ photos: string[] }>('/api/photographers/portfolio');
  return data.photos ?? [];
}

/** Upload a portfolio photo. Returns the public Supabase URL. */
export async function uploadPortfolioPhoto(uri: string, mimeType: string): Promise<string> {
  const filename = uri.split('/').pop() ?? `photo_${Date.now()}.jpg`;

  const form = new FormData();
  form.append('file', {
    uri,
    name: filename,
    type: mimeType ?? 'image/jpeg',
  } as any);

  const { data } = await apiClient.post<{ photoUrl: string }>(
    '/api/photographers/portfolio/upload',
    form,
    { headers: { 'Content-Type': 'multipart/form-data' } },
  );
  return data.photoUrl;
}

/** Delete a portfolio photo by its Supabase public URL. */
export async function deletePortfolioPhoto(photoUrl: string): Promise<void> {
  await apiClient.delete('/api/photographers/portfolio', { data: { photoUrl } });
}
