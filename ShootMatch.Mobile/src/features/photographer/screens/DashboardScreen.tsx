import React, { useState, useEffect, useRef } from 'react';
import {
  ScrollView, StyleSheet, Text, View, Pressable, ActivityIndicator, Image,
  RefreshControl, ImageBackground, Dimensions, StatusBar, Platform, FlatList,
  LayoutAnimation, UIManager
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import * as Location from 'expo-location';
import { 
  getPhotographerProfile, 
  getPhotographersFeed,
  setAvailability, 
  getMyBookingsAsPhotographer,
  confirmBooking,
  cancelBooking,
  updateLiveLocation
} from '../api';
import { useAuth } from '../../auth/AuthContext';
import { usePhotographerTheme } from '../PhotographerThemeContext';
import { localPicture } from '../../../shared/assets/localPictures';

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

const { width } = Dimensions.get('window');

const formatPhotoUrl = (url?: string) => {
  if (!url) return '';
  const apiUrl = process.env.EXPO_PUBLIC_API_URL || '';
  if (url.includes('trycloudflare.com') || url.includes('localhost') || url.includes('127.0.0.1')) {
    try {
      const parsed = new URL(url);
      return `${apiUrl}${parsed.pathname}${parsed.search}`;
    } catch (e) {
      return url;
    }
  }
  return url;
};

export default function DashboardScreen() {
  const navigation = useNavigation<any>();
  const insets = useSafeAreaInsets();
  const { colors, isDark } = usePhotographerTheme();
  const styles = getStyles(colors, isDark);

  const { logout } = useAuth();
  const [activeTab, setActiveTab] = useState<0|1|2|3>(0);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [requestsExpanded, setRequestsExpanded] = useState(true);
  const [profile, setProfile] = useState<any>(null);
  const [bookings, setBookings] = useState<any[]>([]);
  const [feed, setFeed] = useState<any[]>([]);
  const [myPhotos, setMyPhotos] = useState<{ url: string; aspectRatio: number }[]>([]);
  const [activeFeedIndex, setActiveFeedIndex] = useState(0);
  const [portfolioPreviewIndex, setPortfolioPreviewIndex] = useState(0);
  const feedRef = useRef<FlatList<any>>(null);
  const portfolioTimer = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    return () => {
      if (portfolioTimer.current) clearInterval(portfolioTimer.current);
    };
  }, []);

  async function loadData() {
    setLoading(true);
    try {
      const [p, b, f] = await Promise.all([
        getPhotographerProfile(),
        getMyBookingsAsPhotographer(),
        getPhotographersFeed()
      ]);
      setProfile(p);
      setBookings(b);
      setFeed(f.filter(x => !p || x.id !== p.id));

      if (p && p.portfolioPhotos && p.portfolioPhotos.length > 0) {
        const photosWithMeta = await Promise.all(
          p.portfolioPhotos.map(async (url: string) => {
            const displayUrl = formatPhotoUrl(url);
            return new Promise<{ url: string; aspectRatio: number }>(resolve => {
              Image.getSize(
                displayUrl,
                (w, h) => {
                  resolve({ url, aspectRatio: w > 0 && h > 0 ? w / h : 1 });
                },
                () => {
                  resolve({ url, aspectRatio: 1 });
                }
              );
            });
          })
        );
        setMyPhotos(photosWithMeta);
      } else {
        setMyPhotos([]);
      }
    } catch (err) {
      console.error('Dashboard load error:', err);
    } finally {
      setLoading(false);
    }
  }

  async function handleRefresh() {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  }

  async function toggleAvailability() {
    if (!profile) return;
    const newVal = !profile.isAvailable;
    
    // Smooth layout animation transition
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    
    // Optimistic UI update
    setProfile({ ...profile, isAvailable: newVal });

    try {
      await setAvailability(newVal);
      
      if (newVal) {
        // Khi bật Sẵn sàng nhận job, tiến hành lấy GPS và báo lên server
        try {
          if (Platform.OS === 'web') {
            await new Promise<GeolocationPosition>((resolve, reject) => {
              if (!navigator?.geolocation) { reject(new Error('no geolocation')); return; }
              navigator.geolocation.getCurrentPosition(resolve, reject);
            }).then(async pos => {
              await updateLiveLocation(pos.coords.latitude, pos.coords.longitude);
            });
          } else {
            const { status } = await Location.requestForegroundPermissionsAsync();
            if (status === 'granted') {
              const location = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
              await updateLiveLocation(location.coords.latitude, location.coords.longitude);
            }
          }
        } catch (locErr) {
          console.error('Failed to update live location', locErr);
        }
      }
    } catch (err) {
      console.error('Toggle availability error:', err);
      // Revert if API call fails
      LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
      setProfile({ ...profile, isAvailable: !newVal });
    }
  }

  if (loading && !refreshing) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.accent} />
      </View>
    );
  }

  const pendingBookings = bookings.filter(b => b.status === 'Pending');
  const upcomingBookings = bookings.filter(b => b.status === 'Confirmed' || b.status === 'Paid');

  const isAvailable = profile?.isAvailable ?? true;

  const currentMonth = new Date().getMonth();
  const currentMonthBookings = bookings.filter(b => new Date(b.scheduledAt).getMonth() === currentMonth);
  const currentMonthEarnings = currentMonthBookings
    .filter(b => b.status === 'Completed' || b.status === 'Paid')
    .reduce((sum, b) => sum + (b.agreedPrice || 0), 0);
  
  const formattedEarnings = currentMonthEarnings > 0 ? (currentMonthEarnings / 1000000).toFixed(1) + 'M' : '0₫';
  const rawEarnings = currentMonthEarnings > 0 ? currentMonthEarnings.toLocaleString() : '0';
  const progressRatio = Math.min(1, currentMonthEarnings / 15000000);
  const needlePosition = `${10 + progressRatio * 80}%` as any;

  const portfolioPhotos = profile?.portfolioPhotos ?? [];
  const activePhotographer = feed[activeFeedIndex] ?? profile;
  const activePortfolioPhotos = activePhotographer?.portfolioPhotos ?? portfolioPhotos;
  const heroPhoto = activePortfolioPhotos[portfolioPreviewIndex] ?? activePhotographer?.coverPhotoUrl ?? activePhotographer?.avatarUrl;

  const startPortfolioPreview = () => {
    if (activePortfolioPhotos.length < 2) return;
    if (portfolioTimer.current) clearInterval(portfolioTimer.current);
    portfolioTimer.current = setInterval(() => {
      setPortfolioPreviewIndex(prev => (prev + 1) % activePortfolioPhotos.length);
    }, 850);
  };

  const stopPortfolioPreview = () => {
    if (portfolioTimer.current) {
      clearInterval(portfolioTimer.current);
      portfolioTimer.current = null;
    }
  };

  const handleSwipeEnd = (index: number) => {
    setActiveFeedIndex(index);
    setPortfolioPreviewIndex(0);
    stopPortfolioPreview();
  };

  const quickActions = [
    {
      label: 'Gói Dịch Vụ',
      sub: 'Báo giá & thiết lập',
      icon: 'pricetags-outline',
      target: 'ServiceManagement',
      image: localPicture(6),
      filmCode: 'PORTRA 400',
      frameNum: '01',
    },
    {
      label: 'Portfolio',
      sub: 'Cập nhật bộ ảnh',
      icon: 'images-outline',
      target: 'Portfolio',
      image: localPicture(2),
      filmCode: 'PORTRA 400',
      frameNum: '02',
    },
    {
      label: 'Thiết Bị Chụp',
      sub: 'Máy ảnh & phụ kiện',
      icon: 'camera-reverse-outline',
      target: 'ManageEquipment',
      image: localPicture(8),
      filmCode: 'KODAK 507D',
      frameNum: '03',
    },
    {
      label: 'Tùy biến lịch của bạn',
      sub: 'Xem & xếp lịch',
      icon: 'calendar-outline',
      target: 'BookingCalendar',
      image: localPicture(15),
      filmCode: 'KODAK 507D',
      frameNum: '04',
    },
    {
      label: 'Hồ Sơ',
      sub: 'Chỉnh sửa thông tin',
      icon: 'settings-outline',
      target: 'PProfile',
      image: localPicture(20),
      filmCode: 'TRI-X 400',
      frameNum: '05',
    },
    {
      label: 'Trò Chuyện',
      sub: 'Tin nhắn khách hàng',
      icon: 'chatbubbles-outline',
      target: 'PChat',
      image: localPicture(22),
      filmCode: 'TRI-X 400',
      frameNum: '06',
    },
  ];

  return (
    <View style={styles.container}>
      <StatusBar barStyle={isDark ? "light-content" : "dark-content"} backgroundColor="transparent" translucent />
      
      <ScrollView 
        contentContainerStyle={styles.scroll} 
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor={colors.accent} />}
      >
        {/* ── HERO ── */}
        <View style={styles.hero}>
          <ImageBackground 
            source={{ uri: 'https://images.unsplash.com/photo-1452587925148-ce544e77e70d?q=80&w=1000&auto=format&fit=crop' }} 
            style={[styles.heroBg, { paddingTop: insets.top }]}
            imageStyle={{ opacity: 0.55 }}
          >
            {/* Top Bar */}
            <View style={styles.topbar}>
              <Pressable 
                style={({ pressed }) => [
                  styles.availPill, 
                  !isAvailable && styles.availPillOff,
                  pressed && { opacity: 0.8, transform: [{ scale: 0.95 }] }
                ]} 
                onPress={toggleAvailability}
              >
                <View style={[styles.availDot, !isAvailable && styles.availDotOff]} />
                <Text style={[styles.availText, !isAvailable && styles.availTextOff]}>
                  {isAvailable ? 'Đang Nhận Job' : 'Tạm Nghỉ'}
                </Text>
              </Pressable>
              
              <View style={styles.topActions}>
                <Pressable 
                  style={({ pressed }) => [
                    styles.iconBtnNotif,
                    pressed && { opacity: 0.7, transform: [{ scale: 0.9 }] }
                  ]} 
                  onPress={() => navigation.navigate('Notifications')}
                >
                  <Ionicons name="notifications-outline" size={18} color="#FFFFFF" />
                  <View style={styles.notifDot} />
                </Pressable>
                <Pressable 
                  style={({ pressed }) => [
                    styles.iconBtnLogout,
                    pressed && { opacity: 0.7, transform: [{ scale: 0.9 }] }
                  ]} 
                  onPress={logout}
                >
                  <Ionicons name="power-outline" size={18} color="#f87171" />
                </Pressable>
              </View>
            </View>

            {/* Main Title */}
            <View style={styles.heroMain}>
              <Animated.Text entering={FadeInUp.delay(100)} style={styles.heroEyebrow}>Xin Chào, Nhiếp Ảnh Gia</Animated.Text>
              <Animated.Text entering={FadeInUp.delay(200)} style={styles.heroName}>
                {(profile?.displayName || 'Nhiếp ảnh gia').toUpperCase()}
              </Animated.Text>
              <Animated.Text entering={FadeInUp.delay(300)} style={styles.heroStudio}>
                {profile?.studioName || 'PIC-KIC STUDIO'}
              </Animated.Text>
              <Animated.Text entering={FadeInUp.delay(400)} style={styles.heroDesc}>
                Cộng đồng PicKic đang chờ tài năng của bạn. Mỗi khoảnh khắc là một kiệt tác.
              </Animated.Text>
              
              <Animated.View entering={FadeInUp.delay(500)} style={styles.heroCtas}>
                <Pressable style={styles.ctaPrimary} onPress={() => profile && navigation.navigate('PhotographerPortfolio', { photographer: profile })}>
                  <Ionicons name="images" size={16} color="#FFFBF0" />
                  <Text style={styles.ctaPrimaryText}>PORTFOLIO</Text>
                </Pressable>
                <Pressable style={styles.ctaSecondary} onPress={() => navigation.navigate('BookingCalendar')}>
                  <Ionicons name="calendar" size={16} color="#FFFFFF" />
                  <Text style={styles.ctaSecondaryText}>LỊCH</Text>
                </Pressable>
              </Animated.View>
            </View>


          </ImageBackground>
        </View>

        {/* ── MAIN ── */}
        <View style={styles.mainContent}>
          
          {/* Stats Viewfinder Card */}
          <Animated.View entering={FadeInDown.delay(100)} style={styles.section}>
            <View style={styles.sectionHead}>
              <Text style={styles.sectionTitle}>Tổng Quan</Text>
              <Text style={styles.seeAll}>Tháng {currentMonth + 1}</Text>
            </View>
            <View style={styles.viewfinderCard}>
              {/* Rule of Thirds Grid Lines */}
              <View style={styles.viewfinderGridH1} />
              <View style={styles.viewfinderGridH2} />
              <View style={styles.viewfinderGridV1} />
              <View style={styles.viewfinderGridV2} />

              {/* Corner Brackets */}
              <View style={[styles.bracket, styles.bracketTopLeft]} />
              <View style={[styles.bracket, styles.bracketTopRight]} />
              <View style={[styles.bracket, styles.bracketBottomLeft]} />
              <View style={[styles.bracket, styles.bracketBottomRight]} />

              {/* Camera Status HUD (Top Bar) */}
              <View style={styles.hudHeader}>
                <View style={styles.hudModeBadge}>
                  <Text style={styles.hudModeText}>{isAvailable ? 'AF-S M' : 'AF-S P'}</Text>
                </View>
                <Text style={styles.hudSettingsText}>THÁNG {currentMonth + 1} · {new Date().getFullYear()}</Text>
                <Text style={styles.hudSettingsText}>RAW+JPEG</Text>
              </View>

              {/* Central Viewfinder Circle */}
              <View style={styles.hudCentralCircle}>
                <View style={styles.hudCentralDot} />
              </View>

              {/* Viewfinder Metrics */}
              <View style={styles.viewfinderRow}>
                <View style={styles.viewfinderCol}>
                  <Text style={styles.viewfinderLabel}>DOANH THU THÁNG</Text>
                  <Text style={styles.viewfinderValue}>{rawEarnings} ₫</Text>
                  <Text style={styles.viewfinderSub}>Đã thanh toán & hoàn tất</Text>
                </View>

                <View style={styles.viewfinderDivider} />

                <View style={styles.viewfinderCol}>
                  <Text style={styles.viewfinderLabel}>LỊCH TRÌNH CHỤP</Text>
                  <Text style={styles.viewfinderValue}>
                    {currentMonthBookings.length.toString().padStart(2, '0')} <Text style={{ fontSize: 13, color: colors.textMuted }}>/ 36 FRAME</Text>
                  </Text>
                  <Text style={styles.viewfinderSub}>Buổi chụp tháng này</Text>
                </View>
              </View>

              {/* Exposure Meter (Light Meter) */}
              <View style={styles.exposureScaleContainer}>
                <View style={{ width: '80%', position: 'relative', height: 16 }}>
                  {/* Sliding Exposure Needle */}
                  <View style={[styles.exposureNeedle, { left: needlePosition }]} />
                  <View style={styles.exposureTicksRow}>
                    <View style={[styles.exposureTick, styles.exposureTickMajor]} />
                    <View style={styles.exposureTick} />
                    <View style={styles.exposureTick} />
                    <View style={[styles.exposureTick, styles.exposureTickMajor]} />
                    <View style={styles.exposureTick} />
                    <View style={styles.exposureTick} />
                    <View style={[styles.exposureTick, styles.exposureTickMajor]} />
                  </View>
                </View>
                <View style={styles.exposureLabelsRow}>
                  <Text style={styles.exposureLabelText}>-2 EV (UNDER)</Text>
                  <Text style={[styles.exposureLabelText, progressRatio >= 0.5 && styles.exposureLabelTextActive]}>-1 EV</Text>
                  <Text style={[styles.exposureLabelText, progressRatio >= 1.0 && styles.exposureLabelTextActive]}>0 EV (PERFECT)</Text>
                </View>
              </View>
            </View>
          </Animated.View>

          {/* Artistic Inspiration Card */}
          <Animated.View entering={FadeInDown.delay(150)} style={styles.section}>
            <View style={styles.quoteCard}>
              <ImageBackground
                source={{ uri: 'https://images.unsplash.com/photo-1488646953014-85cb44e25828?q=80&w=600&auto=format&fit=crop' }}
                style={styles.quoteBg}
                imageStyle={{ opacity: 0.15, borderRadius: 18 }}
              >
                <View style={styles.quoteContent}>
                  <Ionicons name="color-wand-outline" size={20} color={colors.accent} style={styles.quoteIcon} />
                  <Text style={styles.quoteText}>
                    "Mỗi bức ảnh là một lát cắt của thời gian, một khoảnh khắc được giữ lại mãi mãi để kể câu chuyện của riêng nó."
                  </Text>
                  <Text style={styles.quoteAuthor}>— Góc Cảm Hứng Nghệ Thuật</Text>
                </View>
              </ImageBackground>
            </View>
          </Animated.View>

          {/* New Requests */}
          {pendingBookings.length > 0 && (
            <Animated.View entering={FadeInDown.delay(200)} style={styles.section}>
              <View style={styles.sectionHead}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                  <Text style={styles.sectionTitle}>Yêu Cầu Mới</Text>
                  <View style={styles.pendingBadgeCount}>
                    <Text style={styles.pendingBadgeCountText}>{pendingBookings.length}</Text>
                  </View>
                </View>
                <Pressable 
                  style={{ 
                    paddingHorizontal: 12, 
                    paddingVertical: 6, 
                    borderRadius: 999, 
                    borderWidth: 1, 
                    borderColor: colors.border, 
                    backgroundColor: colors.surfaceStrong 
                  }} 
                  onPress={() => setRequestsExpanded(prev => !prev)}
                >
                  <Text style={{ fontSize: 11, fontWeight: '700', color: colors.text }}>
                    {requestsExpanded ? 'Thu gọn' : 'Mở rộng'}
                  </Text>
                </Pressable>
              </View>
              
              {requestsExpanded && pendingBookings.map((b, idx) => (
                <View key={b.id} style={[styles.reqCard, idx > 0 && { marginTop: 8 }]}>
                  <Image 
                    source={{ uri: b.servicePackageImageUrl ? formatPhotoUrl(b.servicePackageImageUrl) : 'https://images.unsplash.com/photo-1542038784456-1ea8e935640e?q=80&w=600&auto=format&fit=crop' }} 
                    style={styles.reqImg} 
                  />
                  <View style={styles.reqInfo}>
                    <Text style={styles.reqTitle} numberOfLines={1}>{b.customerName || `Khách hàng #${b.customerId.slice(0, 5)}`}</Text>
                    <Text style={styles.reqPackage} numberOfLines={1}>
                      {b.servicePackageName || b.requirements || 'Gói chụp riêng'}
                    </Text>
                    <View style={styles.reqMetaRow}>
                      <Ionicons name="time-outline" size={10} color={colors.textMuted} />
                      <Text style={styles.reqMetaText} numberOfLines={1}>
                        {new Date(b.scheduledAt).toLocaleDateString('vi-VN')} · {new Date(b.scheduledAt).toLocaleTimeString('vi-VN', {hour:'2-digit', minute:'2-digit'})}
                      </Text>
                    </View>
                    <Text style={styles.reqPrice}>{b.agreedPrice?.toLocaleString()}₫</Text>
                  </View>
                  <View style={styles.reqActionCol}>
                    <Pressable style={styles.btnAcceptSmall} onPress={async () => { await confirmBooking(b.id); handleRefresh(); }}>
                      <Text style={styles.btnAcceptTextSmall}>✓ Nhận</Text>
                    </Pressable>
                    <Pressable style={styles.btnRefuseSmall} onPress={async () => { await cancelBooking(b.id, 'Busy'); handleRefresh(); }}>
                      <Text style={styles.btnRefuseTextSmall}>✕ Hủy</Text>
                    </Pressable>
                  </View>
                </View>
              ))}
            </Animated.View>
          )}

          {/* Schedule */}
          <Animated.View entering={FadeInDown.delay(300)} style={styles.section}>
            <View style={styles.sectionHead}>
              <Text style={styles.sectionTitle}>Lịch Hôm Nay</Text>
              <Pressable onPress={() => navigation.navigate('BookingCalendar')}><Text style={styles.seeAll}>Xem tất cả</Text></Pressable>
            </View>
            <View style={styles.schedList}>
              {upcomingBookings.length > 0 ? upcomingBookings.map((b, idx) => {
                const isFirst = idx === 0;
                const d = new Date(b.scheduledAt);
                return (
                  <Pressable key={b.id} style={[styles.schedCard, isFirst && styles.schedCardActive]}>
                    <View style={[styles.schedBadge, isFirst && styles.schedBadgeActive]}>
                      <Text style={[styles.schedTime, isFirst && styles.schedTimeActive]}>{d.getHours()}:{d.getMinutes().toString().padStart(2, '0')}</Text>
                      <Text style={[styles.schedAmpm, isFirst && styles.schedAmpmActive]}>{d.getHours() >= 12 ? 'chiều' : 'sáng'}</Text>
                    </View>
                    <View style={styles.schedInfo}>
                      <Text style={styles.schedName}>{b.customerName || `Khách hàng #${b.customerId.slice(0,4)}`}</Text>
                      <Text style={styles.schedSub} numberOfLines={1}>
                        {b.servicePackageName || b.requirements || 'Gói chụp riêng'} · {b.status}
                      </Text>
                    </View>
                    <View style={styles.schedRight}>
                      <Text style={styles.schedPrice}>{b.agreedPrice?.toLocaleString()}₫</Text>
                      {isFirst && <Text style={styles.schedStatusText}>Sắp tới</Text>}
                    </View>
                  </Pressable>
                );
              }) : (
                <View style={styles.emptySched}>
                  <Text style={styles.emptySchedText}>Chưa có lịch hẹn nào sắp tới</Text>
                </View>
              )}
            </View>
          </Animated.View>

          {/* ── MY PORTFOLIO GALLERY STRIP ── */}
          <Animated.View entering={FadeInDown.delay(350)} style={styles.section}>
            <View style={styles.sectionHead}>
              <Text style={styles.sectionTitle}>Tác Phẩm Của Tôi</Text>
              <Pressable onPress={() => navigation.navigate('PhotographerPortfolio', { photographer: profile })}>
                <Text style={styles.seeAll}>Xem tất cả</Text>
              </Pressable>
            </View>

            {myPhotos.length > 0 ? (
              <ScrollView 
                horizontal 
                showsHorizontalScrollIndicator={false} 
                contentContainerStyle={styles.portfolioStrip}
              >
                {myPhotos.map((item, idx) => {
                  const cardHeight = 160;
                  const calculatedWidth = cardHeight * item.aspectRatio;
                  const cardWidth = Math.max(120, Math.min(240, calculatedWidth));
                  const isPortrait = item.aspectRatio < 0.95;

                  return (
                    <Pressable
                      key={idx}
                      style={[styles.portfolioSlideMount, { width: cardWidth }]}
                      onPress={() => navigation.navigate('PhotographerPortfolio', { photographer: profile })}
                    >
                      <View style={styles.portfolioSlideInner}>
                        <Image
                          source={{ uri: formatPhotoUrl(item.url) }}
                          style={StyleSheet.absoluteFillObject}
                          resizeMode="cover"
                        />
                      </View>
                      <View style={styles.portfolioSlideMeta}>
                        <Text style={styles.portfolioSlideText}>FRAME {String(idx + 1).padStart(2, '0')}</Text>
                        <Text style={styles.portfolioSlideSpec}>
                          {isPortrait ? 'PORTRAIT · 3:4' : 'LANDSCAPE · 4:3'}
                        </Text>
                      </View>
                    </Pressable>
                  );
                })}
              </ScrollView>
            ) : (
              <Pressable 
                style={styles.portfolioEmptyBox} 
                onPress={() => navigation.navigate('Portfolio')}
              >
                <Ionicons name="images-outline" size={24} color={colors.textMuted} />
                <Text style={styles.portfolioEmptyText}>Chưa có ảnh trong portfolio</Text>
                <Text style={styles.portfolioEmptySub}>Nhấn vào đây để tải lên tác phẩm đầu tiên của bạn</Text>
              </Pressable>
            )}
          </Animated.View>

          {/* ── MODE TABS ── */}
          <Animated.View entering={FadeInDown.delay(400)} style={[styles.section, styles.tabSection, styles.tabFrame]}>
            {/* Tab Header */}
            <View style={styles.modeTabHeader}>
              {[
                { label: 'Portfolio Mới', icon: 'images-outline' as const },
                { label: 'Trend Chụp', icon: 'trending-up-outline' as const },
                { label: 'Thiết Bị Mới', icon: 'camera-outline' as const },
                { label: 'Thao Tác Nhanh', icon: 'flash-outline' as const },
              ].map((tab, i) => (
                <Pressable
                  key={i}
                  style={[styles.modeTabBtn, activeTab === i && styles.modeTabBtnActive]}
                  onPress={() => setActiveTab(i as 0|1|2|3)}
                >
                  <Ionicons
                    name={tab.icon}
                    size={14}
                    color={activeTab === i ? '#FFFFFF' : colors.textMuted}
                  />
                  <Text style={[styles.modeTabLabel, activeTab === i && styles.modeTabLabelActive]}>
                    {tab.label}
                  </Text>
                </Pressable>
              ))}
            </View>

            {/* TAB 0 — Photographer deck swipe */}
            {activeTab === 0 && (
              <View style={[styles.modeTabContent, styles.cardStageWrap]}>
                <FlatList
                  ref={feedRef}
                  horizontal
                  pagingEnabled
                  showsHorizontalScrollIndicator={false}
                  data={feed.length > 0 ? feed : (profile ? [profile] : [])}
                  keyExtractor={(item) => item.id}
                  snapToInterval={width * 0.8 + 12}
                  snapToAlignment="start"
                  decelerationRate="fast"
                  contentContainerStyle={styles.cardDeckStrip}
                  renderItem={({ item, index }) => {
                    const cardPhotos = item.portfolioPhotos ?? [];
                    const currentHero = cardPhotos[portfolioPreviewIndex] ?? item.coverPhotoUrl ?? item.avatarUrl;
                    return (
                      <Pressable
                        style={[styles.cardStage, { width: width * 0.78, height: 540 }]}
                        onPress={() => navigation.navigate('PhotographerPortfolio', { photographer: item })}
                        onLongPress={startPortfolioPreview}
                        onPressOut={stopPortfolioPreview}
                        delayLongPress={160}
                      >
                        <ImageBackground
                          source={{ uri: formatPhotoUrl(currentHero) }}
                          style={styles.cardSurface}
                          imageStyle={styles.cardSurfaceImage}
                        >
                          <View style={styles.cardNoise} />
                          <View style={styles.cardHeader}>
                            <View style={styles.avatarFrame}>
                              <Image source={{ uri: formatPhotoUrl(item.avatarUrl) }} style={styles.avatarImg} />
                            </View>
                            <View style={styles.cardIdentity}>
                              <Text style={styles.cardName}>{item.displayName}</Text>
                              <Text style={styles.cardMeta}>{item.region || 'Vietnam'} · {item.rating?.toFixed?.(1) ?? '4.9'}★</Text>
                            </View>
                            <View style={styles.cardChip}><Text style={styles.cardChipText}>{cardPhotos.length} ảnh</Text></View>
                          </View>

                          <View style={styles.cardQuoteBlock}>
                            <Text style={styles.cardQuote}>{item.quote || item.bio || 'Không có mô tả'}</Text>
                          </View>

                          <View style={styles.cardBody}>
                            <View style={styles.pinterestColA}>
                              <ImageBackground source={{ uri: formatPhotoUrl(cardPhotos[0] || currentHero) }} style={[styles.pinterestPhoto, styles.photoTall]} imageStyle={styles.photoImg} />
                              <ImageBackground source={{ uri: formatPhotoUrl(cardPhotos[1] || currentHero) }} style={[styles.pinterestPhoto, styles.photoShort]} imageStyle={styles.photoImg} />
                            </View>
                            <View style={styles.pinterestColB}>
                              <ImageBackground source={{ uri: formatPhotoUrl(cardPhotos[2] || currentHero) }} style={[styles.pinterestPhoto, styles.photoWide]} imageStyle={styles.photoImg} />
                              <ImageBackground source={{ uri: formatPhotoUrl(cardPhotos[3] || currentHero) }} style={[styles.pinterestPhoto, styles.photoTallSmall]} imageStyle={styles.photoImg} />
                            </View>
                          </View>

                          <View style={styles.cardFooter}>
                            <View>
                              <Text style={styles.cardFooterLabel}>Quẹt sang</Text>
                              <Text style={styles.cardFooterValue}>{index + 1} / {feed.length > 0 ? feed.length : 1}</Text>
                            </View>
                            <Pressable style={styles.cardMenuBtn} onPress={() => navigation.navigate('PProfile')}>
                              <Ionicons name="ellipsis-horizontal" size={16} color="#FFF3D8" />
                            </Pressable>
                          </View>
                        </ImageBackground>
                      </Pressable>
                    );
                  }}
                  onMomentumScrollEnd={(e) => {
                    const idx = Math.round(e.nativeEvent.contentOffset.x / (width * 0.8 + 12));
                    handleSwipeEnd(Math.max(0, Math.min(idx, (feed.length > 0 ? feed.length : 1) - 1)));
                  }}
                />
                <Pressable style={styles.tabActionBtn} onPress={() => navigation.navigate('PhotographerPortfolio', { photographer: activePhotographer })}>
                  <Ionicons name="grid-outline" size={14} color="#FFFFFF" />
                  <Text style={styles.tabActionBtnText}>MỞ THƯ VIỆN PORTFOLIO</Text>
                </Pressable>
              </View>
            )}

            {/* TAB 1 — Xu hướng chụp mới */}
            {activeTab === 1 && (
              <View style={styles.modeTabContent}>
                {[
                  { title: 'Film Grain & Analog', sub: 'Phong cách ảnh phim 35mm đang trở lại mạnh mẽ', tag: 'HOT', img: localPicture(3) },
                  { title: 'Golden Hour Portraits', sub: 'Chân dung ánh vàng giờ hoàng hôn — màu sắc tự nhiên', tag: 'TRENDING', img: localPicture(11) },
                  { title: 'Brutalist Compositions', sub: 'Bố cục táo bạo, góc nhìn bất thường, gây shock thị giác', tag: 'AVANT-GARDE', img: localPicture(18) },
                  { title: 'Motion Blur & Bokeh', sub: 'Hiệu ứng chuyển động mờ kết hợp bokeh đẹp như tranh', tag: 'POPULAR', img: localPicture(25) },
                ].map((trend, i) => (
                  <View key={i} style={styles.trendRow}>
                    <ImageBackground source={trend.img} style={styles.trendThumb} imageStyle={{ borderRadius: 8, opacity: 0.85 }}>
                      <View style={styles.trendThumbOverlay} />
                    </ImageBackground>
                    <View style={styles.trendInfo}>
                      <View style={styles.trendTag}>
                        <Text style={styles.trendTagText}>{trend.tag}</Text>
                      </View>
                      <Text style={styles.trendTitle}>{trend.title}</Text>
                      <Text style={styles.trendSub}>{trend.sub}</Text>
                    </View>
                  </View>
                ))}
              </View>
            )}

            {/* TAB 2 — Thiết bị mới */}
            {activeTab === 2 && (
              <View style={styles.modeTabContent}>
                {[
                  { name: 'Sony A7C II', type: 'Mirrorless', spec: '33MP · 4K120 · IBIS 7 stops', icon: 'camera' as const },
                  { name: 'Sigma 35mm f/1.4 DG', type: 'Lens', spec: 'Art Series · Bokeh Tinh Tế', icon: 'aperture-outline' as const },
                  { name: 'DJI RS4 Pro', type: 'Gimbal', spec: '3-axis · 10kg payload · AI tracking', icon: 'navigate-outline' as const },
                  { name: 'Godox V860III', type: 'Flash', spec: '76Wh · TTL · HSS · 1.5s recycle', icon: 'flash-outline' as const },
                ].map((gear, i) => (
                  <Pressable key={i} style={styles.gearRow} onPress={() => navigation.navigate('ManageEquipment')}>
                    <View style={styles.gearIcon}>
                      <Ionicons name={gear.icon} size={20} color={colors.accent} />
                    </View>
                    <View style={styles.gearInfo}>
                      <View style={styles.gearNameRow}>
                        <Text style={styles.gearName}>{gear.name}</Text>
                        <Text style={styles.gearType}>{gear.type}</Text>
                      </View>
                      <Text style={styles.gearSpec}>{gear.spec}</Text>
                    </View>
                    <Ionicons name="chevron-forward" size={14} color={colors.textLight} />
                  </Pressable>
                ))}
                <Pressable style={styles.tabActionBtn} onPress={() => navigation.navigate('ManageEquipment')}>
                  <Ionicons name="list-outline" size={14} color="#FFFFFF" />
                  <Text style={styles.tabActionBtnText}>XEM THIẾT BỊ CỦA TÔI</Text>
                </Pressable>
              </View>
            )}

            {/* TAB 3 — Thao tác nhanh (Slide Mounts) */}
            {activeTab === 3 && (
              <View style={styles.lightTableGrid}>
                {quickActions.map((action, index) => {
                  const rotations = ['-1.5deg', '2deg', '1deg', '-1deg', '1.5deg', '-2deg'];
                  const rotateVal = rotations[index % rotations.length];
                  return (
                    <Pressable
                      key={action.label}
                      style={[styles.slideMount, { transform: [{ rotate: rotateVal }] }]}
                      onPress={() => navigation.navigate(action.target)}
                    >
                      <View style={styles.slideMountInner}>
                        <ImageBackground
                          source={action.image}
                          style={styles.slideImageBg}
                          imageStyle={{ opacity: 0.8 }}
                        >
                          <View style={styles.slideOverlay}>
                            <Ionicons name={action.icon as any} size={20} color="#FFFFFF" style={styles.slideIcon} />
                          </View>
                        </ImageBackground>
                      </View>
                      <Text style={styles.slideLabel}>{action.label}</Text>
                      <Text style={styles.slideSub}>{action.sub}</Text>
                    </Pressable>
                  );
                })}
              </View>
            )}
          </Animated.View>

          {/* End of Deck Footer */}
          <Animated.View entering={FadeInDown.delay(200)} style={styles.endcapCard}>
            <ImageBackground
              source={{ uri: 'https://images.unsplash.com/photo-1516035069371-29a1b244cc32?q=80&w=600&auto=format&fit=crop' }}
              style={styles.endcapBg}
              imageStyle={{ opacity: 0.12, borderRadius: 18 }}
            >
              <View style={styles.endcapContent}>
                <Ionicons name="images-outline" size={20} color={colors.accent} style={styles.endcapIcon} />
                <Text style={styles.endcapText}>
                  "Mỗi photographer là một cách nhìn, quẹt sang để tiếp tục hành trình."
                </Text>
                <Text style={styles.endcapAuthor}>— End of deck</Text>
              </View>
            </ImageBackground>
          </Animated.View>

          <View style={{ height: 100 }} />
        </View>
      </ScrollView>
    </View>
  );
}

const getStyles = (colors: any, isDark: boolean) => StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.background },
  scroll: { flexGrow: 1 },
  
  hero: { minHeight: 480, backgroundColor: '#000' },
  heroBg: { flex: 1, resizeMode: 'cover', justifyContent: 'space-between', paddingBottom: 24, backgroundColor: '#000' },
  
  topbar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingTop: 10 },
  availPill: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: 'rgba(0,0,0,0.6)', borderWidth: 1, borderColor: '#4ade80', borderRadius: 20, paddingVertical: 8, paddingHorizontal: 14 },
  availPillOff: { backgroundColor: 'rgba(0,0,0,0.6)', borderColor: '#f87171' },
  availDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: '#4ade80' },
  availDotOff: { backgroundColor: '#f87171' },
  availText: { fontSize: 10, fontWeight: '700', letterSpacing: 0.8, textTransform: 'uppercase', color: '#4ade80' },
  availTextOff: { color: '#f87171' },
  
  topActions: { flexDirection: 'row', gap: 8 },
  iconBtnNotif: { width: 38, height: 38, borderRadius: 19, backgroundColor: 'rgba(0,0,0,0.6)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.3)', justifyContent: 'center', alignItems: 'center' },
  iconBtnLogout: { width: 38, height: 38, borderRadius: 19, backgroundColor: 'rgba(0,0,0,0.6)', borderWidth: 1, borderColor: 'rgba(248,113,113,0.5)', justifyContent: 'center', alignItems: 'center' },
  notifDot: { position: 'absolute', top: 8, right: 8, width: 6, height: 6, borderRadius: 3, backgroundColor: colors.accent },

  heroMain: { alignItems: 'center', paddingHorizontal: 20, marginTop: 40 },
  heroEyebrow: { fontSize: 9, fontWeight: '700', letterSpacing: 3, textTransform: 'uppercase', color: 'rgba(255,255,255,0.7)', marginBottom: 14 },
  heroName: { fontSize: 42, color: '#FFFFFF', fontWeight: '900', letterSpacing: 1, textAlign: 'center' },
  heroStudio: { fontSize: 16, color: colors.accent, fontWeight: '800', letterSpacing: 1, marginTop: 4, marginBottom: 16 },
  heroDesc: { fontSize: 11, color: 'rgba(255,255,255,0.7)', textAlign: 'center', lineHeight: 18, maxWidth: 260, marginBottom: 24 },
  
  heroCtas: { flexDirection: 'row', gap: 10, justifyContent: 'center' },
  ctaPrimary: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: colors.accent, paddingVertical: 12, paddingHorizontal: 20, borderRadius: 30, shadowColor: colors.accent, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 10, elevation: 6 },
  ctaPrimaryText: { fontSize: 10, fontWeight: '800', letterSpacing: 1, color: '#FFFBF0' },
  ctaSecondary: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: 'rgba(255,255,255,0.15)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.3)', paddingVertical: 12, paddingHorizontal: 20, borderRadius: 30 },
  ctaSecondaryText: { fontSize: 10, fontWeight: '700', letterSpacing: 1, color: '#FFFFFF' },

  heroStatsRow: { flexDirection: 'row', marginHorizontal: 20, backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: 0, marginTop: 40, borderWidth: 1, borderColor: 'rgba(255,255,255,0.15)' },
  hstat: { flex: 1, paddingVertical: 14, alignItems: 'center' },
  hstatDivider: { width: 1, backgroundColor: 'rgba(255,255,255,0.15)' },
  hstatNum: { fontSize: 20, fontWeight: '900', color: '#FFFFFF' },
  hstatLabel: { fontSize: 8, fontWeight: '700', letterSpacing: 0.8, textTransform: 'uppercase', color: 'rgba(255,255,255,0.6)', marginTop: 4 },

  mainContent: { backgroundColor: colors.background, paddingBottom: 120 },
  section: { paddingHorizontal: 20, paddingTop: 24 },
  sectionHead: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 },
  sectionTitle: { fontSize: 18, fontWeight: '900', color: colors.text, letterSpacing: 0.5 },
  seeAll: { fontSize: 9, fontWeight: '700', letterSpacing: 1, textTransform: 'uppercase', color: colors.textMuted },

  viewfinderCard: {
    backgroundColor: isDark ? '#07060a' : '#FAF7F2',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: isDark ? '#1f1f2e' : '#2E2A24',
    padding: 18,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: isDark ? 0.5 : 0.1,
    shadowRadius: 20,
    elevation: 5,
    position: 'relative',
    overflow: 'hidden',
    minHeight: 220,
  },
  // Rule of Thirds Grid Lines
  viewfinderGridH1: {
    position: 'absolute',
    top: '33.3%',
    left: 0,
    right: 0,
    height: 0.5,
    backgroundColor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.05)',
    borderStyle: 'dashed',
  },
  viewfinderGridH2: {
    position: 'absolute',
    top: '66.6%',
    left: 0,
    right: 0,
    height: 0.5,
    backgroundColor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.05)',
    borderStyle: 'dashed',
  },
  viewfinderGridV1: {
    position: 'absolute',
    left: '33.3%',
    top: 0,
    bottom: 0,
    width: 0.5,
    backgroundColor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.05)',
    borderStyle: 'dashed',
  },
  viewfinderGridV2: {
    position: 'absolute',
    left: '66.6%',
    top: 0,
    bottom: 0,
    width: 0.5,
    backgroundColor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.05)',
    borderStyle: 'dashed',
  },
  bracket: {
    position: 'absolute',
    width: 18,
    height: 18,
    borderColor: colors.accent,
  },
  bracketTopLeft: {
    top: 14,
    left: 14,
    borderTopWidth: 3,
    borderLeftWidth: 3,
  },
  bracketTopRight: {
    top: 14,
    right: 14,
    borderTopWidth: 3,
    borderRightWidth: 3,
  },
  bracketBottomLeft: {
    bottom: 14,
    left: 14,
    borderBottomWidth: 3,
    borderLeftWidth: 3,
  },
  bracketBottomRight: {
    bottom: 14,
    right: 14,
    borderBottomWidth: 3,
    borderRightWidth: 3,
  },
  hudHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)',
    paddingBottom: 8,
    marginBottom: 14,
    zIndex: 3,
  },
  hudModeBadge: {
    backgroundColor: colors.accent,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 3,
  },
  hudModeText: {
    fontSize: 8,
    fontWeight: '900',
    color: '#FFFFFF',
    fontFamily: Platform.OS === 'ios' ? 'Courier-Bold' : 'monospace',
  },
  hudSettingsText: {
    fontSize: 9.5,
    fontWeight: '700',
    color: isDark ? 'rgba(255,255,255,0.7)' : '#2E2A24',
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
  },
  hudCentralCircle: {
    position: 'absolute',
    top: '38%',
    left: '42%',
    width: 60,
    height: 60,
    borderRadius: 30,
    borderWidth: 1,
    borderColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)',
    justifyContent: 'center',
    alignItems: 'center',
    pointerEvents: 'none',
  },
  hudCentralDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: isDark ? 'rgba(255,255,255,0.15)' : 'rgba(0,0,0,0.1)',
  },
  viewfinderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 8,
    zIndex: 3,
  },
  viewfinderCol: {
    flex: 1,
  },
  viewfinderLabel: {
    fontSize: 9,
    fontWeight: '800',
    color: colors.textMuted,
    letterSpacing: 1,
    marginBottom: 4,
  },
  viewfinderValue: {
    fontSize: 22,
    fontWeight: '900',
    color: colors.text,
  },
  viewfinderSub: {
    fontSize: 10,
    color: colors.textLight,
    marginTop: 2,
  },
  viewfinderDivider: {
    width: 1,
    height: 40,
    backgroundColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.08)',
    marginHorizontal: 16,
  },
  exposureScaleContainer: {
    marginTop: 16,
    paddingVertical: 10,
    alignItems: 'center',
    backgroundColor: isDark ? 'rgba(0,0,0,0.3)' : 'rgba(0,0,0,0.02)',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.04)',
    zIndex: 3,
  },
  exposureTicksRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    alignItems: 'flex-end',
    height: 12,
  },
  exposureTick: {
    width: 1,
    height: 5,
    backgroundColor: '#7A7062',
  },
  exposureTickMajor: {
    height: 10,
    backgroundColor: colors.textMuted,
    width: 1.5,
  },
  exposureLabelsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '80%',
    marginTop: 6,
  },
  exposureLabelText: {
    fontSize: 8,
    fontWeight: '800',
    color: colors.textMuted,
    fontFamily: Platform.OS === 'ios' ? 'Courier-Bold' : 'monospace',
  },
  exposureLabelTextActive: {
    color: colors.accent,
  },
  exposureNeedle: {
    position: 'absolute',
    top: 0,
    width: 2,
    height: 14,
    backgroundColor: colors.accent,
    zIndex: 4,
  },

  quoteCard: {
    borderRadius: 18,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surfaceStrong,
    overflow: 'hidden',
  },
  quoteBg: {
    padding: 20,
    justifyContent: 'center',
  },
  quoteContent: {
    alignItems: 'center',
    paddingVertical: 4,
  },
  quoteIcon: {
    marginBottom: 8,
    opacity: 0.8,
  },
  quoteText: {
    fontSize: 13,
    fontStyle: 'italic',
    color: colors.text,
    textAlign: 'center',
    lineHeight: 20,
    fontWeight: '500',
  },
  quoteAuthor: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 1,
    textTransform: 'uppercase',
    color: colors.accent,
    marginTop: 10,
  },

  pendingBadgeCount: { backgroundColor: 'rgba(255,66,0,0.12)', paddingVertical: 4, paddingHorizontal: 10, borderRadius: 20 },
  pendingBadgeCountText: { fontSize: 9, fontWeight: '700', color: colors.accent, textTransform: 'uppercase' },
  
  reqCard: { flexDirection: 'row', padding: 10, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, borderRadius: 16, alignItems: 'center', gap: 12 },
  reqImg: { width: 60, height: 60, borderRadius: 10 },
  reqInfo: { flex: 1, minWidth: 0 },
  reqTitle: { fontSize: 13, fontWeight: '800', color: colors.text, marginBottom: 2 },
  reqPackage: { fontSize: 11, fontWeight: '600', color: colors.textMuted, marginBottom: 4 },
  reqMetaRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginBottom: 4 },
  reqMetaText: { fontSize: 9, color: colors.textMuted },
  reqPrice: { fontSize: 13, fontWeight: '900', color: colors.accent },
  reqActionCol: { gap: 6, alignItems: 'stretch', minWidth: 65 },
  btnAcceptSmall: { backgroundColor: colors.text, paddingVertical: 6, paddingHorizontal: 10, borderRadius: 8, alignItems: 'center' },
  btnAcceptTextSmall: { fontSize: 9, fontWeight: '800', color: colors.background, textTransform: 'uppercase' },
  btnRefuseSmall: { backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, paddingVertical: 6, paddingHorizontal: 10, borderRadius: 8, alignItems: 'center' },
  btnRefuseTextSmall: { fontSize: 9, fontWeight: '700', color: colors.textMuted, textTransform: 'uppercase' },

  schedList: { gap: 8 },
  schedCard: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 12, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, borderRadius: 14 },
  schedCardActive: { borderColor: isDark ? 'rgba(34,197,94,0.32)' : 'rgba(27,138,90,0.25)', backgroundColor: isDark ? 'rgba(34,197,94,0.06)' : 'rgba(27,138,90,0.05)' },
  schedBadge: { backgroundColor: colors.surfaceStrong, borderRadius: 10, paddingVertical: 8, paddingHorizontal: 12, alignItems: 'center', minWidth: 60 },
  schedBadgeActive: { backgroundColor: isDark ? 'rgba(34,197,94,0.15)' : 'rgba(27,138,90,0.12)' },
  schedTime: { fontSize: 14, fontWeight: '900', color: colors.text },
  schedTimeActive: { color: isDark ? '#4ade80' : '#1b8a5a' },
  schedAmpm: { fontSize: 8, fontWeight: '700', letterSpacing: 0.5, color: colors.textMuted, textTransform: 'uppercase' },
  schedAmpmActive: { color: isDark ? 'rgba(34,197,94,0.8)' : '#1b8a5a' },
  schedInfo: { flex: 1 },
  schedName: { fontSize: 13, fontWeight: '700', color: colors.text, marginBottom: 2 },
  schedSub: { fontSize: 10, color: colors.textMuted },
  schedRight: { alignItems: 'flex-end' },
  schedPrice: { fontSize: 12, fontWeight: '800', color: colors.text },
  schedStatusText: { fontSize: 9, fontWeight: '700', color: isDark ? '#4ade80' : '#1b8a5a', letterSpacing: 0.5, textTransform: 'uppercase', marginTop: 4 },
  emptySched: { padding: 20, alignItems: 'center', backgroundColor: colors.surface, borderRadius: 14, borderWidth: 1, borderColor: colors.border, borderStyle: 'dashed' },
  emptySchedText: { fontSize: 12, color: colors.textMuted },

  reelsStrip: {
    paddingRight: 4,
    gap: 12,
  },
  reelCard: {
    width: 210,
    height: 260,
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: colors.surfaceStrong,
    borderWidth: 1,
    borderColor: colors.border,
  },
  reelImage: {
    flex: 1,
    justifyContent: 'space-between',
  },
  reelImageStyle: {
    borderRadius: 12,
  },
  reelTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    padding: 10,
  },
  reelBadge: {
    backgroundColor: 'rgba(0,0,0,0.58)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 999,
  },
  reelBadgeText: {
    fontSize: 8,
    fontWeight: '900',
    letterSpacing: 1,
    color: '#FFFFFF',
    textTransform: 'uppercase',
  },
  reelMenuBtn: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: 'rgba(0,0,0,0.58)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  reelCaption: {
    margin: 12,
    padding: 12,
    borderRadius: 10,
    backgroundColor: 'rgba(0,0,0,0.42)',
  },
  reelTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  reelSub: {
    fontSize: 10,
    lineHeight: 14,
    color: 'rgba(255,255,255,0.82)',
  },
  emptyPortfolioBox: {
    paddingVertical: 24,
    paddingHorizontal: 16,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surfaceStrong,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    borderStyle: 'dashed',
    gap: 6,
  },
  emptyPortfolioText: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.text,
  },
  emptyPortfolioSub: {
    fontSize: 10,
    color: colors.textMuted,
    textAlign: 'center',
  },
  tabSection: {
    marginTop: 12,
  },
  tabFrame: {
    paddingTop: 2,
  },
  modeTabHeader: {
    flexDirection: 'row',
    backgroundColor: isDark ? '#0d0b14' : '#EBE5DA',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.borderStrong,
    marginBottom: 10,
    overflow: 'hidden',
  },
  modeTabBtn: {
    flex: 1,
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 3,
    paddingVertical: 10,
    paddingHorizontal: 4,
    borderRightWidth: 1,
    borderRightColor: colors.borderStrong,
  },
  modeTabBtnActive: {
    backgroundColor: colors.accent,
  },
  modeTabLabel: {
    fontSize: 8,
    fontWeight: '800',
    color: colors.textMuted,
    letterSpacing: 0.5,
    textAlign: 'center',
    fontFamily: Platform.OS === 'ios' ? 'Courier-Bold' : 'monospace',
    textTransform: 'uppercase',
  },
  modeTabLabelActive: {
    color: '#FFFFFF',
  },
  modeTabContent: {
    backgroundColor: isDark ? '#0d0b14' : '#F5F0E8',
    borderWidth: 1,
    borderTopWidth: 0,
    borderColor: colors.borderStrong,
    padding: 16,
    gap: 10,
    borderBottomLeftRadius: 8,
    borderBottomRightRadius: 8,
  },

  // Tab 0 — Card Deck
  cardStageWrap: {
    paddingTop: 2,
    paddingBottom: 4,
  },
  cardDeckStrip: {
    paddingRight: 16,
    gap: 12,
    alignItems: 'flex-start',
  },
  cardStage: {
    borderRadius: 24,
    overflow: 'hidden',
    backgroundColor: colors.surfaceStrong,
    borderWidth: 1,
    borderColor: colors.borderStrong,
    marginBottom: 4,
    shadowColor: '#000',
    shadowOpacity: isDark ? 0.32 : 0.12,
    shadowRadius: 22,
    shadowOffset: { width: 0, height: 10 },
    elevation: 6,
  },
  cardSurface: {
    flex: 1,
    padding: 14,
    justifyContent: 'space-between',
  },
  cardSurfaceImage: {
    borderRadius: 28,
  },
  cardNoise: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(10,10,12,0.28)',
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    zIndex: 1,
  },
  avatarFrame: {
    width: 54,
    height: 54,
    borderRadius: 18,
    padding: 2,
    backgroundColor: 'rgba(255,255,255,0.18)',
  },
  avatarImg: {
    width: '100%',
    height: '100%',
    borderRadius: 16,
  },
  cardIdentity: {
    flex: 1,
  },
  cardName: {
    color: '#FFF8EA',
    fontSize: 17,
    fontWeight: '900',
    letterSpacing: -0.4,
  },
  cardMeta: {
    color: 'rgba(255,248,234,0.82)',
    fontSize: 11,
    marginTop: 3,
    fontWeight: '600',
  },
  cardChip: {
    backgroundColor: 'rgba(255,255,255,0.16)',
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderRadius: 999,
  },
  cardChipText: {
    color: '#FFF8EA',
    fontSize: 10,
    fontWeight: '800',
  },
  cardQuoteBlock: {
    marginTop: 18,
    maxWidth: '88%',
    zIndex: 1,
  },
  cardQuote: {
    color: '#FFF8EA',
    fontSize: 15,
    lineHeight: 21,
    fontWeight: '800',
  },
  cardBody: {
    marginTop: 14,
    flexDirection: 'row',
    gap: 8,
    zIndex: 1,
  },
  pinterestColA: { flex: 1, gap: 10 },
  pinterestColB: { flex: 1, gap: 10, paddingTop: 18 },
  pinterestPhoto: {
    borderRadius: 18,
    overflow: 'hidden',
    backgroundColor: 'rgba(255,255,255,0.1)',
  },
  photoTall: { height: 142 },
  photoShort: { height: 92 },
  photoWide: { height: 102 },
  photoTallSmall: { height: 128 },
  photoImg: { borderRadius: 18 },
  cardFooter: {
    marginTop: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    zIndex: 1,
  },
  cardFooterLabel: {
    color: 'rgba(255,248,234,0.7)',
    fontSize: 10,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    fontWeight: '800',
  },
  cardFooterValue: {
    color: '#FFF8EA',
    fontSize: 14,
    fontWeight: '800',
    marginTop: 2,
  },
  cardMenuBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: 'rgba(255,255,255,0.12)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.16)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabEmptyBox: {
    minHeight: 320,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 32,
    paddingHorizontal: 16,
    gap: 8,
    borderWidth: 1,
    borderColor: colors.border,
    borderStyle: 'dashed',
    borderRadius: 18,
    backgroundColor: colors.surfaceStrong,
    marginBottom: 10,
  },
  tabEmptyText: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.text,
    textAlign: 'center',
  },
  tabEmptySub: {
    fontSize: 10,
    color: colors.textMuted,
    textAlign: 'center',
    maxWidth: '78%',
  },
  tabActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: colors.text,
    paddingVertical: 11,
    borderRadius: 14,
    marginTop: 4,
  },
  endcapCard: {
    borderRadius: 18,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surfaceStrong,
    overflow: 'hidden',
    marginTop: 24,
    marginHorizontal: 20,
  },
  endcapBg: {
    padding: 20,
    justifyContent: 'center',
  },
  endcapContent: {
    alignItems: 'center',
    paddingVertical: 4,
  },
  endcapIcon: {
    marginBottom: 8,
    opacity: 0.8,
  },
  endcapText: {
    fontSize: 13,
    fontStyle: 'italic',
    color: colors.text,
    textAlign: 'center',
    lineHeight: 20,
    fontWeight: '500',
  },
  endcapAuthor: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 1,
    textTransform: 'uppercase',
    color: colors.accent,
    marginTop: 10,
  },
  tabActionBtnText: {
    fontSize: 9,
    fontWeight: '900',
    color: colors.background,
    letterSpacing: 1.5,
    textTransform: 'uppercase',
    fontFamily: Platform.OS === 'ios' ? 'Courier-Bold' : 'monospace',
  },

  // Tab 1 — Trend rows
  trendRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  trendThumb: {
    width: 64,
    height: 64,
    borderRadius: 0,
    overflow: 'hidden',
  },
  trendThumbOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.15)',
  },
  trendInfo: {
    flex: 1,
    gap: 3,
  },
  trendTag: {
    alignSelf: 'flex-start',
    backgroundColor: colors.accent,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 0,
  },
  trendTagText: {
    fontSize: 7,
    fontWeight: '900',
    color: '#FFFFFF',
    letterSpacing: 1,
    textTransform: 'uppercase',
    fontFamily: Platform.OS === 'ios' ? 'Courier-Bold' : 'monospace',
  },
  trendTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: colors.text,
  },
  trendSub: {
    fontSize: 10,
    color: colors.textMuted,
    lineHeight: 14,
  },

  // Tab 2 — Gear rows
  gearRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  gearIcon: {
    width: 40,
    height: 40,
    borderRadius: 0,
    backgroundColor: isDark ? '#1a1a2e' : '#E8E2D6',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },
  gearInfo: {
    flex: 1,
    gap: 2,
  },
  gearNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  gearName: {
    fontSize: 13,
    fontWeight: '800',
    color: colors.text,
  },
  gearType: {
    fontSize: 8,
    fontWeight: '700',
    color: colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    backgroundColor: isDark ? '#1a1a2e' : '#DDD8CE',
    paddingHorizontal: 5,
    paddingVertical: 2,
    borderRadius: 0,
  },
  gearSpec: {
    fontSize: 10,
    color: colors.textMuted,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
  },

  // Scattered Light Table Slide Mounts
  lightTableGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    paddingHorizontal: 4,
    paddingVertical: 12,
    gap: 12,
  },
  slideMount: {
    width: '47%',
    backgroundColor: '#FAF7F2', // clean warm cardboard white/cream
    borderRadius: 6,
    padding: 10,
    paddingBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 1, height: 3 },
    shadowOpacity: 0.15,
    shadowRadius: 5,
    elevation: 4,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.06)',
    marginBottom: 6,
  },
  slideMountInner: {
    height: 100,
    backgroundColor: '#000',
    borderRadius: 2,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.85)',
  },
  slideImageBg: {
    flex: 1,
    width: '100%',
  },
  slideOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.45)', // slide transparency layer
    justifyContent: 'center',
    alignItems: 'center',
  },
  slideLabel: {
    fontSize: 10,
    fontWeight: '900',
    color: '#2E2A24', // handwriting charcoal color
    textAlign: 'center',
    marginTop: 10,
    fontFamily: Platform.OS === 'ios' ? 'Courier-Bold' : 'monospace',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  slideSub: {
    fontSize: 7.5,
    color: '#7A7062',
    textAlign: 'center',
    marginTop: 2,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    textTransform: 'uppercase',
  },
  slideIcon: {
    opacity: 0.9,
  },
  portfolioStrip: {
    gap: 12,
    paddingVertical: 4,
    paddingRight: 20,
  },
  portfolioSlideMount: {
    height: 160,
    backgroundColor: isDark ? '#0d0b14' : '#FAF7F2',
    borderRadius: 8,
    padding: 8,
    paddingBottom: 10,
    borderWidth: 1,
    borderColor: colors.borderStrong,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 3,
  },
  portfolioSlideInner: {
    flex: 1,
    backgroundColor: '#000',
    borderRadius: 4,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.1)',
  },
  portfolioSlideMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 6,
    paddingHorizontal: 2,
  },
  portfolioSlideText: {
    fontSize: 7.5,
    fontWeight: '800',
    color: colors.text,
    fontFamily: Platform.OS === 'ios' ? 'Courier-Bold' : 'monospace',
  },
  portfolioSlideSpec: {
    fontSize: 7,
    color: colors.textMuted,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
  },
  portfolioEmptyBox: {
    padding: 20,
    alignItems: 'center',
    backgroundColor: colors.surfaceStrong,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.border,
    borderStyle: 'dashed',
    gap: 6,
  },
  portfolioEmptyText: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.text,
  },
  portfolioEmptySub: {
    fontSize: 10,
    color: colors.textMuted,
    textAlign: 'center',
  },
});
