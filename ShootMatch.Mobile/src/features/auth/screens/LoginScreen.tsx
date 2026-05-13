import React, { useState } from 'react';
import {
  KeyboardAvoidingView, Platform, ScrollView,
  StyleSheet, Text, TextInput, View, Pressable, Alert,
} from 'react-native';
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { AuthStackParamList } from '../../../app/navigation/types';
import { useAuth, UserRole } from '../AuthContext';
import { ClayButton } from '../../../shared/components/ClayButton';
import { colors } from '../../../app/theme/colors';
import { fontSizes, fontWeights } from '../../../app/theme/typography';
import { radius, spacing } from '../../../app/theme/spacing';

type Props = NativeStackScreenProps<AuthStackParamList, 'PhoneLogin'>;

export default function LoginScreen({ navigation, route }: Props) {
  const role = (route.params as any)?.role as UserRole ?? 'customer';
  const { sendOtp } = useAuth();
  const [phone,   setPhone]   = useState('');
  const [loading, setLoading] = useState(false);

  const isCustomer = role === 'customer';

  async function handleSendOtp() {
    const cleaned = phone.replace(/\D/g, '');
    if (cleaned.length < 9) {
      Alert.alert('Số điện thoại không hợp lệ', 'Vui lòng nhập số điện thoại đúng định dạng.');
      return;
    }
    setLoading(true);
    try {
      await sendOtp(`+84${cleaned.replace(/^0/, '')}`, role);
      navigation.navigate('OtpVerify', { phone: `+84${cleaned.replace(/^0/, '')}`, role });
    } catch (e: any) {
      Alert.alert('Lỗi', e.response?.data?.title ?? 'Không thể gửi OTP. Thử lại sau.');
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
        {/* Header */}
        <Animated.View entering={FadeInUp.duration(600).delay(100)} style={styles.header}>
          <View style={styles.logoMark}>
            <Text style={styles.logoLetter}>S</Text>
          </View>
          <Text style={styles.headline}>
            {isCustomer ? 'Chào mừng trở lại' : 'Dành cho nhiếp ảnh gia'}
          </Text>
          <Text style={styles.sub}>
            {isCustomer
              ? 'Đăng nhập để khám phá và đặt lịch chụp hình'
              : 'Quản lý hồ sơ, lịch chụp và khách hàng của bạn'
            }
          </Text>
        </Animated.View>

        {/* Role badge */}
        <Animated.View entering={FadeInDown.duration(500).delay(200)} style={styles.roleBadge}>
          <View style={[styles.dot, { backgroundColor: isCustomer ? colors.info : colors.accent }]} />
          <Text style={styles.roleText}>
            {isCustomer ? 'Khách hàng' : 'Nhiếp ảnh gia'}
          </Text>
          <Pressable onPress={() => navigation.goBack()}>
            <Text style={styles.changeRole}>Thay đổi →</Text>
          </Pressable>
        </Animated.View>

        {/* Form */}
        <Animated.View entering={FadeInDown.duration(500).delay(300)} style={styles.form}>
          <Text style={styles.label}>Số điện thoại</Text>
          <View style={styles.inputWrap}>
            <Text style={styles.prefix}>+84</Text>
            <TextInput
              style={styles.input}
              value={phone}
              onChangeText={setPhone}
              placeholder="9x xxx xxxx"
              placeholderTextColor={colors.textLight}
              keyboardType="phone-pad"
              maxLength={11}
              returnKeyType="done"
              onSubmitEditing={handleSendOtp}
            />
          </View>
          <Text style={styles.hint}>Mã OTP sẽ được gửi qua SMS</Text>
        </Animated.View>

        {/* CTA */}
        <Animated.View entering={FadeInDown.duration(500).delay(400)} style={styles.cta}>
          <ClayButton
            label="Gửi mã OTP"
            onPress={handleSendOtp}
            loading={loading}
            variant="primary"
            size="lg"
          />
        </Animated.View>

        {/* Terms */}
        <Animated.View entering={FadeInDown.duration(500).delay(500)}>
          <Text style={styles.terms}>
            Bằng cách tiếp tục, bạn đồng ý với{' '}
            <Text style={styles.termsLink}>Điều khoản sử dụng</Text>
            {' '}và{' '}
            <Text style={styles.termsLink}>Chính sách bảo mật</Text>.
          </Text>
        </Animated.View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  root:   { flex: 1, backgroundColor: colors.background },
  scroll: { padding: spacing[6], paddingTop: spacing[16], gap: spacing[6] },

  header:     { alignItems: 'center', gap: spacing[3], marginBottom: spacing[2] },
  logoMark:   {
    width: 64, height: 64, borderRadius: 32,
    backgroundColor: colors.dark,
    alignItems: 'center', justifyContent: 'center',
    shadowColor: colors.clay,
    shadowOffset: { width: 6, height: 6 },
    shadowOpacity: 1, shadowRadius: 12, elevation: 8,
  },
  logoLetter: { fontSize: 34, fontWeight: fontWeights.bold, color: colors.background },
  headline:   { fontSize: fontSizes['2xl'], fontWeight: fontWeights.bold, color: colors.dark, textAlign: 'center' },
  sub:        { fontSize: fontSizes.sm, color: colors.textMuted, textAlign: 'center', lineHeight: 20 },

  roleBadge:  {
    flexDirection: 'row', alignItems: 'center', gap: spacing[2],
    backgroundColor: colors.surface,
    borderRadius: radius.full, paddingVertical: spacing[2], paddingHorizontal: spacing[4],
    borderWidth: 1, borderColor: colors.border, alignSelf: 'center',
    shadowColor: colors.clay, shadowOffset: { width: 3, height: 3 },
    shadowOpacity: 0.8, shadowRadius: 6, elevation: 3,
  },
  dot:        { width: 8, height: 8, borderRadius: 4 },
  roleText:   { fontSize: fontSizes.sm, fontWeight: fontWeights.medium, color: colors.text },
  changeRole: { fontSize: fontSizes.xs, color: colors.accent, fontWeight: fontWeights.semibold },

  form:       { gap: spacing[3] },
  label:      { fontSize: fontSizes.xs, fontWeight: fontWeights.semibold, color: colors.textMuted, letterSpacing: 1, textTransform: 'uppercase' },
  inputWrap:  {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    borderWidth: 1.5, borderColor: colors.border,
    paddingHorizontal: spacing[4],
    shadowColor: colors.clay, shadowOffset: { width: 4, height: 4 },
    shadowOpacity: 0.6, shadowRadius: 8, elevation: 4,
  },
  prefix:     { fontSize: fontSizes.md, fontWeight: fontWeights.semibold, color: colors.textMuted, marginRight: spacing[2] },
  input:      { flex: 1, fontSize: fontSizes.lg, color: colors.text, paddingVertical: spacing[4] },
  hint:       { fontSize: fontSizes.xs, color: colors.textLight },

  cta:        { marginTop: spacing[2] },

  terms:      { fontSize: fontSizes.xs, color: colors.textMuted, textAlign: 'center', lineHeight: 18 },
  termsLink:  { color: colors.accent, fontWeight: fontWeights.medium },
});
