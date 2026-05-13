import React, { useEffect, useState } from 'react';
import {
  ScrollView, StyleSheet, Text, View, Image,
  Pressable, RefreshControl, ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { getPhotographers, Photographer, getMyMatches, Match } from '../api';
import { useAuth } from '../../auth/AuthContext';
import { ClayCard } from '../../../shared/components/ClayCard';
import { ClayButton } from '../../../shared/components/ClayButton';
import { colors } from '../../../app/theme/colors';
import { fontSizes, fontWeights } from '../../../app/theme/typography';
import { radius, spacing, shadows } from '../../../app/theme/spacing';

const REGIONS: Record<string, string> = {
  HN: 'Hà Nội', HCM: 'TP.HCM', DN: 'Đà Nẵng', HP: 'Hải Phòng', CT: 'Cần Thơ',
};

function PhotographerCard({ p, onPress }: { p: Photographer; onPress: () => void }) {
  return (
    <Pressable onPress={onPress} style={styles.photoCard}>
      <ClayCard style={styles.photoCardInner}>
        <View style={styles.photoAvatar}>
          {p.avatarUrl
            ? <Image source={{ uri: p.avatarUrl }} style={styles.avatarImg} />
            : <View style={[styles.avatarPlaceholder, { backgroundColor: colors.clay }]}>
                <Text style={styles.avatarLetter}>{p.displayName?.[0] ?? '?'}</Text>
              </View>
          }
          {p.isPremium && (
            <View style={styles.premiumBadge}>
              <Ionicons name="star" size={10} color={colors.background} />
            </View>
          )}
          {p.isAvailable && <View style={styles.availDot} />}
        </View>
        <Text style={styles.photoName} numberOfLines={1}>{p.displayName}</Text>
        <Text style={styles.photoRegion}>{REGIONS[p.region] ?? p.region}</Text>
        <Text style={styles.photoBudget}>
          {p.minBudget?.toLocaleString('vi-VN')}–{p.maxBudget?.toLocaleString('vi-VN')}đ
        </Text>
        <View style={styles.ratingRow}>
          <Ionicons name="star" size={11} color="#f4c430" />
          <Text style={styles.ratingText}>{p.rating?.toFixed(1)}</Text>
        </View>
      </ClayCard>
    </Pressable>
  );
}

export default function HomeScreen() {
  const { session }  = useAuth();
  const navigation   = useNavigation<any>();
  const [photographers, setPhotographers] = useState<Photographer[]>([]);
  const [matches,       setMatches]       = useState<Match[]>([]);
  const [loading,       setLoading]       = useState(true);
  const [refreshing,    setRefreshing]    = useState(false);

  async function load() {
    try {
      const [p, m] = await Promise.all([getPhotographers(), getMyMatches()]);
      setPhotographers(p.slice(0, 8));
      setMatches(m.slice(0, 3));
    } catch {}
    setLoading(false);
    setRefreshing(false);
  }

  useEffect(() => { load(); }, []);

  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Chào buổi sáng' : hour < 18 ? 'Chào buổi chiều' : 'Chào buổi tối';

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); load(); }} tintColor={colors.accent} />}
      >
        {/* Hero Header */}
        <Animated.View entering={FadeInUp.duration(600)} style={styles.hero}>
          <View style={styles.heroTop}>
            <View>
              <Text style={styles.greeting}>{greeting} 👋</Text>
              <Text style={styles.heroTitle}>Tìm nhiếp ảnh gia{'\n'}hoàn hảo cho bạn</Text>
            </View>
            <Pressable style={styles.notifBtn} onPress={() => navigation.navigate('Notifications')}>
              <Ionicons name="notifications-outline" size={22} color={colors.dark} />
              <View style={styles.notifDot} />
            </Pressable>
          </View>
        </Animated.View>

        {/* Quick Actions */}
        <Animated.View entering={FadeInDown.duration(500).delay(150)} style={styles.quickActions}>
          {[
            { icon: 'compass', label: 'Khám phá',  color: colors.accent,   screen: 'Discover' },
            { icon: 'chatbubbles', label: 'Tin nhắn', color: colors.info,   screen: 'Chat' },
            { icon: 'calendar', label: 'Lịch hẹn', color: colors.success,  screen: 'Bookings' },
          ].map((q) => (
            <Pressable key={q.screen} style={styles.quickBtn} onPress={() => navigation.navigate(q.screen)}>
              <View style={[styles.quickIcon, { backgroundColor: q.color + '18' }]}>
                <Ionicons name={q.icon as any} size={24} color={q.color} />
              </View>
              <Text style={styles.quickLabel}>{q.label}</Text>
            </Pressable>
          ))}
        </Animated.View>

        {/* Recent Matches Banner */}
        {matches.length > 0 && (
          <Animated.View entering={FadeInDown.duration(500).delay(250)} style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Matches gần đây</Text>
              <Pressable onPress={() => navigation.navigate('Chat')}>
                <Text style={styles.seeAll}>Xem tất cả →</Text>
              </Pressable>
            </View>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.matchRow}>
              {matches.map((m, i) => (
                <Animated.View key={m.id} entering={FadeInDown.duration(400).delay(i * 80 + 300)}>
                  <Pressable style={styles.matchChip} onPress={() => navigation.navigate('Chat')}>
                    <View style={styles.matchAvatar}>
                      <Ionicons name="person" size={20} color={colors.textMuted} />
                    </View>
                    <View style={styles.matchDot} />
                  </Pressable>
                </Animated.View>
              ))}
            </ScrollView>
          </Animated.View>
        )}

        {/* Discover CTA */}
        <Animated.View entering={FadeInDown.duration(500).delay(300)} style={styles.discoverCTA}>
          <View style={styles.ctaLeft}>
            <Text style={styles.ctaTitle}>Tìm kiếm AI</Text>
            <Text style={styles.ctaSub}>Upload ảnh tham khảo để AI ghép đôi style</Text>
          </View>
          <ClayButton
            label="Bắt đầu"
            onPress={() => navigation.navigate('Discover')}
            variant="primary"
            size="sm"
            fullWidth={false}
          />
        </Animated.View>

        {/* Featured Photographers */}
        <Animated.View entering={FadeInDown.duration(500).delay(400)} style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Nhiếp ảnh gia nổi bật</Text>
            <Pressable onPress={() => navigation.navigate('Discover')}>
              <Text style={styles.seeAll}>Khám phá →</Text>
            </Pressable>
          </View>
          {loading
            ? <ActivityIndicator color={colors.accent} style={{ marginTop: 24 }} />
            : <View style={styles.photoGrid}>
                {photographers.map((p, i) => (
                  <Animated.View key={p.id} entering={FadeInDown.duration(400).delay(i * 60 + 450)} style={styles.photoGridItem}>
                    <PhotographerCard
                      p={p}
                      onPress={() => navigation.navigate('PhotographerProfile', { photographerId: p.id })}
                    />
                  </Animated.View>
                ))}
              </View>
          }
        </Animated.View>

        <View style={{ height: spacing[10] }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },

  hero:     { paddingHorizontal: spacing[6], paddingTop: spacing[4], paddingBottom: spacing[2] },
  heroTop:  { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  greeting: { fontSize: fontSizes.sm, color: colors.textMuted, marginBottom: spacing[1] },
  heroTitle: { fontSize: fontSizes['2xl'], fontWeight: fontWeights.extrabold, color: colors.dark, lineHeight: 32 },
  notifBtn: { position: 'relative', width: 44, height: 44, borderRadius: 22, backgroundColor: colors.surface, alignItems: 'center', justifyContent: 'center', ...shadows.card },
  notifDot: { position: 'absolute', top: 10, right: 10, width: 8, height: 8, borderRadius: 4, backgroundColor: colors.accent },

  quickActions: { flexDirection: 'row', paddingHorizontal: spacing[6], gap: spacing[3], marginVertical: spacing[4] },
  quickBtn:     { flex: 1, alignItems: 'center', gap: spacing[2] },
  quickIcon:    { width: 56, height: 56, borderRadius: radius.lg, alignItems: 'center', justifyContent: 'center' },
  quickLabel:   { fontSize: fontSizes.xs, fontWeight: fontWeights.semibold, color: colors.text },

  section:       { paddingHorizontal: spacing[6], marginBottom: spacing[6] },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing[4] },
  sectionTitle:  { fontSize: fontSizes.lg, fontWeight: fontWeights.bold, color: colors.dark },
  seeAll:        { fontSize: fontSizes.sm, color: colors.accent, fontWeight: fontWeights.semibold },

  matchRow:  { overflow: 'visible' },
  matchChip: { position: 'relative', marginRight: spacing[3] },
  matchAvatar: { width: 56, height: 56, borderRadius: 28, backgroundColor: colors.clay, alignItems: 'center', justifyContent: 'center', ...shadows.card },
  matchDot:  { position: 'absolute', bottom: 2, right: 2, width: 14, height: 14, borderRadius: 7, backgroundColor: colors.success, borderWidth: 2, borderColor: colors.background },

  discoverCTA: {
    marginHorizontal: spacing[6], marginBottom: spacing[6],
    padding: spacing[5], borderRadius: radius.xl,
    backgroundColor: colors.dark,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    ...shadows.clay,
  },
  ctaLeft:  { flex: 1, gap: spacing[1], marginRight: spacing[4] },
  ctaTitle: { fontSize: fontSizes.md, fontWeight: fontWeights.bold, color: colors.background },
  ctaSub:   { fontSize: fontSizes.xs, color: 'rgba(255,247,225,0.65)', lineHeight: 16 },

  photoGrid:     { flexDirection: 'row', flexWrap: 'wrap', gap: spacing[3] },
  photoGridItem: { width: '47%' },
  photoCard:     {},
  photoCardInner: { padding: spacing[3], gap: spacing[2] },
  photoAvatar:   { position: 'relative', marginBottom: spacing[1] },
  avatarImg:     { width: '100%', height: 120, borderRadius: radius.md, resizeMode: 'cover' },
  avatarPlaceholder: { width: '100%', height: 120, borderRadius: radius.md, alignItems: 'center', justifyContent: 'center' },
  avatarLetter:  { fontSize: fontSizes['2xl'], fontWeight: fontWeights.bold, color: colors.dark },
  premiumBadge:  { position: 'absolute', top: 8, right: 8, backgroundColor: colors.accentOrange, borderRadius: radius.full, width: 20, height: 20, alignItems: 'center', justifyContent: 'center' },
  availDot:      { position: 'absolute', bottom: 8, left: 8, width: 10, height: 10, borderRadius: 5, backgroundColor: colors.success, borderWidth: 1.5, borderColor: colors.background },
  photoName:     { fontSize: fontSizes.sm, fontWeight: fontWeights.bold, color: colors.dark },
  photoRegion:   { fontSize: fontSizes.xs, color: colors.textMuted },
  photoBudget:   { fontSize: fontSizes.xs, color: colors.textMuted, fontVariant: ['tabular-nums'] },
  ratingRow:     { flexDirection: 'row', alignItems: 'center', gap: 3 },
  ratingText:    { fontSize: fontSizes.xs, fontWeight: fontWeights.semibold, color: colors.dark },
});
