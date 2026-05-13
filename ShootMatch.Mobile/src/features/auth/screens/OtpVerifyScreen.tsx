import React, { useRef, useState } from 'react';
import {
  StyleSheet, Text, TextInput, View,
  Alert, KeyboardAvoidingView, Platform, Pressable,
} from 'react-native';
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { AuthStackParamList } from '../../../app/navigation/types';
import { useAuth } from '../AuthContext';
import { ClayButton } from '../../../shared/components/ClayButton';
import { colors } from '../../../app/theme/colors';
import { fontSizes, fontWeights } from '../../../app/theme/typography';
import { radius, spacing } from '../../../app/theme/spacing';

type Props = NativeStackScreenProps<AuthStackParamList, 'OtpVerify'>;

export default function OtpVerifyScreen({ navigation, route }: Props) {
  const { phone, role } = route.params as { phone: string; role: string };
  const { verifyOtp, sendOtp } = useAuth();
  const [otp,     setOtp]     = useState(['', '', '', '', '', '']);
  const [loading, setLoading] = useState(false);
  const refs = Array.from({ length: 6 }, () => useRef<TextInput>(null));

  function handleChange(val: string, idx: number) {
    const digit = val.replace(/\D/g, '').slice(-1);
    const next  = [...otp];
    next[idx]   = digit;
    setOtp(next);
    if (digit && idx < 5) refs[idx + 1].current?.focus();
    if (!digit && idx > 0) refs[idx - 1].current?.focus();
  }

  async function handleVerify() {
    const code = otp.join('');
    if (code.length < 6) { Alert.alert('Nhập đủ 6 chữ số'); return; }
    setLoading(true);
    try {
      await verifyOtp(phone, code, role as any);
      // Navigation handled by AuthContext → RoleNavigator
    } catch (e: any) {
      Alert.alert('Mã OTP không đúng', e.response?.data?.detail ?? 'Vui lòng thử lại.');
      setOtp(['', '', '', '', '', '']);
      refs[0].current?.focus();
    } finally { setLoading(false); }
  }

  async function handleResend() {
    try {
      await sendOtp(phone, role as any);
      Alert.alert('Đã gửi lại', 'Mã OTP mới đã được gửi đến ' + phone);
    } catch { Alert.alert('Lỗi', 'Không thể gửi lại OTP.'); }
  }

  return (
    <KeyboardAvoidingView
      style={styles.root}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <Animated.View entering={FadeInUp.duration(600)} style={styles.header}>
        <Pressable style={styles.backBtn} onPress={() => navigation.goBack()}>
          <Text style={styles.backText}>← Quay lại</Text>
        </Pressable>
        <Text style={styles.title}>Xác minh OTP</Text>
        <Text style={styles.sub}>
          Mã 6 chữ số đã gửi đến{'\n'}
          <Text style={styles.phone}>{phone}</Text>
        </Text>
      </Animated.View>

      {/* OTP Boxes */}
      <Animated.View entering={FadeInDown.duration(500).delay(200)} style={styles.otpRow}>
        {otp.map((digit, i) => (
          <TextInput
            key={i}
            ref={refs[i]}
            style={[styles.otpBox, digit ? styles.otpBoxFilled : null]}
            value={digit}
            onChangeText={(v) => handleChange(v, i)}
            keyboardType="numeric"
            maxLength={1}
            textAlign="center"
            autoFocus={i === 0}
            selectTextOnFocus
          />
        ))}
      </Animated.View>

      <Animated.View entering={FadeInDown.duration(500).delay(350)} style={styles.actions}>
        <ClayButton
          label="Xác nhận"
          onPress={handleVerify}
          loading={loading}
          variant="primary"
          size="lg"
        />
        <Pressable onPress={handleResend} style={styles.resend}>
          <Text style={styles.resendText}>Không nhận được mã? <Text style={styles.resendLink}>Gửi lại</Text></Text>
        </Pressable>
      </Animated.View>
    </KeyboardAvoidingView>
  );
}

const BOX = 52;
const styles = StyleSheet.create({
  root:         { flex: 1, backgroundColor: colors.background, paddingHorizontal: spacing[6] },
  header:       { paddingTop: spacing[16], gap: spacing[3], marginBottom: spacing[8] },
  backBtn:      { marginBottom: spacing[4] },
  backText:     { color: colors.accent, fontWeight: fontWeights.semibold, fontSize: fontSizes.sm },
  title:        { fontSize: fontSizes['2xl'], fontWeight: fontWeights.bold, color: colors.dark },
  sub:          { fontSize: fontSizes.sm, color: colors.textMuted, lineHeight: 22 },
  phone:        { color: colors.dark, fontWeight: fontWeights.semibold },

  otpRow:       { flexDirection: 'row', justifyContent: 'space-between', gap: spacing[2], marginBottom: spacing[8] },
  otpBox:       {
    width: BOX, height: BOX, borderRadius: radius.md,
    backgroundColor: colors.surface,
    fontSize: fontSizes.xl, fontWeight: fontWeights.bold, color: colors.dark,
    borderWidth: 1.5, borderColor: colors.border,
    shadowColor: colors.clay, shadowOffset: { width: 4, height: 4 },
    shadowOpacity: 0.7, shadowRadius: 8, elevation: 4,
  },
  otpBoxFilled: { borderColor: colors.accent, borderWidth: 2 },

  actions:      { gap: spacing[4] },
  resend:       { alignItems: 'center', paddingVertical: spacing[2] },
  resendText:   { fontSize: fontSizes.sm, color: colors.textMuted },
  resendLink:   { color: colors.accent, fontWeight: fontWeights.semibold },
});
