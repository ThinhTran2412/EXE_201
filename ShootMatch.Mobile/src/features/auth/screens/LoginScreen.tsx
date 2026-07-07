import React, { useState, useEffect } from 'react';
import {
  KeyboardAvoidingView, Platform, ScrollView,
  StyleSheet, Text, TextInput, View, Alert, Pressable, Dimensions, Image
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
import { Ionicons } from '@expo/vector-icons';
import * as WebBrowser from 'expo-web-browser';
import * as Google from 'expo-auth-session/providers/google';
import { makeRedirectUri } from 'expo-auth-session';

WebBrowser.maybeCompleteAuthSession();

type Props = NativeStackScreenProps<AuthStackParamList, 'Login'>;

const { width } = Dimensions.get('window');

export default function LoginScreen({ navigation, route }: Props) {
  const initialRole = route.params?.role as UserRole ?? 'customer';
  const { loginWithEmail, sendOtp, loginWithGoogle } = useAuth();

  const [role, setRole] = useState<UserRole>(initialRole);
  const [loginMode, setLoginMode] = useState<'email' | 'phone'>('email');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [phone, setPhone] = useState('');
  const [loading, setLoading] = useState(false);

  // Google Auth Setup
  const [request, response, promptAsync] = Google.useIdTokenAuthRequest({
    webClientId: '898887567340-orp0qab3ghipr6ephe2n7ijueq3e24d5.apps.googleusercontent.com',
  }, {
    scheme: 'shootmatch',
  });

  useEffect(() => {
    if (response?.type === 'success') {
      const { id_token } = response.params;
      if (id_token) {
        setLoading(true);
        loginWithGoogle(id_token, role)
          .catch((e: any) => {
            const msg = e.response?.data?.error ?? e.response?.data ?? e.message;
            Alert.alert('Đăng nhập Google thất bại', String(msg));
          })
          .finally(() => setLoading(false));
      }
    } else if (response?.type === 'error') {
      Alert.alert('Lỗi xác thực', 'Không thể kết nối với Google lúc này.');
    }
  }, [response]);

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
      ['#faf5ee', '#16160e'] // Customer (warm light cream) -> Photographer (deep dark analog slate)
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
      ['#bca374', '#d97706'] // Customer Accent (Warm Gold-Beige) -> Photographer Accent (Vintage Gold)
    );
    return { color };
  });

  const isPhotographer = role === 'photographer';

  const handleRoleToggle = () => {
    setRole(role === 'customer' ? 'photographer' : 'customer');
  };

  async function handleLogin() {
    if (loginMode === 'email') {
      if (!email.trim() || !password) {
        Alert.alert('Thiếu thông tin', 'Vui lòng điền email và mật khẩu.');
        return;
      }
      setLoading(true);
      try {
        await loginWithEmail(email.trim().toLowerCase(), password, role);
      } catch (e: any) {
        const msg = e.response?.data?.error ?? e.response?.data ?? 'Đăng nhập thất bại. Vui lòng kiểm tra lại.';
        Alert.alert('Đăng nhập thất bại', String(msg));
      } finally {
        setLoading(false);
      }
    } else {
      const cleaned = phone.replace(/\D/g, '');
      if (cleaned.length < 9) {
        Alert.alert('Số điện thoại không hợp lệ', 'Vui lòng nhập đúng định dạng.');
        return;
      }
      setLoading(true);
      const fullPhone = `+84${cleaned.replace(/^0/, '')}`;
      try {
        await sendOtp(fullPhone, role);
        navigation.navigate('OtpVerify', { phone: fullPhone, role: role as string });
      } catch (e: any) {
        Alert.alert('Lỗi gửi OTP', e.response?.data?.title ?? 'Không thể gửi mã OTP lúc này.');
      } finally {
        setLoading(false);
      }
    }
  }

  return (
    <KeyboardAvoidingView
      style={styles.root}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <Animated.View style={[StyleSheet.absoluteFillObject, animatedContainerStyle]} />

      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
        
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
            {isPhotographer ? 'MÁY CHỤP ĐÃ SẴN SÀNG' : 'TÌM KIẾM KHOẢNH KHẮC'}
          </Animated.Text>
          <Animated.Text style={[styles.sub, animatedMutedTextColor]}>
            {isPhotographer 
              ? 'Đăng nhập cổng thông tin của Nhiếp ảnh gia' 
              : 'Đăng nhập để đặt lịch & khám phá các góc chụp đẹp'
            }
          </Animated.Text>
        </Animated.View>

        {/* Unified Viewfinder Form Card */}
        <Animated.View 
          entering={FadeInDown.duration(600).delay(200)} 
          style={[styles.viewfinderCard, animatedCardStyle]}
        >
          {/* Rule of Thirds Grid Lines (Faint lines for camera aesthetic) */}
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
              {isPhotographer ? 'AF-C [M]' : 'AF-S [A]'}
            </Text>
            <Text style={styles.hudTextMuted}>RAW+JPEG</Text>
            <Text style={styles.hudTextMuted}>ISO 100</Text>
          </View>

          {/* Mode Switcher Segmented Control */}
          <View style={[styles.tabBar, { backgroundColor: isPhotographer ? '#1a1a0f' : '#f3ede2' }]}>
            <Pressable 
              style={[
                styles.tabButton, 
                loginMode === 'email' && [
                  styles.tabButtonActive, 
                  { backgroundColor: isPhotographer ? '#d97706' : '#bca374' }
                ]
              ]} 
              onPress={() => setLoginMode('email')}
            >
              <Text style={[
                styles.tabText, 
                loginMode === 'email' ? styles.tabTextActive : { color: isPhotographer ? '#b5a895' : '#786b59' }
              ]}>
                EMAIL
              </Text>
            </Pressable>
            
            <Pressable 
              style={[
                styles.tabButton, 
                loginMode === 'phone' && [
                  styles.tabButtonActive, 
                  { backgroundColor: isPhotographer ? '#d97706' : '#bca374' }
                ]
              ]} 
              onPress={() => setLoginMode('phone')}
            >
              <Text style={[
                styles.tabText, 
                loginMode === 'phone' ? styles.tabTextActive : { color: isPhotographer ? '#b5a895' : '#786b59' }
              ]}>
                SỐ ĐIỆN THOẠI
              </Text>
            </Pressable>
          </View>

          {/* Login Fields */}
          <View style={styles.formFields}>
            {loginMode === 'email' ? (
              <>
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

                <View style={styles.inputField}>
                  <Text style={[styles.inputLabel, { color: isPhotographer ? '#b5a895' : '#786b59' }]}>MẬT KHẨU</Text>
                  <View style={[styles.inputContainer, { borderColor: isPhotographer ? '#3a3a24' : '#e8dfce' }]}>
                    <Ionicons name="lock-closed-outline" size={16} color={isPhotographer ? '#b5a895' : '#786b59'} style={styles.inputIcon} />
                    <TextInput
                      style={[styles.textInput, { color: isPhotographer ? '#faf5ee' : '#1a1a0f' }]}
                      placeholder="••••••••"
                      placeholderTextColor={isPhotographer ? '#555544' : '#b5a895'}
                      value={password}
                      onChangeText={setPassword}
                      secureTextEntry
                      autoCapitalize="none"
                    />
                  </View>
                </View>
              </>
            ) : (
              <View style={styles.inputField}>
                <Text style={[styles.inputLabel, { color: isPhotographer ? '#b5a895' : '#786b59' }]}>SỐ ĐIỆN THOẠI</Text>
                <View style={[styles.inputContainer, { borderColor: isPhotographer ? '#3a3a24' : '#e8dfce' }]}>
                  <Text style={[styles.phonePrefix, { color: isPhotographer ? '#faf5ee' : '#1a1a0f' }]}>+84</Text>
                  <TextInput
                    style={[styles.textInput, { color: isPhotographer ? '#faf5ee' : '#1a1a0f' }]}
                    placeholder="900000000"
                    placeholderTextColor={isPhotographer ? '#555544' : '#b5a895'}
                    value={phone}
                    onChangeText={setPhone}
                    keyboardType="phone-pad"
                    maxLength={10}
                  />
                </View>
                <Text style={styles.fieldHint}>* Mã OTP sẽ được gửi qua SMS để xác nhận đăng nhập</Text>
              </View>
            )}
          </View>

          <Pressable 
            style={({ pressed }) => [
              styles.submitBtn,
              { backgroundColor: isPhotographer ? '#d97706' : '#bca374' },
              pressed && { opacity: 0.9, transform: [{ scale: 0.98 }] },
              loading && { opacity: 0.7 }
            ]}
            onPress={handleLogin}
            disabled={loading}
          >
            <Text style={styles.submitBtnText}>
              {loading ? 'ĐANG KẾT NỐI...' : loginMode === 'email' ? 'ĐĂNG NHẬP' : 'GỬI MÃ OTP'}
            </Text>
          </Pressable>

          <View style={styles.socialDivider}>
            <View style={[styles.socialDividerLine, { borderColor: isPhotographer ? '#3a3a24' : '#e8dfce' }]} />
            <Text style={[styles.socialDividerText, { color: isPhotographer ? '#555544' : '#b5a895' }]}>hoặc</Text>
            <View style={[styles.socialDividerLine, { borderColor: isPhotographer ? '#3a3a24' : '#e8dfce' }]} />
          </View>

          <Pressable 
            style={({ pressed }) => [
              styles.googleBtn,
              { backgroundColor: isPhotographer ? '#1a1a0f' : '#ffffff', borderColor: isPhotographer ? '#3a3a24' : '#e8dfce' },
              pressed && { opacity: 0.8, transform: [{ scale: 0.98 }] },
              !request && { opacity: 0.5 }
            ]}
            onPress={() => promptAsync()}
            disabled={!request || loading}
          >
            <Ionicons name="logo-google" size={18} color={isPhotographer ? '#faf5ee' : '#1a1a0f'} />
            <Text style={[styles.googleBtnText, { color: isPhotographer ? '#faf5ee' : '#1a1a0f' }]}>
              Tiếp tục với Google
            </Text>
          </Pressable>

          {/* Exposure Meter Aesthetic Footer inside Card */}
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
            <Text style={styles.lightMeterLabel}>0 EV · READY</Text>
          </View>
        </Animated.View>

        {/* Footer: Register Option */}
        <Animated.View entering={FadeInDown.duration(500).delay(350)} style={styles.registerFooter}>
          <Animated.Text style={[styles.registerText, animatedMutedTextColor]}>
            Chưa có tài khoản?{' '}
          </Animated.Text>
          <Pressable onPress={() => navigation.navigate('Register', { role: (role ?? 'customer') as 'customer' | 'photographer' })}>
            <Animated.Text style={[styles.registerLink, animatedAccentColor]}>
              Đăng ký ngay
            </Animated.Text>
          </Pressable>
        </Animated.View>

        {/* Elegant Bottom Role Switcher */}
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
                  {isPhotographer ? 'ĐĂNG NHẬP VỚI VAI TRÒ KHÁCH HÀNG' : 'ĐĂNG NHẬP VỚI VAI TRÒ NHIẾP ẢNH GIA'}
                </Animated.Text>
                <Text style={styles.roleToggleSub}>
                  {isPhotographer ? 'Khám phá & Booking các nhiếp ảnh gia' : 'Quản lý lịch trình, gói dịch vụ & danh mục'}
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
    paddingTop: Platform.OS === 'ios' ? spacing[16] : spacing[10],
    gap: spacing[6],
  },
  header: {
    alignItems: 'center',
    gap: spacing[2],
    marginVertical: spacing[4],
  },
  logoMarkContainer: {
    position: 'relative',
    marginBottom: spacing[2],
  },
  logoMark: {
    width: 60,
    height: 60,
    borderRadius: 30,
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
    width: 60,
    height: 60,
  },
  logoLetter: {
    fontSize: 28,
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
  tabBar: {
    flexDirection: 'row',
    borderRadius: radius.md,
    padding: 3,
    marginBottom: spacing[5],
  },
  tabButton: {
    flex: 1,
    paddingVertical: spacing[2],
    alignItems: 'center',
    borderRadius: radius.sm,
  },
  tabButtonActive: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  tabText: {
    fontSize: fontSizes.xs,
    fontWeight: fontWeights.bold,
    letterSpacing: 1,
  },
  tabTextActive: {
    color: '#FFFFFF',
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
  phonePrefix: {
    fontSize: fontSizes.sm,
    fontWeight: fontWeights.bold,
    marginRight: spacing[2],
  },
  textInput: {
    flex: 1,
    fontSize: 16,
    height: '100%',
    padding: 0,
  },
  fieldHint: {
    fontSize: 9,
    color: '#8b8b7a',
    fontStyle: 'italic',
    marginTop: 2,
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
  socialDivider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: spacing[4],
    zIndex: 2,
  },
  socialDividerLine: {
    flex: 1,
    borderTopWidth: 1,
  },
  socialDividerText: {
    paddingHorizontal: spacing[3],
    fontSize: 10,
    fontWeight: fontWeights.bold,
    textTransform: 'uppercase',
  },
  googleBtn: {
    flexDirection: 'row',
    height: 48,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing[2],
    borderWidth: 1.5,
    zIndex: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  googleBtnText: {
    fontWeight: fontWeights.bold,
    fontSize: fontSizes.sm,
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
