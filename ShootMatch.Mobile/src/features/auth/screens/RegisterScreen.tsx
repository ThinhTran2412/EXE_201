import React, { useState, useEffect } from 'react';
import {
  KeyboardAvoidingView, Platform, ScrollView,
  StyleSheet, Text, TextInput, View, Alert, Pressable, Dimensions, TouchableOpacity, Image
} from 'react-native';
import Animated, {
  useSharedValue, useAnimatedStyle,
  withTiming, interpolateColor, FadeInDown, FadeInUp
} from 'react-native-reanimated';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { AuthStackParamList } from '../../../app/navigation/types';
import { useAuth, UserRole } from '../AuthContext';
import { colors } from '../../../app/theme/colors';
import { fontSizes, fontWeights } from '../../../app/theme/typography';
import { radius, spacing } from '../../../app/theme/spacing';
import { API_URL, apiClient } from '../../../shared/api/client';
import { Ionicons } from '@expo/vector-icons';

type Props = NativeStackScreenProps<AuthStackParamList, 'Register'>;

const { width } = Dimensions.get('window');

export default function RegisterScreen({ navigation, route }: Props) {
  const initialRole = route.params?.role as UserRole ?? 'customer';
  const { registerWithEmail } = useAuth();

  const [role, setRole] = useState<UserRole>(initialRole);
  const [displayName, setDisplayName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [loading, setLoading] = useState(false);
  const [showDebug, setShowDebug] = useState(false);
  const [debugLog, setDebugLog] = useState<string[]>([]);

  // Animated theme transition
  const animProgress = useSharedValue(initialRole === 'photographer' ? 1 : 0);

  useEffect(() => {
    animProgress.value = withTiming(role === 'photographer' ? 1 : 0, { duration: 450 });
  }, [role]);

  // Derived styles based on role animation
  const animatedContainerStyle = useAnimatedStyle(() => {
    const backgroundColor = interpolateColor(
      animProgress.value,
      [0, 1],
      ['#faf5ee', '#16160e']
    );
    return { backgroundColor };
  });

  const animatedCardStyle = useAnimatedStyle(() => {
    const backgroundColor = interpolateColor(
      animProgress.value,
      [0, 1],
      ['#ffffff', '#222214']
    );
    const borderColor = interpolateColor(
      animProgress.value,
      [0, 1],
      ['#e8dfce', '#3a3a24']
    );
    return { backgroundColor, borderColor };
  });

  const animatedTextColor = useAnimatedStyle(() => {
    const color = interpolateColor(
      animProgress.value,
      [0, 1],
      ['#1a1a0f', '#faf5ee']
    );
    return { color };
  });

  const animatedMutedTextColor = useAnimatedStyle(() => {
    const color = interpolateColor(
      animProgress.value,
      [0, 1],
      ['#786b59', '#b5a895']
    );
    return { color };
  });

  const animatedAccentColor = useAnimatedStyle(() => {
    const color = interpolateColor(
      animProgress.value,
      [0, 1],
      ['#bca374', '#d97706']
    );
    return { color };
  });

  const isPhotographer = role === 'photographer';

  const handleRoleToggle = () => {
    setRole(role === 'customer' ? 'photographer' : 'customer');
  };

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
      await registerWithEmail(email.trim().toLowerCase(), password, displayName.trim(), role);
      log('✅ Register success — session set');
    } catch (e: any) {
      const status  = e.response?.status;
      const data    = e.response?.data;
      const code    = e.code;
      const message = e.message;
      log(`❌ status=${status} code=${code} data=${JSON.stringify(data)} msg=${message}`);
      const msg = data?.error ?? data ?? 'Đăng ký thất bại. Vui lòng thử lại.';
      Alert.alert('Đăng ký thất bại', String(msg));
    } finally {
      setLoading(false);
    }
  }

  return (
    <KeyboardAvoidingView
      style={styles.root}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <Animated.View style={[StyleSheet.absoluteFillObject, animatedContainerStyle]} />

      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">

        {/* Back navigation */}
        <Pressable 
          onPress={() => navigation.goBack()}
          style={({ pressed }) => [styles.backButton, pressed && { opacity: 0.7 }]}
        >
          <Ionicons name="arrow-back-outline" size={20} color={isPhotographer ? '#b5a895' : '#786b59'} />
          <Animated.Text style={[styles.backButtonText, animatedMutedTextColor]}>Đăng nhập</Animated.Text>
        </Pressable>

        {/* Viewfinder Header */}
        <Animated.View entering={FadeInUp.duration(600).delay(100)} style={styles.header}>
          <View style={styles.logoMarkContainer}>
            <Image 
              source={require('../../../../assets/images/2. Original.png')} 
              style={styles.logoImage}
              resizeMode="contain"
            />
            <View style={[styles.hudDot, isPhotographer ? styles.hudDotActive : styles.hudDotIdle]} />
          </View>

          <Animated.Text style={[styles.headline, animatedTextColor]}>
            {isPhotographer ? 'ĐĂNG KÝ HỒ SƠ MỚI' : 'TẠO TÀI KHOẢN MỚI'}
          </Animated.Text>
          <Animated.Text style={[styles.sub, animatedMutedTextColor]}>
            {isPhotographer 
              ? 'Tạo tài khoản để tham gia mạng lưới nhiếp ảnh gia chuyên nghiệp' 
              : 'Trở thành thành viên để kết nối & đặt lịch chụp ảnh nhanh chóng'
            }
          </Animated.Text>
        </Animated.View>

        {/* Diagnostic Button */}
        <Pressable 
          onPress={() => setShowDebug(!showDebug)} 
          style={styles.diagnosticToggle}
        >
          <Text style={styles.diagnosticToggleText}>
            {showDebug ? '[-] ẨN DIAGNOSTICS HUD' : '[+] HIỆN DIAGNOSTICS HUD'}
          </Text>
        </Pressable>

        {/* Collapsible Connection Diagnostic Panel */}
        {showDebug && (
          <Animated.View entering={FadeInUp.duration(300)} style={styles.debugPanel}>
            <View style={styles.debugRow}>
              <Text style={styles.debugLabel}>API HOST:</Text>
              <Text style={styles.debugUrl} numberOfLines={1}>{API_URL}</Text>
            </View>
            <TouchableOpacity style={styles.debugBtn} onPress={testConnection}>
              <Text style={styles.debugBtnText}>⚡ TEST ENDPOINT CONNECTION</Text>
            </TouchableOpacity>
            {debugLog.length > 0 && (
              <View style={styles.logContainer}>
                {debugLog.map((line, i) => (
                  <Text key={i} style={styles.logText}>{line}</Text>
                ))}
              </View>
            )}
          </Animated.View>
        )}

        {/* Unified Viewfinder Form Card */}
        <Animated.View 
          entering={FadeInDown.duration(600).delay(200)} 
          style={[styles.viewfinderCard, animatedCardStyle]}
        >
          {/* Rule of Thirds Grid Lines */}
          <View style={[styles.gridLine, styles.gridH1, { borderColor: isPhotographer ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)' }]} />
          <View style={[styles.gridLine, styles.gridH2, { borderColor: isPhotographer ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)' }]} />
          <View style={[styles.gridLine, styles.gridV1, { borderColor: isPhotographer ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)' }]} />
          <View style={[styles.gridLine, styles.gridV2, { borderColor: isPhotographer ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)' }]} />

          {/* Corner Viewfinder Brackets */}
          <View style={[styles.bracket, styles.bracketTL, { borderColor: isPhotographer ? '#d97706' : '#bca374' }]} />
          <View style={[styles.bracket, styles.bracketTR, { borderColor: isPhotographer ? '#d97706' : '#bca374' }]} />
          <View style={[styles.bracket, styles.bracketBL, { borderColor: isPhotographer ? '#d97706' : '#bca374' }]} />
          <View style={[styles.bracket, styles.bracketBR, { borderColor: isPhotographer ? '#d97706' : '#bca374' }]} />

          {/* Metadata Display */}
          <View style={styles.hudMetaRow}>
            <Text style={[styles.hudText, { color: isPhotographer ? '#d97706' : '#bca374' }]}>
              {isPhotographer ? 'MODE: SIGN_UP_P' : 'MODE: SIGN_UP_C'}
            </Text>
            <Text style={styles.hudTextMuted}>RAW+JPEG</Text>
            <Text style={styles.hudTextMuted}>ISO 200</Text>
          </View>

          {/* Registration Fields */}
          <View style={styles.formFields}>
            
            {/* Tên hiển thị */}
            <View style={styles.inputField}>
              <Text style={[styles.inputLabel, { color: isPhotographer ? '#b5a895' : '#786b59' }]}>TÊN HIỂN THỊ</Text>
              <View style={[styles.inputContainer, { borderColor: isPhotographer ? '#3a3a24' : '#e8dfce' }]}>
                <Ionicons name="person-outline" size={16} color={isPhotographer ? '#b5a895' : '#786b59'} style={styles.inputIcon} />
                <TextInput
                  style={[styles.textInput, { color: isPhotographer ? '#faf5ee' : '#1a1a0f' }]}
                  placeholder="Nguyễn Văn A"
                  placeholderTextColor={isPhotographer ? '#555544' : '#b5a895'}
                  value={displayName}
                  onChangeText={setDisplayName}
                  autoCapitalize="words"
                />
              </View>
            </View>

            {/* Email */}
            <View style={styles.inputField}>
              <Text style={[styles.inputLabel, { color: isPhotographer ? '#b5a895' : '#786b59' }]}>EMAIL</Text>
              <View style={[styles.inputContainer, { borderColor: isPhotographer ? '#3a3a24' : '#e8dfce' }]}>
                <Ionicons name="mail-outline" size={16} color={isPhotographer ? '#b5a895' : '#786b59'} style={styles.inputIcon} />
                <TextInput
                  style={[styles.textInput, { color: isPhotographer ? '#faf5ee' : '#1a1a0f' }]}
                  placeholder="your@email.com"
                  placeholderTextColor={isPhotographer ? '#555544' : '#b5a895'}
                  value={email}
                  onChangeText={setEmail}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoCorrect={false}
                />
              </View>
            </View>

            {/* Mật khẩu */}
            <View style={styles.inputField}>
              <Text style={[styles.inputLabel, { color: isPhotographer ? '#b5a895' : '#786b59' }]}>MẬT KHẨU</Text>
              <View style={[styles.inputContainer, { borderColor: isPhotographer ? '#3a3a24' : '#e8dfce' }]}>
                <Ionicons name="lock-closed-outline" size={16} color={isPhotographer ? '#b5a895' : '#786b59'} style={styles.inputIcon} />
                <TextInput
                  style={[styles.textInput, { color: isPhotographer ? '#faf5ee' : '#1a1a0f' }]}
                  placeholder="Ít nhất 8 ký tự"
                  placeholderTextColor={isPhotographer ? '#555544' : '#b5a895'}
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry
                  autoCapitalize="none"
                />
              </View>
            </View>

            {/* Xác nhận mật khẩu */}
            <View style={styles.inputField}>
              <Text style={[styles.inputLabel, { color: isPhotographer ? '#b5a895' : '#786b59' }]}>XÁC NHẬN MẬT KHẨU</Text>
              <View style={[
                styles.inputContainer, 
                { borderColor: isPhotographer ? '#3a3a24' : '#e8dfce' },
                confirm.length > 0 && confirm !== password && { borderColor: colors.danger }
              ]}>
                <Ionicons name="checkmark-circle-outline" size={16} color={isPhotographer ? '#b5a895' : '#786b59'} style={styles.inputIcon} />
                <TextInput
                  style={[styles.textInput, { color: isPhotographer ? '#faf5ee' : '#1a1a0f' }]}
                  placeholder="Nhập lại mật khẩu"
                  placeholderTextColor={isPhotographer ? '#555544' : '#b5a895'}
                  value={confirm}
                  onChangeText={setConfirm}
                  secureTextEntry
                  autoCapitalize="none"
                />
              </View>
              {confirm.length > 0 && confirm !== password && (
                <Text style={styles.errorText}>Mật khẩu xác nhận không trùng khớp</Text>
              )}
            </View>

          </View>

          {/* Action Button */}
          <Pressable 
            style={({ pressed }) => [
              styles.submitBtn,
              { backgroundColor: isPhotographer ? '#d97706' : '#bca374' },
              pressed && { opacity: 0.9, transform: [{ scale: 0.98 }] },
              loading && { opacity: 0.7 }
            ]}
            onPress={handleRegister}
            disabled={loading}
          >
            <Text style={styles.submitBtnText}>
              {loading ? 'ĐANG TẠO HỒ SƠ...' : 'ĐĂNG KÝ TÀI KHOẢN'}
            </Text>
          </Pressable>

          {/* Exposure Meter Aesthetic Footer */}
          <View style={styles.lightMeterContainer}>
            <View style={styles.lightMeterTickRow}>
              <View style={[styles.lightMeterTick, styles.lightMeterTickMajor]} />
              <View style={styles.lightMeterTick} />
              <View style={styles.lightMeterTick} />
              <View style={[styles.lightMeterTick, styles.lightMeterTickCenter, { backgroundColor: isPhotographer ? '#d97706' : '#bca374' }]} />
              <View style={styles.lightMeterTick} />
              <View style={styles.lightMeterTick} />
              <View style={[styles.lightMeterTick, styles.lightMeterTickMajor]} />
            </View>
            <Text style={styles.lightMeterLabel}>REC METER</Text>
          </View>
        </Animated.View>

        {/* Footer Link */}
        <Animated.View entering={FadeInDown.duration(500).delay(350)} style={styles.registerFooter}>
          <Animated.Text style={[styles.registerText, animatedMutedTextColor]}>
            Đã có tài khoản?{' '}
          </Animated.Text>
          <Pressable onPress={() => navigation.navigate('Login', { role: (role ?? 'customer') as 'customer' | 'photographer' })}>
            <Animated.Text style={[styles.registerLink, animatedAccentColor]}>
              Đăng nhập ngay
            </Animated.Text>
          </Pressable>
        </Animated.View>

        {/* Bottom Role Switcher */}
        <Animated.View entering={FadeInDown.duration(500).delay(450)} style={styles.roleToggleSection}>
          <Pressable 
            style={({ pressed }) => [
              styles.roleToggleCard, 
              { backgroundColor: isPhotographer ? 'rgba(255,255,255,0.03)' : 'rgba(26,26,15,0.03)' },
              { borderColor: isPhotographer ? 'rgba(255,255,255,0.08)' : 'rgba(26,26,15,0.06)' },
              pressed && { opacity: 0.8 }
            ]}
            onPress={handleRoleToggle}
          >
            <View style={styles.roleToggleInner}>
              <Ionicons 
                name={isPhotographer ? "people-outline" : "camera-reverse-outline"} 
                size={20} 
                color={isPhotographer ? '#d97706' : '#bca374'} 
              />
              <View style={styles.roleToggleTexts}>
                <Animated.Text style={[styles.roleToggleTitle, animatedTextColor]}>
                  {isPhotographer ? 'ĐĂNG KÝ VỚI VAI TRÒ KHÁCH HÀNG' : 'ĐĂNG KÝ VỚI VAI TRÒ NHIẾP ẢNH GIA'}
                </Animated.Text>
                <Text style={styles.roleToggleSub}>
                  {isPhotographer ? 'Tìm kiếm, đặt lịch chụp & chia sẻ ảnh của bạn' : 'Mở rộng cơ hội tiếp cận khách hàng tiềm năng'}
                </Text>
              </View>
              <Ionicons 
                name="chevron-forward-outline" 
                size={16} 
                color={isPhotographer ? '#b5a895' : '#786b59'} 
              />
            </View>
          </Pressable>
        </Animated.View>

        <View style={{ height: 40 }} />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  scroll: {
    padding: spacing[6],
    paddingTop: Platform.OS === 'ios' ? spacing[12] : spacing[6],
    gap: spacing[5],
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[1],
    alignSelf: 'flex-start',
    marginBottom: spacing[2],
  },
  backButtonText: {
    fontSize: fontSizes.sm,
    fontWeight: fontWeights.semibold,
  },
  header: {
    alignItems: 'center',
    gap: spacing[2],
    marginVertical: spacing[2],
  },
  logoMarkContainer: {
    position: 'relative',
    marginBottom: spacing[1],
  },
  logoMark: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
  },
  logoMarkLight: {
    backgroundColor: '#1a1a0f',
    borderColor: '#e8dfce',
  },
  logoMarkDark: {
    backgroundColor: '#2a2a1e',
    borderColor: '#d97706',
  },
  logoImage: {
    width: 56,
    height: 56,
  },
  logoLetter: {
    fontSize: 26,
    fontWeight: fontWeights.bold,
  },
  logoLetterLight: {
    color: '#faf5ee',
  },
  logoLetterDark: {
    color: '#d97706',
  },
  hudDot: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    width: 10,
    height: 10,
    borderRadius: 5,
    borderWidth: 1.5,
    borderColor: '#faf5ee',
  },
  hudDotIdle: {
    backgroundColor: '#bca374',
  },
  hudDotActive: {
    backgroundColor: '#d97706',
  },
  headline: {
    fontSize: fontSizes.lg,
    fontWeight: fontWeights.bold,
    letterSpacing: 2,
    textAlign: 'center',
  },
  sub: {
    fontSize: fontSizes.xs,
    textAlign: 'center',
    lineHeight: 16,
    paddingHorizontal: spacing[4],
  },
  diagnosticToggle: {
    alignSelf: 'center',
    paddingVertical: spacing[1.5],
    paddingHorizontal: spacing[3],
    borderRadius: radius.sm,
    backgroundColor: 'rgba(139,139,122,0.1)',
    marginBottom: spacing[2],
  },
  diagnosticToggleText: {
    fontSize: 9,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    color: '#8b8b7a',
    fontWeight: fontWeights.bold,
  },
  debugPanel: {
    backgroundColor: '#16160e',
    padding: spacing[3],
    borderRadius: radius.md,
    marginBottom: spacing[3],
    borderWidth: 1.5,
    borderColor: '#2a2a1e',
  },
  debugRow: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    marginBottom: spacing[2], 
    gap: 8 
  },
  debugLabel: { 
    color: '#8b8b7a', 
    fontSize: 9, 
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    fontWeight: 'bold' 
  },
  debugUrl: { 
    color: '#10b981', 
    fontSize: 9, 
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    flex: 1 
  },
  debugBtn: {
    backgroundColor: '#2a2a1e',
    padding: 8,
    borderRadius: 4,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#3a3a24',
  },
  debugBtnText: { 
    color: '#faf5ee', 
    fontSize: 9, 
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    fontWeight: 'bold' 
  },
  logContainer: { 
    marginTop: 8, 
    padding: 6, 
    backgroundColor: '#0a0a05', 
    borderRadius: 4 
  },
  logText: { 
    color: '#b5a895', 
    fontSize: 9, 
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace' 
  },
  viewfinderCard: {
    borderRadius: radius.xl,
    borderWidth: 1.5,
    padding: spacing[6],
    position: 'relative',
    overflow: 'hidden',
    shadowColor: '#1a1a0f',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.08,
    shadowRadius: 20,
    elevation: 8,
  },
  gridLine: {
    position: 'absolute',
    borderWidth: 0.5,
    borderStyle: 'dashed',
  },
  gridH1: {
    top: '33.3%',
    left: 0,
    right: 0,
    height: 0,
  },
  gridH2: {
    top: '66.6%',
    left: 0,
    right: 0,
    height: 0,
  },
  gridV1: {
    left: '33.3%',
    top: 0,
    bottom: 0,
    width: 0,
  },
  gridV2: {
    left: '66.6%',
    top: 0,
    bottom: 0,
    width: 0,
  },
  bracket: {
    position: 'absolute',
    width: 14,
    height: 14,
    borderWidth: 2,
  },
  bracketTL: {
    top: 12,
    left: 12,
    borderRightWidth: 0,
    borderBottomWidth: 0,
  },
  bracketTR: {
    top: 12,
    right: 12,
    borderLeftWidth: 0,
    borderBottomWidth: 0,
  },
  bracketBL: {
    bottom: 12,
    left: 12,
    borderRightWidth: 0,
    borderTopWidth: 0,
  },
  bracketBR: {
    bottom: 12,
    right: 12,
    borderLeftWidth: 0,
    borderTopWidth: 0,
  },
  hudMetaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: spacing[4],
  },
  hudText: {
    fontSize: 9,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    fontWeight: fontWeights.bold,
  },
  hudTextMuted: {
    fontSize: 9,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    color: '#8b8b7a',
  },
  formFields: {
    gap: spacing[4],
    marginBottom: spacing[6],
    zIndex: 2,
  },
  inputField: {
    gap: spacing[1.5],
  },
  inputLabel: {
    fontSize: 9,
    fontWeight: fontWeights.bold,
    letterSpacing: 1,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1.5,
    borderRadius: radius.md,
    paddingHorizontal: spacing[3],
    height: 48,
    backgroundColor: 'rgba(255,255,255,0.01)',
  },
  inputIcon: {
    marginRight: spacing[2],
  },
  textInput: {
    flex: 1,
    fontSize: 16,
    height: '100%',
    padding: 0,
  },
  errorText: { 
    fontSize: fontSizes.xs, 
    color: colors.danger, 
    marginTop: 2 
  },
  submitBtn: {
    height: 48,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 8,
    elevation: 4,
  },
  submitBtnText: {
    color: '#FFFFFF',
    fontWeight: fontWeights.bold,
    fontSize: fontSizes.sm,
    letterSpacing: 1.5,
  },
  lightMeterContainer: {
    alignItems: 'center',
    marginTop: spacing[5],
    gap: 4,
  },
  lightMeterTickRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  lightMeterTick: {
    width: 2,
    height: 6,
    backgroundColor: '#8b8b7a',
    opacity: 0.4,
  },
  lightMeterTickMajor: {
    height: 10,
    opacity: 0.8,
  },
  lightMeterTickCenter: {
    height: 12,
    width: 3,
    opacity: 1,
  },
  lightMeterLabel: {
    fontSize: 8,
    color: '#8b8b7a',
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    letterSpacing: 1,
  },
  registerFooter: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: spacing[2],
  },
  registerText: {
    fontSize: fontSizes.sm,
  },
  registerLink: {
    fontSize: fontSizes.sm,
    fontWeight: fontWeights.bold,
  },
  roleToggleSection: {
    marginTop: spacing[4],
  },
  roleToggleCard: {
    borderWidth: 1.5,
    borderRadius: radius.lg,
    padding: spacing[4],
  },
  roleToggleInner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing[3],
  },
  roleToggleTexts: {
    flex: 1,
    gap: 2,
  },
  roleToggleTitle: {
    fontSize: 10,
    fontWeight: fontWeights.extrabold,
    letterSpacing: 0.8,
  },
  roleToggleSub: {
    fontSize: 9,
    color: '#8b8b7a',
    lineHeight: 12,
  },
});
