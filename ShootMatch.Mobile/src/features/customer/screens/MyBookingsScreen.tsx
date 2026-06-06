import React, { useEffect, useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  Pressable,
  ActivityIndicator,
  RefreshControl,
  Alert,
  Image,
  ScrollView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { getMyBookings, cancelBooking, getPhotographer, getPhotographerServicePackages, Booking, Photographer } from '../api';

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
import { ClayCard } from '../../../shared/components/ClayCard';
import { colors } from '../../../app/theme/colors';
import { fontSizes, fontWeights } from '../../../app/theme/typography';
import { radius, spacing } from '../../../app/theme/spacing';

const STATUS_CFG: Record<string, { label: string; color: string; bgColor: string; icon: string }> = {
  Pending:    { label: 'Chờ xác nhận', color: '#b88d14', bgColor: 'rgba(233,196,106,0.15)', icon: 'time-outline' },
  Processing: { label: 'Đang xử lý',    color: '#b88d14', bgColor: 'rgba(233,196,106,0.15)', icon: 'time-outline' },
  Confirmed:  { label: 'Đã xác nhận', color: '#1d4ed8', bgColor: 'rgba(69,123,157,0.15)',  icon: 'checkmark-circle-outline' },
  Completed:  { label: 'Hoàn thành',  color: '#15803d', bgColor: 'rgba(45,106,79,0.15)',   icon: 'checkmark-done-circle' },
  Cancelled:  { label: 'Đã hủy',      color: '#cf4028', bgColor: 'rgba(207,64,40,0.15)',   icon: 'close-circle-outline' },
  Disputed:   { label: 'Tranh chấp',  color: '#e07b39', bgColor: 'rgba(224,123,57,0.15)',   icon: 'warning-outline' },
};

const DEFAULT_AVATAR = 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150';
const DEFAULT_COVER = 'https://images.unsplash.com/photo-1452587925148-ce544e77e70d?w=800';

const formatPhotoUrl = (url?: string) => {
  if (!url) return '';
  const apiUrl = process.env.EXPO_PUBLIC_API_URL || '';
  const ipMatch = apiUrl.match(/http:\/\/((\d+\.){3}\d+)/);
  if (ipMatch && (url.includes('localhost') || url.includes('127.0.0.1'))) {
    return url.replace(/localhost|127\.0\.0\.1/, ipMatch[1]);
  }
  return url;
};

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

function BookingItem({
  booking,
  photographer,
  packages,
  onCancel,
}: {
  booking: Booking;
  photographer?: Photographer;
  packages: any[];
  onCancel: () => void;
}) {
  const navigation = useNavigation<any>();
  const cfg = STATUS_CFG[booking.status] ?? STATUS_CFG.Pending;
  const concept = getArtisticConcept(booking.id);
  const matchedPkg = booking.servicePackageId
    ? (packages || []).find((p: any) => p.id?.toLowerCase() === booking.servicePackageId?.toLowerCase())
    : null;

  const packageTitle = matchedPkg ? matchedPkg.title : concept.title;
  const parsedDesc = matchedPkg ? splitDescriptionSections(matchedPkg.description || '') : null;
  const packageMood = parsedDesc?.description || concept.mood;
  const packageTips = parsedDesc?.requirements || concept.tips;

  const date = new Date(booking.scheduledAt);

  const dayStr = date.getDate();
  const monthStr = `Tháng ${date.getMonth() + 1}`;
  const yearStr = date.getFullYear();
  const timeStr = date.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });

  const pName = photographer?.displayName ?? 'Nhiếp ảnh gia PicKic';
  const pAvatar = formatPhotoUrl(photographer?.avatarUrl) || DEFAULT_AVATAR;
  const pCover = (photographer?.portfolioPhotos && photographer.portfolioPhotos.length > 0)
    ? formatPhotoUrl(photographer.portfolioPhotos[0])
    : DEFAULT_COVER;

  return (
    <Animated.View entering={FadeInDown.duration(500)}>
      <ClayCard style={styles.card}>
        {/* Cover Photo with overlay tags */}
        <View style={styles.cardCoverContainer}>
          <Image source={{ uri: pCover }} style={styles.cardCover} />
          <View style={styles.coverDarkOverlay} />
          
          {/* Frosted Glass Date Tag */}
          <View style={styles.dateTag}>
            <Text style={styles.dateTagDay}>{dayStr}</Text>
            <View>
              <Text style={styles.dateTagMonth}>{monthStr}</Text>
              <Text style={styles.dateTagTime}>{timeStr}</Text>
            </View>
          </View>

          {/* Status Badge */}
          <View style={[styles.statusBadgeOverlay, { backgroundColor: cfg.bgColor }]}>
            <Ionicons name={cfg.icon as any} size={12} color={cfg.color} />
            <Text style={[styles.statusTextOverlay, { color: cfg.color }]}>{cfg.label}</Text>
          </View>
        </View>

        {/* Card Content */}
        <View style={styles.cardBody}>
          {/* Photographer Row */}
          <View style={styles.photographerRow}>
            <Image source={{ uri: pAvatar }} style={styles.pAvatar} />
            <View style={styles.pInfo}>
              <Text style={styles.pRole}>NHIẾP ẢNH GIA</Text>
              <Text style={styles.pName}>{pName}</Text>
            </View>
            {photographer?.rating ? (
              <View style={styles.ratingBadge}>
                <Ionicons name="star" size={12} color="#FFD700" />
                <Text style={styles.ratingText}>{photographer.rating.toFixed(1)}</Text>
              </View>
            ) : null}
          </View>

          {/* Photoshoot Concept & Mood */}
          <View style={styles.conceptContainer}>
            <Text style={styles.conceptLabel}>CONCEPT CHỤP</Text>
            <Text style={styles.conceptTitle}>{packageTitle}</Text>
            <Text style={styles.conceptMood}>{packageMood}</Text>
          </View>

          {/* Preparation Tips Box */}
          <View style={styles.tipsBox}>
            <View style={styles.tipsHeader}>
              <Ionicons name="sparkles-outline" size={14} color={colors.accent} />
              <Text style={styles.tipsTitle}>Gợi ý chuẩn bị cho bạn</Text>
            </View>
            <Text style={styles.tipsText}>{packageTips}</Text>
          </View>

          {/* Price and Action Row */}
          <View style={styles.footerRow}>
            <View>
              <Text style={styles.priceLabel}>CHI PHÍ THỎA THUẬN</Text>
              <Text style={styles.priceValue}>{booking.agreedPrice?.toLocaleString('vi-VN')}đ</Text>
            </View>
            
            <View style={styles.actionButtons}>
              <Pressable
                style={styles.detailBtn}
                onPress={() => navigation.navigate('BookingDetail', { booking })}
              >
                <Text style={styles.detailBtnText}>Chi tiết</Text>
              </Pressable>
              
              {(booking.status === 'Pending' || booking.status === 'Confirmed') && (
                <Pressable style={styles.cancelBtn} onPress={onCancel}>
                  <Text style={styles.cancelBtnText}>Hủy</Text>
                </Pressable>
              )}
            </View>
          </View>
        </View>
      </ClayCard>
    </Animated.View>
  );
}

function HistoryItem({ booking, photographer }: { booking: Booking; photographer?: Photographer }) {
  const navigation = useNavigation<any>();
  const cfg = STATUS_CFG[booking.status] ?? STATUS_CFG.Completed;
  const pName = photographer?.displayName ?? 'Nhiếp ảnh gia';
  const date = new Date(booking.scheduledAt);
  const dateStr = `${date.getDate()}/${date.getMonth() + 1}/${date.getFullYear()}`;

  return (
    <Pressable
      style={styles.historyItemCard}
      onPress={() => navigation.navigate('BookingDetail', { booking })}
    >
      <View style={styles.historyItemLeft}>
        <Text style={styles.historyItemDate}>{dateStr}</Text>
        <Text style={styles.historyItemName}>{pName}</Text>
      </View>
      <View style={styles.historyItemRight}>
        <Text style={styles.historyItemPrice}>{booking.agreedPrice?.toLocaleString('vi-VN')}đ</Text>
        <View style={[styles.historyStatusBadge, { backgroundColor: cfg.bgColor }]}>
          <Text style={[styles.historyStatusText, { color: cfg.color }]}>{cfg.label}</Text>
        </View>
      </View>
    </Pressable>
  );
}

export default function MyBookingsScreen() {
  const navigation = useNavigation<any>();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [photographers, setPhotographers] = useState<Record<string, Photographer>>({});
  const [photographerPackages, setPhotographerPackages] = useState<Record<string, any[]>>({});
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showHistory, setShowHistory] = useState(false);

  async function load() {
    try {
      const data = await getMyBookings();
      // Sắp xếp các buổi chụp sắp tới lên đầu
      data.sort((a, b) => new Date(a.scheduledAt).getTime() - new Date(b.scheduledAt).getTime());
      setBookings(data);

      const uniqueIds = Array.from(new Set(data.map(b => b.photographerId)));
      const photoMap: Record<string, Photographer> = { ...photographers };
      const pkgsMap: Record<string, any[]> = { ...photographerPackages };
      
      await Promise.all(
        uniqueIds.map(async (id) => {
          if (!photoMap[id]) {
            try {
              const p = await getPhotographer(id);
              if (p) photoMap[id] = p;
            } catch (err) {
              console.log('Error loading photographer profile:', id, err);
            }
          }
          if (!pkgsMap[id]) {
            try {
              const pkgs = await getPhotographerServicePackages(id);
              if (pkgs) pkgsMap[id] = pkgs;
            } catch (err) {
              console.log('Error loading photographer packages:', id, err);
            }
          }
        })
      );
      setPhotographers(photoMap);
      setPhotographerPackages(pkgsMap);
    } catch (err) {
      console.log('Error loading bookings feed:', err);
    }
    setLoading(false);
    setRefreshing(false);
  }

  useEffect(() => {
    load();
    const unsubscribe = navigation.addListener('focus', () => {
      load();
    });
    return unsubscribe;
  }, [navigation]);

  async function handleCancel(b: Booking) {
    Alert.alert('Hủy lịch hẹn', 'Bạn chắc chắn muốn hủy lịch hẹn chụp này không?', [
      { text: 'Quay lại', style: 'cancel' },
      {
        text: 'Hủy lịch',
        style: 'destructive',
        onPress: async () => {
          try {
            await cancelBooking(b.id, 'Khách hàng hủy');
            load();
          } catch {
            Alert.alert('Lỗi', 'Không thể hủy lịch vào lúc này. Vui lòng thử lại sau.');
          }
        },
      },
    ]);
  }

  const upcomingBookings = bookings.filter((b) => b.status === 'Pending' || b.status === 'Processing' || b.status === 'Confirmed');
  const pastBookings = bookings.filter((b) => b.status === 'Completed' || b.status === 'Cancelled' || b.status === 'Disputed');

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerSub}>CHÀO MỪNG BẠN ĐẾN VỚI</Text>
        <Text style={styles.title}>Lịch Trình Nghệ Thuật</Text>
        <Text style={styles.description}>
          Theo dõi hành trình sáng tạo và những buổi chụp hình sắp tới của bạn.
        </Text>
      </View>

      {loading && !refreshing ? (
        <ActivityIndicator size="large" color={colors.accent} style={{ flex: 1 }} />
      ) : (
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => {
                setRefreshing(true);
                load();
              }}
              tintColor={colors.accent}
            />
          }
        >
          {/* Upcoming sessions feed */}
          <View style={styles.upcomingFeed}>
            {upcomingBookings.length === 0 ? (
              <View style={styles.emptyContainer}>
                <Animated.View 
                  entering={FadeInDown.duration(800).delay(200)}
                  style={styles.polaroidFrame}
                >
                  <Image 
                    source={{ uri: 'https://images.unsplash.com/photo-1516035069371-29a1b244cc32?w=500' }} 
                    style={styles.polaroidImage} 
                  />
                  <Text style={styles.polaroidCaption}>Khung ảnh đang chờ bạn...</Text>
                </Animated.View>

                <Text style={styles.emptyTitle}>Ghi Lại Khoảnh Khắc Nghệ Thuật</Text>
                <Text style={styles.emptySub}>
                  Mỗi giây phút trôi qua là một tác phẩm nghệ thuật sống động. Hãy kết nối với các nhiếp ảnh gia để kể câu chuyện của riêng bạn qua từng lăng kính.
                </Text>

                <Pressable 
                  style={styles.discoverBtn}
                  onPress={() => navigation.navigate('Discover')}
                >
                  <Text style={styles.discoverBtnText}>Khám phá nhiếp ảnh gia</Text>
                  <Ionicons name="arrow-forward" size={14} color={colors.white} />
                </Pressable>
              </View>
            ) : (
              upcomingBookings.map((b) => (
                <BookingItem
                  key={b.id}
                  booking={b}
                  photographer={photographers[b.photographerId]}
                  packages={photographerPackages[b.photographerId] || []}
                  onCancel={() => handleCancel(b)}
                />
              ))
            )}
          </View>

          {/* History Section (Completed / Cancelled) */}
          {pastBookings.length > 0 && (
            <View style={styles.historySection}>
              <Pressable
                style={styles.historyHeader}
                onPress={() => setShowHistory(!showHistory)}
              >
                <Text style={styles.historyTitle}>Lịch sử buổi chụp ({pastBookings.length})</Text>
                <Ionicons
                  name={showHistory ? 'chevron-up' : 'chevron-down'}
                  size={18}
                  color={colors.textMuted}
                />
              </Pressable>

              {showHistory && (
                <View style={styles.historyList}>
                  {pastBookings.map((b) => (
                    <HistoryItem
                      key={b.id}
                      booking={b}
                      photographer={photographers[b.photographerId]}
                    />
                  ))}
                </View>
              )}
            </View>
          )}

          <View style={{ height: 40 }} />
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    paddingHorizontal: spacing[6],
    paddingTop: spacing[4],
    paddingBottom: spacing[4],
  },
  headerSub: {
    fontSize: 10,
    fontWeight: fontWeights.bold,
    color: colors.accent,
    letterSpacing: 2,
    marginBottom: 4,
  },
  title: {
    fontSize: 28,
    fontWeight: fontWeights.bold,
    color: colors.dark,
    fontFamily: Platform.OS === 'ios' ? 'Georgia' : 'serif',
  },
  description: {
    fontSize: fontSizes.sm,
    color: colors.textMuted,
    marginTop: 6,
    lineHeight: 18,
  },
  scrollContent: {
    paddingHorizontal: spacing[6],
    paddingBottom: spacing[8],
  },
  upcomingFeed: {
    gap: spacing[5],
    paddingTop: spacing[2],
  },
  card: {
    backgroundColor: '#f3ecd8',
    borderRadius: 24,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(26,26,15,0.12)',
    shadowColor: colors.clay,
    shadowOpacity: 0.18,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 8 },
    elevation: 3,
  },
  cardCoverContainer: {
    height: 150,
    width: '100%',
    position: 'relative',
    backgroundColor: '#ece9db',
  },
  cardCover: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  coverDarkOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(26,26,15,0.15)',
  },
  dateTag: {
    position: 'absolute',
    left: 16,
    top: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: 'rgba(255,247,225,0.92)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(26,26,15,0.08)',
  },
  dateTagDay: {
    fontSize: 26,
    fontWeight: '300',
    color: colors.dark,
    fontFamily: Platform.OS === 'ios' ? 'Georgia' : 'serif',
    marginRight: 2,
  },
  dateTagMonth: {
    fontSize: 9,
    fontWeight: fontWeights.bold,
    color: colors.dark,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  dateTagTime: {
    fontSize: 10,
    color: colors.accent,
    fontWeight: fontWeights.bold,
    marginTop: 1,
  },
  statusBadgeOverlay: {
    position: 'absolute',
    right: 16,
    top: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.25)',
  },
  statusTextOverlay: {
    fontSize: 10,
    fontWeight: fontWeights.bold,
  },
  cardBody: {
    padding: spacing[5],
    gap: spacing[4],
  },
  photographerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  pAvatar: {
    width: 38,
    height: 38,
    borderRadius: 19,
    borderWidth: 1.5,
    borderColor: colors.clayLight,
  },
  pInfo: {
    flex: 1,
  },
  pRole: {
    fontSize: 8,
    fontWeight: fontWeights.bold,
    color: colors.textLight,
    letterSpacing: 1,
  },
  pName: {
    fontSize: 15,
    fontWeight: fontWeights.bold,
    color: colors.dark,
    marginTop: 1,
  },
  ratingBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#eae1c8',
    borderWidth: 1,
    borderColor: '#d9cfb3',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  ratingText: {
    fontSize: 11,
    fontWeight: fontWeights.bold,
    color: colors.dark,
  },
  conceptContainer: {
    gap: 4,
  },
  conceptLabel: {
    fontSize: 8,
    fontWeight: fontWeights.bold,
    color: colors.accent,
    letterSpacing: 1.2,
  },
  conceptTitle: {
    fontSize: 16,
    fontWeight: fontWeights.bold,
    color: colors.dark,
  },
  conceptMood: {
    fontSize: 12,
    color: colors.textMuted,
    fontStyle: 'italic',
  },
  tipsBox: {
    backgroundColor: '#eae1c8',
    borderRadius: 12,
    borderLeftWidth: 3,
    borderColor: colors.accent,
    padding: 10,
  },
  tipsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 4,
  },
  tipsTitle: {
    fontSize: 11,
    fontWeight: fontWeights.bold,
    color: colors.dark,
  },
  tipsText: {
    fontSize: 11,
    color: colors.textMuted,
    lineHeight: 16,
  },
  footerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    borderColor: 'rgba(26,26,15,0.05)',
    paddingTop: spacing[4],
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
  actionButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  detailBtn: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 999,
    backgroundColor: colors.dark,
  },
  detailBtnText: {
    fontSize: 12,
    fontWeight: fontWeights.semibold,
    color: colors.white,
  },
  cancelBtn: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: 'rgba(207,64,40,0.3)',
  },
  cancelBtnText: {
    fontSize: 12,
    fontWeight: fontWeights.semibold,
    color: colors.accent,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 32,
  },
  polaroidFrame: {
    backgroundColor: '#fffcf2',
    padding: 12,
    paddingBottom: 18,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: 'rgba(26,26,15,0.12)',
    shadowColor: colors.clay,
    shadowOpacity: 0.16,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 6 },
    transform: [{ rotate: '-3deg' }],
    marginBottom: 24,
  },
  polaroidImage: {
    width: 150,
    height: 150,
    borderRadius: 2,
  },
  polaroidCaption: {
    fontFamily: Platform.OS === 'ios' ? 'Georgia' : 'serif',
    fontStyle: 'italic',
    fontSize: 12,
    color: colors.textMuted,
    textAlign: 'center',
    marginTop: 10,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: fontWeights.bold,
    color: colors.dark,
    textAlign: 'center',
    marginBottom: 8,
  },
  emptySub: {
    fontSize: fontSizes.sm,
    color: colors.textMuted,
    textAlign: 'center',
    lineHeight: 20,
    paddingHorizontal: 24,
    marginBottom: 24,
  },
  discoverBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: colors.dark,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 999,
    shadowColor: colors.dark,
    shadowOpacity: 0.1,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
  },
  discoverBtnText: {
    fontSize: 13,
    fontWeight: fontWeights.semibold,
    color: colors.white,
  },
  historySection: {
    marginTop: 32,
    borderTopWidth: 1,
    borderColor: 'rgba(26,26,15,0.06)',
    paddingTop: 20,
  },
  historyHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
  },
  historyTitle: {
    fontSize: 15,
    fontWeight: fontWeights.bold,
    color: colors.dark,
  },
  historyList: {
    gap: 10,
    marginTop: 10,
  },
  historyItemCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#f3ecd8',
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(26,26,15,0.12)',
  },
  historyItemLeft: {
    gap: 4,
  },
  historyItemDate: {
    fontSize: 11,
    color: colors.textLight,
  },
  historyItemName: {
    fontSize: 14,
    fontWeight: fontWeights.semibold,
    color: colors.dark,
  },
  historyItemRight: {
    alignItems: 'flex-end',
    gap: 6,
  },
  historyItemPrice: {
    fontSize: 13,
    fontWeight: fontWeights.bold,
    color: colors.dark,
  },
  historyStatusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  historyStatusText: {
    fontSize: 9,
    fontWeight: fontWeights.bold,
  },
});
