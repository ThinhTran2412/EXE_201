import React from 'react';
import { StyleSheet, Text, View, Pressable } from 'react-native';
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { AuthStackParamList } from '../../../app/navigation/types';
import { colors } from '../../../app/theme/colors';
import { fontSizes, fontWeights } from '../../../app/theme/typography';
import { radius, spacing, shadows } from '../../../app/theme/spacing';
import { LinearGradient } from 'expo-linear-gradient';

type Props = NativeStackScreenProps<AuthStackParamList, 'RoleSelect'>;

type RoleOption = {
  key: 'customer' | 'photographer';
  emoji: string;
  title: string;
  sub: string;
  gradient: readonly [string, string];
  tag: string;
  dark?: boolean;
};

const ROLES: RoleOption[] = [
  {
    key: 'customer',
    emoji: '📸',
    title: 'Tôi là Khách hàng',
    sub: 'Tìm kiếm, khám phá và đặt lịch với các nhiếp ảnh gia chuyên nghiệp',
    gradient: ['#fff7e1', '#ffedc4'],
    tag: 'Khám phá',
  },
  {
    key: 'photographer',
    emoji: '🎞',
    title: 'Tôi là Nhiếp ảnh gia',
    sub: 'Xây dựng hồ sơ, quản lý lịch chụp và phát triển doanh nghiệp',
    gradient: ['#1a1a0f', '#2a2a1e'],
    tag: 'Kiếm thu nhập',
    dark: true,
  },
];

export default function RoleSelectScreen({ navigation }: Props) {
  return (
    <View style={styles.root}>
      <Animated.View entering={FadeInUp.duration(600)} style={styles.header}>
        <Text style={styles.headline}>Bạn là ai?</Text>
        <Text style={styles.sub}>Chọn vai trò để bắt đầu trải nghiệm phù hợp nhất</Text>
      </Animated.View>

      <View style={styles.cards}>
        {ROLES.map((role, i) => (
          <Animated.View key={role.key} entering={FadeInDown.duration(500).delay(i * 150 + 200)}>
            <Pressable
              onPress={() => navigation.navigate('AuthMethod', { role: role.key })}
              style={({ pressed }) => [styles.card, pressed && styles.cardPressed]}
            >
              <LinearGradient colors={role.gradient} style={styles.cardGradient}>
                <View style={styles.cardTop}>
                  <Text style={styles.emoji}>{role.emoji}</Text>
                  <View style={[styles.badge, role.dark && styles.badgeDark]}>
                    <Text style={[styles.badgeText, role.dark && styles.badgeTextDark]}>
                      {role.tag}
                    </Text>
                  </View>
                </View>
                <Text style={[styles.cardTitle, role.dark && styles.cardTitleDark]}>
                  {role.title}
                </Text>
                <Text style={[styles.cardSub, role.dark && styles.cardSubDark]}>
                  {role.sub}
                </Text>
                <View style={[styles.arrow, role.dark && styles.arrowDark]}>
                  <Text style={[styles.arrowText, role.dark && styles.arrowTextDark]}>
                    Bắt đầu →
                  </Text>
                </View>
              </LinearGradient>
            </Pressable>
          </Animated.View>
        ))}
      </View>

      <Animated.Text entering={FadeInDown.duration(400).delay(600)} style={styles.footer}>
        Phiên bản 1.0 Beta · ShootMatch
      </Animated.Text>
    </View>
  );
}

const styles = StyleSheet.create({
  root:           { flex: 1, backgroundColor: colors.background, paddingHorizontal: spacing[6], justifyContent: 'center' },
  header:         { alignItems: 'center', gap: spacing[2], marginBottom: spacing[8] },
  headline:       { fontSize: fontSizes['3xl'], fontWeight: fontWeights.extrabold, color: colors.dark, textAlign: 'center' },
  sub:            { fontSize: fontSizes.sm, color: colors.textMuted, textAlign: 'center', lineHeight: 20 },

  cards:          { gap: spacing[4] },
  card:           { borderRadius: radius.xl, overflow: 'hidden', ...shadows.clay },
  cardPressed:    { opacity: 0.92, transform: [{ scale: 0.98 }] },
  cardGradient:   { padding: spacing[6], gap: spacing[3], minHeight: 180 },

  cardTop:        { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  emoji:          { fontSize: 40 },
  badge:          { paddingHorizontal: spacing[3], paddingVertical: spacing[1], borderRadius: radius.full, backgroundColor: 'rgba(26,26,15,0.08)', borderWidth: 1, borderColor: 'rgba(26,26,15,0.12)' },
  badgeDark:      { backgroundColor: 'rgba(255,247,225,0.12)', borderColor: 'rgba(255,247,225,0.2)' },
  badgeText:      { fontSize: fontSizes.xs, fontWeight: fontWeights.semibold, color: colors.dark, letterSpacing: 0.5 },
  badgeTextDark:  { color: colors.background },

  cardTitle:      { fontSize: fontSizes.xl, fontWeight: fontWeights.bold, color: colors.dark },
  cardTitleDark:  { color: colors.background },
  cardSub:        { fontSize: fontSizes.sm, color: colors.textMuted, lineHeight: 20 },
  cardSubDark:    { color: 'rgba(255,247,225,0.7)' },

  arrow:          { alignSelf: 'flex-start', marginTop: spacing[2], paddingHorizontal: spacing[4], paddingVertical: spacing[2], borderRadius: radius.full, borderWidth: 1, borderColor: colors.borderStrong },
  arrowDark:      { borderColor: 'rgba(255,247,225,0.3)' },
  arrowText:      { fontSize: fontSizes.sm, fontWeight: fontWeights.semibold, color: colors.dark },
  arrowTextDark:  { color: colors.background },

  footer:         { textAlign: 'center', fontSize: fontSizes.xs, color: colors.textLight, marginTop: spacing[8] },
});
