import React, { useCallback, useEffect, useState } from 'react';
import {
  Dimensions, Image, StyleSheet, Text, View, Pressable, Alert, ActivityIndicator,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, {
  useSharedValue, useAnimatedStyle, withSpring, withTiming,
  runOnJS, interpolate, Extrapolation,
} from 'react-native-reanimated';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import { getPhotographers, Photographer } from '../api';
import { addFavorite } from '../utils/favorites';

const { width: W, height: H } = Dimensions.get('window');
const CARD_W = W - 24;
const CARD_H = H * 0.65;
const SWIPE_THRESHOLD = W * 0.35;

const THEME = {
  primary: '#ff4200',
  backgroundLight: '#fff7e1',
  accent: '#1a1a0f',
  success: '#22c55e',
  danger: '#ef4444',
};

const REGIONS: Record<string, string> = {
  HN: 'Hà Nội', HCM: 'TP.HCM', DN: 'Đà Nẵng', HP: 'Hải Phòng', CT: 'Cần Thơ',
};

// ── Single swipe card ─────────────────────────────────────────────────────────
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
  const navigation = useNavigation<any>();
  const translateX = useSharedValue(0);
  const translateY = useSharedValue(0);
  const scale = useSharedValue(1 - stackIndex * 0.05);
  
  const [currentSlide, setCurrentSlide] = useState(0);
  const photos = photographer?.portfolioPhotos?.length
    ? photographer.portfolioPhotos
    : (photographer?.avatarUrl ? [photographer.avatarUrl] : []);

  const gesture = Gesture.Pan()
    .enabled(isTop)
    .onUpdate((e) => {
      translateX.value = e.translationX;
      translateY.value = e.translationY * 0.2;
    })
    .onEnd((e) => {
      if (Math.abs(e.translationX) > SWIPE_THRESHOLD) {
        const dir = e.translationX > 0 ? 1 : -1;
        translateX.value = withTiming(dir * W * 1.5, { duration: 300 });
        translateY.value = withTiming(e.translationY * 1.5, { duration: 300 });
        if (dir === 1) runOnJS(onSwipeRight)();
        else           runOnJS(onSwipeLeft)();
      } else {
        translateX.value = withSpring(0, { damping: 15 });
        translateY.value = withSpring(0, { damping: 15 });
      }
    });

  const cardStyle = useAnimatedStyle(() => {
    const rotate = interpolate(
      translateX.value, [-W, 0, W], [-18, 0, 18], Extrapolation.CLAMP
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

  // Stamp overlays
  const likeOpacity = useAnimatedStyle(() => ({
    opacity: interpolate(translateX.value, [0, SWIPE_THRESHOLD / 2], [0, 1], Extrapolation.CLAMP),
  }));
  const nopeOpacity = useAnimatedStyle(() => ({
    opacity: interpolate(translateX.value, [-SWIPE_THRESHOLD / 2, 0], [1, 0], Extrapolation.CLAMP),
  }));

  const stackOffset = isTop ? 0 : stackIndex * 12;

  const handleTap = (e: any) => {
    if (!isTop) return;
    const x = e.nativeEvent.locationX;
    if (x < CARD_W / 2) {
      if (currentSlide > 0) setCurrentSlide(currentSlide - 1);
    } else {
      if (currentSlide < photos.length - 1) setCurrentSlide(currentSlide + 1);
    }
  };

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
        {/* Photo Carousel */}
        <Pressable
          onPress={(e) => handleTap(e)}
          style={styles.cardImageWrap}
        >
          {photos.length > 0
            ? <Image source={{ uri: getFullUrl(photos[currentSlide]) }} style={styles.cardImage} />
            : <View style={[styles.cardImage, styles.cardImagePlaceholder]}>
                <Text style={styles.cardImageLetter}>{photographer?.displayName?.[0] ?? '?'}</Text>
              </View>
          }
          <LinearGradient
            colors={['transparent', 'rgba(26,26,15,0.7)', 'rgba(26,26,15,0.95)']}
            style={styles.cardGradient}
          />

          {/* Carousel Indicators */}
          {photos.length > 1 && (
            <View style={styles.carouselIndicators}>
              {photos.map((_, i) => (
                <View key={i} style={[styles.carouselDot, i === currentSlide && styles.carouselDotActive]} />
              ))}
            </View>
          )}

          {/* LIKE overlay */}
          <Animated.View style={[styles.swipeOverlay, likeOpacity, { backgroundColor: 'rgba(0,0,0,0.4)' }]} pointerEvents="none">
            <View style={[styles.stamp, { borderColor: '#fff' }]}>
              <Ionicons name="heart-outline" size={28} color="#fff" />
              <Text style={styles.stampText}>YÊU THÍCH</Text>
            </View>
          </Animated.View>

          {/* NOPE overlay */}
          <Animated.View style={[styles.swipeOverlay, nopeOpacity, { backgroundColor: 'rgba(0,0,0,0.4)' }]} pointerEvents="none">
            <View style={[styles.stamp, { borderColor: '#fff' }]}>
              <Ionicons name="close-outline" size={32} color="#fff" />
              <Text style={styles.stampText}>BỎ QUA</Text>
            </View>
          </Animated.View>

          {/* Info overlay */}
          <View style={styles.cardInfo}>
            {photographer?.isPremium && (
              <View style={styles.verifiedBadge}>
                <Ionicons name="checkmark-circle" size={14} color="#4ade80" />
                <Text style={styles.verifiedText}>Verified</Text>
              </View>
            )}
            <Text style={styles.cardName}>{photographer?.displayName || 'Nhiếp ảnh gia'}</Text>
            <Text style={styles.cardSub}>
              {(photographer?.displayName || '').toUpperCase()} STUDIO · {REGIONS[photographer?.region || ''] ?? photographer?.region ?? 'Khác'}
            </Text>

            <View style={styles.cardStatsRow}>
              <View style={styles.cardStatItem}>
                <Text style={styles.statIcon}>★</Text>
                <Text style={styles.statValue}>{photographer?.rating?.toFixed(1) || '0.0'}</Text>
              </View>
              <View style={styles.cardStatItem}>
                <Ionicons name="cash-outline" size={12} color="rgba(255,255,255,0.7)" />
                <Text style={styles.statValue}>{photographer?.minBudget?.toLocaleString('vi-VN') || 0} VNĐ</Text>
              </View>
            </View>

            <View style={styles.tagsRow}>
              <View style={styles.tag}><Text style={styles.tagText}>Khám phá</Text></View>
              <View style={styles.tag}><Text style={styles.tagText}>Chụp cá nhân</Text></View>
            </View>
          </View>
        </Pressable>
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
    // TODO: Ghi nhận bỏ qua (nếu cần)
  }, [cards]);

  const handleSwipeRight = useCallback(async () => {
    const top = cards[0];
    if (!top) return;
    setCards((c) => c.slice(1));
    showToast(`❤️ Đã lưu ${top?.displayName || 'Nhiếp ảnh gia'} vào Yêu Thích!`);
    await addFavorite(top);
  }, [cards]);

  const handleButtonSwipe = (dir: 'Left' | 'Right') => {
    if (cards.length === 0) return;
    if (dir === 'Right') handleSwipeRight();
    else handleSwipeLeft();
  };

  if (loading) {
    return (
      <View style={[styles.safe, { justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color={THEME.accent} />
        <Text style={styles.loadingText}>Đang tải danh sách nhiếp ảnh gia...</Text>
      </View>
    );
  }

  const currentIdx = totalCards - cards.length + 1;
  const progressPct = totalCards > 0 ? (currentIdx / totalCards) * 100 : 0;

  return (
    <View style={[styles.safe, { paddingTop: Math.max(insets.top, 16) }]}>
      {/* Header */}
      <View style={styles.header}>
        <Pressable onPress={() => navigation.goBack()} style={styles.headerBtn}>
          <Ionicons name="arrow-back" size={20} color={THEME.accent} />
        </Pressable>
        <Text style={{ fontSize: 22, fontWeight: '900', fontStyle: 'italic', color: THEME.accent }}>PicKic</Text>
        <Pressable onPress={() => {}} style={styles.headerBtn}>
          <Ionicons name="options-outline" size={20} color={THEME.accent} />
        </Pressable>
      </View>

      {/* Progress */}
      <View style={styles.progressContainer}>
        <View style={styles.progressHeader}>
          <Text style={styles.progressLabel}>PHOTOGRAPHER</Text>
          <Text style={styles.progressCount}>{Math.min(currentIdx, totalCards)} / {totalCards}</Text>
        </View>
        <View style={styles.progressBarBg}>
          <LinearGradient
            colors={[THEME.accent, 'rgba(26,26,15,0.7)']}
            style={[styles.progressBarFill, { width: `${progressPct}%` }]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
          />
        </View>
      </View>

      {/* Card Stack Area */}
      <View style={styles.stackArea}>
        {cards.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons name="images-outline" size={64} color="rgba(26,26,15,0.2)" />
            <Text style={styles.emptyTitle}>Hết rồi!</Text>
            <Text style={styles.emptySub}>Bạn đã lướt hết các nhiếp ảnh gia hiện có</Text>
            <Pressable onPress={init} style={styles.btnReset}>
              <Text style={styles.btnResetText}>Khám phá lại</Text>
            </Pressable>
          </View>
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

      {/* Action Buttons */}
      <View style={[styles.actions, { paddingBottom: Math.max(insets.bottom, 24) }]}>
        <Pressable style={[styles.actionBtn, styles.btnNope]} onPress={() => handleButtonSwipe('Left')}>
          <LinearGradient colors={['#fff7e1', '#ffe8c0']} style={styles.btnGradient} />
          <Ionicons name="close" size={28} color={THEME.accent} />
        </Pressable>
        <Pressable
          style={[styles.actionBtn, styles.btnInfo]}
          onPress={() => cards.length > 0 && navigation.navigate('PhotographerProfile', { photographerId: cards[0]?.id })}
        >
          <LinearGradient colors={['#fff7e1', '#ffe8c0']} style={styles.btnGradient} />
          <Ionicons name="information" size={22} color={THEME.accent} />
        </Pressable>
        <Pressable style={[styles.actionBtn, styles.btnLike]} onPress={() => handleButtonSwipe('Right')}>
          <LinearGradient colors={['#fff7e1', '#ffe8c0']} style={styles.btnGradient} />
          <Ionicons name="heart" size={28} color={THEME.primary} />
        </Pressable>
      </View>

      {/* Toast */}
      <Animated.View style={[styles.toast, toastMsg ? styles.toastShow : styles.toastHide]} pointerEvents="none">
        <Text style={styles.toastText}>{toastMsg}</Text>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: THEME.backgroundLight },
  loadingText: { color: 'rgba(26,26,15,0.6)', marginTop: 16, fontSize: 13, fontWeight: '500' },
  
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingVertical: 12 },
  headerBtn: { width: 40, height: 40, borderRadius: 20, borderWidth: 1, borderColor: 'rgba(26,26,15,0.1)', alignItems: 'center', justifyContent: 'center' },

  progressContainer: { paddingHorizontal: 24, paddingBottom: 8 },
  progressHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 },
  progressLabel: { fontSize: 9, fontFamily: 'monospace', textTransform: 'uppercase', letterSpacing: 1.5, color: 'rgba(26,26,15,0.4)' },
  progressCount: { fontSize: 9, fontFamily: 'monospace', color: THEME.accent },
  progressBarBg: { height: 2, backgroundColor: 'rgba(26,26,15,0.1)', borderRadius: 2, overflow: 'hidden' },
  progressBarFill: { height: '100%', borderRadius: 2 },

  stackArea: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  stack: { width: CARD_W, height: CARD_H, alignItems: 'center', justifyContent: 'center' },

  card: { position: 'absolute', width: CARD_W, height: CARD_H, borderRadius: 24, backgroundColor: '#fff', shadowColor: '#000', shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.15, shadowRadius: 30, elevation: 12 },
  cardImageWrap: { width: '100%', height: '100%', borderRadius: 24, overflow: 'hidden' },
  cardImage: { width: '100%', height: '100%', resizeMode: 'cover' },
  cardImagePlaceholder: { backgroundColor: '#e2e8f0', alignItems: 'center', justifyContent: 'center' },
  cardImageLetter: { fontSize: 80, fontWeight: '900', color: '#cbd5e1' },
  cardGradient: { position: 'absolute', bottom: 0, left: 0, right: 0, height: '50%' },

  carouselIndicators: { position: 'absolute', top: 16, left: 0, right: 0, flexDirection: 'row', justifyContent: 'center', gap: 4, zIndex: 20 },
  carouselDot: { width: 5, height: 5, borderRadius: 2.5, backgroundColor: 'rgba(255,255,255,0.5)' },
  carouselDotActive: { width: 20, backgroundColor: 'rgba(255,255,255,0.95)' },

  swipeOverlay: { ...StyleSheet.absoluteFillObject, justifyContent: 'center', alignItems: 'center', zIndex: 30, borderRadius: 24 },
  stamp: { flexDirection: 'row', alignItems: 'center', gap: 8, borderWidth: 2, paddingHorizontal: 20, paddingVertical: 10, borderRadius: 12, transform: [{ rotate: '-15deg' }] },
  stampText: { fontSize: 20, fontWeight: '500', color: '#fff', letterSpacing: 2 },

  cardInfo: { position: 'absolute', bottom: 0, left: 0, right: 0, padding: 24, paddingTop: 40 },
  verifiedBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, marginBottom: 8 },
  verifiedText: { color: '#fff', fontSize: 10, fontWeight: '600', letterSpacing: 0.5 },
  cardName: { color: '#fff', fontSize: 28, fontWeight: '800', fontStyle: 'italic', marginBottom: 4 },
  cardSub: { color: 'rgba(255,255,255,0.8)', fontSize: 10, fontFamily: 'monospace', letterSpacing: 2, marginBottom: 12 },
  cardStatsRow: { flexDirection: 'row', gap: 16, marginBottom: 12 },
  cardStatItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  statIcon: { color: '#fbbf24', fontSize: 12 },
  statValue: { color: '#fff', fontSize: 12, fontWeight: '600' },
  tagsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  tag: { backgroundColor: 'rgba(255,255,255,0.2)', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 },
  tagText: { color: '#fff', fontSize: 9, fontWeight: '600' },

  emptyState: { alignItems: 'center', padding: 40 },
  emptyTitle: { fontSize: 24, fontStyle: 'italic', fontWeight: '800', color: 'rgba(26,26,15,0.6)', marginTop: 16, marginBottom: 8 },
  emptySub: { fontSize: 13, color: 'rgba(26,26,15,0.4)', marginBottom: 24, textAlign: 'center' },
  btnReset: { backgroundColor: THEME.primary, paddingHorizontal: 32, paddingVertical: 14, borderRadius: 30 },
  btnResetText: { color: '#fff', fontWeight: '700', fontSize: 13 },

  actions: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 16, paddingTop: 16 },
  actionBtn: { justifyContent: 'center', alignItems: 'center', borderRadius: 32, shadowColor: 'rgba(26,26,15,0.2)', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 1, shadowRadius: 24, elevation: 8, overflow: 'hidden' },
  btnGradient: { ...StyleSheet.absoluteFillObject },
  btnNope: { width: 64, height: 64 },
  btnInfo: { width: 48, height: 48, borderRadius: 24 },
  btnLike: { width: 64, height: 64 },

  toast: { position: 'absolute', bottom: 120, left: 24, right: 24, alignItems: 'center', zIndex: 9999 },
  toastShow: { opacity: 1 },
  toastHide: { opacity: 0 },
  toastText: { backgroundColor: THEME.accent, color: THEME.backgroundLight, paddingHorizontal: 20, paddingVertical: 12, borderRadius: 30, fontSize: 12, fontWeight: '600', overflow: 'hidden' },
});
