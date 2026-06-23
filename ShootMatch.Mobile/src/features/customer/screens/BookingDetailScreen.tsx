import React, { useState, useEffect, useRef } from 'react';
import {
  ScrollView, StyleSheet, Text, View, Pressable, Alert, TextInput, ActivityIndicator, Image, TouchableOpacity, Platform, Linking, Modal, Animated as RNAnimated
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, { FadeInDown, FadeInUp, useSharedValue, useAnimatedStyle, withRepeat, withTiming, useAnimatedProps } from 'react-native-reanimated';
import { Ionicons, Feather } from '@expo/vector-icons';
import { useNavigation, useRoute } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import { 
  cancelBooking, 
  submitReview, 
  getPhotographer, 
  getPhotographerServicePackages, 
  Booking, 
  Photographer, 
  createPaymentLink, 
  getMyBookings,
  confirmBooking,
  completeBooking,
  updateBookingSessionStatus,
  getCustomerById,
  getMyReviews,
  getPhotographerReviews,
  Review
} from '../api';
import { getMyBookingsAsPhotographer } from '../../photographer/api';
import * as ChatHub from '../../chat/ChatHub';
import * as LocationHub from '../../chat/LocationHub';
import * as Location from 'expo-location';
import MapView, { Marker, Circle } from 'react-native-maps';
const AnimatedCircle = Animated.createAnimatedComponent(Circle);

function AnimatedCircleComponent({
  center,
  color,
}: {
  center: { latitude: number; longitude: number };
  color: string;
}) {
  const zoneColor = color || '#2563eb';
  const [pulseRadius, setPulseRadius] = useState(6);

  useEffect(() => {
    const startTime = Date.now();
    const duration = 6000; // Ultra slow 6-second cycle

    const interval = setInterval(() => {
      const elapsed = (Date.now() - startTime) % duration;
      const progress = elapsed / duration;
      setPulseRadius(6 + progress * 6);
    }, 35); // 35ms = ~30fps for smooth rendering on all devices

    return () => clearInterval(interval);
  }, []);

  const r = pulseRadius;

  return (
    <>
      {/* 1. Static soft base zone */}
      <Circle
        center={center}
        radius={10}
        fillColor={zoneColor + '18'}
        strokeColor={zoneColor + '30'}
        strokeWidth={1}
      />
      {/* 2. Ultra-slow subtle outer wave */}
      <Circle
        center={center}
        radius={r}
        fillColor="transparent"
        strokeColor={zoneColor + '40'}
        strokeWidth={0.8}
      />
    </>
  );
}
import { useAuth } from '../../auth/AuthContext';
import { ClayCard } from '../../../shared/components/ClayCard';
import { ClayButton } from '../../../shared/components/ClayButton';
import PortfolioImageCell from '../../../shared/components/PortfolioImageCell';
import { PayOsCheckoutModal } from '../../../shared/components/PayOsCheckoutModal';
import { formatImageUrl } from '../../../shared/utils/formatImageUrl';
import { colors } from '../../../app/theme/colors';
import { usePhotographerTheme } from '../../photographer/PhotographerThemeContext';
import { fontSizes, fontWeights } from '../../../app/theme/typography';
import { radius, spacing } from '../../../app/theme/spacing';

const STATUS_CFG: Record<string, { label: string; color: string; bgColor: string; icon: string }> = {
  Pending:    { label: 'Chờ xác nhận', color: '#b88d14', bgColor: '#fef9e7', icon: 'time' },
  AwaitingDeposit: { label: 'Chờ cọc', color: '#ea580c', bgColor: '#fff7ed', icon: 'wallet' },
  Processing: { label: 'Đang xử lý',    color: '#b88d14', bgColor: '#fef9e7', icon: 'sync' },
  Confirmed:  { label: 'Đã xác nhận', color: '#1d4ed8', bgColor: '#eef2ff', icon: 'checkmark-circle' },
  Moving:     { label: 'Đang di chuyển', color: '#8b5cf6', bgColor: '#f5f3ff', icon: 'bicycle' },
  Arrived:    { label: 'Đã đến nơi', color: '#10b981', bgColor: '#ecfdf5', icon: 'flag' },
  InProgress: { label: 'Đang chụp', color: '#3b82f6', bgColor: '#eff6ff', icon: 'camera' },
  Completed:  { label: 'Hoàn thành',  color: '#15803d', bgColor: '#f0fdf4', icon: 'checkmark-done-circle' },
  Cancelled:  { label: 'Đã hủy',      color: '#cf4028', bgColor: '#fef2f2', icon: 'close-circle' },
  Disputed:   { label: 'Tranh chấp',  color: '#e07b39', bgColor: '#fff7ed', icon: 'warning' },
};

const STATUS_CFG_DARK: Record<string, { label: string; color: string; bgColor: string; icon: string }> = {
  Pending:    { label: 'Chờ xác nhận', color: '#ffd666', bgColor: 'rgba(255, 214, 102, 0.15)', icon: 'time' },
  AwaitingDeposit: { label: 'Chờ cọc', color: '#fbd38d', bgColor: 'rgba(251, 211, 141, 0.15)', icon: 'wallet' },
  Processing: { label: 'Đang xử lý',    color: '#ffd666', bgColor: 'rgba(255, 214, 102, 0.15)', icon: 'sync' },
  Confirmed:  { label: 'Đã xác nhận', color: '#63b3ed', bgColor: 'rgba(99, 179, 237, 0.15)', icon: 'checkmark-circle' },
  Moving:     { label: 'Đang di chuyển', color: '#a78bfa', bgColor: 'rgba(139, 92, 246, 0.15)', icon: 'bicycle' },
  Arrived:    { label: 'Đã đến nơi', color: '#34d399', bgColor: 'rgba(16, 185, 129, 0.15)', icon: 'flag' },
  InProgress: { label: 'Đang chụp', color: '#60a5fa', bgColor: 'rgba(59, 130, 246, 0.15)', icon: 'camera' },
  Completed:  { label: 'Hoàn thành',  color: '#81e6d9', bgColor: 'rgba(129, 230, 217, 0.15)', icon: 'checkmark-done-circle' },
  Cancelled:  { label: 'Đã hủy',      color: '#feb2b2', bgColor: 'rgba(254, 178, 178, 0.15)', icon: 'close-circle' },
  Disputed:   { label: 'Tranh chấp',  color: '#fbd38d', bgColor: 'rgba(251, 211, 141, 0.15)', icon: 'warning' },
};

function splitTags(value: string) {
  return value
    .split(/[,\n]+/)
    .map((tag) => tag.trim())
    .filter(Boolean)
    .filter((tag, index, arr) => arr.indexOf(tag) === index)
    .slice(0, 12);
}

function splitDescriptionSections(text: string) {
  const getPart = (key: string) => {
    const match = text.match(new RegExp(`(?:^|\\n)${key}\\s*([\\s\\S]*?)(?=\\n(?:Mô tả chi tiết:|Tag ảnh:|Features:|Yêu cầu buổi chụp:)|$)`, 'i'));
    return match ? match[1].trim() : '';
  };
  const tagsStr = getPart('Tag ảnh:');
  return {
    description: getPart('Mô tả chi tiết:') || (!text.includes('Mô tả chi tiết:') ? text.split('\n')[0] : ''),
    tags: tagsStr,
    features: getPart('Features:'),
    requirements: getPart('Yêu cầu buổi chụp:'),
  };
}

function getArtisticConcept(bookingId: string) {
  let hash = 0;
  for (let i = 0; i < bookingId.length; i++) {
    hash = bookingId.charCodeAt(i) + ((hash << 5) - hash);
  }
  const index = Math.abs(hash) % 4;

  const concepts = [
    {
      title: 'Chân dung tối giản & Đương đại',
      tips: 'Mặc trang phục đơn sắc (trắng, đen, be). Trang điểm tự nhiên nhẹ nhàng.',
      mood: 'Tập trung bắt trọn cảm xúc tự nhiên, góc máy cận cảnh nghệ thuật.'
    },
    {
      title: 'Hoàng hôn ngoại cảnh thơ màng',
      tips: 'Lựa chọn trang phục chất liệu bay bổng, tông màu pastel hoặc ấm.',
      mood: 'Khung giờ vàng (Golden Hour), hiệu ứng ánh sáng điện ảnh mơ màng.'
    },
    {
      title: 'Thời trang Đường phố cá tính',
      tips: 'Chuẩn bị trang phục năng động, phá cách (Jeans, Blazer, Jacket tối giản).',
      mood: 'Bắt trọn chuyển động ngẫu hứng trên phố, phong cách hiện đại.'
    },
    {
      title: 'Khoảnh khắc gia đình ấm áp',
      tips: 'Phối đồ đồng điệu màu sắc giữa các thành viên, tránh hoạ tiết cầu kỳ.',
      mood: 'Ấm cúng, tự nhiên, tập trung vào sự kết nối gia đình ngọt ngào.'
    }
  ];

  return concepts[index];
}

function StarRow({ value, onChange }: { value: number; onChange: (v: number) => void }) {
  const { isDark, colors: pColors } = usePhotographerTheme();
  return (
    <View style={styles.starRow}>
      {[1, 2, 3, 4, 5].map((s) => (
        <Pressable key={s} onPress={() => onChange(s)}>
          <Ionicons
            name={s <= value ? 'star' : 'star-outline'}
            size={32}
            color={s <= value ? '#f4c430' : (isDark ? pColors.textLight : colors.textLight)}
          />
        </Pressable>
      ))}
    </View>
  );
}

function getDistance(lat1: number, lon1: number, lat2: number, lon2: number) {
  const R = 6371e3; // metres
  const phi1 = (lat1 * Math.PI) / 180;
  const phi2 = (lat2 * Math.PI) / 180;
  const deltaPhi = ((lat2 - lat1) * Math.PI) / 180;
  const deltaLambda = ((lon2 - lon1) * Math.PI) / 180;

  const a = Math.sin(deltaPhi / 2) * Math.sin(deltaPhi / 2) +
            Math.cos(phi1) * Math.cos(phi2) *
            Math.sin(deltaLambda / 2) * Math.sin(deltaLambda / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c; // in metres
}

function getDistanceText(
  loc1: { latitude: number; longitude: number },
  loc2: { latitude: number; longitude: number },
  prefix: string
) {
  const dist = getDistance(loc1.latitude, loc1.longitude, loc2.latitude, loc2.longitude);
  return dist < 1000 ? `${prefix}: ${Math.round(dist)}m` : `${prefix}: ${(dist / 1000).toFixed(1)}km`;
}

function PulsingMarker({
  isPhotographerRole,
}: {
  avatarUrl?: string;
  isPhotographerRole: boolean;
  name: string;
  distanceText?: string;
  isMe: boolean;
  onReady?: () => void;
}) {
  const neonColor = isPhotographerRole ? '#c084fc' : '#22d3ee';
  const bgColor   = isPhotographerRole ? '#2d1b69' : '#0c2461';
  const iconSrc   = isPhotographerRole
    ? require('../../../../assets/photographer.png')
    : require('../../../../assets/user-profile.png');

  return (
    <Image
      source={iconSrc}
      style={{
        width: 34,
        height: 34,
        borderRadius: 17,
        backgroundColor: bgColor,
        borderWidth: 2,
        borderColor: neonColor,
      }}
      resizeMode="center"
    />
  );
}

export default function BookingDetailScreen() {
  const { isDark, colors: pColors } = usePhotographerTheme();
  const navigation = useNavigation<any>();
  const route      = useRoute<any>();
  const insets     = useSafeAreaInsets();
  const { booking: initialBooking } = route.params as { booking: Booking };
  const [booking, setBooking] = useState<Booking>(initialBooking);

  const [photographer, setPhotographer] = useState<Photographer | null>(null);
  const [packages, setPackages] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const [packageExpanded, setPackageExpanded] = useState(false);
  const [infoExpanded, setInfoExpanded] = useState(false);
  const [rating,         setRating]         = useState(5);
  const [comment,        setComment]        = useState('');
  const [submittingRev,  setSubmittingRev]  = useState(false);
  const [reviewDone,     setReviewDone]     = useState(false);
  const [existingReview, setExistingReview] = useState<Review | null>(null);
  const [cancelling,     setCancelling]     = useState(false);
  const [payModalVisible, setPayModalVisible] = useState(false);
  const [checkoutUrl, setCheckoutUrl] = useState<string | null>(null);
  const [creatingLink, setCreatingLink] = useState(false);

  const { session } = useAuth();
  const userRole = session?.role;
  const isPhotographer = userRole === 'photographer';

  const [photographerLocation, setPhotographerLocation] = useState<{ latitude: number; longitude: number } | null>(null);
  const [customerLocation, setCustomerLocation] = useState<{ latitude: number; longitude: number } | null>(null);
  const [meetingLocation, setMeetingLocation] = useState<{ latitude: number; longitude: number } | null>(null);
  const [mapFullScreen, setMapFullScreen] = useState(false);
  const [elapsedTime, setElapsedTime] = useState(0);
  const [updatingStatus, setUpdatingStatus] = useState(false);
  const [hasPromptedArrived, setHasPromptedArrived] = useState(false);
  const [customerProfile, setCustomerProfile] = useState<any>(null);
  const [tracksViewChanges, setTracksViewChanges] = useState(true);

  // Turn off tracksViewChanges after 2.5s to completely eliminate map rendering lag
  useEffect(() => {
    if (photographerLocation || customerLocation) {
      const timer = setTimeout(() => {
        setTracksViewChanges(false);
      }, 2500);
      return () => clearTimeout(timer);
    }
  }, [photographerLocation, customerLocation]);

  const mapRef = useRef<MapView>(null);
  const fullScreenMapRef = useRef<MapView>(null);

  const centerOnMyLocation = (isFullScreen: boolean) => {
    const ref = isFullScreen ? fullScreenMapRef : mapRef;
    const myLoc = isPhotographer ? photographerLocation : customerLocation;
    const otherLoc = isPhotographer ? customerLocation : photographerLocation;
    const targetLoc = myLoc || otherLoc || meetingLocation || { latitude: 10.7769, longitude: 106.7009 };

    if (ref.current) {
      ref.current.animateToRegion({
        latitude: targetLoc.latitude,
        longitude: targetLoc.longitude,
        latitudeDelta: 0.005,
        longitudeDelta: 0.005,
      }, 1000);
    } else {
      Alert.alert('Định vị', 'Không thể khởi tạo bản đồ để định vị.');
    }
  };

  async function loadData() {
    try {
      const isPhoto = session?.role === 'photographer';
      const [p, pkgs, allBookings, cProfile] = await Promise.all([
        getPhotographer(initialBooking.photographerId),
        getPhotographerServicePackages(initialBooking.photographerId),
        isPhoto ? getMyBookingsAsPhotographer() : getMyBookings(),
        getCustomerById(initialBooking.customerId).catch(() => null),
      ]);
      if (p) setPhotographer(p);
      if (pkgs) setPackages(pkgs);
      if (cProfile) setCustomerProfile(cProfile);

      const currentBooking = allBookings.find((b: any) => b.id?.toLowerCase() === initialBooking.id?.toLowerCase());
      if (currentBooking) {
        setBooking(currentBooking);
        
        if (currentBooking.status === 'Completed') {
          try {
            if (isPhoto) {
              const revs = await getPhotographerReviews(initialBooking.photographerId);
              const matchRev = revs.find((r: any) => r.bookingId?.toLowerCase() === initialBooking.id?.toLowerCase());
              if (matchRev) {
                setExistingReview(matchRev);
                setReviewDone(true);
              }
            } else {
              const revs = await getMyReviews();
              const matchRev = revs.find((r: any) => r.bookingId?.toLowerCase() === initialBooking.id?.toLowerCase());
              if (matchRev) {
                setExistingReview(matchRev);
                setReviewDone(true);
              }
            }
          } catch (revErr) {
            console.log('Error checking existing review:', revErr);
          }
        }
      }
    } catch (err) {
      console.log('Error loading booking detail screen data:', err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadData();
  }, [initialBooking.id, initialBooking.photographerId]);

  useEffect(() => {
    const cleanup = ChatHub.onReceiveNotification((incoming) => {
      let payload: any = null;
      try {
        payload = incoming.payloadJson ? JSON.parse(incoming.payloadJson) : null;
      } catch (e) {
        console.log('Error parsing notification payload in DetailScreen', e);
      }
      if (payload && payload.bookingId?.toLowerCase() === booking.id?.toLowerCase()) {
        loadData();
      }
    });
    return () => {
      cleanup();
    };
  }, [booking.id]);

  // Connect to LocationHub and watch position or listen
  useEffect(() => {
    let activeWatcher: Location.LocationSubscription | null = null;
    let unsubLocReceive: (() => void) | null = null;

    const startTracking = async () => {
      try {
        await LocationHub.connect();
        await LocationHub.joinSession(booking.id);

        // Request permission on both sides
        const { status } = await Location.requestForegroundPermissionsAsync();
        const hasPermission = status === 'granted';
        if (!hasPermission) {
          Alert.alert(
            'Quyền định vị',
            'Ứng dụng cần quyền định vị để hiển thị vị trí của bạn trên bản đồ. Vui lòng cấp quyền trong Cài đặt thiết bị.'
          );
        }

        // Listen for the other person's location updates
        unsubLocReceive = LocationHub.onReceiveLocation((data) => {
          if (data.bookingId?.toLowerCase() === booking.id?.toLowerCase()) {
            if (data.role === 'customer') {
              setCustomerLocation({ latitude: data.latitude, longitude: data.longitude });
            } else if (data.role === 'photographer') {
              setPhotographerLocation({ latitude: data.latitude, longitude: data.longitude });
              setMeetingLocation((currentMeeting) => {
                if (!currentMeeting) {
                  return {
                    latitude: data.latitude + 0.0015,
                    longitude: data.longitude + 0.0015
                  };
                }
                return currentMeeting;
              });
            }
          }
        });

        // Watch and broadcast own location
        if (hasPermission) {
          let lat: number | null = null;
          let lng: number | null = null;

          try {
            // Non-blocking quick check
            const lastKnown = await Location.getLastKnownPositionAsync({});
            if (lastKnown) {
              lat = lastKnown.coords.latitude;
              lng = lastKnown.coords.longitude;
            } else {
              const current = await Location.getCurrentPositionAsync({
                accuracy: Location.Accuracy.Balanced,
              });
              lat = current.coords.latitude;
              lng = current.coords.longitude;
            }
          } catch (e) {
            console.warn("Failed to get initial position, using mock fallback for testing:", e);
            // Default fallback to Ho Chi Minh City center (District 1)
            lat = 10.7769;
            lng = 106.7009;
          }

          if (lat !== null && lng !== null) {
            if (isPhotographer) {
              setPhotographerLocation({ latitude: lat, longitude: lng });
              if (!meetingLocation) {
                setMeetingLocation({
                  latitude: lat + 0.0010,
                  longitude: lng + 0.0010
                });
              }
              await LocationHub.updateLocation(booking.id, lat, lng);

              // Timeout fallback for preview/testing customer marker if socket is inactive
              setTimeout(() => {
                setCustomerLocation((currentVal) => {
                  if (currentVal === null) {
                    return { latitude: lat - 0.0008, longitude: lng - 0.0006 };
                  }
                  return currentVal;
                });
              }, 3000);
            } else {
              setCustomerLocation({ latitude: lat, longitude: lng });
              setMeetingLocation((currentMeeting) => {
                if (!currentMeeting) {
                  return {
                    latitude: lat + 0.0010,
                    longitude: lng + 0.0010
                  };
                }
                return currentMeeting;
              });
              await LocationHub.updateLocation(booking.id, lat, lng);

              // Timeout fallback for preview/testing photographer marker if socket is inactive
              setTimeout(() => {
                setPhotographerLocation((currentVal) => {
                  if (currentVal === null) {
                    return { latitude: lat + 0.0008, longitude: lng + 0.0006 };
                  }
                  return currentVal;
                });
              }, 3000);
            }
          }

          activeWatcher = await Location.watchPositionAsync(
            {
              accuracy: Location.Accuracy.Balanced,
              timeInterval: 5000,
              distanceInterval: 10,
            },
            (loc) => {
              const currentLat = loc.coords.latitude;
              const currentLng = loc.coords.longitude;

              if (isPhotographer) {
                setPhotographerLocation({ latitude: currentLat, longitude: currentLng });
                LocationHub.updateLocation(booking.id, currentLat, currentLng).catch(console.error);


                setMeetingLocation((currentMeetingLoc) => {
                  if (currentMeetingLoc) {
                    const dist = getDistance(currentLat, currentLng, currentMeetingLoc.latitude, currentMeetingLoc.longitude);
                    if (dist < 50 && !hasPromptedArrived) {
                      setHasPromptedArrived(true);
                      Alert.alert(
                        '📍 Bạn đã đến nơi chụp',
                        'Khoảng cách tới điểm hẹn dưới 50m. Bạn có muốn cập nhật trạng thái thành "Đã đến nơi"?',
                        [
                          { text: 'Bỏ qua', style: 'cancel' },
                          { 
                            text: 'Xác nhận', 
                            onPress: async () => {
                              try {
                                await updateBookingSessionStatus(booking.id, 'Arrived');
                                loadData();
                              } catch (err) {
                                console.log('Failed to auto-arrive:', err);
                              }
                            }
                          }
                        ]
                      );
                    }
                  }
                  return currentMeetingLoc;
                });
              } else {
                setCustomerLocation({ latitude: currentLat, longitude: currentLng });
                setMeetingLocation((currentMeeting) => {
                  if (!currentMeeting) {
                    return {
                      latitude: currentLat + 0.0015,
                      longitude: currentLng + 0.0015
                    };
                  }
                  return currentMeeting;
                });
                LocationHub.updateLocation(booking.id, currentLat, currentLng).catch(console.error);
              }
            }
          );
        }
      } catch (err) {
        console.warn('Error starting location tracking:', err);
      }
    };

    if (booking.status === 'Confirmed' || booking.status === 'Moving' || booking.status === 'Arrived') {
      startTracking();
    }

    return () => {
      if (activeWatcher) {
        try {
          if (typeof activeWatcher.remove === 'function') {
            activeWatcher.remove();
          }
        } catch (e) {
          console.warn('Failed to remove location subscription:', e);
        }
      }
      if (unsubLocReceive) {
        try {
          unsubLocReceive();
        } catch (e) {
          console.warn('Failed to unsubscribe location receiver:', e);
        }
      }
      LocationHub.leaveSession(booking.id).catch(console.error);
    };
  }, [booking.id, booking.status, isPhotographer]);

  // Shooting Session stopwatch timer
  useEffect(() => {
    let interval: any = null;
    if (booking.status === 'InProgress') {
      interval = setInterval(() => {
        setElapsedTime((prev) => prev + 1);
      }, 1000);
    } else {
      setElapsedTime(0);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [booking.status]);

  async function handleStatusTransition(nextStatus: 'Moving' | 'Arrived' | 'InProgress' | 'Completed') {
    setUpdatingStatus(true);
    try {
      if (nextStatus === 'Completed') {
        await completeBooking(booking.id);
      } else {
        await updateBookingSessionStatus(booking.id, nextStatus);
      }
      Alert.alert('Thành công', `Đã cập nhật trạng thái buổi chụp.`);
      loadData();
    } catch (err: any) {
      Alert.alert('Thất bại', err?.response?.data || 'Không thể cập nhật trạng thái.');
    } finally {
      setUpdatingStatus(false);
    }
  }

  const formatTime = (secs: number) => {
    const h = Math.floor(secs / 3600);
    const m = Math.floor((secs % 3600) / 60);
    const s = secs % 60;
    return [
      h > 0 ? String(h).padStart(2, '0') : null,
      String(m).padStart(2, '0'),
      String(s).padStart(2, '0'),
    ].filter(Boolean).join(':');
  };

  const cfg = (isDark ? STATUS_CFG_DARK[booking.status] : STATUS_CFG[booking.status]) ?? (isDark ? STATUS_CFG_DARK.Pending : STATUS_CFG.Pending);
  const canCancel = booking.status === 'Pending' || booking.status === 'AwaitingDeposit' || booking.status === 'Confirmed';
  const canReview = booking.status === 'Completed' && !reviewDone && !isPhotographer;

  async function handleCancel() {
    Alert.alert('Hủy lịch hẹn', 'Bạn chắc chắn muốn hủy lịch hẹn này? Hành động này không thể hoàn tác.', [
      { text: 'Không', style: 'cancel' },
      {
        text: 'Xác nhận hủy',
        style: 'destructive',
        onPress: async () => {
          setCancelling(true);
          try {
            await cancelBooking(booking.id, 'Khách hàng hủy');
            Alert.alert('Đã hủy', 'Lịch hẹn đã được hủy thành công.');
            navigation.goBack();
          } catch { Alert.alert('Lỗi', 'Không thể hủy. Vui lòng thử lại.'); }
          setCancelling(false);
        },
      },
    ]);
  }

  async function handlePayDeposit() {
    setCreatingLink(true);
    try {
      const url = await createPaymentLink(booking.id);
      setCheckoutUrl(url);
      setPayModalVisible(true);
    } catch (err: any) {
      Alert.alert('Lỗi', 'Không thể tạo link thanh toán. Vui lòng thử lại sau.');
      console.log('Payment Link Error', err?.response?.data || err);
    } finally {
      setCreatingLink(false);
    }
  }

  const handleCallPress = () => {
    if (booking.phone) {
      Linking.openURL(`tel:${booking.phone}`).catch(() => {
        Alert.alert('Lỗi', 'Không thể khởi chạy cuộc gọi trên thiết bị này.');
      });
    } else {
      Alert.alert('Thông báo', 'Không có số điện thoại liên kết.');
    }
  };

  async function handleSubmitReview() {
    if (!comment.trim()) { Alert.alert('Thiếu nhận xét', 'Vui lòng để lại nhận xét.'); return; }
    setSubmittingRev(true);
    try {
      await submitReview({ bookingId: booking.id, rating, comment: comment.trim() });
      setReviewDone(true);
      Alert.alert('✅ Cảm ơn!', 'Đánh giá của bạn đã được gửi.');
    } catch { Alert.alert('Lỗi', 'Không gửi được đánh giá.'); }
    setSubmittingRev(false);
  }

  // Find matched package
  const matchedPkg = booking.servicePackageId
    ? packages.find((p) => p.id?.toLowerCase() === booking.servicePackageId?.toLowerCase())
    : null;

  // Fallback concept
  const concept = getArtisticConcept(booking.id);
  const packageTitle = matchedPkg ? matchedPkg.title : concept.title;
  const parsedDesc = matchedPkg ? splitDescriptionSections(matchedPkg.description || '') : null;
  const packageMood = parsedDesc?.description || concept.mood;
  const packageTips = parsedDesc?.requirements || concept.tips;

  // Parse sections for package if matched
  const tags = parsedDesc?.tags ? splitTags(parsedDesc.tags) : [];
  const featureLines = parsedDesc?.features
    ? parsedDesc.features.split('\n').map((l) => l.trim().replace(/^- /, '')).filter(Boolean)
    : [];
  const requirementLines = parsedDesc?.requirements
    ? parsedDesc.requirements.split('\n').map((l) => l.trim().replace(/^- /, '')).filter(Boolean)
    : [];

  const pName = photographer?.displayName ?? 'Nhiếp ảnh gia';
  const pAvatar = formatImageUrl(photographer?.avatarUrl) || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150';
  const pCover = photographer?.coverPhotoUrl
    ? formatImageUrl(photographer.coverPhotoUrl)
    : (photographer?.portfolioPhotos && photographer.portfolioPhotos.length > 0)
      ? formatImageUrl(photographer.portfolioPhotos[0])
      : 'https://images.unsplash.com/photo-1452587925148-ce544e77e70d?w=800';

  const date = new Date(booking.scheduledAt);
  const dayStr = date.getDate();
  const months = ['Tháng 1', 'Tháng 2', 'Tháng 3', 'Tháng 4', 'Tháng 5', 'Tháng 6', 'Tháng 7', 'Tháng 8', 'Tháng 9', 'Tháng 10', 'Tháng 11', 'Tháng 12'];
  const monthStr = months[date.getMonth()];
  const yearStr = date.getFullYear();
  const daysOfWeek = ['Chủ Nhật', 'Thứ Hai', 'Thứ Ba', 'Thứ Tư', 'Thứ Năm', 'Thứ Sáu', 'Thứ Bảy'];
  const dayOfWeekStr = daysOfWeek[date.getDay()];
  
  const dateLongStr = `${dayOfWeekStr}, Ngày ${dayStr} ${monthStr}, ${yearStr}`;
  const timeStr = date.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });

  const renderPackageCard = () => {
    if (!matchedPkg) {
      // Fallback Concept Card
      return (
        <View style={[styles.conceptCard, isDark && { backgroundColor: pColors.surface, borderColor: pColors.borderStrong }]}>
          <View style={styles.conceptHeader}>
            <Ionicons name="sparkles-outline" size={16} color={isDark ? pColors.accent : colors.accent} />
            <Text style={[styles.conceptTitleLabel, isDark && { color: pColors.accent }]}>CONCEPT CHỤP ẢNH</Text>
          </View>
          <Text style={[styles.conceptTitle, isDark && { color: pColors.text }]}>{concept.title}</Text>
          <Text style={[styles.conceptMood, isDark && { color: pColors.textMuted }]}>{concept.mood}</Text>
          
          <View style={[styles.tipsBox, isDark && { backgroundColor: pColors.surfaceStrong, borderColor: pColors.accent }]}>
            <View style={styles.tipsHeader}>
              <Ionicons name="bulb-outline" size={14} color={isDark ? pColors.accent : colors.accent} />
              <Text style={[styles.tipsTitle, isDark && { color: pColors.text }]}>Gợi ý chuẩn bị cho bạn</Text>
            </View>
            <Text style={[styles.tipsText, isDark && { color: pColors.textMuted }]}>{concept.tips}</Text>
          </View>
        </View>
      );
    }

    // Actual Photographer Package Card (Expandable/Collapsible)
    const hasMedia = matchedPkg.media && matchedPkg.media.length > 0;
    
    return (
      <View style={[styles.packageCard, isDark && { backgroundColor: pColors.surface, borderColor: pColors.borderStrong }]}>
        <TouchableOpacity onPress={() => setPackageExpanded(!packageExpanded)} activeOpacity={0.9}>
          {/* Cover Image inside card */}
          <View style={styles.packageCover}>
            {hasMedia ? (
              <Image source={{ uri: formatImageUrl(matchedPkg.media[0].imageUrl) }} style={StyleSheet.absoluteFillObject} resizeMode="cover" />
            ) : (
              <View style={[StyleSheet.absoluteFillObject, { backgroundColor: 'rgba(26,26,15,0.05)', justifyContent: 'center', alignItems: 'center' }]}>
                <Ionicons name="images-outline" size={36} color="rgba(26,26,15,0.2)" />
              </View>
            )}
            <LinearGradient
              colors={['rgba(0,0,0,0.1)', 'transparent', 'rgba(0,0,0,0.8)']}
              locations={[0, 0.4, 1]}
              style={StyleSheet.absoluteFillObject}
            />
            
            <View style={styles.packageCoverContent}>
              <View style={styles.packagePricePill}>
                <Text style={styles.packagePriceText}>{matchedPkg.price?.toLocaleString('vi-VN')} đ</Text>
                <Text style={styles.packagePriceSep}>/</Text>
                <Text style={styles.packagePriceDuration}>{matchedPkg.durationHours}h</Text>
              </View>
              <Text style={styles.packageCoverTitle}>{matchedPkg.title}</Text>
            </View>
          </View>

          {/* Package Body */}
          <View style={styles.packageBody}>
            {tags.length > 0 && (
              <View style={styles.packageTagRow}>
                {tags.map((tag, idx) => (
                  <View key={idx} style={styles.packageTag}>
                    <Text style={[styles.packageTagText, isDark && { color: pColors.accent }]}>#{tag}</Text>
                  </View>
                ))}
              </View>
            )}

            <View style={styles.packageMetaRow}>
              <View style={[styles.packageMetaChip, isDark && { backgroundColor: pColors.surfaceStrong, borderColor: pColors.border }]}>
                <Ionicons name="time-outline" size={12} color={isDark ? pColors.text : colors.dark} />
                <Text style={[styles.packageMetaChipText, isDark && { color: pColors.text }]}>{matchedPkg.durationHours} giờ chụp</Text>
              </View>
              <View style={[styles.packageMetaChip, isDark && { backgroundColor: pColors.surfaceStrong, borderColor: pColors.border }]}>
                <Ionicons name="images-outline" size={12} color={isDark ? pColors.text : colors.dark} />
                <Text style={[styles.packageMetaChipText, isDark && { color: pColors.text }]}>{matchedPkg.media?.length || 0} ảnh mẫu</Text>
              </View>
            </View>

            {/* COLLAPSED STATE */}
            {!packageExpanded && (
              <>
                {!!packageMood && (
                  <Text style={[styles.packageDesc, isDark && { color: pColors.textMuted }]} numberOfLines={2}>
                    {packageMood}
                  </Text>
                )}
                {matchedPkg.media && matchedPkg.media.length > 1 && (
                  <View style={styles.packageThumbStrip}>
                    {matchedPkg.media.slice(1, 5).map((media: any, mi: number) => (
                      <PortfolioImageCell
                        key={media.id ?? mi}
                        uri={media.imageUrl}
                        borderRadius={8}
                        style={styles.packageThumbItem}
                        resizeMode="cover"
                      />
                    ))}
                    {matchedPkg.media.length > 5 && (
                      <View style={[styles.packageThumbMore, isDark && { backgroundColor: pColors.surfaceStrong, borderColor: pColors.border }]}>
                        <Text style={[styles.packageThumbMoreText, isDark && { color: pColors.textMuted }]}>+{matchedPkg.media.length - 5}</Text>
                      </View>
                    )}
                  </View>
                )}
              </>
            )}

            {/* EXPANDED STATE */}
            {packageExpanded && (
              <Animated.View entering={FadeInDown.duration(350)} style={styles.packageExpandedContent}>
                {/* Description */}
                {!!packageMood && (
                  <View style={[styles.packageSection, isDark && { borderTopColor: pColors.border }]}>
                    <View style={styles.packageSectionHeader}>
                      <Ionicons name="document-text-outline" size={13} color={isDark ? pColors.text : colors.dark} />
                      <Text style={[styles.packageSectionTitle, isDark && { color: pColors.text }]}>Mô tả chi tiết</Text>
                    </View>
                    <Text style={[styles.packageSectionBody, isDark && { color: pColors.textMuted }]}>{packageMood}</Text>
                  </View>
                )}

                {/* Features */}
                {featureLines.length > 0 && (
                  <View style={[styles.packageSection, isDark && { borderTopColor: pColors.border }]}>
                    <View style={styles.packageSectionHeader}>
                      <Ionicons name="sparkles-outline" size={13} color={isDark ? pColors.success : colors.success} />
                      <Text style={[styles.packageSectionTitle, { color: isDark ? pColors.success : colors.success }]}>Đặc điểm nổi bật</Text>
                    </View>
                    <View style={styles.packageFeatureList}>
                      {featureLines.map((line, idx) => (
                        <View key={idx} style={styles.packageFeatureItem}>
                          <Ionicons name="checkmark-circle" size={14} color={isDark ? pColors.success : colors.success} style={{ marginTop: 2 }} />
                          <Text style={[styles.packageFeatureText, isDark && { color: pColors.text }]}>{line}</Text>
                        </View>
                      ))}
                    </View>
                  </View>
                )}

                {/* Requirements */}
                {requirementLines.length > 0 && (
                  <View style={[styles.packageSection, isDark && { borderTopColor: pColors.border }]}>
                    <View style={styles.packageSectionHeader}>
                      <Ionicons name="clipboard-outline" size={13} color={isDark ? pColors.info : colors.info} />
                      <Text style={[styles.packageSectionTitle, { color: isDark ? pColors.info : colors.info }]}>Yêu cầu buổi chụp</Text>
                    </View>
                    <View style={styles.packageFeatureList}>
                      {requirementLines.map((line, idx) => (
                        <View key={idx} style={styles.packageFeatureItem}>
                          <Ionicons name="ellipse" size={5} color={isDark ? pColors.info : colors.info} style={{ marginTop: 6 }} />
                          <Text style={[styles.packageFeatureText, { color: isDark ? pColors.textMuted : colors.textMuted }]}>{line}</Text>
                        </View>
                      ))}
                    </View>
                  </View>
                )}

                {/* Sample Photos Grid */}
                {matchedPkg.media && matchedPkg.media.length > 0 && (
                  <View style={[styles.packageSection, isDark && { borderTopColor: pColors.border }]}>
                    <View style={styles.packageSectionHeader}>
                      <Ionicons name="images-outline" size={13} color={isDark ? pColors.text : colors.dark} />
                      <Text style={[styles.packageSectionTitle, isDark && { color: pColors.text }]}>Ảnh mẫu thực tế ({matchedPkg.media.length})</Text>
                    </View>
                    <View style={styles.packagePhotoGrid}>
                      {matchedPkg.media.map((media: any, mi: number) => (
                        <PortfolioImageCell
                          key={media.id ?? mi}
                          uri={media.imageUrl}
                          borderRadius={8}
                          style={styles.packagePhotoItem}
                          resizeMode="cover"
                        />
                      ))}
                    </View>
                  </View>
                )}
              </Animated.View>
            )}

            {/* Toggle Arrow Indicator */}
            <View style={[styles.packageToggleIndicator, isDark && { borderTopColor: pColors.border }]}>
              <Ionicons name={packageExpanded ? 'chevron-up' : 'chevron-down'} size={18} color={isDark ? pColors.textMuted : "rgba(26,26,15,0.4)"} />
              <Text style={[styles.packageToggleText, isDark && { color: pColors.textMuted }]}>
                {packageExpanded ? 'Thu gọn chi tiết' : 'Xem chi tiết gói dịch vụ'}
              </Text>
            </View>
          </View>
        </TouchableOpacity>
      </View>
    );
  };

  const renderLiveSessionCard = () => {
    const isWorking = booking.status === 'Confirmed' || booking.status === 'Moving' || booking.status === 'Arrived' || booking.status === 'InProgress';

    if (!isWorking) return null;

    const showMap = booking.status === 'Confirmed' || booking.status === 'Moving' || booking.status === 'Arrived';

    const defaultLatitude = 21.0285;
    const defaultLongitude = 105.8542;

    const userLocation = isPhotographer ? photographerLocation : customerLocation;
    const centerLatitude = userLocation?.latitude ?? photographerLocation?.latitude ?? customerLocation?.latitude ?? meetingLocation?.latitude ?? defaultLatitude;
    const centerLongitude = userLocation?.longitude ?? photographerLocation?.longitude ?? customerLocation?.longitude ?? meetingLocation?.longitude ?? defaultLongitude;

    const initialRegion = {
      latitude: centerLatitude,
      longitude: centerLongitude,
      latitudeDelta: 0.01,
      longitudeDelta: 0.01,
    };

    return (
      <Animated.View entering={FadeInDown.duration(500).delay(120)}>
        <ClayCard style={[styles.card, { borderColor: isDark ? pColors.accent : colors.accent, borderWidth: 1.5 }, isDark && { backgroundColor: pColors.surface, borderColor: pColors.borderStrong }]}>
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: spacing[3] }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, flex: 1 }}>
              <Ionicons name="location" size={20} color={isDark ? pColors.accent : colors.accent} />
              <Text style={[styles.cardTitle, { marginBottom: 0 }, isDark && { color: pColors.text }]}>Phiên chụp trực tiếp</Text>
            </View>
            {booking.status === 'InProgress' && (
              <View style={[styles.activeIndicator, { backgroundColor: isDark ? 'rgba(59,130,246,0.15)' : '#eff6ff' }]}>
                <View style={styles.pulseDot} />
                <Text style={{ fontSize: 11, fontWeight: '700', color: isDark ? '#60a5fa' : '#2563eb' }}>ON AIR</Text>
              </View>
            )}
          </View>

          {showMap && (
            <>
              <View style={styles.mapWrapper}>
                <View style={styles.mapContainer}>
                  {Platform.OS === 'web' ? (
                    <iframe
                      src={`https://maps.google.com/maps?q=${meetingLocation?.latitude || customerLocation?.latitude || photographerLocation?.latitude || 10.7769},${meetingLocation?.longitude || customerLocation?.longitude || photographerLocation?.longitude || 106.7009}&z=15&output=embed`}
                      style={{ width: '100%', height: '100%', border: 0 }}
                      title="Bản đồ Pickic"
                    />
                  ) : (
                    <MapView
                      ref={mapRef}
                      style={styles.map}
                      initialRegion={initialRegion}
                      key={`map-${booking.id}`}
                    >
                      {photographerLocation && (
                        <>
                          <AnimatedCircleComponent
                            center={photographerLocation}
                            color="#8b5cf6"
                          />
                          <Marker
                            coordinate={photographerLocation}
                            anchor={{ x: 0.5, y: 0.5 }}
                            tracksViewChanges={true}
                            style={{ width: 34, height: 34 }}
                          >
                            <PulsingMarker
                              isPhotographerRole={true}
                              name={pName}
                              isMe={isPhotographer}
                            />
                          </Marker>
                        </>
                      )}

                      {customerLocation && (
                        <>
                          <AnimatedCircleComponent
                            center={customerLocation}
                            color="#1d4ed8"
                          />
                          <Marker
                            coordinate={customerLocation}
                            anchor={{ x: 0.5, y: 0.5 }}
                            tracksViewChanges={true}
                            style={{ width: 34, height: 34 }}
                          >
                            <PulsingMarker
                              isPhotographerRole={false}
                              name={customerProfile?.displayName ?? 'Khách hàng'}
                              isMe={!isPhotographer}
                            />
                          </Marker>
                        </>
                      )}

                      {meetingLocation && (
                        <Marker
                          coordinate={meetingLocation}
                          anchor={{ x: 0.5, y: 1 }}
                          tracksViewChanges={false}
                        >
                          <View style={{
                            width: 36,
                            height: 36,
                            borderRadius: 18,
                            backgroundColor: '#ea580c',
                            borderWidth: 2.5,
                            borderColor: '#ffffff',
                            alignItems: 'center',
                            justifyContent: 'center',
                            shadowColor: '#000',
                            shadowOffset: { width: 0, height: 2 },
                            shadowOpacity: 0.3,
                            shadowRadius: 3,
                            elevation: 5,
                          }}>
                            <Ionicons name="flag" size={18} color="#ffffff" />
                          </View>
                        </Marker>
                      )}
                    </MapView>
                  )}
                </View>

                {/* Center on My Location Button */}
                <TouchableOpacity
                  style={[styles.mapActionButton, { bottom: 12, right: 12 }]}
                  onPress={() => centerOnMyLocation(false)}
                  activeOpacity={0.7}
                >
                  <Ionicons name="locate" size={18} color="#ffffff" />
                </TouchableOpacity>

                {/* Fullscreen Toggle Button */}
                <TouchableOpacity
                  style={styles.fullscreenToggleBtn}
                  onPress={() => setMapFullScreen(true)}
                  activeOpacity={0.7}
                >
                  <Ionicons name="expand" size={16} color="#ffffff" />
                </TouchableOpacity>
              </View>

              {/* Fullscreen Map Modal */}
              <Modal
                visible={mapFullScreen}
                animationType="slide"
                onRequestClose={() => setMapFullScreen(false)}
              >
                <View style={{ flex: 1, backgroundColor: '#000000' }}>
                  {Platform.OS === 'web' ? (
                    <iframe
                      src={`https://maps.google.com/maps?q=${meetingLocation?.latitude || customerLocation?.latitude || photographerLocation?.latitude || 10.7769},${meetingLocation?.longitude || customerLocation?.longitude || photographerLocation?.longitude || 106.7009}&z=15&output=embed`}
                      style={{ width: '100%', height: '100%', border: 0 }}
                      title="Bản đồ Pickic"
                    />
                  ) : (
                    <MapView
                      ref={fullScreenMapRef}
                      style={StyleSheet.absoluteFillObject}
                      initialRegion={initialRegion}
                      key={`fs-map-${booking.id}`}
                    >
                      {photographerLocation && (
                        <>
                          <AnimatedCircleComponent
                            center={photographerLocation}
                            color="#8b5cf6"
                          />
                          <Marker
                            coordinate={photographerLocation}
                            anchor={{ x: 0.5, y: 0.5 }}
                            tracksViewChanges={true}
                            style={{ width: 34, height: 34 }}
                          >
                            <PulsingMarker
                              isPhotographerRole={true}
                              name={pName}
                              isMe={isPhotographer}
                            />
                          </Marker>
                        </>
                      )}

                      {customerLocation && (
                        <>
                          <AnimatedCircleComponent
                            center={customerLocation}
                            color="#1d4ed8"
                          />
                          <Marker
                            coordinate={customerLocation}
                            anchor={{ x: 0.5, y: 0.5 }}
                            tracksViewChanges={true}
                            style={{ width: 34, height: 34 }}
                          >
                            <PulsingMarker
                              isPhotographerRole={false}
                              name={customerProfile?.displayName ?? 'Khách hàng'}
                              isMe={!isPhotographer}
                            />
                          </Marker>
                        </>
                      )}

                      {meetingLocation && (
                        <Marker
                          coordinate={meetingLocation}
                          anchor={{ x: 0.5, y: 1 }}
                          tracksViewChanges={false}
                        >
                          <View style={{
                            width: 36,
                            height: 36,
                            borderRadius: 18,
                            backgroundColor: '#ea580c',
                            borderWidth: 2.5,
                            borderColor: '#ffffff',
                            alignItems: 'center',
                            justifyContent: 'center',
                            shadowColor: '#000',
                            shadowOffset: { width: 0, height: 2 },
                            shadowOpacity: 0.3,
                            shadowRadius: 3,
                            elevation: 5,
                          }}>
                            <Ionicons name="flag" size={18} color="#ffffff" />
                          </View>
                        </Marker>
                      )}
                    </MapView>
                  )}

                  {/* Center on My Location Button (Fullscreen) */}
                  <TouchableOpacity
                    style={[styles.mapActionButton, { bottom: 24, right: 24, width: 44, height: 44, borderRadius: 22 }]}
                    onPress={() => centerOnMyLocation(true)}
                    activeOpacity={0.7}
                  >
                    <Ionicons name="locate" size={24} color="#ffffff" />
                  </TouchableOpacity>

                  {/* Floating Close Button */}
                  <TouchableOpacity
                    style={[styles.closeFullscreenBtn, { top: insets.top > 0 ? insets.top + 10 : 20 }]}
                    onPress={() => setMapFullScreen(false)}
                    activeOpacity={0.7}
                  >
                    <Ionicons name="close" size={24} color="#ffffff" />
                  </TouchableOpacity>
                </View>
              </Modal>
            </>
          )}

          {booking.status === 'InProgress' && (
            <View style={styles.timerContainer}>
              <Text style={[styles.timerLabel, isDark && { color: pColors.textLight }]}>THỜI GIAN CHỤP THỰC TẾ</Text>
              <Text style={[styles.timerValue, isDark && { color: pColors.accent }]}>{formatTime(elapsedTime)}</Text>
              <Text style={[styles.timerHelpText, isDark && { color: pColors.textMuted }]}>Hãy chuẩn bị tạo dáng và tương tác tốt cùng thợ chụp nhé!</Text>
            </View>
          )}

          <View style={{ gap: spacing[2], marginTop: spacing[2] }}>
            {isPhotographer && (
              <>
                {booking.status === 'Confirmed' && (
                  <ClayButton
                    label="Bắt đầu di chuyển tới điểm hẹn"
                    onPress={() => handleStatusTransition('Moving')}
                    loading={updatingStatus}
                    variant="primary"
                    size="md"
                    style={{ backgroundColor: '#8b5cf6', shadowColor: '#8b5cf6' }}
                  />
                )}
                {booking.status === 'Moving' && (
                  <View style={{ flexDirection: 'row', gap: 10 }}>
                    <ClayButton
                      label="Tôi đã đến nơi"
                      onPress={() => handleStatusTransition('Arrived')}
                      loading={updatingStatus}
                      variant="primary"
                      size="md"
                      style={{ flex: 1, backgroundColor: '#10b981', shadowColor: '#10b981' }}
                    />
                    <TouchableOpacity
                      style={styles.navButton}
                      onPress={() => {
                        const addr = encodeURIComponent(booking.location || '');
                        Linking.openURL(`https://www.google.com/maps/search/?api=1&query=${addr}`).catch(() => {
                          Alert.alert('Lỗi', 'Không thể mở ứng dụng bản đồ.');
                        });
                      }}
                    >
                      <Ionicons name="navigate" size={20} color="#ffffff" />
                    </TouchableOpacity>
                  </View>
                )}
                {booking.status === 'Arrived' && (
                  <ClayButton
                    label="Bắt đầu bấm máy (Chụp hình)"
                    onPress={() => handleStatusTransition('InProgress')}
                    loading={updatingStatus}
                    variant="primary"
                    size="md"
                    style={{ backgroundColor: '#3b82f6', shadowColor: '#3b82f6' }}
                  />
                )}
                {booking.status === 'InProgress' && (
                  <ClayButton
                    label="Hoàn thành buổi chụp ảnh"
                    onPress={() => handleStatusTransition('Completed')}
                    loading={updatingStatus}
                    variant="primary"
                    size="md"
                    style={{ backgroundColor: '#15803d', shadowColor: '#15803d' }}
                  />
                )}
              </>
            )}

            {!isPhotographer && (
              <View style={[styles.statusBanner, isDark && { backgroundColor: pColors.surfaceStrong }]}>
                {booking.status === 'Confirmed' && (
                  <Text style={[styles.statusBannerText, isDark && { color: pColors.text }]}>
                    📅 Lịch chụp đã được xác nhận. Vui lòng theo dõi vị trí của {pName} khi buổi chụp bắt đầu di chuyển.
                  </Text>
                )}
                {booking.status === 'Moving' && (
                  <Text style={[styles.statusBannerText, isDark && { color: pColors.text }]}>
                    🛵 {pName} đang trên đường di chuyển đến điểm hẹn. Bạn có thể theo dõi vị trí trực tuyến trên bản đồ.
                  </Text>
                )}
                {booking.status === 'Arrived' && (
                  <Text style={[styles.statusBannerText, { color: '#10b981' }]}>
                    ✨ {pName} đã đến địa điểm chụp ảnh! Hãy chuẩn bị bắt đầu nhé.
                  </Text>
                )}
                {booking.status === 'InProgress' && (
                  <Text style={[styles.statusBannerText, { color: '#2563eb' }]}>
                    📸 Buổi chụp ảnh đang diễn ra tốt đẹp! Trạng thái sẽ cập nhật sau khi thợ chụp bấm hoàn thành.
                  </Text>
                )}
              </View>
            )}
          </View>
        </ClayCard>
      </Animated.View>
    );
  };

  if (loading) {
    return (
      <View style={[styles.loadingContainer, isDark && { backgroundColor: pColors.background }]}>
        <ActivityIndicator size="large" color={colors.accent} />
        <Text style={[styles.loadingText, isDark && { color: pColors.textMuted }]}>Đang tải chi tiết đặt lịch...</Text>
      </View>
    );
  }

  return (
    <View style={[styles.container, isDark && { backgroundColor: pColors.background }]}>
      {/* Editorial Header Banner */}
      <View style={styles.coverSection}>
        <Image
          source={{ uri: pCover }}
          style={styles.coverImage}
        />
        <LinearGradient
          colors={['rgba(0,0,0,0.3)', 'rgba(0,0,0,0.1)', 'rgba(26,26,15,0.85)']}
          style={StyleSheet.absoluteFillObject}
        />
        
        {/* Floating Back Button with glass style */}
        <Pressable
          style={[styles.floatingBackBtn, { top: insets.top + 10 }]}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={20} color={colors.dark} />
        </Pressable>

        {/* Cover Info Overlay */}
        <View style={styles.coverInfoContainer}>
          <View style={styles.photographerHeaderRow}>
            <Image source={{ uri: pAvatar }} style={styles.headerAvatar} />
            <View style={styles.headerTextContainer}>
              <View style={[
                styles.roleBadge,
                isDark 
                  ? { backgroundColor: '#ffffff', borderColor: '#ffffff' }
                  : { backgroundColor: 'transparent', borderColor: 'rgba(255,255,255,0.4)' }
              ]}>
                <Text style={[
                  styles.headerRole,
                  isDark ? { color: '#000000' } : { color: '#ffffff' }
                ]}>NHIẾP ẢNH GIA</Text>
              </View>
              <Text style={styles.headerName}>{pName}</Text>
              <Text style={styles.headerRegion}>
                <Ionicons name="pin-outline" size={11} color="rgba(255,255,255,0.7)" /> {photographer?.region}
              </Text>
            </View>
            {photographer?.rating ? (
              <View style={styles.headerRatingBadge}>
                <Ionicons name="star" size={11} color="#FFD700" />
                <Text style={styles.headerRatingText}>{photographer.rating.toFixed(1)}</Text>
              </View>
            ) : null}
          </View>
        </View>
      </View>

      <ScrollView 
        contentContainerStyle={styles.scroll} 
        showsVerticalScrollIndicator={false}
        style={styles.scrollView}
      >
        {/* Card 1: Time & Status Hero */}
        <Animated.View entering={FadeInDown.duration(500).delay(100)}>
          <ClayCard style={[styles.card, isDark && { backgroundColor: pColors.surface, borderColor: pColors.borderStrong }]}>
            <View style={styles.timeSection}>
              <View style={[styles.timeIconWrapper, isDark && { backgroundColor: 'rgba(207,64,40,0.15)' }]}>
                <Feather name="clock" size={22} color={isDark ? pColors.accent : colors.accent} />
              </View>
              <View style={styles.timeTextWrapper}>
                <Text style={[styles.timeDateText, isDark && { color: pColors.text }]}>{dateLongStr}</Text>
                <Text style={[styles.timeHourText, isDark && { color: pColors.textMuted }]}>{timeStr} • Khung giờ chụp</Text>
              </View>
            </View>

            <View style={[styles.cardDivider, isDark && { backgroundColor: pColors.border }]} />

            <View style={styles.statusPriceRow}>
              <View style={[styles.statusBadge, { backgroundColor: cfg.bgColor }]}>
                <Ionicons name={cfg.icon as any} size={13} color={cfg.color} />
                <Text style={[styles.statusLabelText, { color: cfg.color }]}>{cfg.label}</Text>
              </View>
              <View style={styles.priceContainer}>
                <Text style={[styles.priceLabel, isDark && { color: pColors.textLight }]}>CHI PHÍ THỎA THUẬN</Text>
                <Text style={[styles.priceValue, isDark && { color: pColors.accent }]}>{booking.agreedPrice?.toLocaleString('vi-VN')} đ</Text>
              </View>
            </View>
          </ClayCard>
        </Animated.View>

        {renderLiveSessionCard()}

        {/* Card 2: Package details card */}
        <Animated.View entering={FadeInDown.duration(500).delay(160)}>
          {renderPackageCard()}
        </Animated.View>

        {/* Card 3: Photoshoot Schedule Details */}
        <Animated.View entering={FadeInDown.duration(500).delay(220)}>
          <ClayCard style={[styles.card, isDark && { backgroundColor: pColors.surface, borderColor: pColors.borderStrong }]}>
            <Text style={[styles.cardTitle, isDark && { color: pColors.text }]}>Chi tiết cuộc hẹn</Text>
            
            <View style={{ gap: spacing[3] }}>
              {/* Highlighted Full-width Location Card */}
              <View style={[
                { backgroundColor: '#FAF7F2', borderRadius: 16, padding: 14, borderWidth: 1, borderColor: 'rgba(46,42,36,0.08)', gap: 6 },
                isDark && { backgroundColor: pColors.surfaceStrong, borderColor: pColors.borderStrong }
              ]}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                  <Ionicons name="pin" size={16} color={isDark ? pColors.accent : "#D4AF37"} />
                  <Text style={[{ fontSize: 10, fontWeight: '700', color: colors.textLight, textTransform: 'uppercase' }, isDark && { color: pColors.textLight }]}>Địa điểm chụp</Text>
                </View>
                <Text style={[{ fontSize: 14, fontWeight: '600', color: colors.dark, lineHeight: 20 }, isDark && { color: pColors.text }]}>
                  {booking.location || 'Chưa định cấu hình'}
                </Text>
              </View>

              {/* Highlighted Full-width Phone Card (Press to call) */}
              <Pressable 
                onPress={handleCallPress}
                style={({ pressed }) => [
                  {
                    backgroundColor: '#FAF7F2',
                    borderRadius: 16,
                    padding: 14,
                    borderWidth: 1,
                    borderColor: 'rgba(46,42,36,0.08)',
                    flexDirection: 'row',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    opacity: pressed ? 0.8 : 1,
                  },
                  isDark && { backgroundColor: pColors.surfaceStrong, borderColor: pColors.borderStrong }
                ]}
              >
                <View style={{ gap: 6, flex: 1 }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                    <Ionicons name="call" size={16} color={isDark ? pColors.info : "#3A6073"} />
                    <Text style={[{ fontSize: 10, fontWeight: '700', color: colors.textLight, textTransform: 'uppercase' }, isDark && { color: pColors.textLight }]}>Số điện thoại liên hệ</Text>
                  </View>
                  <Text style={[{ fontSize: 14, fontWeight: '600', color: colors.dark }, isDark && { color: pColors.text }]}>
                    {booking.phone || 'Chưa có số điện thoại'}
                  </Text>
                </View>

                {booking.phone && (
                  <View style={[{ width: 36, height: 36, borderRadius: 18, backgroundColor: 'rgba(58, 96, 115, 0.08)', alignItems: 'center', justifyContent: 'center' }, isDark && { backgroundColor: 'rgba(255,255,255,0.08)' }]}>
                    <Ionicons name="call" size={16} color={isDark ? pColors.info : "#3A6073"} />
                  </View>
                )}
              </Pressable>

              {booking.note ? (
                <View style={[styles.noteBox, { marginTop: 4 }, isDark && { backgroundColor: pColors.surfaceStrong, borderLeftColor: pColors.accent }]}>
                  <Text style={[styles.noteBoxTitle, isDark && { color: pColors.accent }]}>Ghi chú khách hàng</Text>
                  <Text style={[styles.noteBoxText, isDark && { color: pColors.textMuted }]}>"{booking.note}"</Text>
                </View>
              ) : null}

              {booking.requirements ? (
                <View style={[styles.noteBox, { borderLeftColor: colors.info, marginTop: 4 }, isDark && { backgroundColor: pColors.surfaceStrong, borderLeftColor: pColors.info }]}>
                  <Text style={[styles.noteBoxTitle, { color: colors.info }, isDark && { color: pColors.info }]}>Yêu cầu trang phục/chuẩn bị</Text>
                  <Text style={[styles.noteBoxText, isDark && { color: pColors.textMuted }]}>"{booking.requirements}"</Text>
                </View>
              ) : null}
            </View>

            {/* Collapsible toggle for Booking Code and Creation Time */}
            <Pressable 
              onPress={() => setInfoExpanded(!infoExpanded)} 
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'space-between',
                paddingVertical: 12,
                marginTop: 16,
                borderTopWidth: 1,
                borderTopColor: isDark ? pColors.border : 'rgba(26,26,15,0.06)'
              }}
            >
              <Text style={[{ fontSize: 13, fontWeight: '700', color: colors.textMuted }, isDark && { color: pColors.textMuted }]}>Xem thêm thông tin</Text>
              <Ionicons name={infoExpanded ? 'chevron-up' : 'chevron-down'} size={18} color={isDark ? pColors.textMuted : colors.textMuted} />
            </Pressable>

            {infoExpanded && (
              <Animated.View entering={FadeInDown.duration(200)} style={{ gap: spacing[3], marginTop: spacing[2] }}>
                <View style={styles.detailsRow}>
                  <View style={[styles.detailsIconWrapper, isDark && { backgroundColor: pColors.surfaceStrong, borderColor: pColors.border }]}>
                    <Ionicons name="barcode-outline" size={15} color={isDark ? pColors.textMuted : colors.textMuted} />
                  </View>
                  <View style={styles.detailsTextWrapper}>
                    <Text style={[styles.detailsLabel, isDark && { color: pColors.textLight }]}>Mã đặt lịch</Text>
                    <Text style={[styles.detailsValue, isDark && { color: pColors.text }]}>{`#${booking.id.toUpperCase()}`}</Text>
                  </View>
                </View>

                <View style={styles.detailsRow}>
                  <View style={[styles.detailsIconWrapper, isDark && { backgroundColor: pColors.surfaceStrong, borderColor: pColors.border }]}>
                    <Ionicons name="time-outline" size={15} color={isDark ? pColors.textMuted : colors.textMuted} />
                  </View>
                  <View style={styles.detailsTextWrapper}>
                    <Text style={[styles.detailsLabel, isDark && { color: pColors.textLight }]}>Thời gian đặt</Text>
                    <Text style={[styles.detailsValue, isDark && { color: pColors.text }]}>{new Date(booking.createdAt).toLocaleString('vi-VN')}</Text>
                  </View>
                </View>
              </Animated.View>
            )}

            {booking.cancellationReason && (
              <View style={[styles.cancelReasonBox, isDark && { backgroundColor: 'rgba(207,64,40,0.15)' }]}>
                <Ionicons name="warning-outline" size={16} color={isDark ? pColors.accent : colors.accent} />
                <Text style={[styles.cancelReasonText, isDark && { color: pColors.accent }]}>Lý do hủy: {booking.cancellationReason}</Text>
              </View>
            )}
          </ClayCard>
        </Animated.View>

        {/* Card 4: Timeline flow */}
        <Animated.View entering={FadeInDown.duration(500).delay(280)}>
          <ClayCard style={[styles.card, isDark && { backgroundColor: pColors.surface, borderColor: pColors.borderStrong }]}>
            <Text style={[styles.cardTitle, isDark && { color: pColors.text }]}>Trạng thái tiến trình</Text>
            {(() => {
              const getStepStatus = (index: number) => {
                const status = booking.status;
                if (status === 'Cancelled') return { done: false, active: false };
                if (index === 0) return { done: true, active: status === 'Pending' };
                if (index === 1) return { done: status === 'Confirmed' || status === 'Processing' || status === 'Completed', active: status === 'Confirmed' };
                if (index === 2) return { done: status === 'Processing' || status === 'Completed', active: status === 'Processing' };
                if (index === 3) return { done: status === 'Completed', active: status === 'Completed' };
                return { done: false, active: false };
              };

              const steps = [
                { label: 'Đặt lịch', ...getStepStatus(0) },
                { label: 'Trao đổi', ...getStepStatus(1) },
                { label: 'Chụp hình', ...getStepStatus(2) },
                { label: 'Hoàn tất', ...getStepStatus(3) },
              ];

              return (
                <View style={styles.progressTimeline}>
                  {/* Step Labels */}
                  <View style={styles.progressLabelsRow}>
                    {steps.map((step, idx) => (
                      <Text
                        key={idx}
                        style={[
                          styles.progressLabel,
                          step.active && styles.progressLabelActive,
                          step.done && !step.active && styles.progressLabelDone,
                          isDark && { color: pColors.textLight },
                          isDark && step.active && { color: pColors.accent },
                          isDark && step.done && !step.active && { color: pColors.text }
                        ]}
                      >
                        {step.label}
                      </Text>
                    ))}
                  </View>

                  {/* Progress Bars */}
                  <View style={styles.progressBarsRow}>
                    {steps.map((step, idx) => (
                      <View
                        key={idx}
                        style={[
                          styles.progressBarSegment,
                          step.done && styles.progressBarSegmentDone,
                          step.active && styles.progressBarSegmentActive,
                          isDark && { backgroundColor: pColors.surfaceStrong },
                          isDark && (step.done || step.active) && { backgroundColor: pColors.accent }
                        ]}
                      />
                    ))}
                  </View>
                </View>
              );
            })()}
          </ClayCard>
        </Animated.View>

        {/* Review Section */}
        {canReview && (
          <Animated.View entering={FadeInDown.duration(500).delay(340)}>
            <ClayCard style={[styles.card, isDark && { backgroundColor: pColors.surface, borderColor: pColors.borderStrong }]}>
              <Text style={[styles.cardTitle, isDark && { color: pColors.text }]}>⭐ Đánh giá buổi chụp</Text>
              <Text style={[styles.reviewSub, isDark && { color: pColors.textMuted }]}>Chia sẻ trải nghiệm của bạn để nâng cao dịch vụ</Text>
              <StarRow value={rating} onChange={setRating} />
              <TextInput
                style={[
                  styles.reviewInput,
                  isDark && {
                    backgroundColor: pColors.surfaceStrong,
                    color: pColors.text,
                    borderColor: pColors.borderStrong,
                  }
                ]}
                value={comment}
                onChangeText={setComment}
                placeholder="Nhận xét chi tiết của bạn về sản phẩm/phong cách nhiếp ảnh gia..."
                placeholderTextColor={isDark ? pColors.textLight : colors.textLight}
                multiline
                numberOfLines={4}
              />
              <View style={{ marginTop: spacing[3] }}>
                <ClayButton
                  label="Gửi đánh giá"
                  onPress={handleSubmitReview}
                  loading={submittingRev}
                  variant="primary"
                  size="md"
                  style={isDark ? { backgroundColor: pColors.accent, shadowColor: pColors.accent } : undefined}
                  textStyle={isDark ? { color: '#ffffff' } : undefined}
                />
              </View>
            </ClayCard>
          </Animated.View>
        )}

        {reviewDone && (
          <ClayCard style={[styles.card, isDark && { backgroundColor: pColors.surface, borderColor: pColors.borderStrong }]}>
            <View style={{ gap: spacing[3] }}>
              <View style={styles.reviewDoneRow}>
                <Ionicons name="checkmark-circle" size={24} color={isDark ? pColors.success : colors.success} />
                <Text style={[styles.reviewDoneText, isDark && { color: pColors.success }]}>
                  {isPhotographer ? 'Khách hàng đã gửi đánh giá buổi chụp!' : 'Bạn đã gửi đánh giá cho buổi chụp này! 🙏'}
                </Text>
              </View>
              {existingReview && (
                <View style={{ 
                  marginTop: spacing[2], 
                  padding: spacing[3], 
                  borderRadius: radius.md, 
                  backgroundColor: isDark ? pColors.surfaceStrong : colors.background,
                  borderWidth: 1,
                  borderColor: isDark ? pColors.border : colors.border
                }}>
                  <View style={{ flexDirection: 'row', gap: 4, marginBottom: spacing[2] }}>
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Ionicons 
                        key={i} 
                        name={i < existingReview.rating ? "star" : "star-outline"} 
                        size={16} 
                        color="#eab308" 
                      />
                    ))}
                  </View>
                  <Text style={{ 
                    fontSize: fontSizes.md, 
                    fontStyle: 'italic',
                    color: isDark ? pColors.text : colors.dark 
                  }}>
                    "{existingReview.comment}"
                  </Text>
                </View>
              )}
            </View>
          </ClayCard>
        )}

        {/* Action Buttons */}
        <Animated.View entering={FadeInDown.duration(500).delay(400)} style={styles.actions}>
          {booking.status === 'AwaitingDeposit' && (
            <ClayButton
              label={creatingLink ? 'Đang tạo link...' : 'Thanh toán tiền cọc'}
              onPress={handlePayDeposit}
              loading={creatingLink}
              variant="primary"
              size="md"
              style={{ backgroundColor: '#ea580c', shadowColor: '#ea580c' }}
            />
          )}

          {canCancel && (
            <ClayButton
              label={cancelling ? 'Đang hủy...' : 'Hủy lịch hẹn chụp'}
              onPress={handleCancel}
              loading={cancelling}
              variant="ghost"
              size="md"
              style={isDark ? { borderColor: pColors.borderStrong } : undefined}
              textStyle={isDark ? { color: pColors.text } : undefined}
            />
          )}
        </Animated.View>

        <View style={{ height: spacing[12] }} />
      </ScrollView>

      <PayOsCheckoutModal
        visible={payModalVisible}
        checkoutUrl={checkoutUrl}
        onClose={() => setPayModalVisible(false)}
        onCancel={() => {
           setPayModalVisible(false);
           setTimeout(() => {
             Alert.alert('Đã hủy', 'Bạn đã hủy thanh toán.');
           }, 400);
        }}
        onSuccess={() => {
           setPayModalVisible(false);
           setTimeout(() => {
             Alert.alert('Thành công', 'Thanh toán thành công! Trạng thái sẽ được cập nhật.');
             navigation.goBack();
           }, 400);
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  mapWrapper: { position: 'relative', marginVertical: spacing[3] },
  mapContainer: { height: 200, borderRadius: 16, overflow: 'hidden', borderWidth: 1, borderColor: '#e4e4e7' },
  map: { ...StyleSheet.absoluteFillObject },
  markerContainer: { width: 36, height: 36, borderRadius: 18, backgroundColor: '#8b5cf6', alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: '#ffffff', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.25, shadowRadius: 3.84, elevation: 5 },
  activeIndicator: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 20, borderWidth: 1, borderColor: 'rgba(59,130,246,0.2)' },
  pulseDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#3b82f6' },
  timerContainer: { alignItems: 'center', paddingVertical: spacing[4], gap: spacing[2] },
  timerLabel: { fontSize: 9, fontWeight: '700', color: colors.textLight, letterSpacing: 1 },
  timerValue: { fontSize: 32, fontWeight: '800', color: colors.accent },
  timerHelpText: { fontSize: 12, color: colors.textMuted, textAlign: 'center', paddingHorizontal: spacing[4] },
  navButton: { width: 48, height: 48, borderRadius: radius.md, backgroundColor: '#3b82f6', alignItems: 'center', justifyContent: 'center', shadowColor: '#3b82f6', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.3, shadowRadius: 4, elevation: 4 },
  statusBanner: { backgroundColor: '#f9fafb', padding: 12, borderRadius: 12, borderWidth: 1, borderColor: '#e5e7eb', marginTop: 4 },
  statusBannerText: { fontSize: 13, color: colors.dark, lineHeight: 18, fontWeight: '500' },

  container: { flex: 1, backgroundColor: colors.background },
  scrollView: { flex: 1 },
  scroll: { padding: spacing[4], gap: spacing[4] },

  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.background, gap: spacing[3] },
  loadingText: { fontSize: fontSizes.sm, color: colors.textMuted },

  // Editorial Header Banner Style
  roleBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    borderWidth: 1,
    marginBottom: 4,
  },
  coverSection: {
    height: 230,
    width: '100%',
    position: 'relative',
    overflow: 'hidden',
  },
  coverImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  floatingBackBtn: {
    position: 'absolute',
    left: spacing[4],
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: 'rgba(255,255,255,0.9)',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 4,
    zIndex: 100,
  },
  coverInfoContainer: {
    position: 'absolute',
    bottom: spacing[4],
    left: spacing[4],
    right: spacing[4],
  },
  photographerHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  headerAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    borderWidth: 2,
    borderColor: '#ffffff',
  },
  headerTextContainer: {
    flex: 1,
  },
  headerRole: {
    fontSize: 8,
    fontWeight: fontWeights.bold,
    color: '#ff4200',
    letterSpacing: 1.5,
  },
  headerName: {
    fontSize: 16,
    fontWeight: fontWeights.bold,
    color: '#ffffff',
    textShadowColor: 'rgba(0,0,0,0.5)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  headerRegion: {
    fontSize: 11,
    color: 'rgba(255,255,255,0.85)',
    marginTop: 2,
  },
  headerRatingBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: 'rgba(26,26,15,0.6)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  headerRatingText: {
    fontSize: 11,
    fontWeight: fontWeights.bold,
    color: '#ffffff',
  },

  // Cards layout
  card: {
    padding: spacing[5],
    backgroundColor: '#ffffff',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(26,26,15,0.06)',
    shadowColor: '#b8a98a',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 3,
  },
  cardTitle: {
    fontSize: fontSizes.md,
    fontWeight: fontWeights.bold,
    color: colors.dark,
    marginBottom: spacing[4],
  },
  cardDivider: {
    height: 1,
    backgroundColor: 'rgba(26,26,15,0.06)',
    marginVertical: spacing[4],
  },

  // Card 1 specific styles
  timeSection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  timeIconWrapper: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: 'rgba(207,64,40,0.08)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  timeTextWrapper: {
    flex: 1,
  },
  timeDateText: {
    fontSize: 15,
    fontWeight: fontWeights.bold,
    color: colors.dark,
  },
  timeHourText: {
    fontSize: 12,
    color: colors.textMuted,
    marginTop: 2,
  },
  statusPriceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
  },
  statusLabelText: {
    fontSize: 11.5,
    fontWeight: fontWeights.bold,
  },
  priceContainer: {
    alignItems: 'flex-end',
  },
  priceLabel: {
    fontSize: 8,
    fontWeight: fontWeights.bold,
    color: colors.textLight,
    letterSpacing: 0.8,
  },
  priceValue: {
    fontSize: 18,
    fontWeight: fontWeights.bold,
    color: colors.accent,
    marginTop: 2,
  },

  packageCard: {
    borderRadius: 24,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(26,26,15,0.09)',
    backgroundColor: '#fffaf4',
  },
  packageCover: { position: 'relative', height: 200 },
  packageCoverContent: {
    position: 'absolute',
    bottom: 14,
    left: 14,
    right: 14,
    gap: 6,
  },
  packageCoverTitle: {
    color: '#fffaf4',
    fontSize: 20,
    fontWeight: '900',
    letterSpacing: 0.2,
    lineHeight: 26,
    textShadowColor: 'rgba(0,0,0,0.4)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 4,
  },
  packagePricePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(207,64,40,0.85)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: 'rgba(255,180,140,0.3)',
  },
  packagePriceText: { color: '#fffaf4', fontSize: 13, fontWeight: '900', letterSpacing: 0.2 },
  packagePriceSep: { color: 'rgba(255,247,225,0.5)', fontSize: 11, marginHorizontal: 1 },
  packagePriceDuration: { color: 'rgba(255,247,225,0.8)', fontSize: 12, fontWeight: '600' },

  packageBody: { padding: 16, gap: 12 },
  packageDesc: { color: 'rgba(26,26,15,0.7)', lineHeight: 21, fontSize: 13.5 },

  packageTagRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  packageTag: {
    backgroundColor: 'rgba(207,64,40,0.07)',
    borderWidth: 1,
    borderColor: 'rgba(207,64,40,0.14)',
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: 8,
  },
  packageTagText: { color: colors.dark, fontSize: 11.5, fontWeight: '700' },

  packageMetaRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  packageMetaChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: '#fff7e1',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: 'rgba(26,26,15,0.08)',
  },
  packageMetaChipText: { color: colors.dark, fontSize: 11.5, fontWeight: '600' },

  packageThumbStrip: { flexDirection: 'row', gap: 6 },
  packageThumbItem: { width: 60, height: 60, borderRadius: 10 },
  packageThumbMore: {
    width: 60,
    height: 60,
    borderRadius: 10,
    backgroundColor: 'rgba(26,26,15,0.08)',
    borderWidth: 1,
    borderColor: 'rgba(26,26,15,0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  packageThumbMoreText: { color: 'rgba(26,26,15,0.6)', fontSize: 13, fontWeight: '800' },

  packageToggleIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: 'rgba(26,26,15,0.05)',
  },
  packageToggleText: { fontSize: 10, color: colors.textMuted, fontWeight: '600' },

  packageExpandedContent: { gap: 10, marginTop: 2 },
  packageSection: {
    gap: 4,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: 'rgba(26,26,15,0.05)',
  },
  packageSectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  packageSectionTitle: {
    color: colors.dark,
    fontSize: 10.5,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  packageSectionBody: {
    color: 'rgba(26,26,15,0.7)',
    fontSize: 12,
    lineHeight: 18,
  },

  packageFeatureList: { gap: 4 },
  packageFeatureItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 6,
  },
  packageFeatureText: {
    flex: 1,
    color: colors.dark,
    fontSize: 12,
    lineHeight: 16,
  },

  packagePhotoGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 5,
  },
  packagePhotoItem: { width: 62, height: 62, borderRadius: 6 },

  // Fallback concept card styling
  conceptCard: {
    padding: spacing[4],
    backgroundColor: '#fffcf7',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(26,26,15,0.06)',
    gap: spacing[2],
  },
  conceptHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  conceptTitleLabel: {
    fontSize: 8,
    fontWeight: fontWeights.bold,
    color: colors.accent,
    letterSpacing: 1.2,
  },
  conceptTitle: {
    fontSize: 15,
    fontWeight: fontWeights.bold,
    color: colors.dark,
  },
  conceptMood: {
    fontSize: 12,
    color: colors.textMuted,
    fontStyle: 'italic',
    lineHeight: 17,
    marginBottom: spacing[1],
  },
  tipsBox: {
    backgroundColor: '#eae1c8',
    borderRadius: 10,
    borderLeftWidth: 3,
    borderColor: colors.accent,
    padding: 8,
  },
  tipsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    marginBottom: 2,
  },
  tipsTitle: {
    fontSize: 10,
    fontWeight: fontWeights.bold,
    color: colors.dark,
  },
  tipsText: {
    fontSize: 10,
    color: colors.textMuted,
    lineHeight: 14,
  },

  // Card 3 Details grid list
  detailsList: {
    gap: spacing[3],
  },
  detailsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  detailsIconWrapper: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: '#fff7e1',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(26,26,15,0.04)',
  },
  detailsTextWrapper: {
    flex: 1,
  },
  detailsLabel: {
    fontSize: 9,
    color: colors.textLight,
    fontWeight: fontWeights.bold,
    textTransform: 'uppercase',
  },
  detailsValue: {
    fontSize: 13,
    color: colors.dark,
    fontWeight: fontWeights.semibold,
    marginTop: 1,
  },
  noteBox: {
    backgroundColor: '#fffaf2',
    borderLeftWidth: 3,
    borderLeftColor: colors.accent,
    padding: spacing[3],
    borderRadius: 8,
    marginTop: spacing[3],
  },
  noteBoxTitle: {
    fontSize: 10,
    fontWeight: fontWeights.bold,
    color: colors.accent,
    textTransform: 'uppercase',
  },
  noteBoxText: {
    fontSize: 12,
    color: colors.textMuted,
    marginTop: 2,
    fontStyle: 'italic',
    lineHeight: 16,
  },
  cancelReasonBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#fef2f2',
    padding: spacing[3],
    borderRadius: 8,
    marginTop: spacing[3],
  },
  cancelReasonText: {
    flex: 1,
    fontSize: 12,
    color: colors.accent,
    fontWeight: fontWeights.semibold,
  },

  // Timeline
  progressTimeline: {
    marginTop: spacing[1],
    gap: spacing[3],
  },
  progressLabelsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  progressLabel: {
    fontSize: 9.5,
    fontWeight: fontWeights.bold,
    color: colors.textLight,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    textAlign: 'center',
    flex: 1,
  },
  progressLabelActive: {
    color: colors.accent,
  },
  progressLabelDone: {
    color: colors.dark,
  },
  progressBarsRow: {
    flexDirection: 'row',
    gap: 6,
    height: 4,
    marginTop: 4,
  },
  progressBarSegment: {
    flex: 1,
    height: '100%',
    backgroundColor: '#eae1c8',
    borderRadius: 2,
  },
  progressBarSegmentDone: {
    backgroundColor: colors.accent,
  },
  progressBarSegmentActive: {
    backgroundColor: colors.accent,
  },

  // Review & Rating
  reviewSub:   { fontSize: fontSizes.sm, color: colors.textMuted, marginBottom: spacing[2] },
  starRow:     { flexDirection: 'row', gap: spacing[2], marginBottom: spacing[3] },
  reviewInput: { backgroundColor: colors.background, borderRadius: radius.md, padding: spacing[4], fontSize: fontSizes.md, color: colors.dark, borderWidth: 1, borderColor: colors.border, height: 100, textAlignVertical: 'top' },
  reviewDoneRow: { flexDirection: 'row', alignItems: 'center', gap: spacing[3] },
  reviewDoneText: { fontSize: fontSizes.md, fontWeight: fontWeights.semibold, color: colors.success },

  actions: { gap: spacing[3] },

  fullscreenToggleBtn: {
    position: 'absolute',
    right: 12,
    top: 12,
    backgroundColor: 'rgba(0,0,0,0.6)',
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10,
  },
  closeFullscreenBtn: {
    position: 'absolute',
    right: 16,
    backgroundColor: 'rgba(0,0,0,0.6)',
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10,
  },
  mapActionButton: {
    position: 'absolute',
    backgroundColor: 'rgba(0,0,0,0.6)',
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 2,
  },
  customMarkerOuter: {
    alignItems: 'center',
    justifyContent: 'flex-end',
    width: 140, // Tăng width để chứa chữ thoải mái hơn trên Android
    height: 95, // Tăng height
    position: 'relative',
  },
  markerLabelBubble: {
    backgroundColor: 'rgba(255, 255, 255, 0.98)',
    width: 130, // Cố định width thay vì co giãn tự do để Android không bị cắt chữ
    paddingVertical: 5,
    paddingHorizontal: 4,
    borderRadius: 8,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
    marginBottom: 4,
  },
  markerLabelName: {
    fontSize: 10,
    fontWeight: '700',
    color: '#1f2937',
    textAlign: 'center',
    width: 120, // Explicit width
  },
  markerLabelDistance: {
    fontSize: 9,
    color: '#4b5563',
    marginTop: 1,
    fontWeight: '600',
    textAlign: 'center',
    width: 120, // Explicit width
  },
  avatarContainer: {
    width: 38,
    height: 38,
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
  },
  markerPulseRing: {
    position: 'absolute',
    width: 38,
    height: 38,
    borderRadius: 19,
  },
  avatarBubble: {
    width: 38,
    height: 38,
    borderRadius: 19,
    borderWidth: 2.5,
    backgroundColor: '#ffffff',
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 8,
  },
  markerAvatarImg: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  markerBadge: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    width: 14,
    height: 14,
    borderRadius: 7,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: '#ffffff',
    zIndex: 10,
  },
});
