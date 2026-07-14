import React, { useCallback, useEffect, useState } from 'react';
import {
  Dimensions, Image, StyleSheet, Text, View, Pressable, Alert, ActivityIndicator,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, {
  useSharedValue, useAnimatedStyle, withSpring, withTiming,
  runOnJS, interpolate, Extrapolation, withRepeat,
} from 'react-native-reanimated';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import { getPhotographers, Photographer } from '../api';
import { addFavorite } from '../utils/favorites';
import { colors } from '../../../app/theme/colors';

const { width: W, height: H } = Dimensions.get('window');
const CARD_W = W - 20;
const CARD_H = H * 0.63; // Giảm nhẹ tỉ lệ từ 0.65 xuống 0.63 để tránh đè lấp trên màn hình có phím điều hướng hệ thống
const SWIPE_THRESHOLD = W * 0.38;

const REGIONS: Record<string, string> = {
  HN: 'Hà Nội', HCM: 'TP.HCM', DN: 'Đà Nẵng', HP: 'Hải Phòng', CT: 'Cần Thơ',
};

// ── Match Score mock algorithm ────────────────────────────────────────────────
const getMatchScore = (photographer: Photographer) => {
  let score = 83;
  if (photographer.rating) {
    score += Math.round((photographer.rating - 4.0) * 10);
  }
  if (photographer.isPremium) {
    score += 4;
  }
  score += (photographer.displayName?.length ?? 0) % 5;
  return Math.min(Math.max(score, 75), 99);
};

// ── Radar Waves Empty State ───────────────────────────────────────────────────
function RadarScanner({ onReset }: { onReset: () => void }) {
  const pulse1 = useSharedValue(0.6);
  const pulse2 = useSharedValue(0.6);
  const pulse3 = useSharedValue(0.6);

  useEffect(() => {
    pulse1.value = withRepeat(withTiming(2.2, { duration: 2500 }), -1, false);
    pulse2.value = withRepeat(withTiming(2.2, { duration: 2500 }), -1, false);
    pulse3.value = withRepeat(withTiming(2.2, { duration: 2500 }), -1, false);
  }, []);

  const rStyle1 = useAnimatedStyle(() => ({
    transform: [{ scale: pulse1.value }],
    opacity: interpolate(pulse1.value, [0.6, 2.2], [0.5, 0]),
  }));
  const rStyle2 = useAnimatedStyle(() => ({
    transform: [{ scale: pulse2.value }],
    opacity: interpolate(pulse2.value, [0.6, 2.2], [0.5, 0]),
  }));
  const rStyle3 = useAnimatedStyle(() => ({
    transform: [{ scale: pulse3.value }],
    opacity: interpolate(pulse3.value, [0.6, 2.2], [0.5, 0]),
  }));

  return (
    <View style={styles.radarContainer}>
      <Animated.View style={[styles.radarCircle, rStyle1]} />
      <Animated.View style={[styles.radarCircle, rStyle2]} />
      <Animated.View style={[styles.radarCircle, rStyle3]} />
      <LinearGradient
        colors={[colors.accentOrange, colors.accent]}
        style={styles.radarCenter}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        <Ionicons name="camera" size={36} color="#fff" />
      </LinearGradient>

      <Text style={styles.radarTitle}>Hết lượt khám phá!</Text>
      <Text style={styles.radarSub}>Đang quét tìm thêm nhiếp ảnh gia ở gần bạn...</Text>

      <Pressable onPress={onReset} style={({ pressed }) => [styles.radarBtnPress, { opacity: pressed ? 0.8 : 1 }]}>
        <LinearGradient
          colors={[colors.accentOrange, colors.accent]}
          style={styles.radarBtnGradient}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
        >
          <Ionicons name="reload" size={16} color="#fff" style={{ marginRight: 6 }} />
          <Text style={styles.radarBtnText}>Khám phá lại</Text>
        </LinearGradient>
      </Pressable>
    </View>
  );
}

// ── Single Viewfinder Full Screen Card ─────────────────────────────────────────
function SwipeCard({
  photographer,
  onSwipeLeft,
  onSwipeRight,
  isTop,
  stackIndex,
}: {
  photographer: Photographer;
  onSwipeLeft: () => void;
  onSwipeRight: () => void;
  isTop: boolean;
  stackIndex: number;
}) {
  const translateX = useSharedValue(0);
  const translateY = useSharedValue(0);
  const scale = useSharedValue(1 - stackIndex * 0.04);
  const recOpacity = useSharedValue(1);

  const [currentSlide, setCurrentSlide] = useState(0);
  const photos = photographer?.portfolioPhotos?.length
    ? photographer.portfolioPhotos
    : (photographer?.avatarUrl ? [photographer.avatarUrl] : []);

  useEffect(() => {
    if (isTop) {
      recOpacity.value = withRepeat(withTiming(0.2, { duration: 800 }), -1, true);
    }
  }, [isTop]);

  const recStyle = useAnimatedStyle(() => ({
    opacity: recOpacity.value,
  }));

  const gesture = Gesture.Pan()
    .enabled(isTop)
    .onUpdate((e) => {
      translateX.value = e.translationX;
      translateY.value = e.translationY * 0.25;
    })
    .onEnd((e) => {
      if (Math.abs(e.translationX) > SWIPE_THRESHOLD) {
        const dir = e.translationX > 0 ? 1 : -1;
        translateX.value = withTiming(dir * W * 1.5, { duration: 250 });
        translateY.value = withTiming(e.translationY * 1.5, { duration: 250 });
        if (dir === 1) runOnJS(onSwipeRight)();
        else runOnJS(onSwipeLeft)();
      } else {
        translateX.value = withSpring(0, { damping: 15 });
        translateY.value = withSpring(0, { damping: 15 });
      }
    });

  const cardStyle = useAnimatedStyle(() => {
    const rotate = interpolate(
      translateX.value, [-W, 0, W], [-12, 0, 12], Extrapolation.CLAMP
    );
    return {
      transform: [
        { translateX: translateX.value },
        { translateY: translateY.value },
        { rotate: `${rotate}deg` },
        { scale: isTop ? 1 : scale.value },
      ],
    };
  });

  const likeOverlayStyle = useAnimatedStyle(() => ({
    opacity: interpolate(translateX.value, [0, SWIPE_THRESHOLD * 0.8], [0, 0.9], Extrapolation.CLAMP),
  }));
  const nopeOverlayStyle = useAnimatedStyle(() => ({
    opacity: interpolate(translateX.value, [-SWIPE_THRESHOLD * 0.8, 0], [0.9, 0], Extrapolation.CLAMP),
  }));
  const likeIconStyle = useAnimatedStyle(() => ({
    transform: [{ scale: interpolate(translateX.value, [0, SWIPE_THRESHOLD], [0.5, 1.2], Extrapolation.CLAMP) }],
  }));
  const nopeIconStyle = useAnimatedStyle(() => ({
    transform: [{ scale: interpolate(translateX.value, [-SWIPE_THRESHOLD, 0], [1.2, 0.5], Extrapolation.CLAMP) }],
  }));

  const stackOffset = isTop ? 0 : stackIndex * 12;

  const getFullUrl = (url: string) => {
    if (!url) return '';
    const apiUrl = process.env.EXPO_PUBLIC_API_URL || '';
    const ipMatch = apiUrl.match(/http:\/\/((\d+\.){3}\d+)/);
    if (ipMatch && (url.includes('localhost') || url.includes('127.0.0.1'))) {
      return url.replace(/localhost|127\.0\.0\.1/, ipMatch[1]);
    }
    return url;
  };

  return (
    <GestureDetector gesture={gesture}>
      <Animated.View style={[styles.card, { top: stackOffset, zIndex: 10 - stackIndex }, cardStyle]}>
        <View style={styles.cardInner}>

          {/* Ảnh thô (Raw photo) tràn ngập khung quẹt */}
          {photos.length > 0
            ? <Image source={{ uri: getFullUrl(photos[currentSlide]) }} style={styles.viewfinderImage as any} />
            : <View style={[styles.viewfinderImage as any, styles.cardImagePlaceholder]}>
              <Text style={styles.cardImageLetter}>{photographer?.displayName?.[0] ?? '?'}</Text>
            </View>
          }

          {/* Vùng tap chuyển ảnh */}
          {isTop && (
            <View style={styles.tapZones}>
              <Pressable style={styles.tapLeft} onPress={() => { if (currentSlide > 0) setCurrentSlide(currentSlide - 1); }} />
              <Pressable style={styles.tapRight} onPress={() => { if (currentSlide < photos.length - 1) setCurrentSlide(currentSlide + 1); }} />
            </View>
          )}

          {/* DSLR Viewfinder overlay (chỉ giữ khung rìa, bỏ chấm tròn giữa) */}
          <View style={styles.focusBrackets} pointerEvents="none">
            <View style={styles.focusBracketTL} />
            <View style={styles.focusBracketTR} />
            <View style={styles.focusBracketBL} />
            <View style={styles.focusBracketBR} />
          </View>

          {/* DSLR HUD indicators */}
          <View style={styles.hudTop} pointerEvents="none">
            <View style={styles.hudRow}>
              <Animated.View style={[styles.recIndicator, recStyle]}>
                <View style={styles.redDot} />
                <Text style={styles.hudText}>REC</Text>
              </Animated.View>
              <Text style={styles.hudText}>RAW 10-bit</Text>
              <View style={styles.batteryRow}>
                <Ionicons name="battery-full" size={14} color="rgba(255,255,255,0.8)" />
                <Text style={[styles.hudText, { marginLeft: 3 }]}>98%</Text>
              </View>
            </View>
          </View>

          <View style={styles.hudBottom} pointerEvents="none">
            <View style={styles.hudRow}>
              <Text style={styles.hudText}>F/1.8</Text>
              <Text style={styles.hudText}>1/250s</Text>
              <Text style={styles.hudText}>EV -0.3</Text>
              <Text style={styles.hudText}>ISO 400</Text>
            </View>
          </View>

          {/* Gradient Wash */}
          <LinearGradient
            colors={['transparent', 'rgba(26,26,15,0.3)', 'rgba(26,26,15,0.92)']}
            style={styles.cardGradient}
            pointerEvents="none"
          />

          {/* Carousel dots indicators */}
          {photos.length > 1 && (
            <View style={styles.carouselIndicators}>
              {photos.map((_, i) => (
                <View key={i} style={styles.carouselBarBg}>
                  <View
                    style={[
                      styles.carouselBarFill,
                      i === currentSlide && styles.carouselBarFillActive,
                      i < currentSlide && styles.carouselBarFillPassed,
                    ]}
                  />
                </View>
              ))}
            </View>
          )}

          {/* Swipe Action Overlays */}
          <Animated.View style={[styles.swipeOverlay, styles.likeOverlay, likeOverlayStyle]} pointerEvents="none">
            <Animated.View style={[styles.swipeIconCircle, { backgroundColor: '#22c55e' }, likeIconStyle]}>
              <Ionicons name="heart" size={54} color="#fff" />
            </Animated.View>
          </Animated.View>

          <Animated.View style={[styles.swipeOverlay, styles.nopeOverlay, nopeOverlayStyle]} pointerEvents="none">
            <Animated.View style={[styles.swipeIconCircle, { backgroundColor: '#ef4444' }, nopeIconStyle]}>
              <Ionicons name="close" size={60} color="#fff" />
            </Animated.View>
          </Animated.View>

          {/* Phần ảnh sẽ chỉ hiển thị Tên và Tag phong cách */}
          <View style={styles.photoInfoOverlay} pointerEvents="none">
            <Text style={styles.cardName} numberOfLines={1}>{photographer?.displayName || 'Nhiếp ảnh gia'}</Text>

            <View style={styles.tagsRow}>
              <View style={styles.tag}>
                <Ionicons name="aperture" size={10} color={colors.accentOrange} style={{ marginRight: 4 }} />
                <Text style={styles.tagText}>Ngoại cảnh</Text>
              </View>
              <View style={styles.tag}>
                <Ionicons name="aperture" size={10} color={colors.accentOrange} style={{ marginRight: 4 }} />
                <Text style={styles.tagText}>Chân dung</Text>
              </View>
            </View>
          </View>

        </View>
      </Animated.View>
    </GestureDetector>
  );
}

// ── Main DiscoverScreen ────────────────────────────────────────────────────────
export default function DiscoverScreen() {
  const navigation = useNavigation<any>();
  const insets = useSafeAreaInsets();
  const [cards, setCards] = useState<Photographer[]>([]);
  const [totalCards, setTotalCards] = useState(0);
  const [loading, setLoading] = useState(true);
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  async function init() {
    setLoading(true);
    try {
      const feed = await getPhotographers();
      setCards(feed);
      setTotalCards(feed.length);
    } catch (e) {
      Alert.alert('Lỗi', 'Không thể tải danh sách nhiếp ảnh gia.');
    }
    setLoading(false);
  }

  useEffect(() => { init(); }, []);

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 2000);
  };

  const handleSwipeLeft = useCallback(async () => {
    const top = cards[0];
    if (!top) return;
    setCards((c) => c.slice(1));
  }, [cards]);

  const handleSwipeRight = useCallback(async () => {
    const top = cards[0];
    if (!top) return;
    setCards((c) => c.slice(1));
    showToast(`❤️ Đã lưu ${top?.displayName || 'Nhiếp ảnh gia'} vào Yêu Thích!`);
    await addFavorite(top);
  }, [cards]);

  if (loading) {
    return (
      <View style={[styles.safe, { justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color={colors.accentOrange} />
        <Text style={styles.loadingText}>Đang tìm kiếm các nhiếp ảnh gia tốt nhất...</Text>
      </View>
    );
  }

  const topCard = cards[0];

  return (
    <View style={[styles.safe, { paddingTop: Math.max(insets.top, 12) }]}>
      <View style={styles.bgBlobs}>
        <View style={[styles.bgBlob, styles.bgBlob1]} />
        <View style={[styles.bgBlob, styles.bgBlob2]} />
      </View>

      {/* Minimal Header for Profile Detail and Filter */}
      <View style={styles.headerMinimal}>
        {topCard ? (
          <Pressable
            onPress={() => navigation.navigate('PhotographerProfile', { photographerId: topCard.id })}
            style={styles.headerProfileBtn}
          >
            <Ionicons name="person" size={20} color={colors.dark} />
          </Pressable>
        ) : (
          <View style={{ width: 44 }} />
        )}
        <View style={{ flex: 1 }} />
        <Pressable onPress={() => { }} style={styles.filterBtn}>
          <Ionicons name="options" size={22} color={colors.dark} />
        </Pressable>
      </View>

      <View style={styles.stackArea}>
        {cards.length === 0 ? (
          <RadarScanner onReset={init} />
        ) : (
          <View style={styles.stack}>
            {cards.slice(0, 3).map((p, i) => (
              <SwipeCard
                key={p.id}
                photographer={p}
                isTop={i === 0}
                stackIndex={i}
                onSwipeLeft={handleSwipeLeft}
                onSwipeRight={handleSwipeRight}
              />
            ))}
          </View>
        )}
      </View>

      {/* Bảng thông tin nghệ thuật & Tương thích thay thế hoàn toàn dãy nút bấm */}
      {topCard && (
        <Pressable
          onPress={() => navigation.navigate('PhotographerProfile', { photographerId: topCard.id })}
          style={({ pressed }) => [
            styles.dashboardContainer,
            { paddingBottom: 6, opacity: pressed ? 0.85 : 1 }
          ]}
        >
          <View style={styles.dashboardInner}>
            <View style={styles.dashHeaderRow}>
              {/* Tỉ lệ tương thích */}
              <LinearGradient
                colors={['#10b981', '#059669']}
                style={styles.dashMatchBadge}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
              >
                <Ionicons name="flash" size={12} color="#fff" style={{ marginRight: 4 }} />
                <Text style={styles.dashMatchText}>{getMatchScore(topCard)}% Tương thích</Text>
              </LinearGradient>

              {/* Địa điểm */}
              <View style={styles.dashLocBadge}>
                <Ionicons name="location-sharp" size={12} color="rgba(26,26,15,0.6)" style={{ marginRight: 3 }} />
                <Text style={styles.dashLocText}>
                  {REGIONS[topCard.region] || topCard.region || 'Toàn quốc'}
                </Text>
              </View>
            </View>

            {/* Đánh giá & Giá tiền thiết kế dạng Pill đôi cao cấp kiểu Airbnb */}
            <View style={styles.dashStatsRow}>
              <View style={styles.dashStatPill}>
                <Ionicons name="star" size={13} color="#fbbf24" style={{ marginRight: 2 }} />
                <Text style={styles.dashStatValue}>{topCard.rating?.toFixed(1) || '5.0'}</Text>
                <Text style={styles.dashStatLabel}> Đánh giá</Text>
              </View>

              <View style={styles.dashStatPill}>
                <Ionicons name="wallet" size={13} color="#059669" style={{ marginRight: 2 }} />
                <Text style={styles.dashStatValue}>
                  {topCard.minBudget ? (topCard.minBudget / 1000000).toFixed(1) + 'M' : '0.5M'}
                </Text>
                <Text style={styles.dashStatLabel}> VND / Buổi</Text>
              </View>
            </View>

            {/* Phong cách nghệ thuật của nhiếp ảnh gia */}
            <View style={styles.artStyleRow}>
              <Text style={styles.artStyleLabel}>GU NGHỆ THUẬT:</Text>
              <View style={styles.artStylePills}>
                <View style={styles.artPill}><Text style={styles.artPillText}>Vintage Film</Text></View>
                <View style={styles.artPill}><Text style={styles.artPillText}>Streetlife</Text></View>
                <View style={styles.artPill}><Text style={styles.artPillText}>Minimalist</Text></View>
              </View>
            </View>
          </View>
        </Pressable>
      )}

      {toastMsg && (
        <View style={styles.toastContainer} pointerEvents="none">
          <LinearGradient
            colors={[colors.dark, 'rgba(26,26,15,0.95)']}
            style={styles.toastGradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
          >
            <Ionicons name="heart" size={16} color="#ff4200" style={{ marginRight: 8 }} />
            <Text style={styles.toastText}>{toastMsg}</Text>
          </LinearGradient>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  loadingText: { color: 'rgba(26,26,15,0.6)', marginTop: 16, fontSize: 13, fontWeight: '600' },

  bgBlobs: { ...StyleSheet.absoluteFillObject, zIndex: 0, overflow: 'hidden' },
  bgBlob: { position: 'absolute', width: 250, height: 250, borderRadius: 125, opacity: 0.08 },
  bgBlob1: { top: -50, right: -50, backgroundColor: '#ff4200' },
  bgBlob2: { bottom: 50, left: -80, backgroundColor: '#ca8a04' },

  headerMinimal: { flexDirection: 'row', paddingHorizontal: 24, paddingBottom: 6, zIndex: 50 },
  headerProfileBtn: { width: 44, height: 44, borderRadius: 22, backgroundColor: 'rgba(255,255,255,0.85)', alignItems: 'center', justifyContent: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.1, shadowRadius: 10, elevation: 5 },
  filterBtn: { width: 44, height: 44, borderRadius: 22, backgroundColor: 'rgba(255,255,255,0.85)', alignItems: 'center', justifyContent: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.1, shadowRadius: 10, elevation: 5 },

  stackArea: { flex: 1, justifyContent: 'center', alignItems: 'center', zIndex: 5 },
  stack: { width: CARD_W, height: CARD_H, alignItems: 'center', justifyContent: 'center', marginTop: 6 },

  card: { position: 'absolute', width: CARD_W, height: CARD_H, borderRadius: 28, backgroundColor: '#1c1c13', shadowColor: '#1a1a0f', shadowOffset: { width: 0, height: 12 }, shadowOpacity: 0.18, shadowRadius: 24, elevation: 12, borderWidth: 1.5, borderColor: 'rgba(255,247,225,0.08)' },
  cardInner: { flex: 1, borderRadius: 28, overflow: 'hidden', position: 'relative' },

  // Raw photo frame covers 100% of swipe card
  viewfinderImage: { ...StyleSheet.absoluteFillObject, width: '100%', height: '100%', resizeMode: 'cover' },
  cardImagePlaceholder: { backgroundColor: '#e2e8f0', alignItems: 'center', justifyContent: 'center' },
  cardImageLetter: { fontSize: 80, fontWeight: '900', color: '#cbd5e1' },
  cardGradient: { ...StyleSheet.absoluteFillObject, zIndex: 20 },

  tapZones: { ...StyleSheet.absoluteFillObject, flexDirection: 'row', zIndex: 35 },
  tapLeft: { flex: 1 },
  tapRight: { flex: 1 },

  // DSLR brackets
  focusBrackets: { ...StyleSheet.absoluteFillObject, zIndex: 22 },
  focusBracketTL: { position: 'absolute', top: 32, left: 24, width: 16, height: 16, borderTopWidth: 2, borderLeftWidth: 2, borderColor: 'rgba(255,255,255,0.45)' },
  focusBracketTR: { position: 'absolute', top: 32, right: 24, width: 16, height: 16, borderTopWidth: 2, borderRightWidth: 2, borderColor: 'rgba(255,255,255,0.45)' },
  focusBracketBL: { position: 'absolute', bottom: 95, left: 24, width: 16, height: 16, borderBottomWidth: 2, borderLeftWidth: 2, borderColor: 'rgba(255,255,255,0.45)' },
  focusBracketBR: { position: 'absolute', bottom: 95, right: 24, width: 16, height: 16, borderBottomWidth: 2, borderRightWidth: 2, borderColor: 'rgba(255,255,255,0.45)' },

  // DSLR HUD HUD
  hudTop: { position: 'absolute', top: 24, left: 20, right: 20, zIndex: 25 },
  hudBottom: { position: 'absolute', bottom: 80, left: 20, right: 20, zIndex: 25 },
  hudRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  hudText: { color: 'rgba(255,255,255,0.85)', fontSize: 10, fontWeight: '700', fontFamily: 'monospace', textShadowColor: '#000', textShadowOffset: { width: 1, height: 1 }, textShadowRadius: 2 },
  recIndicator: { flexDirection: 'row', alignItems: 'center' },
  redDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: '#ef4444', marginRight: 4 },
  batteryRow: { flexDirection: 'row', alignItems: 'center' },

  carouselIndicators: { position: 'absolute', top: 18, left: 20, right: 20, flexDirection: 'row', gap: 4, zIndex: 30 },
  carouselBarBg: { flex: 1, height: 3, borderRadius: 1.5, backgroundColor: 'rgba(255,255,255,0.25)', overflow: 'hidden' },
  carouselBarFill: { height: '100%', width: 0, backgroundColor: 'rgba(255,255,255,0.4)' },
  carouselBarFillActive: { width: '100%', backgroundColor: '#fff' },
  carouselBarFillPassed: { width: '100%', backgroundColor: '#fff' },

  swipeOverlay: { ...StyleSheet.absoluteFillObject, justifyContent: 'center', alignItems: 'center', zIndex: 40 },
  likeOverlay: { backgroundColor: 'rgba(34, 197, 94, 0.18)' },
  nopeOverlay: { backgroundColor: 'rgba(239, 68, 68, 0.18)' },
  swipeIconCircle: { width: 90, height: 90, borderRadius: 45, justifyContent: 'center', alignItems: 'center', borderWidth: 3, borderColor: '#fff', shadowColor: '#000', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.25, shadowRadius: 15, elevation: 8 },

  // Overlay info on image (Name & Tags only)
  photoInfoOverlay: { position: 'absolute', bottom: 0, left: 0, right: 0, paddingHorizontal: 20, paddingBottom: 10, paddingTop: 30, zIndex: 25 },
  cardName: { color: '#fff', fontSize: 26, fontWeight: '900', marginBottom: 6, textShadowColor: 'rgba(0,0,0,0.5)', textShadowOffset: { width: 1, height: 1 }, textShadowRadius: 3 },
  tagsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  tag: { backgroundColor: 'rgba(26,26,15,0.7)', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20, flexDirection: 'row', alignItems: 'center', borderWidth: 0.5, borderColor: 'rgba(255,255,255,0.1)' },
  tagText: { color: '#fff7e1', fontSize: 10, fontWeight: '700', letterSpacing: 0.5 },

  // Bottom Dashboard replaces action buttons
  dashboardContainer: { paddingHorizontal: 16, paddingTop: 4, zIndex: 10 },
  dashboardInner: { backgroundColor: 'rgba(26,26,15,0.04)', borderRadius: 20, padding: 10, borderWidth: 1, borderColor: 'rgba(26,26,15,0.06)' },
  dashHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 },
  dashMatchBadge: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 10, paddingVertical: 5, borderRadius: 10 },
  dashMatchText: { color: '#fff', fontSize: 11, fontWeight: '800' },
  dashLocBadge: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(26,26,15,0.06)', paddingHorizontal: 10, paddingVertical: 5, borderRadius: 10 },
  dashLocText: { color: colors.dark, fontSize: 11, fontWeight: '700' },

  dashStatsRow: { flexDirection: 'row', gap: 10, marginBottom: 8 },
  dashStatPill: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: '#fff', paddingVertical: 7, borderRadius: 14, shadowColor: '#1a1a0f', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.04, shadowRadius: 8, elevation: 2, borderWidth: 1, borderColor: 'rgba(26,26,15,0.04)' },
  dashStatValue: { color: colors.dark, fontSize: 13, fontWeight: '800' },
  dashStatLabel: { color: 'rgba(26,26,15,0.55)', fontSize: 10, fontWeight: '700' },

  artStyleRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  artStyleLabel: { color: 'rgba(26,26,15,0.4)', fontSize: 10, fontWeight: '800', letterSpacing: 0.5 },
  artStylePills: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, flex: 1 },
  artPill: { backgroundColor: colors.dark, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 },
  artPillText: { color: colors.background, fontSize: 9, fontWeight: '700' },

  radarContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', width: '100%', paddingHorizontal: 30 },
  radarCircle: { position: 'absolute', width: 200, height: 200, borderRadius: 100, borderWidth: 1, borderColor: colors.accentOrange, backgroundColor: 'rgba(255,66,0,0.03)' },
  radarCenter: { width: 80, height: 80, borderRadius: 40, justifyContent: 'center', alignItems: 'center', shadowColor: colors.accentOrange, shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.3, shadowRadius: 16, elevation: 8, marginBottom: 30 },
  radarTitle: { fontSize: 20, fontWeight: '900', color: colors.dark, marginBottom: 8, textAlign: 'center' },
  radarSub: { fontSize: 13, color: colors.textMuted, textAlign: 'center', marginBottom: 32, lineHeight: 18 },
  radarBtnPress: {},
  radarBtnGradient: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 28, paddingVertical: 14, borderRadius: 28, shadowColor: colors.accentOrange, shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.25, shadowRadius: 12, elevation: 4 },
  radarBtnText: { color: '#fff', fontWeight: '800', fontSize: 14 },

  toastContainer: { position: 'absolute', bottom: 120, left: 24, right: 24, alignItems: 'center', zIndex: 100 },
  toastGradient: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 22, paddingVertical: 12, borderRadius: 30, shadowColor: '#000', shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.15, shadowRadius: 12, elevation: 4 },
  toastText: { color: '#fff', fontSize: 12, fontWeight: '700' },
});
