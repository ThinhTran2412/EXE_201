import React, { useState, useEffect } from 'react';
import {
  ScrollView, StyleSheet, Text, View, Pressable, Image, ActivityIndicator,
  Dimensions, TextInput, Alert, Modal, KeyboardAvoidingView, Platform,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import * as ImageManipulator from 'expo-image-manipulator';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, { FadeInDown, FadeIn } from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import { getPhotographerProfile, updateProfile, updatePersonalInfo, uploadProfileImage, submitVerification } from '../api';
import { formatRegion } from '../../../shared/constants/regions';
import { colors } from '../../../app/theme/colors';
import { spacing } from '../../../app/theme/spacing';
import PortfolioImageCell from '../../../shared/components/PortfolioImageCell';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

const formatPhotoUrl = (url: string) => {
  if (!url) return '';
  const apiUrl = process.env.EXPO_PUBLIC_API_URL || '';
  const ipMatch = apiUrl.match(/http:\/\/((\d+\.){3}\d+)/);
  if (ipMatch && (url.includes('localhost') || url.includes('127.0.0.1'))) {
    return url.replace(/localhost|127\.0\.0\.1/, ipMatch[1]);
  }
  return url;
};

async function prepareImage(uri: string, kind: 'avatar' | 'cover') {
  const actions = kind === 'avatar'
    ? [{ resize: { width: 1024 } }]
    : [{ resize: { width: 1600 } }];

  const result = await ImageManipulator.manipulateAsync(uri, actions, {
    compress: 0.75,
    format: ImageManipulator.SaveFormat.JPEG,
  });

  return result.uri;
}

export default function PProfileScreen() {
  const photoSize = Math.floor((SCREEN_WIDTH - spacing[5] * 2 - spacing[2] * 2) / 3);
  const gridGap = spacing[2];
  const navigation = useNavigation<any>();
  const insets = useSafeAreaInsets();

  const [loading, setLoading] = useState(true);
  const [savingImage, setSavingImage] = useState<'avatar' | 'cover' | null>(null);
  const [submittingVerify, setSubmittingVerify] = useState(false);
  const [profile, setProfile] = useState<any>(null);
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [personalInfoModalVisible, setPersonalInfoModalVisible] = useState(false);
  const [personalInfoVisible, setPersonalInfoVisible] = useState(true);
  const [editForm, setEditForm] = useState({ displayName: '', bio: '', quote: '' });
  const [personalForm, setPersonalForm] = useState({
    phone: '',
    email: '',
    region: '',
    personalAddress: '',
    nationalId: '',
  });

  const loadProfile = React.useCallback(async (showSpinner = false) => {
    if (showSpinner) {
      setLoading(true);
    }
    try {
      const p = await getPhotographerProfile();
      if (p) {
        setProfile(p);
        setEditForm({ displayName: p.displayName || '', bio: p.bio || '', quote: p.quote || '' });
        setPersonalForm({
          phone: p.phone || '',
          email: p.email || '',
          region: p.region || '',
          personalAddress: p.personalAddress || '',
          nationalId: p.nationalId || '',
        });
      }
    } catch (err) {
      console.error('Load profile error:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadProfile(true);
  }, [loadProfile]);

  useFocusEffect(
    React.useCallback(() => {
      loadProfile(false);
    }, [loadProfile])
  );

  async function handleSaveProfile() {
    try {
      await updateProfile({
        displayName: editForm.displayName,
        bio: editForm.bio,
        quote: editForm.quote,
      });
      setProfile((prev: any) => ({
        ...prev,
        displayName: editForm.displayName,
        bio: editForm.bio,
        quote: editForm.quote,
      }));
      await loadProfile();
      setEditModalVisible(false);
    } catch (err: any) {
      console.error('Update photographer profile failed:', err?.response?.status, err?.response?.data ?? err);
      const message = err?.response?.data?.message || err?.response?.data || err?.message || 'Không thể cập nhật hồ sơ.';
      Alert.alert('Lỗi', typeof message === 'string' ? message : 'Không thể cập nhật hồ sơ.');
    }
  }

  async function pickAndUploadImage(kind: 'avatar' | 'cover') {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 1,
      allowsEditing: kind === 'avatar',
      aspect: kind === 'avatar' ? [1, 1] : [16, 9],
    });

    if (result.canceled || !result.assets?.length) return;

    const asset = result.assets[0];
    try {
      setSavingImage(kind);
      const preparedUri = await prepareImage(asset.uri, kind);
      const uploadedUrl = await uploadProfileImage(preparedUri, asset.mimeType ?? 'image/jpeg', kind);
      await updateProfile(kind === 'avatar' ? { avatarUrl: uploadedUrl } : { coverPhotoUrl: uploadedUrl });
      setProfile((prev: any) => ({
        ...prev,
        ...(kind === 'avatar' ? { avatarUrl: uploadedUrl } : { coverPhotoUrl: uploadedUrl }),
      }));
    } catch (err: any) {
      console.error(`Upload ${kind} failed:`, err?.response?.status, err?.response?.data ?? err);
      Alert.alert('Lỗi', err?.response?.data?.message || 'Không thể cập nhật ảnh.');
    } finally {
      setSavingImage(null);
    }
  }

  async function handleSubmitVerification() {
    try {
      setSubmittingVerify(true);
      await submitVerification();
      await loadProfile();
      Alert.alert('Thành công', 'Yêu cầu xác minh đã được gửi.');
    } catch (err: any) {
      const message = err?.response?.data?.message || err?.response?.data || err?.message || '';
      console.error('Submit verification failed:', err?.response?.status, err?.response?.data ?? err);

      if (String(message).toLowerCase().includes('verification already in progress')) {
        await loadProfile();
        Alert.alert('Thông báo', 'Yêu cầu xác minh của bạn đang được xử lý rồi.');
        return;
      }

      Alert.alert('Lỗi', typeof message === 'string' ? message : 'Không thể gửi yêu cầu xác minh.');
    } finally {
      setSubmittingVerify(false);
    }
  }

  const verificationLabel = profile?.verificationStatus === 'Verified'
    ? 'Đã xác minh'
    : profile?.verificationStatus === 'Pending'
      ? 'Đang chờ xác minh'
      : 'Chưa xác minh';

  const verificationColor = profile?.verificationStatus === 'Verified'
    ? '#2ECC71'
    : profile?.verificationStatus === 'Pending'
      ? '#F1C40F'
      : '#E74C3C';

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  const photos = profile?.portfolioPhotos || [];
  const coverUrl = formatPhotoUrl(profile?.coverPhotoUrl) || 'https://images.unsplash.com/photo-1492691527719-9d1e07e534b4';
  const avatarUrl = formatPhotoUrl(profile?.avatarUrl) || 'https://i.pravatar.cc/150';
  const canVerify = profile?.verificationStatus !== 'Verified' && profile?.verificationStatus !== 'Pending';

  return (
    <View style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 100 }}>
        <View style={styles.coverContainer}>
          <Animated.View entering={FadeIn.duration(800)} style={StyleSheet.absoluteFillObject}>
            <Image source={{ uri: coverUrl }} style={styles.cover} />
            <LinearGradient pointerEvents="none" colors={['rgba(13,11,20,0.02)', 'rgba(13,11,20,0.18)', 'rgba(13,11,20,0.42)']} style={StyleSheet.absoluteFillObject} />
          </Animated.View>

          <Pressable
            style={styles.coverActionOverlay}
            hitSlop={18}
            android_ripple={{ color: 'rgba(255,255,255,0.12)' }}
            onPress={() => pickAndUploadImage('cover')}
          >
            <Ionicons name="image-outline" size={18} color="#FFFBF0" />
            <Text style={styles.coverActionText}>{savingImage === 'cover' ? 'Đang tải...' : 'Đổi ảnh bìa'}</Text>
          </Pressable>

          <View style={[styles.topActions, { top: Math.max(insets.top, 16) }]}> 
            <Pressable style={styles.iconBtn} onPress={() => navigation.goBack()}>
              <Ionicons name="chevron-back" size={24} color="#FFFBF0" />
            </Pressable>
            <Pressable style={styles.iconBtn} onPress={() => setEditModalVisible(true)}>
              <Ionicons name="pencil" size={20} color="#FFFBF0" />
            </Pressable>
          </View>
        </View>

        <Animated.View entering={FadeInDown.delay(200).duration(600)} style={styles.profileHeader}>
          <View style={styles.avatarWrapper}>
            <Image source={{ uri: avatarUrl }} style={styles.avatar} />
            <Pressable style={styles.avatarEditBtn} onPress={() => pickAndUploadImage('avatar')}>
              {savingImage === 'avatar' ? <ActivityIndicator size="small" color="#fff" /> : <Ionicons name="camera" size={16} color="#fff" />}
            </Pressable>
          </View>

          <View style={styles.nameRow}>
            <Text style={styles.name}>{profile?.displayName}</Text>
            {profile?.verificationStatus === 'Verified' && <Ionicons name="checkmark-circle" size={22} color="#2ECC71" />}
          </View>

          <View style={[styles.verifiedBadge, { borderColor: `${verificationColor}33`, backgroundColor: `${verificationColor}15` }]}>
            <Ionicons name={profile?.verificationStatus === 'Verified' ? 'shield-checkmark' : 'shield-outline'} size={14} color={verificationColor} />
            <Text style={[styles.verifiedText, { color: verificationColor }]}>{verificationLabel}</Text>
          </View>

          {canVerify && (
            <Pressable style={styles.verifyBtn} onPress={handleSubmitVerification} disabled={submittingVerify}>
              <LinearGradient colors={[colors.primary, '#E67E22']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.verifyBtnGradient}>
                {submittingVerify ? <ActivityIndicator size="small" color="#fff" /> : <Text style={styles.verifyBtnText}>Gửi yêu cầu xác minh</Text>}
              </LinearGradient>
            </Pressable>
          )}

          <View style={styles.badgeRow}>
            <View style={styles.regionBadge}>
              <Ionicons name="location" size={12} color="#FFFBF0" />
              <Text style={styles.regionText}>{formatRegion(profile?.region) || 'Chưa cập nhật'}</Text>
            </View>
            <View style={styles.ratingBadge}>
              <Ionicons name="star" size={12} color="#FFD700" />
              <Text style={styles.ratingText}>{profile?.rating?.toFixed(1) || '0.0'}</Text>
            </View>
          </View>

          <View style={styles.quoteSection}>
            <Text style={styles.quoteSectionLabel}>Quote cá nhân</Text>
            {profile?.quote ? (
              <View style={styles.quoteWrapper}>
                <Ionicons name="chatbox-ellipses-outline" size={24} color={colors.primary} style={styles.quoteIconLeft} />
                <Text style={styles.quoteText}>{profile.quote}</Text>
              </View>
            ) : (
              <View style={styles.quoteEmptyState}>
                <Ionicons name="chatbox-outline" size={20} color={colors.textMuted} />
                <Text style={styles.quoteEmptyText}>Chưa có quote. Hãy thêm một câu ngắn để khách hàng hiểu phong cách của bạn.</Text>
              </View>
            )}
          </View>
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(400).duration(600)} style={styles.content}>
          <LinearGradient colors={['#1e1c26', '#141121']} style={styles.statsBar}>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{photos.length}</Text>
              <Text style={styles.statLabel}>Tác phẩm</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text style={styles.statValue}>2+</Text>
              <Text style={styles.statLabel}>Năm KN</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text style={styles.statValue}>100%</Text>
              <Text style={styles.statLabel}>Phản hồi</Text>
            </View>
          </LinearGradient>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Giới Thiệu</Text>
            <View style={styles.bioContainer}>
              <Text style={styles.bioText}>{profile?.bio || 'Chưa có thông tin giới thiệu. Hãy thêm tiểu sử để khách hàng hiểu rõ hơn về phong cách của bạn.'}</Text>
            </View>
          </View>

          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Thông tin cá nhân</Text>
              <View style={styles.personalActions}>
                <Pressable
                  style={styles.personalEditBtn}
                  onPress={() => setPersonalInfoVisible(v => !v)}
                  accessibilityLabel={personalInfoVisible ? 'Ẩn thông tin cá nhân' : 'Hiện thông tin cá nhân'}
                >
                  <Ionicons name={personalInfoVisible ? 'eye-off-outline' : 'eye-outline'} size={16} color="#F7E7D2" />
                </Pressable>
                <Pressable style={styles.personalEditBtn} onPress={() => navigation.navigate('PersonalInfo')}>
                  <Ionicons name="create-outline" size={16} color="#F7E7D2" />
                </Pressable>
              </View>
            </View>
            {personalInfoVisible ? (
              <View style={styles.personalInfoCard}>
                <PersonalInfoRow icon="call-outline" label="SĐT" value={personalForm.phone || 'Chưa cập nhật'} />
                <PersonalInfoRow icon="mail-outline" label="Email" value={personalForm.email || 'Chưa cập nhật'} />
                <PersonalInfoRow icon="map-outline" label="Tỉnh / Thành phố" value={formatRegion(personalForm.region) || 'Chưa cập nhật'} />
              </View>
            ) : (
              <View style={styles.personalInfoHidden}>
                <Ionicons name="lock-closed-outline" size={16} color="rgba(255,251,240,0.45)" />
                <Text style={styles.personalInfoHiddenText}>Thông tin cá nhân đang được ẩn</Text>
              </View>
            )}
          </View>

          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Portfolio</Text>
              <Pressable onPress={() => navigation.navigate('Portfolio')}>
                <Text style={styles.seeAllBtn}>Xem tất cả</Text>
              </Pressable>
            </View>
            <View style={styles.photoGrid}>
              {photos.length === 0 ? (
                <Pressable style={[styles.addPhotoPlaceholder, { width: photoSize, height: photoSize }]} onPress={() => navigation.navigate('Portfolio')}>
                  <Ionicons name="add" size={32} color={colors.primary} />
                  <Text style={styles.addPhotoText}>Thêm ảnh</Text>
                </Pressable>
              ) : (
                [0, 1, 2].map(row => (
                  <View
                    key={`pgrid-${row}`}
                    style={{
                      flexDirection: 'row',
                      marginBottom: row < 2 ? gridGap : 0,
                    }}
                  >
                    {[0, 1, 2].map(col => {
                      const idx = row * 3 + col;
                      const url = photos[idx];
                      return (
                        <View
                          key={`p-${row}-${col}`}
                          style={{
                            width: photoSize,
                            height: photoSize,
                            marginRight: col < 2 ? gridGap : 0,
                          }}
                        >
                          {url ? (
                            <PortfolioImageCell
                              uri={url}
                              style={{ width: photoSize, height: photoSize }}
                              borderRadius={12}
                              onPress={() => navigation.navigate('Portfolio')}
                            />
                          ) : null}
                        </View>
                      );
                    })}
                  </View>
                ))
              )}
            </View>
          </View>

          <View style={styles.menu}>
            <MenuLink icon="card-outline" label="Quản lý dịch vụ & giá" onPress={() => navigation.navigate('ServiceManagement')} />
            <MenuLink icon="calendar-outline" label="Lịch hẹn dạng lịch" onPress={() => navigation.navigate('BookingCalendar')} />
            <MenuLink icon="shield-checkmark-outline" label="Xác minh danh tính" onPress={handleSubmitVerification} />
            <MenuLink icon="notifications-outline" label="Cài đặt thông báo" onPress={() => { }} />
          </View>
        </Animated.View>
      </ScrollView>

      <Modal visible={editModalVisible} animationType="slide" transparent>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.modalWrapper}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Chỉnh sửa hồ sơ</Text>
              <Pressable onPress={() => setEditModalVisible(false)} style={styles.closeBtn}>
                <Ionicons name="close" size={24} color="#FFFBF0" />
              </Pressable>
            </View>
            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.modalScroll}>
              <Text style={styles.inputLabel}>Tên hiển thị</Text>
              <TextInput style={styles.inputField} value={editForm.displayName} onChangeText={(t) => setEditForm(prev => ({ ...prev, displayName: t }))} placeholder="Ví dụ: John Doe Photography" placeholderTextColor={colors.textMuted} />
              <Text style={styles.inputLabel}>Câu trích dẫn (Quote)</Text>
              <TextInput style={styles.inputField} value={editForm.quote} onChangeText={(t) => setEditForm(prev => ({ ...prev, quote: t }))} placeholder="Câu nói truyền cảm hứng của bạn..." placeholderTextColor={colors.textMuted} />
              <Text style={styles.inputLabel}>Tiểu sử</Text>
              <TextInput style={[styles.inputField, styles.textArea]} value={editForm.bio} onChangeText={(t) => setEditForm(prev => ({ ...prev, bio: t }))} placeholder="Chia sẻ về phong cách, kinh nghiệm..." placeholderTextColor={colors.textMuted} multiline />
              <Pressable style={styles.saveBtn} onPress={handleSaveProfile}>
                <LinearGradient colors={[colors.primary, '#E67E22']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.saveBtnGradient}>
                  <Text style={styles.saveBtnText}>Lưu thay đổi</Text>
                </LinearGradient>
              </Pressable>
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      <Modal visible={personalInfoModalVisible} animationType="slide" transparent>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.modalWrapper}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Cập nhật thông tin cá nhân</Text>
              <Pressable onPress={() => setPersonalInfoModalVisible(false)} style={styles.closeBtn}>
                <Ionicons name="close" size={24} color="#FFFBF0" />
              </Pressable>
            </View>
            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.modalScroll}>
              <Text style={styles.inputLabel}>Căn cước / CCCD</Text>
              <TextInput style={styles.inputField} value={personalForm.nationalId} onChangeText={(t) => setPersonalForm(prev => ({ ...prev, nationalId: t }))} placeholder="Nhập số căn cước / CCCD" placeholderTextColor={colors.textMuted} />
              <Text style={styles.inputLabel}>Số điện thoại liên lạc</Text>
              <TextInput style={styles.inputField} value={personalForm.phone} onChangeText={(t) => setPersonalForm(prev => ({ ...prev, phone: t }))} placeholder="Nhập số điện thoại" placeholderTextColor={colors.textMuted} keyboardType="phone-pad" />
              <Text style={styles.inputLabel}>Email cụ thể</Text>
              <TextInput style={styles.inputField} value={personalForm.email} onChangeText={(t) => setPersonalForm(prev => ({ ...prev, email: t }))} placeholder="Nhập email" placeholderTextColor={colors.textMuted} keyboardType="email-address" autoCapitalize="none" />
              <Text style={styles.inputLabel}>Tỉnh / Thành phố</Text>
              <TextInput style={styles.inputField} value={formatRegion(personalForm.region)} editable={false} placeholder="Cập nhật tại màn Thông tin cá nhân" placeholderTextColor={colors.textMuted} />
              <Text style={styles.inputLabel}>Địa chỉ cụ thể</Text>
              <TextInput style={[styles.inputField, styles.textArea]} value={personalForm.personalAddress} onChangeText={(t) => setPersonalForm(prev => ({ ...prev, personalAddress: t }))} placeholder="Số nhà, đường, phường/xã..." placeholderTextColor={colors.textMuted} multiline />
              <Pressable
                style={styles.saveBtn}
                onPress={async () => {
                  try {
                    await updatePersonalInfo(personalForm);
                    await loadProfile();
                    setPersonalInfoModalVisible(false);
                    Alert.alert('Thành công', 'Đã cập nhật thông tin cá nhân.');
                  } catch (err: any) {
                    const message = err?.response?.data?.message || err?.response?.data || err?.message || 'Không thể cập nhật thông tin cá nhân.';
                    Alert.alert('Lỗi', typeof message === 'string' ? message : 'Không thể cập nhật thông tin cá nhân.');
                  }
                }}
              >
                <LinearGradient colors={[colors.primary, '#E67E22']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.saveBtnGradient}>
                  <Text style={styles.saveBtnText}>Lưu thông tin</Text>
                </LinearGradient>
              </Pressable>
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
}

function MenuLink({ icon, label, onPress }: any) {
  return (
    <Pressable style={({ pressed }) => [styles.menuLink, pressed && { opacity: 0.7 }]} onPress={onPress}>
      <View style={styles.menuLinkLeft}>
        <View style={styles.menuIconWrapper}>
          <Ionicons name={icon} size={20} color={colors.primary} />
        </View>
        <Text style={styles.menuLinkLabel}>{label}</Text>
      </View>
      <Ionicons name="chevron-forward" size={20} color="rgba(255,255,255,0.3)" />
    </Pressable>
  );
}

function PersonalInfoRow({ icon, label, value }: { icon: string; label: string; value: string }) {
  return (
    <View style={styles.personalRow}>
      <View style={styles.personalRowIcon}>
        <Ionicons name={icon as any} size={16} color="#F7E7D2" />
      </View>
      <View style={styles.personalRowBody}>
        <Text style={styles.personalRowLabel}>{label}</Text>
        <Text style={styles.personalRowValue}>{value}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0d0b14' },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#0d0b14' },
  coverContainer: { width: '100%', aspectRatio: 16 / 9, maxHeight: 260, position: 'relative' },
  cover: { width: '100%', height: '100%', resizeMode: 'cover' },
  coverActionOverlay: { position: 'absolute', bottom: 18, right: 16, zIndex: 9999, elevation: 9999, flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: 'rgba(0,0,0,0.22)', paddingHorizontal: 14, paddingVertical: 10, borderRadius: 22 },
  coverActionText: { color: '#FFFBF0', fontSize: 13, fontWeight: '600' },
  topActions: { position: 'absolute', left: 16, right: 16, flexDirection: 'row', justifyContent: 'space-between', zIndex: 10 },
  iconBtn: { width: 44, height: 44, borderRadius: 22, backgroundColor: 'rgba(0,0,0,0.3)', justifyContent: 'center', alignItems: 'center' },
  profileHeader: { alignItems: 'center', marginTop: -60, paddingHorizontal: 24, zIndex: 5 },
  avatarWrapper: { position: 'relative', marginBottom: 12 },
  avatar: { width: 110, height: 110, borderRadius: 55, borderWidth: 4, borderColor: '#0d0b14' },
  avatarEditBtn: { position: 'absolute', right: 2, bottom: 2, width: 32, height: 32, borderRadius: 16, backgroundColor: colors.primary, justifyContent: 'center', alignItems: 'center', borderWidth: 2, borderColor: '#0d0b14' },
  nameRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  name: { fontSize: 28, fontWeight: '800', color: '#FFFBF0', marginBottom: 8, letterSpacing: 0.5 },
  verifiedBadge: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 999, borderWidth: 1, marginBottom: 10 },
  verifiedText: { fontSize: 13, fontWeight: '700' },
  verifyBtn: { marginBottom: 12, borderRadius: 14, overflow: 'hidden' },
  verifyBtnGradient: { paddingHorizontal: 16, paddingVertical: 10, alignItems: 'center', justifyContent: 'center' },
  verifyBtnText: { color: '#fff', fontWeight: '700' },
  badgeRow: { flexDirection: 'row', gap: 12, marginBottom: 20 },
  regionBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: 'rgba(0, 0, 0, 0.35)', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20, borderWidth: 1, borderColor: 'rgba(255, 255, 255, 0.12)' },
  regionText: { color: '#FFFBF0', fontSize: 13, fontWeight: '600' },
  personalActions: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  personalInfoHidden: { flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: 'rgba(30, 28, 38, 0.55)', borderRadius: 18, padding: 16, borderWidth: 1, borderColor: 'rgba(255,255,255,0.04)' },
  personalInfoHiddenText: { color: 'rgba(255,251,240,0.55)', fontSize: 13, fontWeight: '600' },
  ratingBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: 'rgba(255, 215, 0, 0.15)', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20 },
  ratingText: { color: '#FFD700', fontSize: 13, fontWeight: '600' },
  quoteSection: { width: '100%', marginBottom: 6 },
  quoteSectionLabel: { color: 'rgba(255,251,240,0.55)', fontSize: 12, fontWeight: '700', letterSpacing: 0.8, textTransform: 'uppercase', marginBottom: 10, alignSelf: 'flex-start' },
  quoteWrapper: { position: 'relative', paddingHorizontal: 20, paddingVertical: 14, alignItems: 'center', justifyContent: 'center', width: '100%', backgroundColor: 'rgba(230, 126, 34, 0.08)', borderRadius: 18, borderWidth: 1, borderColor: 'rgba(230, 126, 34, 0.14)' },
  quoteIconLeft: { position: 'absolute', top: 14, left: 14, opacity: 0.22 },
  quoteText: { fontSize: 16, fontStyle: 'italic', color: 'rgba(255,251,240,0.95)', textAlign: 'center', lineHeight: 24, fontFamily: Platform.OS === 'ios' ? 'Georgia' : 'serif', paddingHorizontal: 18, flexShrink: 1, width: '100%' },
  quoteEmptyState: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 16, paddingVertical: 14, borderRadius: 18, backgroundColor: 'rgba(255,255,255,0.03)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.05)' },
  quoteEmptyText: { flex: 1, color: 'rgba(255,251,240,0.6)', fontSize: 14, lineHeight: 20 },
  content: { paddingHorizontal: 20, paddingTop: 10 },
  statsBar: { flexDirection: 'row', borderRadius: 20, padding: 20, marginBottom: 30, borderWidth: 1, borderColor: 'rgba(255,255,255,0.05)', shadowColor: '#000', shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.3, shadowRadius: 20, elevation: 10 },
  statItem: { flex: 1, alignItems: 'center', gap: 4 },
  statDivider: { width: 1, backgroundColor: 'rgba(255,255,255,0.1)', marginVertical: 4 },
  statValue: { fontSize: 22, fontWeight: 'bold', color: '#FFFBF0' },
  statLabel: { fontSize: 12, color: colors.textMuted, textTransform: 'uppercase', letterSpacing: 1 },
  section: { marginBottom: 32 },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  sectionTitle: { fontSize: 18, fontWeight: '700', color: '#FFFBF0', letterSpacing: 0.5 },
  seeAllBtn: { color: colors.primary, fontSize: 14, fontWeight: '600' },
  personalEditBtn: { width: 34, height: 34, borderRadius: 17, backgroundColor: 'rgba(243,192,139,0.12)', justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: 'rgba(243,192,139,0.12)' },
  bioContainer: { backgroundColor: 'rgba(30, 28, 38, 0.5)', borderRadius: 16, padding: 20, borderWidth: 1, borderColor: 'rgba(255,255,255,0.03)' },
  bioText: { color: 'rgba(255, 251, 240, 0.75)', lineHeight: 24, fontSize: 15 },
  personalInfoCard: { backgroundColor: 'rgba(30, 28, 38, 0.55)', borderRadius: 18, padding: 14, borderWidth: 1, borderColor: 'rgba(255,255,255,0.04)', gap: 10 },
  personalRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 10 },
  personalRowIcon: { width: 26, height: 26, borderRadius: 8, backgroundColor: 'rgba(243,192,139,0.12)', justifyContent: 'center', alignItems: 'center', marginTop: 1 },
  personalRowBody: { flex: 1 },
  personalRowLabel: { color: 'rgba(255,251,240,0.55)', fontSize: 10, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.5 },
  personalRowValue: { color: '#FFFBF0', fontSize: 13, fontWeight: '600', lineHeight: 18, marginTop: 2 },
  photoGrid: { alignItems: 'flex-start' },
  gridPhoto: { borderRadius: 12, backgroundColor: '#2a2636' },
  addPhotoPlaceholder: { borderRadius: 12, borderStyle: 'dashed', borderWidth: 1, borderColor: 'rgba(230, 126, 34, 0.3)', justifyContent: 'center', alignItems: 'center', gap: 8, backgroundColor: 'rgba(230, 126, 34, 0.05)' },
  addPhotoText: { color: colors.primary, fontSize: 12, fontWeight: '600' },
  menu: { gap: 12, marginTop: 10 },
  menuLink: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#1e1c26', padding: 16, borderRadius: 16 },
  menuLinkLeft: { flexDirection: 'row', alignItems: 'center', gap: 16 },
  menuIconWrapper: { width: 40, height: 40, borderRadius: 12, backgroundColor: 'rgba(230, 126, 34, 0.1)', justifyContent: 'center', alignItems: 'center' },
  menuLinkLabel: { color: '#FFFBF0', fontSize: 16, fontWeight: '500' },
  modalWrapper: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.7)' },
  modalContent: { backgroundColor: '#141121', borderTopLeftRadius: 32, borderTopRightRadius: 32, maxHeight: '90%', paddingBottom: Platform.OS === 'ios' ? 20 : 0 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 24, borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.05)' },
  modalTitle: { fontSize: 20, fontWeight: 'bold', color: '#FFFBF0' },
  closeBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: 'rgba(255,255,255,0.1)', justifyContent: 'center', alignItems: 'center' },
  modalScroll: { padding: 24, gap: 20 },
  inputLabel: { color: 'rgba(255,251,240,0.6)', fontSize: 14, fontWeight: '600', marginBottom: -10, marginLeft: 4 },
  inputField: { backgroundColor: '#1e1c26', borderRadius: 16, padding: 16, color: '#FFFBF0', fontSize: 16, borderWidth: 1, borderColor: 'rgba(255,255,255,0.05)' },
  textArea: { minHeight: 120, textAlignVertical: 'top' },
  saveBtn: { marginTop: 10, marginBottom: 40, borderRadius: 16, overflow: 'hidden' },
  saveBtnGradient: { padding: 18, alignItems: 'center', justifyContent: 'center' },
  saveBtnText: { color: '#FFFBF0', fontSize: 16, fontWeight: 'bold', letterSpacing: 0.5 },
});
