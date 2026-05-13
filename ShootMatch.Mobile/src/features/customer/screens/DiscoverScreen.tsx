import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  Dimensions, Image, StyleSheet, Text, View, Pressable, Alert, ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Animated, {
  useSharedValue, useAnimatedStyle, withSpring, withTiming,
  runOnJS, interpolate, Extrapolation,
} from 'react-native-reanimated';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import { createSearch, getSwipeFeed, recordSwipe, PhotographerCard } from '../api';
import { colors } from '../../../app/theme/colors';
import { fontSizes, fontWeights } from '../../../app/theme/typography';
import { radius, spacing } from '../../../app/theme/spacing';

const { width: W, height: H } = Dimensions.get('window');
const CARD_W = W - spacing[6] * 2;
const SWIPE_THRESHOLD = W * 0.35;

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
  photographer: PhotographerCard;
  onSwipeLeft: () => void;
  onSwipeRight: () => void;
  isTop: boolean;
  stackIndex: number;
}) {
  const navigation = useNavigation<any>();
  const translateX = useSharedValue(0);
  const translateY = useSharedValue(0);
  const scale      = useSharedValue(1 - stackIndex * 0.04);

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
        { scale: scale.value },
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

  const stackOffset = stackIndex * 8;

  return (
    <GestureDetector gesture={gesture}>
      <Animated.View style={[styles.card, { top: stackOffset, zIndex: 10 - stackIndex }, cardStyle]}>
        {/* Photo */}
        <Pressable
          onPress={() => isTop && navigation.navigate('PhotographerProfile', { photographerId: photographer.photographerId })}
          style={styles.cardImageWrap}
        >
          {photographer.avatarUrl
            ? <Image source={{ uri: photographer.avatarUrl }} style={styles.cardImage} />
            : <View style={[styles.cardImage, styles.cardImagePlaceholder]}>
                <Text style={styles.cardImageLetter}>{photographer.displayName?.[0] ?? '?'}</Text>
              </View>
          }
          <LinearGradient
            colors={['transparent', 'rgba(26,26,15,0.82)']}
            style={styles.cardGradient}
          />

          {/* LIKE stamp */}
          <Animated.View style={[styles.stamp, styles.stampLike, likeOpacity]}>
            <Text style={styles.stampText}>MATCH ✓</Text>
          </Animated.View>

          {/* NOPE stamp */}
          <Animated.View style={[styles.stamp, styles.stampNope, nopeOpacity]}>
            <Text style={styles.stampText}>PASS ✕</Text>
          </Animated.View>

          {/* Info overlay */}
          <View style={styles.cardInfo}>
            <View style={styles.cardNameRow}>
              <Text style={styles.cardName}>{photographer.displayName}</Text>
              {photographer.isPremium && (
                <View style={styles.premiumBadge}>
                  <Ionicons name="star" size={11} color={colors.background} />
                  <Text style={styles.premiumText}>PRO</Text>
                </View>
              )}
            </View>
            <Text style={styles.cardRegion}>
              <Ionicons name="location" size={12} color="rgba(255,247,225,0.8)" />
              {' '}{REGIONS[photographer.region] ?? photographer.region}
            </Text>
            <View style={styles.cardStats}>
              <View style={styles.cardStat}>
                <Ionicons name="star" size={13} color="#f4c430" />
                <Text style={styles.cardStatText}>{photographer.rating?.toFixed(1)}</Text>
              </View>
              <View style={styles.cardStatDivider} />
              <Text style={styles.cardStatText}>
                {photographer.minBudget?.toLocaleString('vi-VN')}đ+
              </Text>
              <View style={styles.cardStatDivider} />
              <Text style={styles.cardStatText}>
                {Math.round(photographer.finalScore * 100)}% phù hợp
              </Text>
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
  const [cards,     setCards]     = useState<PhotographerCard[]>([]);
  const [searchId,  setSearchId]  = useState<string | null>(null);
  const [loading,   setLoading]   = useState(true);
  const [matchMsg,  setMatchMsg]  = useState<string | null>(null);

  async function init() {
    try {
      const sid = await createSearch('HCM', 500000);
      setSearchId(sid);
      const feed = await getSwipeFeed(sid);
      setCards(feed);
    } catch (e) {
      Alert.alert('Lỗi', 'Không thể tải feed. Kiểm tra kết nối.');
    }
    setLoading(false);
  }

  useEffect(() => { init(); }, []);

  const handleSwipeLeft = useCallback(async () => {
    const top = cards[0];
    if (!top || !searchId) return;
    setCards((c) => c.slice(1));
    try { await recordSwipe(searchId, top.photographerId, 'Left'); } catch {}
  }, [cards, searchId]);

  const handleSwipeRight = useCallback(async () => {
    const top = cards[0];
    if (!top || !searchId) return;
    setCards((c) => c.slice(1));
    try {
      await recordSwipe(searchId, top.photographerId, 'Right');
      setMatchMsg(`🎉 Match với ${top.displayName}!`);
      setTimeout(() => setMatchMsg(null), 2500);
    } catch {}
  }, [cards, searchId]);

  const handleButtonSwipe = (dir: 'Left' | 'Right') => {
    if (dir === 'Right') handleSwipeRight();
    else                  handleSwipeLeft();
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.center}>
          <ActivityIndicator size="large" color={colors.accent} />
          <Text style={styles.loadingText}>AI đang tìm nhiếp ảnh gia phù hợp...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Khám phá</Text>
        <Pressable onPress={init} style={styles.refreshBtn}>
          <Ionicons name="refresh" size={20} color={colors.dark} />
        </Pressable>
      </View>

      {/* Match toast */}
      {matchMsg && (
        <Animated.View style={styles.matchToast}>
          <Text style={styles.matchToastText}>{matchMsg}</Text>
        </Animated.View>
      )}

      {/* Card Stack */}
      <View style={styles.stack}>
        {cards.length === 0 ? (
          <View style={styles.emptyStack}>
            <Text style={styles.emptyEmoji}>🎞</Text>
            <Text style={styles.emptyTitle}>Đã xem hết rồi!</Text>
            <Text style={styles.emptySub}>Làm mới để tải thêm nhiếp ảnh gia</Text>
            <Pressable onPress={init} style={styles.refreshFab}>
              <Text style={styles.refreshFabText}>Tải lại</Text>
            </Pressable>
          </View>
        ) : (
          cards.slice(0, 3).map((p, i) => (
            <SwipeCard
              key={p.photographerId}
              photographer={p}
              isTop={i === 0}
              stackIndex={i}
              onSwipeLeft={handleSwipeLeft}
              onSwipeRight={handleSwipeRight}
            />
          ))
        )}
      </View>

      {/* Action Buttons */}
      {cards.length > 0 && (
        <View style={styles.actions}>
          {/* Pass */}
          <Pressable style={[styles.actionBtn, styles.actionPass]} onPress={() => handleButtonSwipe('Left')}>
            <Ionicons name="close" size={32} color={colors.accent} />
          </Pressable>

          {/* Profile shortcut */}
          <Pressable
            style={[styles.actionBtn, styles.actionInfo]}
            onPress={() => navigation.navigate('PhotographerProfile', { photographerId: cards[0]?.photographerId })}
          >
            <Ionicons name="information" size={22} color={colors.dark} />
          </Pressable>

          {/* Like */}
          <Pressable style={[styles.actionBtn, styles.actionLike]} onPress={() => handleButtonSwipe('Right')}>
            <Ionicons name="heart" size={32} color={colors.success} />
          </Pressable>
        </View>
      )}

      {/* Progress */}
      {cards.length > 0 && (
        <Text style={styles.progress}>{cards.length} nhiếp ảnh gia còn lại</Text>
      )}
    </SafeAreaView>
  );
}

const CARD_H = H * 0.58;

const styles = StyleSheet.create({
  safe:   { flex: 1, backgroundColor: colors.background },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: spacing[4] },
  loadingText: { color: colors.textMuted, fontSize: fontSizes.sm, textAlign: 'center', paddingHorizontal: spacing[8] },

  header:     { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: spacing[6], paddingVertical: spacing[4] },
  headerTitle: { fontSize: fontSizes.xl, fontWeight: fontWeights.bold, color: colors.dark },
  refreshBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: colors.surface, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: colors.border },

  matchToast: {
    marginHorizontal: spacing[6], marginBottom: spacing[2],
    padding: spacing[3], borderRadius: radius.lg,
    backgroundColor: colors.success,
    alignItems: 'center',
  },
  matchToastText: { color: '#fff', fontWeight: fontWeights.bold, fontSize: fontSizes.md },

  stack: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    marginHorizontal: spacing[6],
  },

  card: {
    position: 'absolute',
    width: CARD_W,
    height: CARD_H,
    borderRadius: radius.xl,
    overflow: 'hidden',
    backgroundColor: colors.surface,
    shadowColor: colors.dark,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2,
    shadowRadius: 20,
    elevation: 12,
  },
  cardImageWrap: { width: '100%', height: '100%' },
  cardImage:     { width: '100%', height: '100%', resizeMode: 'cover' },
  cardImagePlaceholder: { backgroundColor: colors.clay, alignItems: 'center', justifyContent: 'center' },
  cardImageLetter: { fontSize: fontSizes['4xl'], fontWeight: fontWeights.bold, color: colors.dark },
  cardGradient:  { position: 'absolute', bottom: 0, left: 0, right: 0, height: '60%' },

  stamp:      { position: 'absolute', top: 32, borderRadius: radius.sm, paddingVertical: 8, paddingHorizontal: 16, borderWidth: 3 },
  stampLike:  { left: 24, borderColor: colors.success, transform: [{ rotate: '-15deg' }] },
  stampNope:  { right: 24, borderColor: colors.accent, transform: [{ rotate: '15deg' }] },
  stampText:  { fontSize: fontSizes.xl, fontWeight: fontWeights.extrabold, color: colors.white, letterSpacing: 2 },

  cardInfo:    { position: 'absolute', bottom: 0, left: 0, right: 0, padding: spacing[5], gap: spacing[2] },
  cardNameRow: { flexDirection: 'row', alignItems: 'center', gap: spacing[2] },
  cardName:    { fontSize: fontSizes.xl, fontWeight: fontWeights.extrabold, color: colors.background, flex: 1 },
  premiumBadge: { flexDirection: 'row', alignItems: 'center', gap: 3, backgroundColor: colors.accentOrange, borderRadius: radius.full, paddingHorizontal: 8, paddingVertical: 3 },
  premiumText:  { fontSize: fontSizes.xs, fontWeight: fontWeights.bold, color: colors.background },
  cardRegion:   { fontSize: fontSizes.sm, color: 'rgba(255,247,225,0.8)' },
  cardStats:    { flexDirection: 'row', alignItems: 'center', gap: spacing[2] },
  cardStat:     { flexDirection: 'row', alignItems: 'center', gap: 3 },
  cardStatText: { fontSize: fontSizes.xs, color: 'rgba(255,247,225,0.9)', fontWeight: fontWeights.medium },
  cardStatDivider: { width: 1, height: 12, backgroundColor: 'rgba(255,247,225,0.3)' },

  emptyStack:  { alignItems: 'center', gap: spacing[3] },
  emptyEmoji:  { fontSize: 64 },
  emptyTitle:  { fontSize: fontSizes.xl, fontWeight: fontWeights.bold, color: colors.dark },
  emptySub:    { fontSize: fontSizes.sm, color: colors.textMuted, textAlign: 'center' },
  refreshFab:  { marginTop: spacing[3], paddingHorizontal: spacing[6], paddingVertical: spacing[3], backgroundColor: colors.dark, borderRadius: radius.full },
  refreshFabText: { color: colors.background, fontWeight: fontWeights.semibold },

  actions:    { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: spacing[5], paddingHorizontal: spacing[6], paddingBottom: spacing[2] },
  actionBtn:  { width: 64, height: 64, borderRadius: 32, alignItems: 'center', justifyContent: 'center', shadowColor: colors.dark, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.15, shadowRadius: 10, elevation: 6 },
  actionPass: { backgroundColor: colors.surface, borderWidth: 2, borderColor: colors.accent + '30' },
  actionInfo: { width: 48, height: 48, borderRadius: 24, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border },
  actionLike: { backgroundColor: colors.surface, borderWidth: 2, borderColor: colors.success + '30' },

  progress:   { textAlign: 'center', fontSize: fontSizes.xs, color: colors.textLight, paddingBottom: spacing[2] },
});
