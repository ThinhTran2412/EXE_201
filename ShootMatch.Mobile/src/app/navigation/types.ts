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
  Search: undefined;
  PhotographerProfile: { id: string };
  PhotographerPortfolio: { photographerId: string; initialIndex?: number };
  PhotographerServicePackages: { photographer: any; packages: any[] };
  Checkout: { photographer: any; matchId?: string; packageId?: string; packages?: any[] };
  BookingSuccess: {
    photographerId: string;
    photographerName: string;
    packageName: string;
    dateDisplay: string;
    price: number;
    commission: number;
    total: number;
    location: string;
    phone: string;
  };
  BookingDetail: { booking: any };
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
  CustomerProfile: { customerId: string; customerName?: string };
  Call: {
    conversationId: string;
    callSessionId?: string;
    callType: 'audio' | 'video';
    role: 'caller' | 'callee';
    name: string;
    avatarUrl?: string;
  };
};

