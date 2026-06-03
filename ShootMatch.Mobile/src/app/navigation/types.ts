export type AuthStackParamList = {
  Splash:      undefined;
  RoleSelect:  undefined;
  AuthMethod:  { role: 'customer' | 'photographer' };
  PhoneLogin:  { role: 'customer' | 'photographer' };
  OtpVerify:   { phone: string; role: string };
  Register:    { role: 'customer' | 'photographer' };
  EmailLogin:  { role: 'customer' | 'photographer' };
};

export type CustomerTabParamList = {
  Home:       undefined;
  Discover:   undefined;
  Chat:       undefined;
  Bookings:   undefined;
  Profile:    undefined;
};

export type PhotographerTabParamList = {
  Dashboard:  undefined;
  PBookings:  undefined;
  PChat:      undefined;
  Portfolio:  undefined;
  PProfile:   undefined;
};

export type CustomerStackParamList = {
  CustomerRoot: undefined;
  PhotographerProfile: { id: string };
  PhotographerPortfolio: { photographerId: string; initialIndex?: number };
  PhotographerServicePackages: { photographer: any; packages: any[] };
  Checkout: { photographer: any; matchId?: string; packageId?: string; packages?: any[] };
  BookingSuccess: undefined;
  BookingDetail: { bookingId: string };
  Notifications: undefined;
  EditProfile: undefined;
  CustomerFavorites: undefined;
  CustomerSharedMedia: undefined;
  Chat: { conversationId: string; name: string };
  Call: {
    conversationId: string;
    callSessionId?: string;
    callType: 'audio' | 'video';
    role: 'caller' | 'callee';
    name: string;
    avatarUrl?: string;
  };
};

export type PhotographerStackParamList = {
  PhotographerRoot: undefined;
  Chat: { conversationId: string; name: string };
  ServiceManagement: undefined;
  BookingCalendar: undefined;
  PersonalInfo: undefined;
  Call: {
    conversationId: string;
    callSessionId?: string;
    callType: 'audio' | 'video';
    role: 'caller' | 'callee';
    name: string;
    avatarUrl?: string;
  };
};

