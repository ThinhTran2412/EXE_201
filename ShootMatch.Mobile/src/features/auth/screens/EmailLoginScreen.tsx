import React, { useState } from 'react';
import {
  KeyboardAvoidingView, Platform, ScrollView,
  StyleSheet, Text, TextInput, View, Alert,
} from 'react-native';
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { AuthStackParamList } from '../../../app/navigation/types';
import { useAuth, UserRole } from '../AuthContext';
import { ClayButton } from '../../../shared/components/ClayButton';
import { colors } from '../../../app/theme/colors';
import { fontSizes, fontWeights } from '../../../app/theme/typography';
import { radius, spacing } from '../../../app/theme/spacing';

type Props = NativeStackScreenProps<AuthStackParamList, 'EmailLogin'>;

export default function EmailLoginScreen({ navigation, route }: Props) {
  const { role } = route.params;
  const { loginWithEmail } = useAuth();
  const [email,    setEmail]    = useState('');
  const [password, setPassword] = useState('');
  const [loading,  setLoading]  = useState(false);

  const isCustomer = role === 'customer';

  async function handleLogin() {
    if (!email.trim() || !password) {
      Alert.alert('Thiếu thông tin', 'Vui lòng nhập email và mật khẩu.');
      return;
    }
    setLoading(true);
    try {
      await loginWithEmail(email.trim().toLowerCase(), password, role as UserRole);
    } catch (e: any) {
      const msg = e.response?.data?.error ?? e.response?.data ?? 'Đăng nhập thất bại. Thử lại.';
      Alert.alert('Lỗi đăng nhập', String(msg));
    } finally {
      setLoading(false);
    }
  }

  return (
    <KeyboardAvoidingView
      style={styles.root}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">

        <Animated.View entering={FadeInUp.duration(600)} style={styles.header}>
          <View style={styles.logoMark}>
            <Text style={styles.logoLetter}>S</Text>
          </View>
          <Text style={styles.headline}>Đăng nhập</Text>
          <Text style={styles.sub}>
            {isCustomer ? 'Tài khoản khách hàng' : 'Tài khoản nhiếp ảnh gia'}
          </Text>
        </Animated.View>

        <Animated.View entering={FadeInDown.duration(500).delay(200)} style={styles.form}>

          <View style={styles.field}>
            <Text style={styles.label}>Email</Text>
            <TextInput
              style={styles.input}
              value={email}
              onChangeText={setEmail}
              placeholder="your@email.com"
              placeholderTextColor={colors.textLight}
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
              returnKeyType="next"
            />
          </View>

          <View style={styles.field}>
            <Text style={styles.label}>Mật khẩu</Text>
            <TextInput
              style={styles.input}
              value={password}
              onChangeText={setPassword}
              placeholder="••••••••"
              placeholderTextColor={colors.textLight}
              secureTextEntry
              returnKeyType="done"
              onSubmitEditing={handleLogin}
            />
          </View>

        </Animated.View>

        <Animated.View entering={FadeInDown.duration(500).delay(350)} style={styles.cta}>
          <ClayButton
            label="Đăng nhập"
            onPress={handleLogin}
            loading={loading}
            variant="primary"
            size="lg"
          />
        </Animated.View>

        <Animated.View entering={FadeInDown.duration(500).delay(450)} style={styles.footer}>
          <Text style={styles.footerText}>Chưa có tài khoản? </Text>
          <Text
            style={styles.footerLink}
            onPress={() => navigation.replace('Register', { role })}
          >
            Đăng ký ngay
          </Text>
        </Animated.View>

      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  root:   { flex: 1, backgroundColor: colors.background },
  scroll: { padding: spacing[6], paddingTop: spacing[16], gap: spacing[6] },

  header:     { alignItems: 'center', gap: spacing[3] },
  logoMark:   {
    width: 64, height: 64, borderRadius: 32,
    backgroundColor: colors.dark,
    alignItems: 'center', justifyContent: 'center',
    shadowColor: colors.clay, shadowOffset: { width: 6, height: 6 },
    shadowOpacity: 1, shadowRadius: 12, elevation: 8,
  },
  logoLetter: { fontSize: 32, fontWeight: fontWeights.bold, color: colors.background },
  headline:   { fontSize: fontSizes['2xl'], fontWeight: fontWeights.bold, color: colors.dark },
  sub:        { fontSize: fontSizes.sm, color: colors.textMuted },

  form:  { gap: spacing[4] },
  field: { gap: spacing[1] },
  label: {
    fontSize: fontSizes.xs, fontWeight: fontWeights.semibold,
    color: colors.textMuted, letterSpacing: 0.8, textTransform: 'uppercase',
  },
  input: {
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    borderWidth: 1.5, borderColor: colors.border,
    paddingHorizontal: spacing[4], paddingVertical: spacing[4],
    fontSize: fontSizes.md, color: colors.text,
    shadowColor: colors.clay, shadowOffset: { width: 4, height: 4 },
    shadowOpacity: 0.6, shadowRadius: 8, elevation: 4,
  },

  cta: { marginTop: spacing[2] },

  footer:     { flexDirection: 'row', justifyContent: 'center', alignItems: 'center' },
  footerText: { fontSize: fontSizes.sm, color: colors.textMuted },
  footerLink: { fontSize: fontSizes.sm, fontWeight: fontWeights.semibold, color: colors.accent },
});
