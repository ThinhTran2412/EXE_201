import React, { useState } from 'react';
import {
  KeyboardAvoidingView, Platform, ScrollView,
  StyleSheet, Text, TextInput, View, Alert, TouchableOpacity,
} from 'react-native';
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { AuthStackParamList } from '../../../app/navigation/types';
import { useAuth, UserRole } from '../AuthContext';
import { ClayButton } from '../../../shared/components/ClayButton';
import { colors } from '../../../app/theme/colors';
import { fontSizes, fontWeights } from '../../../app/theme/typography';
import { radius, spacing } from '../../../app/theme/spacing';
import { API_URL, apiClient } from '../../../shared/api/client';

type Props = NativeStackScreenProps<AuthStackParamList, 'Register'>;

export default function RegisterScreen({ navigation, route }: Props) {
  const { role } = route.params;
  const { registerWithEmail } = useAuth();

  const [displayName, setDisplayName] = useState('');
  const [email,       setEmail]       = useState('');
  const [password,    setPassword]    = useState('');
  const [confirm,     setConfirm]     = useState('');
  const [loading,     setLoading]     = useState(false);

  // ── Debug ─────────────────────────────────────────────────────────────────
  const [debugLog, setDebugLog] = useState<string[]>([]);

  function log(msg: string) {
    console.log('[DEBUG]', msg);
    setDebugLog(prev => [`${new Date().toLocaleTimeString()}: ${msg}`, ...prev.slice(0, 9)]);
  }

  async function testConnection() {
    log(`Testing → ${API_URL}/health`);
    try {
      const res = await apiClient.get('/health', { timeout: 5000 });
      log(`✅ OK ${res.status} — ${JSON.stringify(res.data).slice(0, 80)}`);
    } catch (e: any) {
      if (e.response) {
        log(`⚠️ HTTP ${e.response.status}: ${JSON.stringify(e.response.data).slice(0, 80)}`);
      } else if (e.code) {
        log(`❌ Network: ${e.code} — ${e.message}`);
      } else {
        log(`❌ ${e.message}`);
      }
    }
  }
  // ─────────────────────────────────────────────────────────────────────────

  async function handleRegister() {
    if (!displayName.trim()) {
      Alert.alert('Thiếu thông tin', 'Vui lòng nhập tên hiển thị.');
      return;
    }
    if (!email.trim()) {
      Alert.alert('Thiếu thông tin', 'Vui lòng nhập email.');
      return;
    }
    if (password.length < 8) {
      Alert.alert('Mật khẩu quá ngắn', 'Mật khẩu phải có ít nhất 8 ký tự.');
      return;
    }
    if (password !== confirm) {
      Alert.alert('Mật khẩu không khớp', 'Vui lòng kiểm tra lại xác nhận mật khẩu.');
      return;
    }

    log(`POST /api/auth/register — email: ${email.trim().toLowerCase()}`);
    setLoading(true);
    try {
      await registerWithEmail(email.trim().toLowerCase(), password, displayName.trim(), role as UserRole);
      log('✅ Register success — session set');
    } catch (e: any) {
      const status  = e.response?.status;
      const data    = e.response?.data;
      const code    = e.code;
      const message = e.message;
      log(`❌ status=${status} code=${code} data=${JSON.stringify(data)} msg=${message}`);
      const msg = data?.error ?? data ?? 'Đăng ký thất bại. Thử lại.';
      Alert.alert('Lỗi đăng ký', String(msg));
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

        {/* ── Debug Panel ─────────────────────────────────────────────────── */}
        <View style={styles.debugPanel}>
          <View style={styles.debugRow}>
            <Text style={styles.debugLabel}>API:</Text>
            <Text style={styles.debugUrl} numberOfLines={1}>{API_URL}</Text>
          </View>
          <TouchableOpacity style={styles.debugBtn} onPress={testConnection}>
            <Text style={styles.debugBtnText}>⚡ TEST CONNECTION</Text>
          </TouchableOpacity>
          {debugLog.length > 0 && (
            <View style={styles.logContainer}>
              {debugLog.map((line, i) => (
                <Text key={i} style={styles.logText}>{line}</Text>
              ))}
            </View>
          )}
        </View>
        {/* ────────────────────────────────────────────────────────────────── */}

        <Animated.View entering={FadeInUp.duration(600)} style={styles.header}>
          <View style={styles.logoMark}>
            <Text style={styles.logoLetter}>S</Text>
          </View>
          <Text style={styles.headline}>Tạo tài khoản</Text>
          <Text style={styles.sub}>
            {role === 'customer' ? 'Khách hàng ShootMatch' : 'Nhiếp ảnh gia ShootMatch'}
          </Text>
        </Animated.View>

        <Animated.View entering={FadeInDown.duration(500).delay(200)} style={styles.form}>

          <View style={styles.field}>
            <Text style={styles.label}>Tên hiển thị</Text>
            <TextInput
              style={styles.input}
              value={displayName}
              onChangeText={setDisplayName}
              placeholder="Nguyễn Văn A"
              placeholderTextColor={colors.textLight}
              autoCapitalize="words"
              returnKeyType="next"
            />
          </View>

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
              placeholder="Ít nhất 8 ký tự"
              placeholderTextColor={colors.textLight}
              secureTextEntry
              returnKeyType="next"
            />
          </View>

          <View style={styles.field}>
            <Text style={styles.label}>Xác nhận mật khẩu</Text>
            <TextInput
              style={[
                styles.input,
                confirm.length > 0 && confirm !== password && styles.inputError,
              ]}
              value={confirm}
              onChangeText={setConfirm}
              placeholder="Nhập lại mật khẩu"
              placeholderTextColor={colors.textLight}
              secureTextEntry
              returnKeyType="done"
              onSubmitEditing={handleRegister}
            />
            {confirm.length > 0 && confirm !== password && (
              <Text style={styles.errorText}>Mật khẩu không khớp</Text>
            )}
          </View>

        </Animated.View>

        <Animated.View entering={FadeInDown.duration(500).delay(400)} style={styles.cta}>
          <ClayButton
            label="Đăng ký"
            onPress={handleRegister}
            loading={loading}
            variant="primary"
            size="lg"
          />
        </Animated.View>

        <Animated.View entering={FadeInDown.duration(500).delay(500)} style={styles.footer}>
          <Text style={styles.footerText}>Đã có tài khoản? </Text>
          <Text
            style={styles.footerLink}
            onPress={() => navigation.replace('EmailLogin', { role })}
          >
            Đăng nhập
          </Text>
        </Animated.View>

      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  root:   { flex: 1, backgroundColor: colors.background },
  scroll: { padding: spacing[6], paddingTop: spacing[12], gap: spacing[5] },

  header:     { alignItems: 'center', gap: spacing[2] },
  logoMark:   {
    width: 60, height: 60, borderRadius: 30,
    backgroundColor: colors.dark,
    alignItems: 'center', justifyContent: 'center',
    shadowColor: colors.clay, shadowOffset: { width: 6, height: 6 },
    shadowOpacity: 1, shadowRadius: 12, elevation: 8,
  },
  logoLetter: { fontSize: 30, fontWeight: fontWeights.bold, color: colors.background },
  headline:   { fontSize: fontSizes['2xl'], fontWeight: fontWeights.bold, color: colors.dark },
  sub:        { fontSize: fontSizes.sm, color: colors.textMuted },

  form:       { gap: spacing[4] },
  field:      { gap: spacing[1] },
  label:      {
    fontSize: fontSizes.xs, fontWeight: fontWeights.semibold,
    color: colors.textMuted, letterSpacing: 0.8, textTransform: 'uppercase',
  },
  input:      {
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    borderWidth: 1.5, borderColor: colors.border,
    paddingHorizontal: spacing[4], paddingVertical: spacing[4],
    fontSize: fontSizes.md, color: colors.text,
    shadowColor: colors.clay, shadowOffset: { width: 4, height: 4 },
    shadowOpacity: 0.6, shadowRadius: 8, elevation: 4,
  },
  inputError: { borderColor: colors.danger },
  errorText:  { fontSize: fontSizes.xs, color: colors.danger, marginTop: 2 },

  cta:        { marginTop: spacing[2] },

  footer:     { flexDirection: 'row', justifyContent: 'center', alignItems: 'center' },
  footerText: { fontSize: fontSizes.sm, color: colors.textMuted },
  footerLink: { fontSize: fontSizes.sm, fontWeight: fontWeights.semibold, color: colors.accent },

  // Debug Styles
  debugPanel: {
    backgroundColor: '#1a1a1a',
    padding: spacing[3],
    borderRadius: radius.md,
    marginBottom: spacing[4],
    borderWidth: 1,
    borderColor: '#333',
  },
  debugRow: { flexDirection: 'row', alignItems: 'center', marginBottom: spacing[2], gap: 8 },
  debugLabel: { color: '#888', fontSize: 10, fontWeight: 'bold' },
  debugUrl: { color: '#00ff00', fontSize: 10, flex: 1 },
  debugBtn: {
    backgroundColor: '#333',
    padding: 8,
    borderRadius: 4,
    alignItems: 'center',
  },
  debugBtnText: { color: '#fff', fontSize: 11, fontWeight: 'bold' },
  logContainer: { marginTop: 8, padding: 6, backgroundColor: '#000', borderRadius: 4 },
  logText: { color: '#ccc', fontSize: 9, fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace' },
});
