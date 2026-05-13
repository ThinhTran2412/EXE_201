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

export type PhotographerStackParamList = {
  PhotographerRoot: undefined;
  Chat: undefined;
  ServiceManagement: undefined;
  BookingCalendar: undefined;
};
