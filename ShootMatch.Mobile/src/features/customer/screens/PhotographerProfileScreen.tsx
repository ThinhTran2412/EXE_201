import React, { useEffect, useState } from 'react';
import {
  ScrollView, StyleSheet, Text, View, Image, Pressable,
  ActivityIndicator, Alert, Dimensions, Modal,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation, useRoute } from '@react-navigation/native';
import { getPhotographer, Photographer } from '../api';
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

// ── Dummy Data ──
const DUMMY_EQUIPMENT = [
  { icon: 'camera-outline', name: 'Sony A7R V', desc: '61MP Full Frame Mirrorless' },
  { icon: 'settings-outline', name: '35mm f/1.4 Summilux', desc: 'Leica Prime Lens' },
  { icon: 'bulb-outline', name: 'Profoto B10 Plus', desc: '500Ws Studio Flash' },
];

const DUMMY_SERVICES = [
  { name: 'Portrait Session', duration: '1 giờ', price: '1.200.000₫', desc: '20 ảnh retouched' },
  { name: 'Fashion Editorial', duration: '3 giờ', price: '2.500.000₫', desc: '50 ảnh + video BTS' },
  { name: 'Full Day Event', duration: '8 giờ', price: '5.800.000₫', desc: 'Unlimited ảnh + album' },
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

  // State for Lightbox
  const [lightboxImg, setLightboxImg] = useState<string | null>(null);

  useEffect(() => {
    Promise.all([
      getPhotographer(photographerId),
      isFavorite(photographerId)
    ])
      .then(([data, favoriteStatus]) => {
        setP(data);
        setFav(favoriteStatus);
      })
      .catch(() => Alert.alert('Lỗi', 'Không tải được hồ sơ'))
      .finally(() => setLoading(false));
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

  if (loading) {
    return (
      <View style={[styles.safe, { justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color={THEME.accent} />
      </View>
    );
  }

  if (!p) return null;

  const photos = p.portfolioPhotos?.length ? p.portfolioPhotos : (p.avatarUrl ? [p.avatarUrl] : []);
  const displayPhotos = photos.slice(0, 9);
  const heroUri = p.coverPhotoUrl || photos[0] || p.avatarUrl || '';
  const specialties = ['Portrait', 'Fashion', 'Editorial']; // Dummy
  const scheduleSlots = [
    { day: 'T3', time: '09:00', state: 'normal' },
    { day: 'T3', time: '14:00', state: 'selected' },
    { day: 'T4', time: '10:00', state: 'unavailable' },
    { day: 'T4', time: '15:00', state: 'normal' },
    { day: 'T5', time: '09:00', state: 'normal' },
    { day: 'T5', time: '13:00', state: 'unavailable' },
    { day: 'T6', time: '10:00', state: 'normal' },
    { day: 'T7', time: '08:00', state: 'normal' },
  ];

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
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Dịch Vụ & Giá</Text>
          <View style={{ gap: 8 }}>
            {DUMMY_SERVICES.map((s, i) => (
              <View key={i} style={styles.serviceItem}>
                <View style={{ flex: 1 }}>
                  <Text style={{ fontSize: 13, fontWeight: '600', color: THEME.accent }}>{s.name}</Text>
                  <Text style={{ fontSize: 11, opacity: 0.5, color: THEME.accent, marginTop: 2 }}>{s.duration} · {s.desc}</Text>
                </View>
                <Text style={{ fontSize: 13, fontWeight: '700', color: THEME.accent }}>{s.price}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* ── SCHEDULE ── */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Lịch Trống Tuần Này</Text>
          <View style={styles.scheduleGrid}>
            {scheduleSlots.map((s, i) => (
              <View
                key={i}
                style={[
                  styles.timeSlot,
                  s.state === 'selected' && styles.timeSlotSelected,
                  s.state === 'unavailable' && styles.timeSlotUnavailable
                ]}
              >
                <Text style={[styles.slotDay, s.state === 'selected' && { color: THEME.primary }]}>{s.day}</Text>
                <Text style={[styles.slotTime, s.state === 'selected' && { color: THEME.primary }]}>{s.time}</Text>
              </View>
            ))}
          </View>
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
        <Pressable style={styles.iconBtn}>
          <Ionicons name="chatbubble-ellipses-outline" size={20} color={THEME.accent} />
        </Pressable>
        <Pressable
          style={styles.bookBtn}
          onPress={() => navigation.navigate('Checkout', { photographer: p })}
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
  serviceItem: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 16, borderRadius: 12, borderWidth: 1, borderColor: 'rgba(26,26,15,0.08)' },

  scheduleGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  timeSlot: { paddingVertical: 8, paddingHorizontal: 12, borderRadius: 10, backgroundColor: 'rgba(26,26,15,0.04)', borderWidth: 1, borderColor: 'rgba(26,26,15,0.08)', alignItems: 'center', width: '23%' },
  timeSlotSelected: { backgroundColor: THEME.accent, borderColor: THEME.accent },
  timeSlotUnavailable: { opacity: 0.35 },
  slotDay: { fontSize: 11, color: THEME.accent, marginBottom: 2 },
  slotTime: { fontSize: 11, fontWeight: '700', color: THEME.accent },

  reviewCard: { backgroundColor: 'rgba(26,26,15,0.03)', borderWidth: 1, borderColor: 'rgba(26,26,15,0.06)', borderRadius: 16, padding: 16 },
  reviewAvatar: { width: 32, height: 32, borderRadius: 16, backgroundColor: 'rgba(26,26,15,0.1)', alignItems: 'center', justifyContent: 'center' },

  ctaBar: { position: 'absolute', bottom: 0, left: 0, right: 0, backgroundColor: 'rgba(248,248,217,0.95)', borderTopWidth: 1, borderTopColor: 'rgba(26,26,15,0.06)', flexDirection: 'row', alignItems: 'center', paddingHorizontal: 24, paddingTop: 16, gap: 12 },
  iconBtn: { width: 48, height: 48, borderRadius: 24, borderWidth: 1, borderColor: 'rgba(26,26,15,0.15)', alignItems: 'center', justifyContent: 'center', backgroundColor: 'transparent' },
  bookBtn: { flex: 1, height: 48, borderRadius: 24, backgroundColor: THEME.accent, alignItems: 'center', justifyContent: 'center' },
  bookBtnText: { color: THEME.primary, fontSize: 13, fontWeight: '600' },

  lightbox: { flex: 1, backgroundColor: 'rgba(0,0,0,0.95)', alignItems: 'center', justifyContent: 'center' },
});
