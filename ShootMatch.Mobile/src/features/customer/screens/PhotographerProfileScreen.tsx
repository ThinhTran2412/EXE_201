import React, { useEffect, useState } from 'react';
import {
  ScrollView, StyleSheet, Text, View, Image, Pressable, ActivityIndicator, Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation, useRoute } from '@react-navigation/native';
import { getPhotographer, Photographer } from '../api';
import { ClayButton } from '../../../shared/components/ClayButton';
import { ClayCard } from '../../../shared/components/ClayCard';
import { colors } from '../../../app/theme/colors';
import { fontSizes, fontWeights } from '../../../app/theme/typography';
import { radius, spacing } from '../../../app/theme/spacing';

const REGIONS: Record<string, string> = {
  HN: 'Hà Nội', HCM: 'TP.HCM', DN: 'Đà Nẵng', HP: 'Hải Phòng', CT: 'Cần Thơ',
};

function StatPill({ icon, value, label }: { icon: string; value: string; label: string }) {
  return (
    <ClayCard style={styles.statPill}>
      <Text style={styles.statIcon}>{icon}</Text>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </ClayCard>
  );
}

export default function PhotographerProfileScreen() {
  const navigation = useNavigation<any>();
  const route      = useRoute<any>();
  const { photographerId } = route.params as { photographerId: string };

  const [p,       setP]       = useState<Photographer | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getPhotographer(photographerId)
      .then(setP)
      .catch(() => Alert.alert('Lỗi', 'Không tải được hồ sơ'))
      .finally(() => setLoading(false));
  }, [photographerId]);

  if (loading) {
    return (
      <SafeAreaView style={styles.safe}>
        <ActivityIndicator size="large" color={colors.accent} style={{ flex: 1 }} />
      </SafeAreaView>
    );
  }

  if (!p) return null;

  return (
    <SafeAreaView style={styles.safe} edges={['bottom']}>
      <ScrollView showsVerticalScrollIndicator={false} stickyHeaderIndices={[]}>
        {/* Hero Cover */}
        <Animated.View entering={FadeInUp.duration(600)} style={styles.coverWrap}>
          {p.coverPhotoUrl
            ? <Image source={{ uri: p.coverPhotoUrl }} style={styles.cover} />
            : <View style={[styles.cover, { backgroundColor: colors.clay }]} />
          }
          <LinearGradient colors={['transparent', colors.background]} style={styles.coverGradient} />

          {/* Back */}
          <Pressable style={styles.backBtn} onPress={() => navigation.goBack()}>
            <Ionicons name="arrow-back" size={20} color={colors.dark} />
          </Pressable>

          {/* Avatar */}
          <View style={styles.avatarWrap}>
            {p.avatarUrl
              ? <Image source={{ uri: p.avatarUrl }} style={styles.avatar} />
              : <View style={[styles.avatar, styles.avatarPlaceholder]}>
                  <Text style={styles.avatarLetter}>{p.displayName?.[0]}</Text>
                </View>
            }
            {p.isAvailable && <View style={styles.availDot} />}
          </View>
        </Animated.View>

        {/* Content */}
        <View style={styles.content}>
          {/* Name + Badges */}
          <Animated.View entering={FadeInDown.duration(500).delay(100)} style={styles.nameSection}>
            <View style={styles.nameRow}>
              <Text style={styles.name}>{p.displayName}</Text>
              {p.isPremium && (
                <View style={styles.premiumBadge}>
                  <Ionicons name="star" size={12} color={colors.background} />
                  <Text style={styles.premiumText}>PRO</Text>
                </View>
              )}
            </View>
            <View style={styles.metaRow}>
              <Ionicons name="location" size={14} color={colors.textMuted} />
              <Text style={styles.meta}>{REGIONS[p.region] ?? p.region}</Text>
              {p.verificationStatus === 'Verified' && (
                <>
                  <Text style={styles.metaDot}>·</Text>
                  <Ionicons name="checkmark-circle" size={14} color={colors.info} />
                  <Text style={styles.meta}>Đã xác minh</Text>
                </>
              )}
            </View>
            {p.instagramUrl && (
              <Text style={styles.instagram}>📷 {p.instagramUrl}</Text>
            )}
          </Animated.View>

          {/* Stats */}
          <Animated.View entering={FadeInDown.duration(500).delay(200)} style={styles.statsRow}>
            <StatPill icon="⭐" value={p.rating?.toFixed(1)} label="Đánh giá" />
            <StatPill icon="💰" value={`${(p.minBudget / 1000).toFixed(0)}k+`} label="Từ" />
            <StatPill icon="📅" value={p.isAvailable ? 'Có sẵn' : 'Bận'} label="Lịch" />
          </Animated.View>

          {/* Bio */}
          {p.bio && (
            <Animated.View entering={FadeInDown.duration(500).delay(300)} style={styles.bioSection}>
              <Text style={styles.sectionTitle}>Giới thiệu</Text>
              <Text style={styles.bio}>{p.bio}</Text>
            </Animated.View>
          )}

          {/* Budget */}
          <Animated.View entering={FadeInDown.duration(500).delay(350)}>
            <ClayCard style={styles.budgetCard}>
              <Text style={styles.sectionTitle}>Gói dịch vụ</Text>
              <View style={styles.budgetRow}>
                <View>
                  <Text style={styles.budgetLabel}>Từ</Text>
                  <Text style={styles.budgetValue}>{p.minBudget?.toLocaleString('vi-VN')}đ</Text>
                </View>
                <View style={styles.budgetDivider} />
                <View>
                  <Text style={styles.budgetLabel}>Đến</Text>
                  <Text style={styles.budgetValue}>{p.maxBudget?.toLocaleString('vi-VN')}đ</Text>
                </View>
              </View>
            </ClayCard>
          </Animated.View>

          <View style={{ height: spacing[10] }} />
        </View>
      </ScrollView>

      {/* Sticky CTA */}
      <Animated.View entering={FadeInDown.duration(400).delay(400)} style={styles.ctaBar}>
        <ClayButton
          label="Đặt lịch ngay"
          onPress={() => navigation.navigate('Checkout', { photographer: p })}
          variant="primary"
          size="lg"
          disabled={!p.isAvailable}
        />
        {!p.isAvailable && (
          <Text style={styles.unavailableText}>Nhiếp ảnh gia hiện không nhận lịch</Text>
        )}
      </Animated.View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe:    { flex: 1, backgroundColor: colors.background },
  coverWrap: { height: 300, position: 'relative' },
  cover:     { width: '100%', height: '100%', resizeMode: 'cover' },
  coverGradient: { position: 'absolute', bottom: 0, left: 0, right: 0, height: 120 },
  backBtn:  { position: 'absolute', top: 16, left: 16, width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(255,247,225,0.9)', alignItems: 'center', justifyContent: 'center' },
  avatarWrap: { position: 'absolute', bottom: -40, left: spacing[6] },
  avatar:    { width: 88, height: 88, borderRadius: 44, borderWidth: 4, borderColor: colors.background },
  avatarPlaceholder: { backgroundColor: colors.clay, alignItems: 'center', justifyContent: 'center' },
  avatarLetter: { fontSize: fontSizes['2xl'], fontWeight: fontWeights.bold, color: colors.dark },
  availDot: { position: 'absolute', bottom: 6, right: 6, width: 16, height: 16, borderRadius: 8, backgroundColor: colors.success, borderWidth: 2.5, borderColor: colors.background },

  content:     { paddingHorizontal: spacing[6], paddingTop: 56 },
  nameSection: { gap: spacing[2], marginBottom: spacing[5] },
  nameRow:     { flexDirection: 'row', alignItems: 'center', gap: spacing[2] },
  name:        { fontSize: fontSizes['2xl'], fontWeight: fontWeights.extrabold, color: colors.dark, flex: 1 },
  premiumBadge: { flexDirection: 'row', alignItems: 'center', gap: 3, backgroundColor: colors.accentOrange, borderRadius: radius.full, paddingHorizontal: 8, paddingVertical: 3 },
  premiumText:  { fontSize: fontSizes.xs, fontWeight: fontWeights.bold, color: colors.white },
  metaRow:     { flexDirection: 'row', alignItems: 'center', gap: spacing[1] },
  meta:        { fontSize: fontSizes.sm, color: colors.textMuted },
  metaDot:     { color: colors.textMuted },
  instagram:   { fontSize: fontSizes.sm, color: colors.info },

  statsRow: { flexDirection: 'row', gap: spacing[3], marginBottom: spacing[6] },
  statPill: { flex: 1, padding: spacing[3], alignItems: 'center', gap: spacing[1] },
  statIcon: { fontSize: 20 },
  statValue: { fontSize: fontSizes.md, fontWeight: fontWeights.bold, color: colors.dark },
  statLabel: { fontSize: fontSizes.xs, color: colors.textMuted },

  bioSection:  { marginBottom: spacing[5] },
  sectionTitle: { fontSize: fontSizes.md, fontWeight: fontWeights.bold, color: colors.dark, marginBottom: spacing[3] },
  bio:          { fontSize: fontSizes.sm, color: colors.textMuted, lineHeight: 22 },

  budgetCard: { padding: spacing[5], marginBottom: spacing[5] },
  budgetRow:  { flexDirection: 'row', alignItems: 'center', gap: spacing[4], marginTop: spacing[2] },
  budgetLabel: { fontSize: fontSizes.xs, color: colors.textMuted, textTransform: 'uppercase', letterSpacing: 0.8 },
  budgetValue: { fontSize: fontSizes.xl, fontWeight: fontWeights.bold, color: colors.dark },
  budgetDivider: { width: 1, height: 40, backgroundColor: colors.border },

  ctaBar:   { paddingHorizontal: spacing[6], paddingVertical: spacing[4], borderTopWidth: 1, borderTopColor: colors.border, gap: spacing[2] },
  unavailableText: { textAlign: 'center', fontSize: fontSizes.xs, color: colors.textMuted },
});
