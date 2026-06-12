import React, { useState, useEffect } from 'react';
import {
  ScrollView, StyleSheet, Text, View, Pressable, ActivityIndicator, Image,
  RefreshControl, ImageBackground, Dimensions, StatusBar
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { 
  getPhotographerProfile, 
  setAvailability, 
  getMyBookingsAsPhotographer,
  confirmBooking,
  cancelBooking 
} from '../api';
import { useAuth } from '../../auth/AuthContext';
import { usePhotographerTheme } from '../PhotographerThemeContext';

const { width } = Dimensions.get('window');

const formatPhotoUrl = (url?: string) => {
  if (!url) return '';
  const apiUrl = process.env.EXPO_PUBLIC_API_URL || '';
  const ipMatch = apiUrl.match(/http:\/\/((\d+\.){3}\d+)/);
  if (ipMatch && (url.includes('localhost') || url.includes('127.0.0.1'))) {
    return url.replace(/localhost|127\.0\.0\.1/, ipMatch[1]);
  }
  return url;
};

export default function DashboardScreen() {
  const navigation = useNavigation<any>();
  const insets = useSafeAreaInsets();
  const { colors, isDark } = usePhotographerTheme();
  const styles = getStyles(colors, isDark);

  const { logout } = useAuth();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [profile, setProfile] = useState<any>(null);
  const [bookings, setBookings] = useState<any[]>([]);

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    setLoading(true);
    try {
      const [p, b] = await Promise.all([
        getPhotographerProfile(),
        getMyBookingsAsPhotographer()
      ]);
      setProfile(p);
      setBookings(b);
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
    try {
      await setAvailability(newVal);
      setProfile({ ...profile, isAvailable: newVal });
    } catch (err) {
      console.error('Toggle availability error:', err);
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
                style={[styles.availPill, !isAvailable && styles.availPillOff]} 
                onPress={toggleAvailability}
              >
                <View style={[styles.availDot, !isAvailable && styles.availDotOff]} />
                <Text style={[styles.availText, !isAvailable && styles.availTextOff]}>
                  {isAvailable ? 'Đang Nhận Job' : 'Tạm Nghỉ'}
                </Text>
              </Pressable>
              
              <View style={styles.topActions}>
                <Pressable style={styles.iconBtnNotif} onPress={() => navigation.navigate('Notifications')}>
                  <Ionicons name="notifications-outline" size={18} color="#FFFFFF" />
                  <View style={styles.notifDot} />
                </Pressable>
                <Pressable style={styles.iconBtnLogout} onPress={logout}>
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
                <Pressable style={styles.ctaPrimary} onPress={() => navigation.navigate('Portfolio')}>
                  <Ionicons name="images" size={16} color="#FFFBF0" />
                  <Text style={styles.ctaPrimaryText}>PORTFOLIO</Text>
                </Pressable>
                <Pressable style={styles.ctaSecondary} onPress={() => navigation.navigate('BookingCalendar')}>
                  <Ionicons name="calendar" size={16} color="#FFFFFF" />
                  <Text style={styles.ctaSecondaryText}>LỊCH</Text>
                </Pressable>
              </Animated.View>
            </View>

            {/* Hero Stats Row */}
            <Animated.View entering={FadeInUp.delay(600)} style={styles.heroStatsRow}>
              <View style={styles.hstat}>
                <Text style={[styles.hstatNum, { color: colors.accent }]}>N/A</Text>
                <Text style={styles.hstatLabel}>Hôm Nay</Text>
              </View>
              <View style={styles.hstatDivider} />
              <View style={styles.hstat}>
                <Text style={styles.hstatNum}>{upcomingBookings.length}</Text>
                <Text style={styles.hstatLabel}>Bookings</Text>
              </View>
              <View style={styles.hstatDivider} />
              <View style={styles.hstat}>
                <Text style={styles.hstatNum}>{profile?.rating ? profile.rating.toFixed(1) : '0.0'}★</Text>
                <Text style={styles.hstatLabel}>Rating</Text>
              </View>
            </Animated.View>
          </ImageBackground>
        </View>

        {/* ── MAIN ── */}
        <View style={styles.mainContent}>
          
          {/* Stats Scroll */}
          <Animated.View entering={FadeInDown.delay(100)} style={styles.section}>
            <View style={styles.sectionHead}>
              <Text style={styles.sectionTitle}>Tổng Quan</Text>
              <Text style={styles.seeAll}>Tháng này</Text>
            </View>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.statsScroll}>
              <View style={[styles.statCard, styles.hiOrange]}>
                <Ionicons name="cash" size={20} color={colors.accent} style={{ marginBottom: 8 }} />
                <Text style={[styles.scVal, { color: colors.accent }]}>{formattedEarnings}</Text>
                <Text style={styles.scLbl}>Doanh Thu T{currentMonth + 1}</Text>
                <View style={[styles.scTrend, styles.trendUp]}><Text style={styles.trendUpText}>N/A</Text></View>
              </View>
              <View style={[styles.statCard, styles.hiPurple]}>
                <Ionicons name="calendar-sharp" size={20} color="rgba(130,110,255,0.7)" style={{ marginBottom: 8 }} />
                <Text style={[styles.scVal, { color: '#826eff' }]}>{currentMonthBookings.length}</Text>
                <Text style={styles.scLbl}>Booking T{currentMonth + 1}</Text>
                <View style={[styles.scTrend, styles.trendUp]}><Text style={styles.trendUpText}>N/A</Text></View>
              </View>
              <View style={styles.statCard}>
                <Ionicons name="eye" size={20} color={colors.textLight} style={{ marginBottom: 8 }} />
                <Text style={styles.scVal}>N/A</Text>
                <Text style={styles.scLbl}>Profile Views</Text>
                <View style={[styles.scTrend, styles.trendUp]}><Text style={styles.trendUpText}>N/A</Text></View>
              </View>
            </ScrollView>
          </Animated.View>

          {/* New Requests */}
          {pendingBookings.length > 0 && (
            <Animated.View entering={FadeInDown.delay(200)} style={styles.section}>
              <View style={styles.sectionHead}>
                <Text style={styles.sectionTitle}>Yêu Cầu Mới</Text>
                <View style={styles.pendingBadgeCount}><Text style={styles.pendingBadgeCountText}>{pendingBookings.length} đang chờ</Text></View>
              </View>
              
              {pendingBookings.map((b, idx) => (
                <View key={b.id} style={[styles.reqCard, idx > 0 && { marginTop: 12 }]}>
                  <Image source={{ uri: 'https://images.unsplash.com/photo-1542038784456-1ea8e935640e?q=80&w=600&auto=format&fit=crop' }} style={styles.reqImg} />
                  <View style={styles.reqBadge}>
                    <View style={styles.dotNew} />
                    <Text style={styles.reqBadgeText}>Yêu Cầu Mới</Text>
                  </View>
                  <View style={styles.reqBody}>
                    <Text style={styles.reqTitle}>Khách hàng #{b.customerId.slice(0, 5)}</Text>
                    <View style={styles.reqMeta}>
                      <View style={styles.reqMetaItem}>
                        <Ionicons name="time-outline" size={12} color={colors.textMuted} />
                        <Text style={styles.reqMetaText}>{new Date(b.scheduledAt).toLocaleDateString('vi-VN')} · {new Date(b.scheduledAt).toLocaleTimeString('vi-VN', {hour:'2-digit', minute:'2-digit'})}</Text>
                      </View>
                    </View>
                    <View style={styles.reqPriceRow}>
                      <Text style={styles.reqPrice}>{b.agreedPrice?.toLocaleString()}</Text>
                      <Text style={styles.reqDur}>₫</Text>
                    </View>
                    <View style={styles.reqBtns}>
                      <Pressable style={styles.btnAccept} onPress={async () => { await confirmBooking(b.id); handleRefresh(); }}>
                        <Text style={styles.btnAcceptText}>✓ Chấp Nhận</Text>
                      </Pressable>
                      <Pressable style={styles.btnRefuse} onPress={async () => { await cancelBooking(b.id, 'Busy'); handleRefresh(); }}>
                        <Text style={styles.btnRefuseText}>✕ Từ Chối</Text>
                      </Pressable>
                    </View>
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
                      <Text style={styles.schedName}>Khách hàng #{b.customerId.slice(0,4)}</Text>
                      <Text style={styles.schedSub}>Trạng thái: {b.status}</Text>
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

          {/* Portfolio Mosaic */}
          <Animated.View entering={FadeInDown.delay(400)} style={styles.section}>
            <View style={styles.sectionHead}>
              <Text style={styles.sectionTitle}>Portfolio</Text>
              <Pressable onPress={() => navigation.navigate('Portfolio')}><Text style={styles.seeAll}>Quản lý</Text></Pressable>
            </View>
            {profile?.portfolioPhotos && profile.portfolioPhotos.length > 0 ? (
              <View style={styles.mosaic}>
                <View style={styles.mosaicCol1}>
                  <ImageBackground source={{ uri: formatPhotoUrl(profile.portfolioPhotos[0]) }} style={[styles.mosaicItem, { height: 200 }]} imageStyle={{ borderRadius: 12 }}>
                    <View style={styles.portBadge}><Text style={styles.portBadgeText}>{profile.portfolioPhotos.length} ảnh</Text></View>
                  </ImageBackground>
                </View>
                {(profile.portfolioPhotos.length > 1 || profile.portfolioPhotos.length > 2) && (
                  <View style={styles.mosaicCol2}>
                    {profile.portfolioPhotos[1] && <Image source={{ uri: formatPhotoUrl(profile.portfolioPhotos[1]) }} style={[styles.mosaicItem, { height: profile.portfolioPhotos[2] ? 96 : 200, marginBottom: profile.portfolioPhotos[2] ? 8 : 0 }]} />}
                    {profile.portfolioPhotos[2] && <Image source={{ uri: formatPhotoUrl(profile.portfolioPhotos[2]) }} style={[styles.mosaicItem, { height: 96 }]} />}
                  </View>
                )}
                {(profile.portfolioPhotos.length > 3 || profile.portfolioPhotos.length > 4) && (
                  <View style={styles.mosaicCol3}>
                    {profile.portfolioPhotos[3] && <Image source={{ uri: formatPhotoUrl(profile.portfolioPhotos[3]) }} style={[styles.mosaicItem, { height: profile.portfolioPhotos[4] ? 96 : 200, marginBottom: profile.portfolioPhotos[4] ? 8 : 0 }]} />}
                    {profile.portfolioPhotos[4] && <Image source={{ uri: formatPhotoUrl(profile.portfolioPhotos[4]) }} style={[styles.mosaicItem, { height: 96 }]} />}
                  </View>
                )}
              </View>
            ) : (
              <View style={{ padding: 30, alignItems: 'center', backgroundColor: colors.surfaceStrong, borderRadius: 12, borderWidth: 1, borderColor: colors.border, borderStyle: 'dashed' }}>
                <Ionicons name="images-outline" size={32} color={colors.textLight} style={{ marginBottom: 10 }} />
                <Text style={{ color: colors.textMuted, fontSize: 12 }}>Chưa có ảnh trong portfolio</Text>
              </View>
            )}
          </Animated.View>

          {/* Quick Actions */}
          <Animated.View entering={FadeInDown.delay(500)} style={styles.section}>
            <Text style={[styles.sectionTitle, { marginBottom: 12 }]}>Thao Tác Nhanh</Text>
            <View style={styles.actionsGrid}>
              <Pressable style={styles.actionTile} onPress={() => navigation.navigate('Portfolio')}>
                <View style={[styles.atIcon, { backgroundColor: 'rgba(255,66,0,0.12)' }]}>
                  <Ionicons name="image" size={20} color={colors.accent} />
                </View>
                <Text style={styles.atLabel}>Tải Lên{'\n'}Portfolio</Text>
              </Pressable>
              <Pressable style={styles.actionTile} onPress={() => navigation.navigate('PProfile')}>
                <View style={[styles.atIcon, { backgroundColor: isDark ? 'rgba(130,110,255,0.12)' : 'rgba(91,63,203,0.1)' }]}>
                  <Ionicons name="create" size={20} color={isDark ? "#826eff" : "#5b3fcb"} />
                </View>
                <Text style={styles.atLabel}>Sửa{'\n'}Profile</Text>
              </Pressable>
              <Pressable style={styles.actionTile} onPress={() => navigation.navigate('PBookings')}>
                <View style={[styles.atIcon, { backgroundColor: isDark ? 'rgba(34,197,94,0.12)' : 'rgba(27,138,90,0.1)' }]}>
                  <Ionicons name="calendar" size={20} color={isDark ? "#4ade80" : "#1b8a5a"} />
                </View>
                <Text style={styles.atLabel}>Lịch{'\n'}Booking</Text>
              </Pressable>
              <Pressable style={styles.actionTile} onPress={() => navigation.navigate('PChat')}>
                <View style={[styles.atIcon, { backgroundColor: isDark ? 'rgba(251,191,36,0.12)' : 'rgba(212,136,6,0.1)' }]}>
                  <Ionicons name="chatbubble" size={20} color={isDark ? "#fbbf24" : "#d48806"} />
                </View>
                <Text style={styles.atLabel}>Tin{'\n'}Nhắn</Text>
              </Pressable>
            </View>
          </Animated.View>

          {/* Earnings */}
          <Animated.View entering={FadeInDown.delay(600)} style={styles.section}>
            <View style={styles.earnBanner}>
              <Text style={styles.earnMonth}>Thu Nhập Tháng Này</Text>
              <Text style={styles.earnAmt}>{rawEarnings}<Text style={styles.earnCur}>₫</Text></Text>
              <Text style={styles.earnNote}>Mục tiêu của bạn sẽ được thiết lập sau</Text>
              <View style={styles.earnTrack}>
                <View style={[styles.earnFill, { width: '0%' }]} />
              </View>
              <View style={styles.earnLabels}>
                <Text style={styles.earnLabelText}>0₫</Text>
                <Text style={styles.earnLabelText}>N/A</Text>
              </View>
            </View>
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

  heroStatsRow: { flexDirection: 'row', marginHorizontal: 20, backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: 16, marginTop: 40, borderWidth: 1, borderColor: 'rgba(255,255,255,0.15)' },
  hstat: { flex: 1, paddingVertical: 14, alignItems: 'center' },
  hstatDivider: { width: 1, backgroundColor: 'rgba(255,255,255,0.15)' },
  hstatNum: { fontSize: 20, fontWeight: '900', color: '#FFFFFF' },
  hstatLabel: { fontSize: 8, fontWeight: '700', letterSpacing: 0.8, textTransform: 'uppercase', color: 'rgba(255,255,255,0.6)', marginTop: 4 },

  mainContent: { backgroundColor: colors.background, paddingBottom: 40 },
  section: { paddingHorizontal: 20, paddingTop: 24 },
  sectionHead: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 },
  sectionTitle: { fontSize: 18, fontWeight: '900', color: colors.text, letterSpacing: 0.5 },
  seeAll: { fontSize: 9, fontWeight: '700', letterSpacing: 1, textTransform: 'uppercase', color: colors.textMuted },

  statsScroll: { paddingRight: 20, gap: 10 },
  statCard: { width: 130, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, borderRadius: 16, padding: 16 },
  hiOrange: { borderColor: 'rgba(255,66,0,0.4)', backgroundColor: 'rgba(255,66,0,0.05)' },
  hiPurple: { borderColor: 'rgba(54,23,207,0.4)', backgroundColor: 'rgba(54,23,207,0.05)' },
  scVal: { fontSize: 22, fontWeight: '900', color: colors.text, marginBottom: 4 },
  scLbl: { fontSize: 9, fontWeight: '800', letterSpacing: 0.5, textTransform: 'uppercase', color: colors.textMuted },
  scTrend: { position: 'absolute', top: 12, right: 12, paddingVertical: 2, paddingHorizontal: 6, borderRadius: 6 },
  trendUp: { backgroundColor: 'rgba(34,197,94,0.15)' },
  trendUpText: { fontSize: 9, fontWeight: '700', color: '#4ade80' },
  
  pendingBadgeCount: { backgroundColor: 'rgba(255,66,0,0.12)', paddingVertical: 4, paddingHorizontal: 10, borderRadius: 20 },
  pendingBadgeCountText: { fontSize: 9, fontWeight: '700', color: colors.accent, textTransform: 'uppercase' },
  
  reqCard: { borderRadius: 22, overflow: 'hidden', borderWidth: 1, borderColor: colors.border },
  reqImg: { width: '100%', height: 160, opacity: 0.7 },
  reqBadge: { position: 'absolute', top: 14, left: 14, flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: colors.accent, borderRadius: 20, paddingVertical: 5, paddingHorizontal: 12 },
  dotNew: { width: 6, height: 6, borderRadius: 3, backgroundColor: '#FFFBF0' },
  reqBadgeText: { fontSize: 9, fontWeight: '800', letterSpacing: 1, textTransform: 'uppercase', color: '#FFFBF0' },
  reqBody: { backgroundColor: colors.surfaceStrong, padding: 18 },
  reqTitle: { fontSize: 16, fontWeight: '800', color: colors.text, marginBottom: 6 },
  reqMeta: { flexDirection: 'row', gap: 10, marginBottom: 12 },
  reqMetaItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  reqMetaText: { fontSize: 11, color: colors.textMuted },
  reqPriceRow: { flexDirection: 'row', alignItems: 'baseline' },
  reqPrice: { fontSize: 24, fontWeight: '900', color: colors.accent },
  reqDur: { fontSize: 12, color: colors.textLight, marginLeft: 4 },
  reqBtns: { flexDirection: 'row', gap: 10, marginTop: 14 },
  btnAccept: { flex: 1, backgroundColor: colors.text, paddingVertical: 12, borderRadius: 12, alignItems: 'center' },
  btnAcceptText: { fontSize: 11, fontWeight: '800', color: colors.background, letterSpacing: 1, textTransform: 'uppercase' },
  btnRefuse: { flex: 1, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, paddingVertical: 12, borderRadius: 12, alignItems: 'center' },
  btnRefuseText: { fontSize: 11, fontWeight: '700', color: colors.textMuted, letterSpacing: 1, textTransform: 'uppercase' },

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

  mosaic: { flexDirection: 'row', gap: 8 },
  mosaicCol1: { flex: 1 },
  mosaicCol2: { flex: 1 },
  mosaicCol3: { flex: 1 },
  mosaicItem: { width: '100%', backgroundColor: colors.surface, borderRadius: 12, overflow: 'hidden' },
  portBadge: { position: 'absolute', bottom: 8, right: 8, backgroundColor: colors.surfaceStrong, paddingVertical: 4, paddingHorizontal: 8, borderRadius: 12, borderWidth: 1, borderColor: colors.border },
  portBadgeText: { fontSize: 9, fontWeight: '700', color: colors.textMuted },
  mosaicAdd: { width: '100%', height: 96, borderRadius: 12, borderWidth: 1, borderColor: colors.border, borderStyle: 'dashed', justifyContent: 'center', alignItems: 'center' },
  mosaicAddText: { fontSize: 9, fontWeight: '700', color: colors.textLight, marginTop: 4, letterSpacing: 1 },

  actionsGrid: { flexDirection: 'row', gap: 8 },
  actionTile: { flex: 1, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, borderRadius: 16, paddingVertical: 14, alignItems: 'center' },
  atIcon: { width: 40, height: 40, borderRadius: 12, justifyContent: 'center', alignItems: 'center', marginBottom: 8 },
  atLabel: { fontSize: 9, fontWeight: '800', color: colors.textMuted, textAlign: 'center', letterSpacing: 0.5, textTransform: 'uppercase' },

  earnBanner: { backgroundColor: colors.surfaceStrong, borderRadius: 22, padding: 22, borderWidth: 1, borderColor: colors.border, overflow: 'hidden' },
  earnMonth: { fontSize: 9, fontWeight: '700', color: colors.textMuted, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 6 },
  earnAmt: { fontSize: 36, fontWeight: '900', color: colors.text },
  earnCur: { fontSize: 16, color: colors.textMuted },
  earnNote: { fontSize: 11, color: colors.textMuted, marginTop: 4, marginBottom: 16 },
  earnTrack: { height: 6, backgroundColor: colors.border, borderRadius: 3, marginBottom: 8 },
  earnFill: { height: '100%', backgroundColor: isDark ? '#826eff' : '#5b3fcb', borderRadius: 3 },
  earnLabels: { flexDirection: 'row', justifyContent: 'space-between' },
  earnLabelText: { fontSize: 8, fontWeight: '700', color: colors.textMuted, textTransform: 'uppercase', letterSpacing: 0.5 },
});
