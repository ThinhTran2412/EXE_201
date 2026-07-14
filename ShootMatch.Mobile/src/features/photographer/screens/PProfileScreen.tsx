import React, { useState, useEffect } from 'react';
import {
  ScrollView, StyleSheet, Text, View, Pressable, Image, ActivityIndicator,
  Dimensions, TextInput, Alert, Modal, KeyboardAvoidingView, Platform, Switch,
  useWindowDimensions,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import * as ImageManipulator from 'expo-image-manipulator';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, { FadeInDown, FadeIn } from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import { getPhotographerProfile, updateProfile, updatePersonalInfo, uploadProfileImage, submitVerification, getMyReviewsReceived, proposeStyle, proposeConcept } from '../api';
import { formatRegion } from '../../../shared/constants/regions';
import { spacing } from '../../../app/theme/spacing';
import PortfolioImageCell from '../../../shared/components/PortfolioImageCell';
import { formatImageUrl } from '../../../shared/utils/formatImageUrl';
import { usePhotographerTheme } from '../PhotographerThemeContext';

const { width: SCREEN_WIDTH } = Dimensions.get('window');



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
  const { colors, isDark, toggleTheme } = usePhotographerTheme();
  const styles = getStyles(colors, isDark);

  const { width: windowWidth } = useWindowDimensions();
  const containerWidth = Platform.OS === 'web' ? Math.min(windowWidth, 800) : windowWidth;
  const photoSize = Math.floor((containerWidth - spacing[5] * 2 - spacing[2] * 2) / 3);
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
  const [reviews, setReviews] = useState<any[]>([]);
  const [reviewsLoading, setReviewsLoading] = useState(true);
  const [reviewsExpanded, setReviewsExpanded] = useState(false);
  
  const [proposeModalVisible, setProposeModalVisible] = useState(false);
  const [proposeType, setProposeType] = useState<'style' | 'concept'>('style');
  const [proposeForm, setProposeForm] = useState({ name: '', description: '', keywords: '' });
  const [proposing, setProposing] = useState(false);

  const loadProfile = React.useCallback(async (showSpinner = false) => {
    if (showSpinner) {
      setLoading(true);
      setReviewsLoading(true);
    }
    try {
      const [p, revs] = await Promise.all([
        getPhotographerProfile(),
        getMyReviewsReceived().catch(() => [])
      ]);
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
      setReviews(revs);
    } catch (err) {
      console.log('Load profile error:', err);
    } finally {
      setLoading(false);
      setReviewsLoading(false);
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

  async function handleProposeTag() {
    const name = proposeForm.name.trim();
    if (!name) {
      Alert.alert('Lỗi', 'Tên phong cách/chủ đề không được để trống.');
      return;
    }

    try {
      setProposing(true);
      if (proposeType === 'style') {
        await proposeStyle(name, proposeForm.description, proposeForm.keywords);
      } else {
        await proposeConcept(name, proposeForm.description, proposeForm.keywords);
      }
      
      Alert.alert(
        'Thành công',
        `Yêu cầu đề xuất ${proposeType === 'style' ? 'phong cách' : 'concept'} "${name}" đã được gửi và đang chờ phê duyệt.`
      );
      
      setProposeForm({ name: '', description: '', keywords: '' });
      setProposeModalVisible(false);
    } catch (err: any) {
      console.error('Propose tag failed:', err?.response?.status, err?.response?.data ?? err);
      const message = err?.response?.data?.message || err?.response?.data || err?.message || 'Có lỗi xảy ra khi gửi đề xuất.';
      Alert.alert('Lỗi', typeof message === 'string' ? message : 'Có lỗi xảy ra khi gửi đề xuất.');
    } finally {
      setProposing(false);
    }
  }

  const verificationLabel = profile?.verificationStatus === 'Verified'
    ? 'Đã xác minh'
    : profile?.verificationStatus === 'Pending'
      ? 'Đang chờ xác minh'
      : 'Chưa xác minh';

  const verificationColor = profile?.verificationStatus === 'Verified'
    ? (isDark ? '#2ECC71' : '#27ae60')
    : profile?.verificationStatus === 'Pending'
      ? (isDark ? '#F1C40F' : '#d48806')
      : (isDark ? '#E74C3C' : '#c0392b');

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  const photos = profile?.portfolioPhotos || [];
  const coverUrl = formatImageUrl(profile?.coverPhotoUrl) || 'https://images.unsplash.com/photo-1492691527719-9d1e07e534b4';
  const avatarUrl = formatImageUrl(profile?.avatarUrl) || 'https://i.pravatar.cc/150';
  const canVerify = profile?.verificationStatus !== 'Verified' && profile?.verificationStatus !== 'Pending';

  return (
    <View style={styles.container}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 100 }}
      >
        <View style={styles.coverContainer}>
          <Animated.View entering={FadeIn.duration(800)} style={StyleSheet.absoluteFillObject}>
            <Image source={{ uri: coverUrl }} style={styles.cover} />
            <LinearGradient pointerEvents="none" colors={['rgba(13,11,20,0.02)', 'rgba(13,11,20,0.18)', 'rgba(13,11,20,0.42)']} style={StyleSheet.absoluteFillObject} />
          </Animated.View>

          <View style={[styles.topActions, { top: Math.max(insets.top, 16) }]}> 
            <Pressable style={styles.iconBtn} onPress={() => navigation.goBack()}>
              <Ionicons name="chevron-back" size={24} color="#FFFBF0" />
            </Pressable>
            <Pressable style={styles.iconBtn} onPress={() => setEditModalVisible(true)}>
              <Ionicons name="pencil" size={20} color="#FFFBF0" />
            </Pressable>
          </View>

          <Pressable
            style={styles.coverActionOverlay}
            hitSlop={18}
            android_ripple={{ color: 'rgba(255,255,255,0.12)' }}
            onPress={() => pickAndUploadImage('cover')}
          >
            <Ionicons name="image-outline" size={18} color="#FFFBF0" />
            <Text style={styles.coverActionText}>{savingImage === 'cover' ? 'Đang tải...' : 'Đổi ảnh bìa'}</Text>
          </Pressable>
        </View>

        <Animated.View entering={FadeInDown.delay(200).duration(600)} style={styles.profileHeader}>

          <View style={styles.avatarFocusContainer}>
            {/* Focus Ring Indicator Lines */}
            <View style={styles.lensFocusMarkTop} />
            <View style={styles.lensFocusMarkBottom} />
            <View style={styles.lensFocusMarkLeft} />
            <View style={styles.lensFocusMarkRight} />

            <View style={styles.avatarWrapper}>
              <Image source={{ uri: avatarUrl }} style={styles.avatar} />
              <Pressable style={styles.avatarEditBtn} onPress={() => pickAndUploadImage('avatar')}>
                {savingImage === 'avatar' ? <ActivityIndicator size="small" color="#fff" /> : <Ionicons name="camera" size={16} color="#fff" />}
              </Pressable>
            </View>
          </View>

          <View style={styles.nameRow}>
            <Text style={styles.name}>{profile?.displayName}</Text>
            {profile?.verificationStatus === 'Verified' && <Ionicons name="checkmark-circle" size={22} color="#2ECC71" />}
          </View>

          <View style={styles.badgeRow}>
            <View style={styles.ratingBadge}>
              <Ionicons name="star" size={10} color="#FFD700" />
              <Text style={styles.ratingText}>RATING · {profile?.rating?.toFixed(1) || '0.0'}</Text>
            </View>
            <View style={styles.regionBadge}>
              <Ionicons name="location" size={10} color={colors.accent} />
              <Text style={styles.regionText}>LOC · {formatRegion(profile?.region)?.toUpperCase() || 'UNKNOWN'}</Text>
            </View>
            <View style={[styles.verifiedBadge, { borderColor: `${verificationColor}33`, backgroundColor: `${verificationColor}10` }]}>
              <Ionicons name={profile?.verificationStatus === 'Verified' ? 'shield-checkmark' : 'shield-outline'} size={10} color={verificationColor} />
              <Text style={[styles.verifiedText, { color: verificationColor }]}>{verificationLabel?.toUpperCase()}</Text>
            </View>
          </View>

          {canVerify && (
            <Pressable style={styles.verifyBtn} onPress={handleSubmitVerification} disabled={submittingVerify}>
              <LinearGradient colors={[colors.primary, '#E67E22']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.verifyBtnGradient}>
                {submittingVerify ? <ActivityIndicator size="small" color="#fff" /> : <Text style={styles.verifyBtnText}>Gửi yêu cầu xác minh</Text>}
              </LinearGradient>
            </Pressable>
          )}

          <View style={styles.quoteSection}>
            <Text style={styles.quoteSectionLabel}>Quote cá nhân</Text>
            {profile?.quote ? (
              <View style={styles.quoteWrapper}>
                {/* Minimalist Watermark Circle */}
                <View style={styles.quoteWatermarkCircle} />
                
                <Text style={styles.quoteMarkLeft}>“</Text>
                <Text style={styles.quoteText}>{profile.quote}</Text>
                <Text style={styles.quoteMarkRight}>”</Text>
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
          <View style={styles.statsCardsRow}>
            <View style={styles.statCardItem}>
              <View style={styles.statCardLeftAccent} />
              <Text style={styles.statCardValue}>
                {photos.length}
                <Text style={styles.statCardSuffix}> px</Text>
              </Text>
              <Text style={styles.statCardLabel}>TÁC PHẨM</Text>
            </View>
            <View style={styles.statCardItem}>
              <View style={styles.statCardLeftAccent} />
              <Text style={styles.statCardValue}>
                2+
                <Text style={styles.statCardSuffix}> yr</Text>
              </Text>
              <Text style={styles.statCardLabel}>KINH NGHIỆM</Text>
            </View>
            <View style={styles.statCardItem}>
              <View style={styles.statCardLeftAccent} />
              <Text style={styles.statCardValue}>
                100
                <Text style={styles.statCardSuffix}> %</Text>
              </Text>
              <Text style={styles.statCardLabel}>PHẢN HỒI</Text>
            </View>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Giới Thiệu</Text>
            <View style={styles.bioContainer}>
              <View style={styles.cardHeaderAccent} />
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
                  <Ionicons name={personalInfoVisible ? 'eye-off-outline' : 'eye-outline'} size={16} color={isDark ? '#F5DEB3' : colors.accent} />
                </Pressable>
                <Pressable style={styles.personalEditBtn} onPress={() => navigation.navigate('PersonalInfo')}>
                  <Ionicons name="create-outline" size={16} color={isDark ? '#F5DEB3' : colors.accent} />
                </Pressable>
              </View>
            </View>
            {personalInfoVisible ? (
              <View style={styles.personalInfoCard}>
                <View style={styles.cardHeaderAccent} />
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
              <Text style={styles.sectionTitle}>Thiết bị sử dụng</Text>
              <View style={styles.personalActions}>
                <Pressable style={styles.personalEditBtn} onPress={() => navigation.navigate('ManageEquipment')}>
                  <Ionicons name="create-outline" size={16} color={isDark ? '#F5DEB3' : colors.accent} />
                </Pressable>
              </View>
            </View>
            
            {profile?.equipments && profile.equipments.length > 0 ? (
              <ScrollView 
                horizontal 
                showsHorizontalScrollIndicator={false} 
                contentContainerStyle={styles.portfolioStrip}
              >
                {profile.equipments.map((eq: any, idx: number) => {
                  let iconName = 'camera-outline';
                  if (eq.category === 'Lens') iconName = 'aperture-outline';
                  else if (eq.category === 'Lighting') iconName = 'flash-outline';
                  else if (eq.category === 'Drone') iconName = 'airplane-outline';
                  else if (eq.category === 'Other') iconName = 'cube-outline';

                  const categoryColors: Record<string, string> = {
                    Camera: '#cf4028',
                    Lens: '#3498db',
                    Lighting: '#f1c40f',
                    Drone: '#2ecc71',
                    Other: '#95a5a6',
                  };
                  const catColor = categoryColors[eq.category] || '#95a5a6';

                  return (
                    <Pressable
                      key={eq.id || idx}
                      style={styles.portfolioSlideMount}
                      onPress={() => navigation.navigate('ManageEquipment')}
                    >
                      {/* Top Sprocket Holes */}
                      <View style={styles.sprocketHolesRow}>
                        {[1, 2, 3, 4].map(i => (
                          <View key={`sprock-t-${i}`} style={styles.sprocketHole} />
                        ))}
                      </View>

                      <View style={[styles.portfolioSlideInner, { backgroundColor: isDark ? '#121118' : '#FAF7F2', justifyContent: 'center', alignItems: 'center' }]}>
                        <View style={{ width: 44, height: 44, borderRadius: 22, backgroundColor: `${catColor}15`, justifyContent: 'center', alignItems: 'center', marginBottom: 6 }}>
                          <Ionicons name={iconName as any} size={22} color={catColor} />
                        </View>
                        <Text style={{ color: colors.text, fontSize: 11, fontWeight: '700', textAlign: 'center', paddingHorizontal: 6 }} numberOfLines={2}>
                          {eq.name}
                        </Text>
                      </View>
                      
                      <View style={styles.portfolioSlideMeta}>
                        <Text style={styles.portfolioSlideText}>GEAR {String(idx + 1).padStart(2, '0')}</Text>
                        <Text style={[styles.portfolioSlideSpec, { color: catColor, fontSize: 8 }]}>
                          {eq.category.toUpperCase()}{eq.isPrimary ? ' · MAIN' : ''}
                        </Text>
                      </View>

                      {/* Bottom Sprocket Holes */}
                      <View style={[styles.sprocketHolesRow, { marginTop: 4 }]}>
                        {[1, 2, 3, 4].map(i => (
                          <View key={`sprock-b-${i}`} style={styles.sprocketHole} />
                        ))}
                      </View>
                    </Pressable>
                  );
                })}
              </ScrollView>
            ) : (
              <View style={styles.personalInfoHidden}>
                <Ionicons name="camera-outline" size={16} color="rgba(255,251,240,0.45)" />
                <Text style={styles.personalInfoHiddenText}>Chưa cập nhật thiết bị nào</Text>
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
                            position: 'relative',
                          }}
                        >
                          {url ? (
                            <>
                              <PortfolioImageCell
                                uri={url}
                                style={{ width: photoSize, height: photoSize }}
                                borderRadius={12}
                                onPress={() => navigation.navigate('Portfolio')}
                              />
                              {/* Contact Sheet Frame Index Overlay */}
                              <View style={styles.gridPhotoIndexBadge}>
                                <Text style={styles.gridPhotoIndexText}>
                                  {String(idx + 1).padStart(2, '0')}
                                </Text>
                              </View>
                            </>
                          ) : null}
                        </View>
                      );
                    })}
                  </View>
                ))
              )}
            </View>
          </View>

          {/* ── REVIEWS RECEIVED ── */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Đánh giá nhận được ({reviews.length})</Text>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                  <Ionicons name="star" size={14} color="#FFD700" />
                  <Text style={{ color: '#FFD700', fontSize: 14, fontWeight: '700' }}>
                    {profile?.rating ? profile.rating.toFixed(1) : '0.0'}
                  </Text>
                </View>
                {reviews.length > 0 && (
                  <Pressable
                    style={styles.personalEditBtn}
                    onPress={() => setReviewsExpanded(v => !v)}
                    accessibilityLabel={reviewsExpanded ? 'Thu gọn đánh giá' : 'Mở rộng đánh giá'}
                  >
                    <Ionicons name={reviewsExpanded ? 'chevron-up' : 'chevron-down'} size={16} color={isDark ? '#F5DEB3' : colors.accent} />
                  </Pressable>
                )}
              </View>
            </View>
            <View style={{ gap: 12 }}>
              {reviewsLoading ? (
                <ActivityIndicator size="small" color={colors.primary} />
              ) : reviews.length === 0 ? (
                <View style={styles.reviewEmptyState}>
                  <Ionicons name="star-outline" size={18} color="rgba(255,251,240,0.3)" />
                  <Text style={styles.reviewEmptyText}>Bạn chưa nhận được đánh giá nào.</Text>
                </View>
              ) : reviewsExpanded ? (
                reviews.map((r, i) => (
                  <View key={r.id || i} style={styles.reviewCard}>
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                        {r.authorAvatarUrl ? (
                          <PortfolioImageCell 
                            uri={r.authorAvatarUrl} 
                            style={styles.reviewAvatarImage} 
                            borderRadius={16} 
                            resizeMode="cover" 
                          />
                        ) : (
                          <View style={styles.reviewAvatar}>
                            <Text style={{ fontSize: 11, fontWeight: 'bold', color: colors.text }}>
                              {r.authorName ? r.authorName.split(' ').map((n: string)=>n[0]).join('').substring(0,2) : 'KH'}
                            </Text>
                          </View>
                        )}
                        <View>
                          <Text style={{ fontSize: 13, fontWeight: '600', color: colors.text }}>{r.authorName || 'Khách hàng'}</Text>
                          <Text style={{ fontSize: 10, opacity: 0.6, color: colors.textMuted }}>
                            {new Date(r.createdAt).toLocaleDateString('vi-VN')}
                          </Text>
                        </View>
                      </View>
                      <Text style={{ color: '#FFD700', fontSize: 10 }}>{'★'.repeat(r.rating)}{'☆'.repeat(5-r.rating)}</Text>
                    </View>
                    <Text style={{ fontSize: 12, lineHeight: 18, opacity: 0.9, color: colors.text }}>"{r.comment}"</Text>
                  </View>
                ))
              ) : (
                <Pressable onPress={() => setReviewsExpanded(true)} style={styles.reviewEmptyState}>
                  <Ionicons name="chatbubbles-outline" size={18} color={colors.accent} />
                  <Text style={[styles.reviewEmptyText, { color: colors.accent, fontWeight: '600', opacity: 1 }]}>
                    Nhấn để xem {reviews.length} đánh giá
                  </Text>
                </Pressable>
              )}
            </View>
          </View>

          <View style={styles.menu}>
            <MenuLink icon="card-outline" label="Quản lý dịch vụ & giá" onPress={() => navigation.navigate('ServiceManagement')} />
            <MenuLink icon="camera-outline" label="Quản lý thiết bị" onPress={() => navigation.navigate('ManageEquipment')} />
            <MenuLink icon="calendar-outline" label="Tùy biến lịch của bạn" onPress={() => navigation.navigate('BookingCalendar')} />
            <ThemeSwitchLink />
            <MenuLink icon="pricetags-outline" label="Đề xuất Style / Concept mới" onPress={() => { setProposeForm({ name: '', description: '', keywords: '' }); setProposeModalVisible(true); }} />
            <MenuLink icon="shield-checkmark-outline" label="Xác minh danh tính" onPress={handleSubmitVerification} />
            <MenuLink icon="notifications-outline" label="Cài đặt thông báo" onPress={() => navigation.navigate('Notifications')} />
          </View>
        </Animated.View>
      </ScrollView>

      <Modal visible={editModalVisible} animationType="slide" transparent>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.modalWrapper}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Chỉnh sửa hồ sơ</Text>
              <Pressable onPress={() => setEditModalVisible(false)} style={styles.closeBtn}>
                <Ionicons name="close" size={24} color={colors.text} />
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
                <Ionicons name="close" size={24} color={colors.text} />
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

      <Modal visible={proposeModalVisible} animationType="slide" transparent>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.modalWrapper}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Đề xuất Tag mới</Text>
              <Pressable onPress={() => setProposeModalVisible(false)} style={styles.closeBtn}>
                <Ionicons name="close" size={24} color={colors.text} />
              </Pressable>
            </View>
            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.modalScroll}>
              <Text style={styles.inputLabel}>Loại đề xuất</Text>
              <View style={{ flexDirection: 'row', gap: 12, marginTop: 4, marginBottom: 10 }}>
                <Pressable
                  style={{
                    flex: 1,
                    backgroundColor: proposeType === 'style' ? colors.primary : colors.surface,
                    padding: 12,
                    borderRadius: 12,
                    alignItems: 'center',
                    borderWidth: 1,
                    borderColor: proposeType === 'style' ? colors.primary : colors.border,
                  }}
                  onPress={() => setProposeType('style')}
                >
                  <Text style={{ color: proposeType === 'style' ? colors.textInverse : colors.text, fontWeight: 'bold', fontSize: 13 }}>Style (Phong cách)</Text>
                </Pressable>
                <Pressable
                  style={{
                    flex: 1,
                    backgroundColor: proposeType === 'concept' ? colors.primary : colors.surface,
                    padding: 12,
                    borderRadius: 12,
                    alignItems: 'center',
                    borderWidth: 1,
                    borderColor: proposeType === 'concept' ? colors.primary : colors.border,
                  }}
                  onPress={() => setProposeType('concept')}
                >
                  <Text style={{ color: proposeType === 'concept' ? colors.textInverse : colors.text, fontWeight: 'bold', fontSize: 13 }}>Concept (Chủ đề)</Text>
                </Pressable>
              </View>

              <Text style={styles.inputLabel}>Tên phong cách/chủ đề</Text>
              <TextInput
                style={styles.inputField}
                value={proposeForm.name}
                onChangeText={(t) => setProposeForm(prev => ({ ...prev, name: t }))}
                placeholder="Ví dụ: Cyberpunk, Indie Film..."
                placeholderTextColor={colors.textMuted}
              />

              <Text style={styles.inputLabel}>Từ khóa liên quan (cách nhau bằng dấu phẩy)</Text>
              <TextInput
                style={styles.inputField}
                value={proposeForm.keywords}
                onChangeText={(t) => setProposeForm(prev => ({ ...prev, keywords: t }))}
                placeholder="Ví dụ: neon, tối, tương lai..."
                placeholderTextColor={colors.textMuted}
              />

              <Text style={styles.inputLabel}>Mô tả ngắn</Text>
              <TextInput
                style={[styles.inputField, styles.textArea]}
                value={proposeForm.description}
                onChangeText={(t) => setProposeForm(prev => ({ ...prev, description: t }))}
                placeholder="Mô tả phong cách hoặc concept này..."
                placeholderTextColor={colors.textMuted}
                multiline
              />

              <Pressable style={styles.saveBtn} onPress={handleProposeTag} disabled={proposing}>
                <LinearGradient colors={[colors.primary, '#E67E22']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.saveBtnGradient}>
                  {proposing ? (
                    <ActivityIndicator size="small" color={colors.textInverse} />
                  ) : (
                    <Text style={styles.saveBtnText}>Gửi đề xuất</Text>
                  )}
                </LinearGradient>
              </Pressable>
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
}

function ThemeSwitchLink() {
  const { isDark, toggleTheme, colors } = usePhotographerTheme();
  const styles = getStyles(colors, isDark);
  return (
    <View style={styles.menuLink}>
      <View style={styles.menuLinkLeft}>
        <View style={[styles.menuIconWrapper, { backgroundColor: isDark ? 'rgba(230, 126, 34, 0.15)' : 'rgba(230, 126, 34, 0.08)' }]}>
          <Ionicons name="sunny-outline" size={20} color={isDark ? '#E67E22' : colors.accent} />
        </View>
        <Text style={styles.menuLinkLabel}>Giao diện sáng / tối</Text>
      </View>
      <Switch
        value={isDark}
        onValueChange={toggleTheme}
        trackColor={{ false: 'rgba(0,0,0,0.1)', true: 'rgba(230, 126, 34, 0.4)' }}
        thumbColor={isDark ? '#E67E22' : 'rgba(0,0,0,0.2)'}
      />
    </View>
  );
}

function MenuLink({ icon, label, onPress }: any) {
  const { colors, isDark } = usePhotographerTheme();
  const styles = getStyles(colors, isDark);
  return (
    <Pressable style={({ pressed }) => [styles.menuLink, pressed && { opacity: 0.7 }]} onPress={onPress}>
      <View style={styles.menuLinkLeft}>
        <View style={styles.menuIconWrapper}>
          <Ionicons name={icon} size={20} color={colors.accent} />
        </View>
        <Text style={styles.menuLinkLabel}>{label}</Text>
      </View>
      <Ionicons name="chevron-forward" size={20} color={colors.textLight} />
    </Pressable>
  );
}

function PersonalInfoRow({ icon, label, value }: { icon: string; label: string; value: string }) {
  const { colors, isDark } = usePhotographerTheme();
  const styles = getStyles(colors, isDark);
  return (
    <View style={styles.personalRow}>
      <View style={styles.personalRowIcon}>
        <Ionicons name={icon as any} size={16} color={isDark ? '#F5DEB3' : colors.accent} />
      </View>
      <View style={styles.personalRowBody}>
        <Text style={styles.personalRowLabel}>{label}</Text>
        <Text style={styles.personalRowValue}>{value}</Text>
      </View>
    </View>
  );
}

function EquipmentRow({ equipment }: { equipment: any }) {
  const { colors, isDark } = usePhotographerTheme();
  const styles = getStyles(colors, isDark);
  let iconName = 'camera-outline';
  if (equipment.category === 'Lens') iconName = 'aperture-outline';
  else if (equipment.category === 'Lighting') iconName = 'flash-outline';
  else if (equipment.category === 'Drone') iconName = 'airplane-outline';
  else if (equipment.category === 'Other') iconName = 'cube-outline';

  const categoryColors: Record<string, string> = {
    Camera: '#cf4028',
    Lens: '#3498db',
    Lighting: '#f1c40f',
    Drone: '#2ecc71',
    Other: '#95a5a6',
  };
  const catColor = categoryColors[equipment.category] || '#95a5a6';

  return (
    <View style={styles.personalRow}>
      <View style={[styles.personalRowIcon, { backgroundColor: `${catColor}15` }]}>
        <Ionicons name={iconName as any} size={16} color={catColor} />
      </View>
      <View style={styles.personalRowBody}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
          <Text style={[styles.personalRowLabel, { color: catColor }]}>{equipment.category}</Text>
          {equipment.isPrimary && (
            <View style={{ backgroundColor: 'rgba(230, 126, 34, 0.15)', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4, borderWidth: 1, borderColor: 'rgba(230, 126, 34, 0.3)' }}>
              <Text style={{ fontSize: 8, color: '#E67E22', fontWeight: 'bold' }}>CHÍNH</Text>
            </View>
          )}
        </View>
        <Text style={styles.personalRowValue}>{equipment.name}</Text>
        {equipment.description ? (
          <Text style={{ color: colors.textMuted, fontSize: 11, marginTop: 2 }}>{equipment.description}</Text>
        ) : null}
      </View>
    </View>
  );
}

const getStyles = (colors: any, isDark: boolean) => StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.background },
  coverContainer: { width: '100%', aspectRatio: 16 / 9, maxHeight: 260, position: 'relative' },
  cover: { width: '100%', height: '100%', resizeMode: 'cover' },
  coverActionOverlay: { position: 'absolute', bottom: 72, right: 16, zIndex: 9999, elevation: 9999, flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: 'rgba(0,0,0,0.22)', paddingHorizontal: 14, paddingVertical: 10, borderRadius: 22 },
  coverActionText: { color: '#FFFBF0', fontSize: 13, fontWeight: '600' },
  topActions: { position: 'absolute', left: 16, right: 16, flexDirection: 'row', justifyContent: 'space-between', zIndex: 10 },
  iconBtn: { width: 44, height: 44, borderRadius: 22, backgroundColor: 'rgba(0,0,0,0.3)', justifyContent: 'center', alignItems: 'center' },
  profileHeader: { alignItems: 'center', marginTop: -60, paddingHorizontal: 24, zIndex: 5 },
  
  // Custom camera lens focus ring avatar styling
  avatarFocusContainer: {
    position: 'relative',
    padding: 8,
    borderRadius: 70,
    borderWidth: 1.5,
    borderColor: 'rgba(230, 126, 34, 0.35)',
    borderStyle: 'dashed',
    marginBottom: 12,
  },
  lensFocusMarkTop: {
    position: 'absolute',
    top: -2,
    left: '50%',
    marginLeft: -5,
    width: 10,
    height: 4,
    backgroundColor: colors.accent,
  },
  lensFocusMarkBottom: {
    position: 'absolute',
    bottom: -2,
    left: '50%',
    marginLeft: -5,
    width: 10,
    height: 4,
    backgroundColor: colors.accent,
  },
  lensFocusMarkLeft: {
    position: 'absolute',
    left: -2,
    top: '50%',
    marginTop: -5,
    width: 4,
    height: 10,
    backgroundColor: colors.accent,
  },
  lensFocusMarkRight: {
    position: 'absolute',
    right: -2,
    top: '50%',
    marginTop: -5,
    width: 4,
    height: 10,
    backgroundColor: colors.accent,
  },
  
  avatarWrapper: { position: 'relative' },
  avatar: { width: 110, height: 110, borderRadius: 55, borderWidth: 4, borderColor: colors.background },
  avatarEditBtn: { position: 'absolute', right: 2, bottom: 2, width: 32, height: 32, borderRadius: 16, backgroundColor: colors.accent, justifyContent: 'center', alignItems: 'center', borderWidth: 2, borderColor: colors.background },
  nameRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  name: { fontSize: 28, fontWeight: '800', color: colors.text, marginBottom: 8, letterSpacing: 0.5 },
  verifiedBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 10, paddingVertical: 5, borderRadius: 6, borderWidth: 1 },
  verifiedText: { fontSize: 10, fontWeight: '700', fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace' },
  verifyBtn: { marginBottom: 12, borderRadius: 14, overflow: 'hidden' },
  verifyBtnGradient: { paddingHorizontal: 16, paddingVertical: 10, alignItems: 'center', justifyContent: 'center' },
  verifyBtnText: { color: '#fff', fontWeight: '700' },
  badgeRow: { flexDirection: 'row', gap: 8, marginBottom: 20, flexWrap: 'wrap', justifyContent: 'center' },
  regionBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: colors.surfaceStrong, paddingHorizontal: 10, paddingVertical: 5, borderRadius: 6, borderWidth: 1, borderColor: colors.border },
  regionText: { color: colors.text, fontSize: 10, fontWeight: '700', fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace' },
  personalActions: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  personalInfoHidden: { flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: colors.surfaceStrong, borderRadius: 18, padding: 16, borderWidth: 1, borderColor: colors.border },
  personalInfoHiddenText: { color: colors.textMuted, fontSize: 13, fontWeight: '600' },
  ratingBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: isDark ? 'rgba(255, 215, 0, 0.1)' : 'rgba(212, 175, 55, 0.08)', paddingHorizontal: 10, paddingVertical: 5, borderRadius: 6, borderWidth: 1, borderColor: isDark ? 'rgba(255, 215, 0, 0.25)' : 'rgba(212, 175, 55, 0.2)' },
  ratingText: { color: isDark ? '#FFD700' : '#B4781A', fontSize: 10, fontWeight: '700', fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace' },
  quoteSection: { width: '100%', marginBottom: 6 },
  quoteSectionLabel: { color: colors.textMuted, fontSize: 12, fontWeight: '700', letterSpacing: 0.8, textTransform: 'uppercase', marginBottom: 10, alignSelf: 'flex-start' },
  
  // Custom watermarked aperture quote card styling
  quoteWrapper: {
    position: 'relative',
    paddingHorizontal: 20,
    paddingVertical: 18,
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    backgroundColor: isDark ? 'rgba(243, 192, 139, 0.04)' : 'rgba(230, 126, 34, 0.05)',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: 'hidden',
  },
  quoteWatermarkCircle: {
    position: 'absolute',
    width: 140,
    height: 140,
    borderRadius: 70,
    borderWidth: 1,
    borderColor: isDark ? 'rgba(255,255,255,0.025)' : 'rgba(0,0,0,0.02)',
    pointerEvents: 'none',
  },
  quoteMarkLeft: { position: 'absolute', top: 4, left: 12, fontSize: 36, fontWeight: 'bold', color: isDark ? '#F5DEB3' : colors.accent, opacity: 0.25 },
  quoteMarkRight: { position: 'absolute', bottom: -8, right: 12, fontSize: 36, fontWeight: 'bold', color: isDark ? '#F5DEB3' : colors.accent, opacity: 0.25 },
  quoteText: { fontSize: 16, fontStyle: 'italic', color: colors.text, textAlign: 'center', lineHeight: 24, fontFamily: Platform.OS === 'ios' ? 'Georgia' : 'serif', paddingHorizontal: 18, flexShrink: 1, width: '100%' },
  quoteEmptyState: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 16, paddingVertical: 14, borderRadius: 18, backgroundColor: colors.surfaceStrong, borderWidth: 1, borderColor: colors.border },
  quoteEmptyText: { flex: 1, color: colors.textMuted, fontSize: 14, lineHeight: 20 },
  content: { paddingHorizontal: 20, paddingTop: 10 },
  
  // Custom camera-spec themed stats cards row
  statsCardsRow: { flexDirection: 'row', gap: 10, marginBottom: 24 },
  statCardItem: {
    flex: 1,
    backgroundColor: colors.surfaceStrong,
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
    position: 'relative',
    overflow: 'hidden',
  },
  statCardLeftAccent: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: 3,
    backgroundColor: colors.accent,
  },
  statCardValue: {
    fontSize: 20,
    fontWeight: '800',
    color: colors.text,
    fontFamily: Platform.OS === 'ios' ? 'Courier-Bold' : 'monospace',
  },
  statCardSuffix: {
    fontSize: 10,
    color: colors.accent,
    fontWeight: '600',
  },
  statCardLabel: {
    fontSize: 8.5,
    color: colors.textMuted,
    marginTop: 6,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  section: { marginBottom: 32 },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  sectionTitle: { fontSize: 18, fontWeight: '800', color: colors.text, letterSpacing: 0.5 },
  seeAllBtn: { color: colors.accent, fontSize: 14, fontWeight: '600' },
  personalEditBtn: { width: 34, height: 34, borderRadius: 17, backgroundColor: 'rgba(243,192,139,0.12)', justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: 'rgba(243,192,139,0.12)' },
  
  // Minimalist cards with fine accent color top border
  bioContainer: {
    backgroundColor: colors.surfaceStrong,
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: colors.border,
    position: 'relative',
    overflow: 'hidden',
  },
  cardHeaderAccent: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 2.5,
    backgroundColor: colors.accent,
    opacity: 0.8,
  },
  bioText: { color: colors.textMuted, lineHeight: 24, fontSize: 15 },
  personalInfoCard: {
    backgroundColor: colors.surfaceStrong,
    borderRadius: 18,
    padding: 14,
    borderWidth: 1,
    borderColor: colors.border,
    gap: 10,
    position: 'relative',
    overflow: 'hidden',
  },
  personalRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 10 },
  personalRowIcon: { width: 26, height: 26, borderRadius: 8, backgroundColor: 'rgba(243,192,139,0.12)', justifyContent: 'center', alignItems: 'center', marginTop: 1 },
  personalRowBody: { flex: 1 },
  personalRowLabel: { color: colors.textLight, fontSize: 10, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.5 },
  personalRowValue: { color: colors.text, fontSize: 13, fontWeight: '600', lineHeight: 18, marginTop: 2 },
  portfolioStrip: { gap: 12, paddingBottom: 10 },
  portfolioSlideMount: {
    backgroundColor: isDark ? '#121118' : '#FAF7F2',
    borderWidth: 1,
    borderColor: isDark ? '#2E2A36' : '#E6E3DB',
    padding: 8,
    paddingBottom: 6,
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: isDark ? 0.3 : 0.05,
    shadowRadius: 8,
    elevation: 3,
  },
  
  // Custom sprocket holes to simulate 35mm photographic film slide frames
  sprocketHolesRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 8,
    height: 6,
    width: '100%',
    marginBottom: 4,
  },
  sprocketHole: {
    width: 8,
    height: 5,
    borderRadius: 1,
    backgroundColor: isDark ? '#2E2A36' : '#E6E3DB',
  },
  
  portfolioSlideInner: {
    aspectRatio: 3 / 4,
    borderRadius: 6,
    overflow: 'hidden',
    backgroundColor: '#000',
    width: 120,
  },
  portfolioSlideMeta: {
    marginTop: 6,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 2,
  },
  portfolioSlideText: {
    fontSize: 8,
    fontWeight: '800',
    color: colors.text,
    fontFamily: Platform.OS === 'ios' ? 'Courier-Bold' : 'monospace',
  },
  portfolioSlideSpec: {
    fontSize: 7.5,
    fontWeight: '700',
    color: colors.textMuted,
  },
  portfolioEmptyBox: {
    borderRadius: 12,
    borderStyle: 'dashed',
    borderWidth: 1,
    borderColor: 'rgba(230, 126, 34, 0.3)',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
    backgroundColor: 'rgba(230, 126, 34, 0.05)',
    padding: 24,
    width: '100%',
  },
  portfolioEmptyText: { color: colors.text, fontSize: 14, fontWeight: '600' },
  portfolioEmptySub: { color: colors.textMuted, fontSize: 12 },
  photoGrid: { alignItems: 'flex-start' },
  gridPhoto: { borderRadius: 12, backgroundColor: colors.surfaceStrong },
  
  // Contact Sheet Frame Index Badging
  gridPhotoIndexBadge: {
    position: 'absolute',
    bottom: 6,
    left: 6,
    backgroundColor: 'rgba(0,0,0,0.65)',
    paddingHorizontal: 4,
    paddingVertical: 1,
    borderRadius: 3,
  },
  gridPhotoIndexText: {
    color: '#FFD700',
    fontSize: 8,
    fontWeight: '800',
    fontFamily: Platform.OS === 'ios' ? 'Courier-Bold' : 'monospace',
  },
  
  addPhotoPlaceholder: { borderRadius: 12, borderStyle: 'dashed', borderWidth: 1, borderColor: 'rgba(230, 126, 34, 0.3)', justifyContent: 'center', alignItems: 'center', gap: 8, backgroundColor: 'rgba(230, 126, 34, 0.05)' },
  addPhotoText: { color: colors.accent, fontSize: 12, fontWeight: '600' },
  menu: { gap: 10, marginTop: 10 },
  reviewCard: { backgroundColor: colors.surfaceStrong, borderWidth: 1, borderColor: colors.border, borderRadius: 16, padding: 16, marginBottom: 12 },
  reviewAvatar: { width: 32, height: 32, borderRadius: 16, backgroundColor: colors.background, alignItems: 'center', justifyContent: 'center' },
  reviewAvatarImage: { width: 32, height: 32, borderRadius: 16 },
  reviewEmptyState: { flexDirection: 'row', alignItems: 'center', gap: 8, padding: 16, backgroundColor: colors.surfaceStrong, borderRadius: 12, borderWidth: 1, borderColor: colors.border },
  reviewEmptyText: { fontSize: 12, opacity: 0.5, color: colors.text },
  menuLink: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: isDark ? 'rgba(255, 255, 255, 0.02)' : 'rgba(0, 0, 0, 0.02)',
    padding: 14,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.border,
  },
  menuLinkLeft: { flexDirection: 'row', alignItems: 'center', gap: 16 },
  menuIconWrapper: { width: 36, height: 36, borderRadius: 10, backgroundColor: 'rgba(230, 126, 34, 0.08)', justifyContent: 'center', alignItems: 'center' },
  menuLinkLabel: { color: colors.text, fontSize: 15, fontWeight: '600' },
  modalWrapper: { flex: 1, justifyContent: 'flex-end', backgroundColor: colors.overlay },
  modalContent: { backgroundColor: colors.surfaceStrong, borderTopLeftRadius: 32, borderTopRightRadius: 32, maxHeight: '90%', paddingBottom: Platform.OS === 'ios' ? 20 : 0, borderWidth: 1, borderColor: colors.border },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 24, borderBottomWidth: 1, borderBottomColor: colors.border },
  modalTitle: { fontSize: 20, fontWeight: 'bold', color: colors.text },
  closeBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: colors.border, justifyContent: 'center', alignItems: 'center' },
  modalScroll: { padding: 24, gap: 20 },
  inputLabel: { color: colors.textMuted, fontSize: 14, fontWeight: '600', marginBottom: -10, marginLeft: 4 },
  inputField: { backgroundColor: colors.surface, borderRadius: 16, padding: 16, color: colors.text, fontSize: 16, borderWidth: 1, borderColor: colors.border },
  textArea: { minHeight: 120, textAlignVertical: 'top' },
  saveBtn: { marginTop: 10, marginBottom: 40, borderRadius: 16, overflow: 'hidden' },
  saveBtnGradient: { padding: 18, alignItems: 'center', justifyContent: 'center' },
  saveBtnText: { color: '#FFFBF0', fontSize: 16, fontWeight: 'bold', letterSpacing: 0.5 },
});
