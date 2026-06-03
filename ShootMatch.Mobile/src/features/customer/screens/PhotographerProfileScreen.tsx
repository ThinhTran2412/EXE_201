import React, { useEffect, useMemo, useState } from 'react';
import {
  ScrollView, StyleSheet, Text, View, Image, Pressable,
  ActivityIndicator, Alert, Dimensions, Modal,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation, useRoute } from '@react-navigation/native';
import { getPhotographer, Photographer, getMyConversations, getMyMatches, recordSwipe, getPhotographerAvailability, type PhotographerAvailabilitySlot, getPhotographerServicePackages } from '../api';
import { formatImageUrl } from '../../../shared/utils/formatImageUrl';
import { addFavorite, removeFavorite, isFavorite } from '../utils/favorites';
import PortfolioImageCell from '../../../shared/components/PortfolioImageCell';

const { width: W } = Dimensions.get('window');
/** Lưới 3×3: bề ngang nội dung = W − padding hai bên; mỗi ô vuông, 2 khe giữa 3 cột */
const GRID_H_PAD = 20;
const GRID_GAP = 6;
const GRID_INNER = W - GRID_H_PAD * 2;
const PORTFOLIO_CELL = Math.floor((GRID_INNER - GRID_GAP * 2) / 3);

const THEME = {
  primary: '#fff7e1',
  accent: '#1a1a0f',
  orange: '#ff4200',
  danger: '#ef4444',
};

const REGIONS: Record<string, string> = {
  HN: 'Hà Nội', HCM: 'TP.HCM', DN: 'Đà Nẵng', HP: 'Hải Phòng', CT: 'Cần Thơ',
};

type TimeSlot = {
  start: string;
  end: string;
};

const TIME_SLOTS: TimeSlot[] = [
  { start: '07:00', end: '07:30' },
  { start: '07:30', end: '08:00' },
  { start: '08:00', end: '08:30' },
  { start: '08:30', end: '09:00' },
  { start: '09:00', end: '09:30' },
  { start: '09:30', end: '10:00' },
  { start: '10:00', end: '10:30' },
  { start: '10:30', end: '11:00' },
  { start: '11:00', end: '11:30' },
  { start: '11:30', end: '12:00' },
  { start: '12:00', end: '12:30' },
  { start: '12:30', end: '13:00' },
  { start: '13:00', end: '13:30' },
  { start: '13:30', end: '14:00' },
  { start: '14:00', end: '14:30' },
  { start: '14:30', end: '15:00' },
  { start: '15:00', end: '15:30' },
  { start: '15:30', end: '16:00' },
  { start: '16:00', end: '16:30' },
  { start: '16:30', end: '17:00' },
  { start: '17:00', end: '17:30' },
  { start: '17:30', end: '18:00' },
  { start: '18:00', end: '18:30' },
  { start: '18:30', end: '19:00' },
  { start: '19:00', end: '19:30' },
  { start: '19:30', end: '20:00' },
  { start: '20:00', end: '20:30' },
  { start: '20:30', end: '21:00' },
  { start: '21:00', end: '21:30' },
  { start: '21:30', end: '22:00' },
];

// ── Dummy Data ──
const DUMMY_EQUIPMENT = [
  { icon: 'camera-outline', name: 'Sony A7R V', desc: '61MP Full Frame Mirrorless' },
  { icon: 'settings-outline', name: '35mm f/1.4 Summilux', desc: 'Leica Prime Lens' },
  { icon: 'bulb-outline', name: 'Profoto B10 Plus', desc: '500Ws Studio Flash' },
];

const DUMMY_REVIEWS = [
  { name: 'Trân Ngọc', date: '15/01/2026', rating: 5, text: 'Chụp ảnh cực kỳ chuyên nghiệp và tận tâm. Ảnh ra đẹp hơn mong đợi nhiều lần!' },
  { name: 'Minh Hiếu', date: '02/01/2026', rating: 4, text: 'Phong cách độc đáo, rất sáng tạo. Phản hồi nhanh và linh hoạt với yêu cầu của khách hàng.' },
];

export default function PhotographerProfileScreen() {
  const navigation = useNavigation<any>();
  const insets = useSafeAreaInsets();
  const route = useRoute<any>();
  const { photographerId } = route.params as { photographerId: string };

  const [p, setP] = useState<Photographer | null>(null);
  const [loading, setLoading] = useState(true);
  const [fav, setFav] = useState(false);
  const [matchId, setMatchId] = useState<string | null>(null);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [chatLoading, setChatLoading] = useState(false);
  const [availabilitySlots, setAvailabilitySlots] = useState<PhotographerAvailabilitySlot[]>([]);
  const [servicePackages, setServicePackages] = useState<any[]>([]);
  const [scheduleLoading, setScheduleLoading] = useState(true);
  const [scheduleExpanded, setScheduleExpanded] = useState(false);
  const [selectedScheduleDate, setSelectedScheduleDate] = useState(new Date());
  const [selectedShift, setSelectedShift] = useState<'Sáng' | 'Trưa' | 'Chiều'>('Sáng');

  // State for Lightbox
  const [lightboxImg, setLightboxImg] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    Promise.all([
      getPhotographer(photographerId),
      isFavorite(photographerId),
      getMyMatches().catch(() => []),
      getMyConversations().catch(() => []),
      getPhotographerAvailability(photographerId).catch(() => []),
      getPhotographerServicePackages(photographerId).catch(() => []),
    ])
      .then(([data, favoriteStatus, matches, convs, availability, packages]) => {
        if (!mounted) return;
        setP(data);
        setFav(favoriteStatus);
        setAvailabilitySlots(availability);
        setServicePackages(packages);

        const existingMatch = matches.find((m: any) => m.photographerId === photographerId);
        if (existingMatch) setMatchId(existingMatch.id);

        const existingConv = convs.find((c: any) => c.photographerId === photographerId);
        if (existingConv) setConversationId(existingConv.id);
      })
      .catch(() => {
        if (!mounted) return;
        Alert.alert('Lỗi', 'Không tải được hồ sơ');
      })
      .finally(() => {
        if (!mounted) return;
        setLoading(false);
        setScheduleLoading(false);
      });

    return () => {
      mounted = false;
    };
  }, [photographerId]);

  const toggleFav = async () => {
    if (!p) return;
    const nextFav = !fav;
    setFav(nextFav);
    if (nextFav) {
      await addFavorite(p);
    } else {
      await removeFavorite(p.id);
    }
  };

  const handleChatPress = async () => {
    if (!p) return;
    setChatLoading(true);
    try {
      let currentConvId = conversationId;
      
      // If we don't have conversationId yet, try to fetch/create one
      if (!currentConvId) {
        // Fetch fresh matches and conversations first, in case they matched in the background
        const [matches, convs] = await Promise.all([
          getMyMatches().catch(() => []),
          getMyConversations().catch(() => [])
        ]);
        
        const existingMatch = matches.find((m: any) => m.photographerId === photographerId);
        const existingConv = convs.find((c: any) => c.photographerId === photographerId);
        
        if (existingConv) {
          currentConvId = existingConv.id;
          setConversationId(existingConv.id);
          if (existingMatch) setMatchId(existingMatch.id);
        } else {
          // No match/conv exists. Let's auto-create it via swipe!
          // We record swipe Right to simulate mutual match and auto-create the conversation.
          await recordSwipe('00000000-0000-0000-0000-000000000000', p.id, 'Right');
          
          // Re-fetch conversations to get the newly created conversation ID
          const [updatedMatches, updatedConvs] = await Promise.all([
            getMyMatches().catch(() => []),
            getMyConversations().catch(() => [])
          ]);
          
          const newMatch = updatedMatches.find((m: any) => m.photographerId === photographerId);
          const newConv = updatedConvs.find((c: any) => c.photographerId === photographerId);
          
          if (newConv) {
            currentConvId = newConv.id;
            setConversationId(newConv.id);
          }
          if (newMatch) {
            setMatchId(newMatch.id);
          }
        }
      }
      
      if (currentConvId) {
        navigation.navigate('ChatThread', {
          conversationId: currentConvId,
          name: p.displayName,
          participantName: p.displayName,
          participantAvatarUrl: p.avatarUrl ? formatImageUrl(p.avatarUrl) : undefined,
        });
      } else {
        Alert.alert('Thông báo', 'Không thể khởi tạo cuộc trò chuyện. Vui lòng thử lại sau.');
      }
    } catch (err) {
      console.error(err);
      Alert.alert('Lỗi', 'Có lỗi xảy ra khi bắt đầu cuộc trò chuyện.');
    } finally {
      setChatLoading(false);
    }
  };

  const handleBookPress = async (packageId?: string) => {
    if (!p) return;
    let currentMatchId = matchId;
    
    if (!currentMatchId) {
      setChatLoading(true);
      try {
        // Fetch fresh matches in case they matched in the background
        const matches = await getMyMatches().catch(() => []);
        const existingMatch = matches.find((m: any) => m.photographerId === photographerId);
        
        if (existingMatch) {
          currentMatchId = existingMatch.id;
          setMatchId(existingMatch.id);
        } else {
          // Auto-create a match via swipe
          await recordSwipe('00000000-0000-0000-0000-000000000000', p.id, 'Right');
          
          // Re-fetch matches to get the newly created match ID
          const updatedMatches = await getMyMatches().catch(() => []);
          const newMatch = updatedMatches.find((m: any) => m.photographerId === photographerId);
          
          if (newMatch) {
            currentMatchId = newMatch.id;
            setMatchId(newMatch.id);
          }
        }
      } catch (err) {
        console.error(err);
      } finally {
        setChatLoading(false);
      }
    }
    
    // Navigate so CheckoutScreen can proceed
    navigation.navigate('Checkout', { photographer: p, matchId: currentMatchId || undefined, packageId, packages: servicePackages });
  };

  const normalizeAvailabilityDate = (value?: string | null) => {
    if (!value) return '';
    return value.slice(0, 10);
  };

  const normalizeAvailabilityTime = (value?: string | null) => {
    if (!value) return '';
    return value.length >= 5 ? value.slice(0, 5) : value;
  };

  const scheduleDays = (() => {
    const base = new Date();
    const dates = Array.from({ length: 7 }, (_, idx) => {
      const date = new Date(base);
      date.setDate(base.getDate() + idx);
      return date;
    });

    return dates.map((date) => {
      const key = date.toISOString().slice(0, 10);
      const slots = availabilitySlots.filter((slot) => normalizeAvailabilityDate(slot.specificDate) === key);
      const blockedStarts = new Set(slots.filter((slot) => slot.slotType === 'Blocked').map((slot) => normalizeAvailabilityTime(slot.startTime)));
      const availableStarts = TIME_SLOTS.filter((slot) => !blockedStarts.has(slot.start)).map((slot) => slot.start);
      const preview = availableStarts.slice(0, 3);
      return {
        key,
        date,
        preview,
        totalAvailable: availableStarts.length,
        blockedCount: blockedStarts.size,
        isToday: key === new Date().toISOString().slice(0, 10),
      };
    });
  })();

  const selectedScheduleKey = selectedScheduleDate.toISOString().slice(0, 10);
  const selectedDaySlots = availabilitySlots.filter((slot) => normalizeAvailabilityDate(slot.specificDate) === selectedScheduleKey);
  const selectedDayBlockedStarts = new Set(selectedDaySlots.filter((slot) => slot.slotType === 'Blocked').map((slot) => normalizeAvailabilityTime(slot.startTime)));
  const selectedDayAvailability = {
    blockedStarts: selectedDayBlockedStarts,
    availableSlots: TIME_SLOTS.filter((slot) => !selectedDayBlockedStarts.has(slot.start)),
    slots: selectedDaySlots,
  };

  const photos = p?.portfolioPhotos?.length ? p.portfolioPhotos : (p?.avatarUrl ? [p.avatarUrl] : []);
  const displayPhotos = photos.slice(0, 9);
  const heroUri = p?.coverPhotoUrl || photos[0] || p?.avatarUrl || '';
  const specialties = ['Portrait', 'Fashion', 'Editorial']; // Dummy

  if (!p) return null;

  return (
    <View style={styles.safe}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 120 }}>
        
        {/* ── HERO ── */}
        <View style={[styles.heroSection, { height: W * 0.8 }]}>
          {heroUri ? (
            <Image source={{ uri: formatImageUrl(heroUri) }} style={styles.heroBg} resizeMode="cover" />
          ) : (
            <View style={[styles.heroBg, { backgroundColor: '#e2e8f0', justifyContent: 'center', alignItems: 'center' }]}>
               <Text style={{ fontSize: 60, color: '#cbd5e1', fontWeight: '900' }}>{p.displayName?.[0]}</Text>
            </View>
          )}
          <LinearGradient
            colors={['rgba(0,0,0,0.15)', 'transparent', 'rgba(26,26,15,0.95)']}
            locations={[0, 0.4, 1]}
            style={StyleSheet.absoluteFill}
          />

          {/* Float Back */}
          <Pressable style={[styles.floatBtn, { top: Math.max(insets.top, 16), left: 16 }]} onPress={() => navigation.goBack()}>
            <Ionicons name="arrow-back" size={20} color={THEME.accent} />
          </Pressable>

          {/* Float Fav */}
          <Pressable style={[styles.floatBtn, { top: Math.max(insets.top, 16), right: 16 }, fav && { backgroundColor: 'rgba(239,68,68,0.9)' }]} onPress={toggleFav}>
            <Ionicons name={fav ? "heart" : "heart-outline"} size={20} color={fav ? "#fff" : THEME.accent} />
          </Pressable>

          {/* Hero Info */}
          <View style={styles.heroInfo}>
            {p.verificationStatus === 'Verified' && (
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, marginBottom: 8 }}>
                <Ionicons name="checkmark-circle" size={14} color="#4ade80" />
                <Text style={{ color: 'rgba(255,255,255,0.9)', fontSize: 10, fontWeight: '700', letterSpacing: 1, textTransform: 'uppercase' }}>Verified</Text>
              </View>
            )}
            <Text style={styles.heroName}>{p.displayName}</Text>
            <Text style={styles.heroStudio}>{p.displayName.toUpperCase()} STUDIO · {REGIONS[p.region] || p.region}</Text>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 2 }}>
                <Text style={{ color: '#fbbf24', fontWeight: '800', fontSize: 13 }}>{p.rating?.toFixed(1) || '0.0'}</Text>
                <Text style={{ color: 'rgba(255,255,255,0.6)', fontSize: 11 }}>/ 5.0</Text>
              </View>
              <Text style={{ color: 'rgba(255,255,255,0.3)' }}>·</Text>
              <Text style={{ color: 'rgba(255,255,255,0.9)', fontSize: 13, fontWeight: '600' }}>Từ {p.minBudget?.toLocaleString('vi-VN')}đ</Text>
            </View>
          </View>
        </View>

        {/* ── QUOTE ── */}
        {p.quote ? (
          <View style={{ paddingHorizontal: 24, paddingVertical: 20 }}>
            <View style={{ borderLeftWidth: 2, borderLeftColor: 'rgba(255,66,0,0.4)', paddingLeft: 16 }}>
              <Text style={{ fontSize: 18, fontWeight: '600', fontStyle: 'italic', color: 'rgba(26,26,15,0.8)', lineHeight: 28 }}>
                "{p.quote}"
              </Text>
            </View>
          </View>
        ) : null}

        {/* ── STATS ── */}
        <View style={{ paddingHorizontal: 20, paddingBottom: 16 }}>
          <View style={{ flexDirection: 'row', gap: 12 }}>
            <View style={styles.statCard}>
              <Text style={styles.statVal}>320</Text>
              <Text style={styles.statLabel}>Buổi chụp</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={styles.statVal}>10</Text>
              <Text style={styles.statLabel}>Năm Kinh nghiệm</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={styles.statVal}>{p.rating?.toFixed(1) || '0.0'}</Text>
              <Text style={styles.statLabel}>Điểm Đánh giá</Text>
            </View>
          </View>
        </View>

        {/* ── SPECIALTIES ── */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Chuyên Môn</Text>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
            {specialties.map((s, i) => (
              <View key={i} style={styles.specBadge}>
                <Ionicons name="sparkles-outline" size={12} color="rgba(26,26,15,0.5)" />
                <Text style={styles.specBadgeText}>{s}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* ── ABOUT ── */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Giới Thiệu</Text>
          <Text style={styles.aboutText}>
            {p.bio || `${p.displayName} là nhiếp ảnh gia chuyên nghiệp với nhiều năm kinh nghiệm. Phong cách của họ kết hợp ánh sáng tự nhiên và chỉnh màu nghệ thuật, tạo nên những bức ảnh mang cảm xúc sâu sắc.`}
          </Text>
        </View>

        {/* ── PORTFOLIO GALLERY ── */}
        {photos.length > 0 && (
          <View style={[styles.section, { paddingHorizontal: 0 }]}>
            <View style={{ paddingHorizontal: GRID_H_PAD, marginBottom: 8 }}>
              <Text style={styles.sectionTitle}>Portfolio</Text>
            </View>
            <View style={{ paddingHorizontal: GRID_H_PAD }}>
              {[0, 1, 2].map(row => (
                <View
                  key={`row-${row}`}
                  style={{
                    flexDirection: 'row',
                    marginBottom: row < 2 ? GRID_GAP : 0,
                  }}
                >
                  {[0, 1, 2].map(col => {
                    const idx = row * 3 + col;
                    const img = displayPhotos[idx];
                    return (
                      <View
                        key={`cell-${row}-${col}`}
                        style={{
                          width: PORTFOLIO_CELL,
                          height: PORTFOLIO_CELL,
                          marginRight: col < 2 ? GRID_GAP : 0,
                        }}
                      >
                        {img ? (
                          <PortfolioImageCell
                            uri={img}
                            borderRadius={14}
                            style={{ width: PORTFOLIO_CELL, height: PORTFOLIO_CELL }}
                            onPress={() => setLightboxImg(img)}
                          />
                        ) : null}
                      </View>
                    );
                  })}
                </View>
              ))}
            </View>
            {photos.length > 0 && (
              <View style={{ paddingHorizontal: GRID_H_PAD, marginTop: 14 }}>
                <Pressable style={styles.viewAllBtn} onPress={() => navigation.navigate('PhotographerPortfolio', { photographer: p })}>
                  <Text style={styles.viewAllBtnText}>Mở toàn bộ portfolio</Text>
                </Pressable>
              </View>
            )}
          </View>
        )}

        {/* ── EQUIPMENT ── */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Thiết Bị</Text>
          <View style={{ gap: 8 }}>
            {DUMMY_EQUIPMENT.map((eq, i) => (
              <View key={i} style={styles.equipItem}>
                <Ionicons name={eq.icon as any} size={20} color="rgba(26,26,15,0.5)" />
                <View>
                  <Text style={{ fontSize: 13, fontWeight: '600', color: THEME.accent }}>{eq.name}</Text>
                  <Text style={{ fontSize: 11, opacity: 0.5, color: THEME.accent }}>{eq.desc}</Text>
                </View>
              </View>
            ))}
          </View>
        </View>

        {/* ── SERVICES & PRICING ── */}
        {servicePackages.length > 0 && (
          <View style={[styles.section, { paddingHorizontal: 0 }]}>
            <View style={{ paddingHorizontal: 20, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
              <Text style={[styles.sectionTitle, { marginBottom: 0 }]}>Gói Dịch Vụ Nổi Bật</Text>
              <Pressable onPress={() => navigation.navigate('PhotographerServicePackages', { photographer: p, packages: servicePackages })}>
                <Text style={{ fontSize: 11, fontWeight: '700', color: THEME.orange, textTransform: 'uppercase' }}>Xem tất cả</Text>
              </Pressable>
            </View>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 20, gap: 12 }}>
              {servicePackages.map((s, i) => (
                <Pressable key={s.id || i} style={styles.packageCardSquare} onPress={() => handleBookPress(s.id)}>
                  {s.media && s.media.length > 0 ? (
                    <Image source={{ uri: formatImageUrl(s.media[0].imageUrl) }} style={styles.packageCardImg} />
                  ) : (
                    <View style={[styles.packageCardImg, { backgroundColor: 'rgba(26,26,15,0.05)', justifyContent: 'center', alignItems: 'center' }]}>
                      <Ionicons name="images-outline" size={32} color="rgba(26,26,15,0.2)" />
                    </View>
                  )}
                  <LinearGradient
                    colors={['transparent', 'rgba(26,26,15,0.85)']}
                    locations={[0.3, 1]}
                    style={StyleSheet.absoluteFill}
                  />
                  <View style={styles.packageCardContent}>
                    <View>
                      <Text style={styles.packageCardTitle} numberOfLines={2}>{s.title}</Text>
                      <Text style={styles.packageCardDuration} numberOfLines={1}>{s.durationHours} giờ · {s.subtitle}</Text>
                    </View>
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 12 }}>
                      <Text style={styles.packageCardPrice}>{s.price.toLocaleString('vi-VN')}₫</Text>
                      <View style={styles.packageCardBtn}>
                        <Text style={styles.packageCardBtnText}>Đặt</Text>
                      </View>
                    </View>
                  </View>
                </Pressable>
              ))}
            </ScrollView>
          </View>
        )}

        {/* ── SCHEDULE ── */}
        <View style={styles.section}>
          <View style={styles.scheduleHeader}>
            <Text style={styles.sectionTitle}>Lịch Trống Tuần Này</Text>
            <Pressable style={styles.scheduleToggle} onPress={() => setScheduleExpanded((prev) => !prev)}>
              <Text style={styles.scheduleToggleText}>{scheduleExpanded ? 'Thu gọn' : 'Xem chi tiết'}</Text>
            </Pressable>
          </View>

          <View style={styles.dayPager}>
            <Pressable
              style={[styles.dayPagerBtn, scheduleDays[0]?.key === selectedScheduleKey && styles.dayPagerBtnDisabled]}
              onPress={() => {
                const next = new Date(selectedScheduleDate);
                next.setDate(next.getDate() - 1);
                setSelectedScheduleDate(next);
              }}
              disabled={scheduleDays[0]?.key === selectedScheduleKey}
            >
              <Ionicons name="chevron-back" size={16} color={THEME.accent} />
            </Pressable>
            <Text style={styles.dayPagerLabel}>
              {selectedScheduleDate.toLocaleDateString('vi-VN', { weekday: 'short', day: '2-digit', month: '2-digit' })}
            </Text>
            <Pressable
              style={styles.dayPagerBtn}
              onPress={() => {
                const next = new Date(selectedScheduleDate);
                next.setDate(next.getDate() + 1);
                setSelectedScheduleDate(next);
              }}
            >
              <Ionicons name="chevron-forward" size={16} color={THEME.accent} />
            </Pressable>
          </View>

          <View style={styles.shiftTabsRow}>
            {['Sáng', 'Trưa', 'Chiều'].map((label) => {
              const active = selectedShift === label;
              return (
                <Pressable key={label} style={styles.shiftTab} onPress={() => setSelectedShift(label as 'Sáng' | 'Trưa' | 'Chiều')}>
                  <Text style={[styles.shiftTabText, active && styles.shiftTabTextActive]} numberOfLines={1}>{label}</Text>
                  <View style={[styles.shiftTabLine, active && styles.shiftTabLineActive]} />
                </Pressable>
              );
            })}
          </View>

          {scheduleLoading ? (
            <View style={styles.scheduleLoading}>
              <ActivityIndicator size="small" color={THEME.accent} />
              <Text style={styles.scheduleLoadingText}>Đang tải lịch thực tế...</Text>
            </View>
          ) : (
            <>
              {(() => {
                const shiftRanges = {
                  Sáng: ['07:00', '12:00'],
                  Trưa: ['12:00', '17:00'],
                  Chiều: ['17:00', '22:00'],
                } as const;
                const [startRange, endRange] = shiftRanges[selectedShift];
                const shiftSlots = TIME_SLOTS.filter((slot) => slot.start >= startRange && slot.start < endRange);
                const shiftSlotStates = shiftSlots.map((slot) => ({
                  ...slot,
                  isBusy: selectedDayAvailability.slots.some((blocked) => blocked.startTime.slice(0, 5) === slot.start && blocked.slotType === 'Blocked'),
                }));
                const slotsToShow = (scheduleExpanded ? shiftSlotStates : shiftSlotStates.slice(0, 10)).slice(0, 10);
                const firstRow = slotsToShow.slice(0, 5);
                const secondRow = slotsToShow.slice(5, 10);

                return (
                  <View style={styles.timeSlotRows}>
                    {[firstRow, secondRow].map((row, rowIndex) => (
                      <View key={`slot-row-${rowIndex}`} style={styles.timeSlotRow}>
                        {row.map((slot) => (
                          <View key={`${selectedScheduleKey}-${slot.start}`} style={[styles.timeSlotItem, slot.isBusy && styles.timeSlotItemBusy]}>
                            <Text style={[styles.timeSlotItemTime, slot.isBusy && styles.timeSlotItemTimeBusy]}>{slot.start}</Text>
                            <Text style={[styles.timeSlotItemRange, slot.isBusy && styles.timeSlotItemRangeBusy]}>{slot.end}</Text>
                          </View>
                        ))}
                      </View>
                    ))}
                  </View>
                );
              })()}

              <View style={styles.scheduleSummaryCard}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.scheduleSummaryTitle}>
                    {selectedScheduleDate.toLocaleDateString('vi-VN', { weekday: 'long', day: '2-digit', month: '2-digit', year: 'numeric' })}
                  </Text>
                  <Text style={styles.scheduleSummaryText}>
                    {selectedDayAvailability.availableSlots.length} khung giờ trống · {selectedDayAvailability.blockedStarts.size} khung giờ bận
                  </Text>
                </View>
                <Pressable style={styles.scheduleDetailsBtn} onPress={() => setScheduleExpanded((prev) => !prev)}>
                  <Text style={styles.scheduleDetailsBtnText}>{scheduleExpanded ? 'Thu gọn' : 'Xem chi tiết'}</Text>
                </Pressable>
              </View>
            </>
          )}
        </View>

        {/* ── REVIEWS ── */}
        <View style={styles.section}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
            <Text style={styles.sectionTitle}>Đánh Giá</Text>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
              <Text style={{ color: '#fbbf24', fontSize: 10 }}>★★★★★</Text>
              <Text style={{ fontSize: 11, fontWeight: '600', opacity: 0.6 }}>4.9</Text>
            </View>
          </View>
          <View style={{ gap: 12 }}>
            {DUMMY_REVIEWS.map((r, i) => (
              <View key={i} style={styles.reviewCard}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                    <View style={styles.reviewAvatar}>
                      <Text style={{ fontSize: 11, fontWeight: 'bold' }}>{r.name.split(' ').map(n=>n[0]).join('').substring(0,2)}</Text>
                    </View>
                    <View>
                      <Text style={{ fontSize: 13, fontWeight: '600' }}>{r.name}</Text>
                      <Text style={{ fontSize: 10, opacity: 0.4 }}>{r.date}</Text>
                    </View>
                  </View>
                  <Text style={{ color: '#fbbf24', fontSize: 10 }}>{'★'.repeat(r.rating)}{'☆'.repeat(5-r.rating)}</Text>
                </View>
                <Text style={{ fontSize: 11, lineHeight: 18, opacity: 0.7 }}>"{r.text}"</Text>
              </View>
            ))}
          </View>
        </View>

      </ScrollView>

      {/* ── STICKY CTA BAR ── */}
      <View style={[styles.ctaBar, { paddingBottom: Math.max(insets.bottom, 16) }]}>
        <Pressable style={styles.iconBtn} onPress={handleChatPress} disabled={chatLoading}>
          {chatLoading ? (
            <ActivityIndicator size="small" color={THEME.accent} />
          ) : (
            <Ionicons name="chatbubble-ellipses-outline" size={20} color={THEME.accent} />
          )}
        </Pressable>
        <Pressable
          style={styles.bookBtn}
          onPress={() => handleBookPress()}
          disabled={chatLoading}
        >
          <Text style={styles.bookBtnText}>Đặt Lịch Ngay</Text>
        </Pressable>
        <Pressable style={[styles.iconBtn, fav && { backgroundColor: 'rgba(239,68,68,0.1)', borderColor: 'transparent' }]} onPress={toggleFav}>
          <Ionicons name={fav ? "heart" : "heart-outline"} size={20} color={fav ? THEME.danger : THEME.accent} />
        </Pressable>
      </View>

      {/* ── LIGHTBOX ── */}
      <Modal visible={!!lightboxImg} transparent animationType="fade" onRequestClose={() => setLightboxImg(null)}>
        <View style={styles.lightbox}>
          <Pressable style={StyleSheet.absoluteFill} onPress={() => setLightboxImg(null)} />
          {lightboxImg && (
            <Image source={{ uri: formatImageUrl(lightboxImg) }} style={{ width: '95%', height: '95%', resizeMode: 'contain' }} />
          )}
        </View>
      </Modal>

    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: THEME.primary },
  
  heroSection: { width: '100%', position: 'relative' },
  heroBg: { ...StyleSheet.absoluteFillObject, resizeMode: 'cover' },
  floatBtn: {
    position: 'absolute', zIndex: 30, width: 40, height: 40, borderRadius: 20,
    backgroundColor: 'rgba(248,248,217,0.9)', alignItems: 'center', justifyContent: 'center',
    shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.2, shadowRadius: 10, elevation: 5,
  },
  heroInfo: { position: 'absolute', bottom: 0, left: 0, right: 0, paddingHorizontal: 24, paddingBottom: 24, zIndex: 10 },
  heroName: { color: '#fff', fontSize: 36, fontWeight: '900', marginBottom: 8, textShadowColor: 'rgba(0,0,0,0.3)', textShadowOffset: { width: 0, height: 4 }, textShadowRadius: 12 },
  heroStudio: { color: 'rgba(255,255,255,0.8)', fontSize: 10, fontFamily: 'monospace', letterSpacing: 2, marginBottom: 12 },

  statCard: { flex: 1, backgroundColor: 'rgba(26,26,15,0.04)', borderWidth: 1, borderColor: 'rgba(26,26,15,0.06)', borderRadius: 16, paddingVertical: 16, paddingHorizontal: 12, alignItems: 'center' },
  statVal: { fontSize: 24, fontWeight: '800', color: THEME.accent },
  statLabel: { fontSize: 9, textTransform: 'uppercase', letterSpacing: 1, opacity: 0.5, marginTop: 4, textAlign: 'center' },

  section: { paddingHorizontal: 20, paddingBottom: 20 },
  sectionTitle: { fontSize: 10, textTransform: 'uppercase', letterSpacing: 2, fontWeight: '800', opacity: 0.4, marginBottom: 12, color: THEME.accent },
  
  specBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 14, paddingVertical: 6, borderRadius: 50, backgroundColor: 'rgba(26,26,15,0.06)' },
  specBadgeText: { fontSize: 11, fontWeight: '600', color: THEME.accent },

  aboutText: { fontSize: 13, lineHeight: 22, opacity: 0.7, color: THEME.accent },

  viewAllBtn: { paddingVertical: 12, borderRadius: 12, borderWidth: 1, borderColor: THEME.accent, alignItems: 'center' },
  viewAllBtnText: { fontSize: 13, fontWeight: '700', color: THEME.accent, letterSpacing: 1 },

  equipItem: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 12, borderRadius: 12, backgroundColor: 'rgba(26,26,15,0.03)', borderWidth: 1, borderColor: 'rgba(26,26,15,0.06)' },
  serviceItem: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', padding: 12, borderRadius: 12, borderWidth: 1, borderColor: 'rgba(26,26,15,0.08)' },

  packageCardSquare: { width: W * 0.7, height: W * 0.7, borderRadius: 16, overflow: 'hidden', backgroundColor: '#fff', borderWidth: 1, borderColor: 'rgba(26,26,15,0.08)' },
  packageCardImg: { ...StyleSheet.absoluteFillObject, resizeMode: 'cover' },
  packageCardContent: { position: 'absolute', bottom: 0, left: 0, right: 0, padding: 16 },
  packageCardTitle: { fontSize: 16, fontWeight: '800', color: '#fff', marginBottom: 4 },
  packageCardDuration: { fontSize: 12, color: 'rgba(255,255,255,0.7)' },
  packageCardPrice: { fontSize: 16, fontWeight: '700', color: '#fff' },
  packageCardBtn: { backgroundColor: THEME.primary, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8 },
  packageCardBtnText: { color: THEME.accent, fontSize: 12, fontWeight: '800' },

  scheduleHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  scheduleToggle: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: 999, borderWidth: 1, borderColor: 'rgba(26,26,15,0.12)', backgroundColor: 'rgba(26,26,15,0.03)', flexShrink: 0, maxWidth: 120 },
  scheduleToggleText: { fontSize: 12, fontWeight: '700', color: THEME.accent },
  dayPager: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10, padding: 10, borderRadius: 14, backgroundColor: 'rgba(26,26,15,0.03)' },
  shiftTabsRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 10, gap: 8 },
  shiftTab: { flex: 1, alignItems: 'center', paddingVertical: 4, minWidth: 0 },
  shiftTabText: { fontSize: 12, fontWeight: '700', color: THEME.accent, opacity: 0.45, textAlign: 'center' },
  shiftTabTextActive: { opacity: 1 },
  shiftTabLine: { marginTop: 5, height: 2, width: 22, borderRadius: 99, backgroundColor: 'transparent' },
  shiftTabLineActive: { backgroundColor: THEME.accent },
  dayPagerBtn: { width: 34, height: 34, borderRadius: 17, backgroundColor: '#fff', alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: 'rgba(26,26,15,0.08)' },
  dayPagerBtnDisabled: { opacity: 0.35 },
  dayPagerLabel: { fontSize: 13, fontWeight: '700', color: THEME.accent, textTransform: 'capitalize' },
  scheduleLoading: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingVertical: 12 },
  scheduleLoadingText: { fontSize: 12, color: THEME.accent, opacity: 0.6 },
  timeSlotRows: { gap: 8 },
  timeSlotRow: { flexDirection: 'row', gap: 8 },
  timeSlotItem: { flex: 1, paddingVertical: 10, paddingHorizontal: 10, borderRadius: 12, backgroundColor: 'rgba(26,26,15,0.04)', borderWidth: 1, borderColor: 'rgba(26,26,15,0.08)' },
  timeSlotItemBusy: { backgroundColor: 'rgba(148,163,184,0.16)', borderColor: 'rgba(148,163,184,0.45)' },
  timeSlotItemTime: { fontSize: 13, fontWeight: '800', color: THEME.accent },
  timeSlotItemTimeBusy: { color: '#64748b', textDecorationLine: 'line-through' },
  timeSlotItemRange: { fontSize: 10, color: THEME.accent, opacity: 0.5, marginTop: 2 },
  timeSlotItemRangeBusy: { opacity: 0.35 },
  scheduleSummaryCard: { marginTop: 12, padding: 14, borderRadius: 16, backgroundColor: 'rgba(26,26,15,0.03)', borderWidth: 1, borderColor: 'rgba(26,26,15,0.06)', flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12 },
  scheduleSummaryTitle: { fontSize: 13, fontWeight: '800', color: THEME.accent, textTransform: 'capitalize' },
  scheduleSummaryText: { fontSize: 11, color: THEME.accent, opacity: 0.55, marginTop: 4 },
  scheduleDetailsBtn: { paddingHorizontal: 12, paddingVertical: 9, borderRadius: 12, backgroundColor: THEME.accent, flexShrink: 0 },
  scheduleDetailsBtnText: { fontSize: 11, fontWeight: '800', color: THEME.primary },

  reviewCard: { backgroundColor: 'rgba(26,26,15,0.03)', borderWidth: 1, borderColor: 'rgba(26,26,15,0.06)', borderRadius: 16, padding: 16 },
  reviewAvatar: { width: 32, height: 32, borderRadius: 16, backgroundColor: 'rgba(26,26,15,0.1)', alignItems: 'center', justifyContent: 'center' },

  ctaBar: { position: 'absolute', bottom: 0, left: 0, right: 0, backgroundColor: 'rgba(248,248,217,0.95)', borderTopWidth: 1, borderTopColor: 'rgba(26,26,15,0.06)', flexDirection: 'row', alignItems: 'center', paddingHorizontal: 24, paddingTop: 16, gap: 12 },
  iconBtn: { width: 48, height: 48, borderRadius: 24, borderWidth: 1, borderColor: 'rgba(26,26,15,0.15)', alignItems: 'center', justifyContent: 'center', backgroundColor: 'transparent' },
  bookBtn: { flex: 1, height: 48, borderRadius: 24, backgroundColor: THEME.accent, alignItems: 'center', justifyContent: 'center' },
  bookBtnText: { color: THEME.primary, fontSize: 13, fontWeight: '600' },

  lightbox: { flex: 1, backgroundColor: 'rgba(0,0,0,0.95)', alignItems: 'center', justifyContent: 'center' },
});
