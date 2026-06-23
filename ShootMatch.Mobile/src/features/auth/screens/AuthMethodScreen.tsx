import React from 'react';
import {
  View, Text, StyleSheet, Pressable, ScrollView,
} from 'react-native';
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { AuthStackParamList } from '../../../app/navigation/types';
import { colors } from '../../../app/theme/colors';
import { fontSizes, fontWeights } from '../../../app/theme/typography';
import { radius, spacing } from '../../../app/theme/spacing';

type Props = NativeStackScreenProps<AuthStackParamList, 'AuthMethod'>;

export default function AuthMethodScreen({ navigation, route }: Props) {
  const { role } = route.params;
  const isCustomer = role === 'customer';
  const accentColor = isCustomer ? colors.info : colors.accent;

  return (
    <ScrollView
      style={styles.root}
      contentContainerStyle={styles.scroll}
      showsVerticalScrollIndicator={false}
    >
      {/* Header */}
      <Animated.View entering={FadeInUp.duration(600)} style={styles.header}>
        <View style={[styles.logoMark, { borderColor: accentColor }]}>
          <Text style={styles.logoLetter}>S</Text>
        </View>
        <Text style={styles.headline}>
          {isCustomer ? 'Đăng nhập / Đăng ký' : 'Dành cho nhiếp ảnh gia'}
        </Text>
        <Text style={styles.sub}>Chọn phương thức xác thực</Text>
      </Animated.View>

      {/* Role badge */}
      <Animated.View entering={FadeInDown.duration(400).delay(100)} style={styles.roleBadge}>
        <View style={[styles.dot, { backgroundColor: accentColor }]} />
        <Text style={styles.roleText}>
          {isCustomer ? 'Khách hàng' : 'Nhiếp ảnh gia'}
        </Text>
        <Pressable onPress={() => navigation.goBack()}>
          <Text style={[styles.changeRole, { color: accentColor }]}>Thay đổi →</Text>
        </Pressable>
      </Animated.View>

      {/* Method cards */}
      <Animated.View entering={FadeInDown.duration(500).delay(200)} style={styles.methods}>

        {/* Email / Password */}
        <Pressable
          style={({ pressed }) => [styles.card, pressed && styles.cardPressed]}
          onPress={() => navigation.navigate('Login', { role })}
        >
          <View style={[styles.cardIcon, { backgroundColor: '#e8f4fd' }]}>
            <Text style={styles.cardEmoji}>✉️</Text>
          </View>
          <View style={styles.cardBody}>
            <Text style={styles.cardTitle}>Email &amp; Mật khẩu</Text>
            <Text style={styles.cardSub}>Đăng nhập bằng email của bạn</Text>
          </View>
          <Text style={styles.cardArrow}>›</Text>
        </Pressable>

        {/* Register new */}
        <Pressable
          style={({ pressed }) => [styles.card, pressed && styles.cardPressed]}
          onPress={() => navigation.navigate('Register', { role })}
        >
          <View style={[styles.cardIcon, { backgroundColor: '#edfdf4' }]}>
            <Text style={styles.cardEmoji}>👤</Text>
          </View>
          <View style={styles.cardBody}>
            <Text style={styles.cardTitle}>Tạo tài khoản mới</Text>
            <Text style={styles.cardSub}>Đăng ký bằng email &amp; mật khẩu</Text>
          </View>
          <Text style={styles.cardArrow}>›</Text>
        </Pressable>

        {/* Phone OTP */}
        <Pressable
          style={({ pressed }) => [styles.card, pressed && styles.cardPressed]}
          onPress={() => navigation.navigate('Login', { role })}
        >
          <View style={[styles.cardIcon, { backgroundColor: '#fdf8e8' }]}>
            <Text style={styles.cardEmoji}>📱</Text>
          </View>
          <View style={styles.cardBody}>
            <Text style={styles.cardTitle}>Số điện thoại (OTP)</Text>
            <Text style={styles.cardSub}>Xác minh qua tin nhắn SMS</Text>
          </View>
          <Text style={styles.cardArrow}>›</Text>
        </Pressable>

      </Animated.View>

      <Animated.View entering={FadeInDown.duration(500).delay(400)}>
        <Text style={styles.terms}>
          Bằng cách tiếp tục, bạn đồng ý với{' '}
          <Text style={styles.termsLink}>Điều khoản sử dụng</Text>
          {' '}và{' '}
          <Text style={styles.termsLink}>Chính sách bảo mật</Text>.
        </Text>
      </Animated.View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  root:    { flex: 1, backgroundColor: colors.background },
  scroll:  { padding: spacing[6], paddingTop: spacing[16], gap: spacing[5] },

  header:     { alignItems: 'center', gap: spacing[3], marginBottom: spacing[2] },
  logoMark:   {
    width: 64, height: 64, borderRadius: 32,
    backgroundColor: colors.dark,
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 2,
    shadowColor: colors.clay,
    shadowOffset: { width: 6, height: 6 },
    shadowOpacity: 1, shadowRadius: 12, elevation: 8,
  },
  logoLetter: { fontSize: 32, fontWeight: fontWeights.bold, color: colors.background },
  headline:   { fontSize: fontSizes['2xl'], fontWeight: fontWeights.bold, color: colors.dark, textAlign: 'center' },
  sub:        { fontSize: fontSizes.sm, color: colors.textMuted, textAlign: 'center' },

  roleBadge: {
    flexDirection: 'row', alignItems: 'center', gap: spacing[2],
    backgroundColor: colors.surface,
    borderRadius: radius.full, paddingVertical: spacing[2], paddingHorizontal: spacing[4],
    borderWidth: 1, borderColor: colors.border, alignSelf: 'center',
    shadowColor: colors.clay, shadowOffset: { width: 3, height: 3 },
    shadowOpacity: 0.8, shadowRadius: 6, elevation: 3,
  },
  dot:        { width: 8, height: 8, borderRadius: 4 },
  roleText:   { fontSize: fontSizes.sm, fontWeight: fontWeights.medium, color: colors.text },
  changeRole: { fontSize: fontSizes.xs, fontWeight: fontWeights.semibold },

  methods:  { gap: spacing[3] },
  card: {
    flexDirection: 'row', alignItems: 'center', gap: spacing[4],
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1.5, borderColor: colors.border,
    padding: spacing[4],
    shadowColor: colors.clay, shadowOffset: { width: 4, height: 4 },
    shadowOpacity: 0.7, shadowRadius: 8, elevation: 4,
  },
  cardPressed: { opacity: 0.7, transform: [{ scale: 0.98 }] },
  cardIcon: {
    width: 44, height: 44, borderRadius: radius.md,
    alignItems: 'center', justifyContent: 'center',
  },
  cardEmoji:  { fontSize: 22 },
  cardBody:   { flex: 1, gap: 2 },
  cardTitle:  { fontSize: fontSizes.md, fontWeight: fontWeights.semibold, color: colors.dark },
  cardSub:    { fontSize: fontSizes.xs, color: colors.textMuted },
  cardArrow:  { fontSize: 22, color: colors.textLight, fontWeight: fontWeights.bold },

  terms:      { fontSize: fontSizes.xs, color: colors.textMuted, textAlign: 'center', lineHeight: 18 },
  termsLink:  { color: colors.accent, fontWeight: fontWeights.medium },
});
