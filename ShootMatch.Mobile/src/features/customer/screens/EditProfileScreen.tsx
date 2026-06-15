import React, { useCallback, useEffect, useState } from 'react';
import {
  ScrollView, StyleSheet, Text, View, TextInput, Pressable, Alert, Image, ActivityIndicator,
  Dimensions, Platform, KeyboardAvoidingView, useWindowDimensions
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import * as ImagePicker from 'expo-image-picker';
import * as ImageManipulator from 'expo-image-manipulator';
import { LinearGradient } from 'expo-linear-gradient';
import { colors } from '../../../app/theme/colors';
import { radius, spacing } from '../../../app/theme/spacing';
import { formatImageUrl } from '../../../shared/utils/formatImageUrl';
import { useAuth } from '../../auth/AuthContext';
import { getCustomerProfile, updateCustomerProfile, uploadCustomerProfileImage, uploadCustomerRollPreviewPhoto, type CustomerPhotoSlot, type CustomerProfile } from '../api';

const { width: W } = Dimensions.get('window');
const PAD = spacing[5];
const GAP = 12;
const COLLAGE_W = W - PAD * 2;
const LEFT_COL_W = Math.floor((COLLAGE_W - GAP) * 0.54);
const RIGHT_COL_W = Math.floor((COLLAGE_W - GAP) * 0.46);
const COLLAGE_H = 280;

const STYLE_DEFINITIONS = [
  { id: 'Portrait', name: 'Portrait', desc: 'Chụp chân dung tập trung vào biểu cảm khuôn mặt, thần thái và chiều sâu của đôi mắt.' },
  { id: 'Golden hour', name: 'Golden hour', desc: 'Tận dụng dải ánh sáng ấm áp, rực rỡ và thơ mộng lúc bình minh hoặc hoàng hôn.' },
  { id: 'Film look', name: 'Film look', desc: 'Tone màu hoài cổ đặc trưng của máy phim, hạt mịn hoài niệm đậm chất điện ảnh.' },
  { id: 'Lifestyle', name: 'Lifestyle', desc: 'Ghi lại những khoảnh khắc chân thực, tự nhiên và sống động của cuộc sống thường nhật.' },
  { id: 'Editorial', name: 'Editorial', desc: 'Phong cách thời trang cao cấp, tạo hình táo bạo mang đậm tính nghệ thuật tạp chí.' }
];

async function prepareImage(uri: string) {
  const result = await ImageManipulator.manipulateAsync(uri, [{ resize: { width: 1024 } }], {
    compress: 0.75,
    format: ImageManipulator.SaveFormat.JPEG,
  });
  return result.uri;
}

// Camera Viewfinder Brackets Overlay Component
function ViewfinderBrackets({ color = 'rgba(255, 247, 225, 0.45)', size = 10, thick = 1.5 }: { color?: string, size?: number, thick?: number }) {
  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      <View style={{ position: 'absolute', top: 8, left: 8, borderTopWidth: thick, borderLeftWidth: thick, width: size, height: size, borderColor: color }} />
      <View style={{ position: 'absolute', top: 8, right: 8, borderTopWidth: thick, borderRightWidth: thick, width: size, height: size, borderColor: color }} />
      <View style={{ position: 'absolute', bottom: 8, left: 8, borderBottomWidth: thick, borderLeftWidth: thick, width: size, height: size, borderColor: color }} />
      <View style={{ position: 'absolute', bottom: 8, right: 8, borderBottomWidth: thick, borderRightWidth: thick, width: size, height: size, borderColor: color }} />
    </View>
  );
}

export default function EditProfileScreen() {
  const navigation = useNavigation<any>();
  const { width: windowWidth } = useWindowDimensions();
  const RW = Platform.OS === 'web' ? Math.min(windowWidth, 800) : windowWidth;
  // scroll padding = 20*2, rollSectionContainer padding = 16*2
  const [containerWidth, setContainerWidth] = useState(RW - 40 - 32);
  const ROLL_SLOT_W = Math.floor((containerWidth - 8 * 3) / 4);
  const ROLL_SLOT_H = Math.round(ROLL_SLOT_W * 1.3);
  const COLLAGE_W_R = RW - spacing[5] * 2;
  const LEFT_COL_W_R = Math.floor((COLLAGE_W_R - GAP) * 0.54);
  const RIGHT_COL_W_R = Math.floor((COLLAGE_W_R - GAP) * 0.46);
  const { session } = useAuth();

  const [profile, setProfile] = useState<CustomerProfile | null>(null);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [region, setRegion] = useState('');
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState<CustomerPhotoSlot | null>(null);
  const [focusedField, setFocusedField] = useState<string | null>(null);

  const [rollPreviewEnabled, setRollPreviewEnabled] = useState(false);
  const [rollPreviewPhotos, setRollPreviewPhotos] = useState<string[]>([]);
  const [uploadingRollIndex, setUploadingRollIndex] = useState<number | null>(null);

  // Collapsible section states
  const [identityExpanded, setIdentityExpanded] = useState(true);
  const [rollExpanded, setRollExpanded] = useState(true);
  const [styleExpanded, setStyleExpanded] = useState(true);

  // Photography style preferences states
  const [selectedStyles, setSelectedStyles] = useState<string[]>([]);
  const [activeStyleId, setActiveStyleId] = useState<string | null>(null);

  useFocusEffect(useCallback(() => {
    let mounted = true;
    (async () => {
      try {
        const me = await getCustomerProfile();
        if (!mounted) return;
        setProfile(me);
        setName(me?.displayName ?? '');
        setEmail(me?.email ?? '');
        setRegion(me?.region ?? '');
        const photosStr = me?.rollPreviewPhotos ?? '';
        const photosList = photosStr.split(',').map(url => url.trim()).filter(Boolean);
        setRollPreviewPhotos(photosList);
        setRollPreviewEnabled(photosList.length > 0);

        // Load custom style preferences from API profile first, fallback to AsyncStorage/defaults
        const styleStr = me?.preferredStyles ?? '';
        if (styleStr) {
          const parsed = styleStr.split(',').map(s => s.trim()).filter(Boolean);
          setSelectedStyles(parsed);
          if (parsed.length > 0) {
            setActiveStyleId(parsed[0]);
          } else {
            setActiveStyleId(null);
          }
        } else if (session?.userId) {
          const stored = await AsyncStorage.getItem(`sm_customer_styles_${session.userId}`);
          if (stored) {
            try {
              const parsed = JSON.parse(stored);
              if (Array.isArray(parsed)) {
                setSelectedStyles(parsed);
                if (parsed.length > 0) {
                  setActiveStyleId(parsed[0]);
                } else {
                  setActiveStyleId(null);
                }
              }
            } catch {
              // fallback to default
              setSelectedStyles(['Portrait', 'Golden hour', 'Film look', 'Lifestyle', 'Editorial']);
              setActiveStyleId('Portrait');
            }
          } else {
            // default
            setSelectedStyles(['Portrait', 'Golden hour', 'Film look', 'Lifestyle', 'Editorial']);
            setActiveStyleId('Portrait');
          }
        }
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => { mounted = false; };
  }, [session]));

  async function handlePhotoPress(slot: CustomerPhotoSlot) {
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) {
      Alert.alert('Cần quyền truy cập', 'Cho phép truy cập thư viện ảnh để cập nhật hồ sơ.');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], allowsEditing: true, aspect: [1, 1], quality: 1 });
    if (result.canceled || !result.assets?.[0]) return;

    const asset = result.assets[0];
    setUploading(slot);
    try {
      const preparedUri = await prepareImage(asset.uri);
      const uploadedUrl = await uploadCustomerProfileImage(preparedUri, 'image/jpeg', slot);
      const patch =
        slot === 'avatar' ? { avatarUrl: uploadedUrl }
          : slot === 'cover' ? { coverPhotoUrl: uploadedUrl }
            : slot === 'highlight1' ? { highlightPhoto1Url: uploadedUrl }
              : slot === 'highlight2' ? { highlightPhoto2Url: uploadedUrl }
                : { highlightPhoto3Url: uploadedUrl };
      await updateCustomerProfile(patch);
      setProfile(prev => (prev ? { ...prev, ...patch } : prev));
    } catch {
      Alert.alert('Lỗi', 'Không thể cập nhật ảnh. Vui lòng thử lại.');
    } finally {
      setUploading(null);
    }
  }

  async function handleRollPhotoPress(index: number) {
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) {
      Alert.alert('Cần quyền truy cập', 'Cho phép truy cập thư viện ảnh để tải lên phim bản thảo.');
      return;
    }

    const isReplacing = index < rollPreviewPhotos.length;
    const maxSelectable = 8 - rollPreviewPhotos.length + (isReplacing ? 1 : 0);

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsMultipleSelection: true,
      selectionLimit: maxSelectable,
      quality: 0.8,
    });
    if (result.canceled || !result.assets || result.assets.length === 0) return;

    const assets = result.assets;
    setUploadingRollIndex(index);
    try {
      const uploadedUrls: string[] = [];
      for (let i = 0; i < assets.length; i++) {
        const slotIdx = index + i;
        if (slotIdx >= 8) break;
        setUploadingRollIndex(slotIdx);
        const asset = assets[i];
        const preparedUri = await prepareImage(asset.uri);
        const uploadedUrl = await uploadCustomerRollPreviewPhoto(preparedUri, 'image/jpeg');
        uploadedUrls.push(uploadedUrl);
      }

      setRollPreviewPhotos(prev => {
        const next = [...prev];
        let currIndex = index;
        for (const url of uploadedUrls) {
          if (currIndex < next.length) {
            next[currIndex] = url;
          } else if (next.length < 8) {
            next.push(url);
          }
          currIndex++;
        }
        return next;
      });
    } catch (err) {
      Alert.alert('Lỗi', 'Không thể tải ảnh lên. Vui lòng thử lại.');
    } finally {
      setUploadingRollIndex(null);
    }
  }

  function handleDeleteRollPhoto(index: number) {
    setRollPreviewPhotos(prev => {
      const next = prev.filter((_, idx) => idx !== index);
      return next;
    });
  }

  async function handleSave() {
    if (!name.trim()) { Alert.alert('Thiếu tên', 'Vui lòng nhập tên hiển thị.'); return; }

    // Custom Roll Preview Validation
    let rollPreviewPhotosPayload = '';
    if (rollPreviewEnabled) {
      if (rollPreviewPhotos.length < 4) {
        Alert.alert(
          'Thiếu hình ảnh',
          `Cuộn phim bản thảo cần tối thiểu 4 ảnh (hiện tại có ${rollPreviewPhotos.length} ảnh). Vui lòng tải thêm hoặc tắt tính năng này để tiếp tục.`
        );
        return;
      }
      rollPreviewPhotosPayload = rollPreviewPhotos.join(',');
    }

    setSaving(true);
    try {
      await updateCustomerProfile({
        displayName: name.trim(),
        email: email.trim(),
        region: region.trim(),
        rollPreviewPhotos: rollPreviewPhotosPayload,
        preferredStyles: selectedStyles.join(','),
      });

      // Save style preferences to AsyncStorage
      if (session?.userId) {
        await AsyncStorage.setItem(`sm_customer_styles_${session.userId}`, JSON.stringify(selectedStyles));
      }

      Alert.alert('✅ Đã lưu', 'Thông tin hồ sơ đã được cập nhật.');
      navigation.goBack();
    } catch {
      Alert.alert('Lỗi', 'Không thể lưu hồ sơ. Vui lòng thử lại.');
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.loadingBox}>
          <ActivityIndicator size="large" color="#ff4200" />
          <Text style={styles.loadingText}>Đang tải buồng tối…</Text>
        </View>
      </SafeAreaView>
    );
  }

  const avatarUri = formatImageUrl(profile?.avatarUrl);
  const coverUri = formatImageUrl(profile?.coverPhotoUrl);
  const highlight1Uri = formatImageUrl(profile?.highlightPhoto1Url);
  const highlight2Uri = formatImageUrl(profile?.highlightPhoto2Url);
  const highlight3Uri = formatImageUrl(profile?.highlightPhoto3Url);

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
        {/* --- VIEW-FINDER HEADER --- */}
        <Animated.View entering={FadeInUp.duration(600)} style={styles.header}>
          <Pressable style={styles.backBtn} onPress={() => navigation.goBack()}>
            <Ionicons name="chevron-back-outline" size={22} color={colors.dark} />
          </Pressable>
          <View style={styles.headerTitleWrap}>
            <Text style={styles.headerTitle}>EXHIBIT STUDIO // EDIT</Text>
            <Text style={styles.headerSubtitle}>RAW · ISO 100 · F/2.8 · [•] REC</Text>
          </View>
          <View style={styles.headerRight}>
            <View style={styles.redDot} />
          </View>
        </Animated.View>

        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
          {/* --- HERO VIEWFINDER SHUTTER BOX (Cover & Avatar) --- */}
          <Animated.View entering={FadeInDown.duration(600).delay(100)} style={styles.shutterBlock}>
            <View style={styles.coverCardWrap}>
              <Pressable style={styles.coverCard} onPress={() => handlePhotoPress('cover')}>
                {coverUri ? (
                  <Image source={{ uri: coverUri }} style={styles.coverImage} />
                ) : (
                  <View style={styles.coverPlaceholder}>
                    <Ionicons name="images-outline" size={24} color="rgba(26,26,15,0.3)" style={{ marginBottom: 4 }} />
                    <Text style={styles.coverPlaceholderText}>ADD COVER IMAGE</Text>
                  </View>
                )}
                <View style={styles.coverOverlay} />
                <View viewfinder-tag style={styles.viewfinderTagCover}>
                  <Text style={styles.viewfinderTagText}>WIDE SHUTTER // CROP 16:9</Text>
                </View>
                <View style={styles.coverEditButton}>
                  {uploading === 'cover' ? <ActivityIndicator size="small" color="#fff" /> : <Ionicons name="camera-outline" size={14} color="#fff" />}
                </View>
              </Pressable>

              {/* Circular Aperture Ring (Avatar) */}
              <View style={styles.avatarDock}>
                <Pressable style={styles.avatarWrap} onPress={() => handlePhotoPress('avatar')}>
                  {avatarUri ? (
                    <Image source={{ uri: avatarUri }} style={styles.avatarImage} />
                  ) : (
                    <View style={styles.avatarPlaceholderCircle}>
                      <Text style={styles.avatarLetter}>{name?.[0]?.toUpperCase() || 'U'}</Text>
                    </View>
                  )}
                  <View style={styles.avatarEditButton}>
                    {uploading === 'avatar' ? <ActivityIndicator size="small" color="#fff" /> : <Ionicons name="aperture" size={12} color="#fff" />}
                  </View>
                </Pressable>
              </View>
            </View>
          </Animated.View>

          {/* --- ASYMMETRIC EXHIBIT COLLAGE (3 Featured Photos) --- */}
          <View style={styles.sectionHeadingRow}>
            <Text style={styles.sectionEyebrow}>01 // PORTFOLIO EXHIBITS</Text>
            <Text style={styles.sectionSubtitleText}>Collage bất đối xứng · Trực quan nghệ thuật</Text>
          </View>

          <Animated.View entering={FadeInDown.duration(600).delay(200)} style={styles.collageContainer}>
            {/* Highlight 1 (Dominant Vertical Poster Format) */}
            <Pressable
              style={[styles.highlightTall, { width: LEFT_COL_W_R, height: COLLAGE_H }]}
              onPress={() => handlePhotoPress('highlight1')}
            >
              {highlight1Uri ? (
                <Image source={{ uri: highlight1Uri }} style={styles.collageImg} />
              ) : (
                <View style={styles.collagePlaceholder}>
                  <Ionicons name="add-circle-outline" size={24} color="#ff4200" style={{ marginBottom: 6 }} />
                  <Text style={styles.collagePlaceholderTitle}>ADD FRAME</Text>
                  <Text style={styles.collagePlaceholderSub}>Exhibit 01</Text>
                </View>
              )}
              <View style={styles.collageOverlay} />
              <ViewfinderBrackets />
              <View style={styles.collageMeta}>
                <Text style={styles.collageMetaTitle}>EXH_01 // FRONTISPIECE</Text>
                <Text style={styles.collageMetaHint}>Ảnh chính nổi bật</Text>
              </View>
              <View style={styles.collageEditBtn}>
                {uploading === 'highlight1' ? <ActivityIndicator size="small" color="#fff" /> : <Ionicons name="pencil-sharp" size={12} color="#fff" />}
              </View>
            </Pressable>

            {/* Right Column Stack (Highlight 2 & 3) */}
            <View style={{ width: RIGHT_COL_W_R, height: COLLAGE_H, justifyContent: 'space-between' }}>
              {/* Highlight 2 */}
              <Pressable
                style={[styles.highlightSmall, { height: (COLLAGE_H - GAP) / 2 }]}
                onPress={() => handlePhotoPress('highlight2')}
              >
                {highlight2Uri ? (
                  <Image source={{ uri: highlight2Uri }} style={styles.collageImg} />
                ) : (
                  <View style={styles.collagePlaceholderMini}>
                    <Ionicons name="add-outline" size={16} color="rgba(26,26,15,0.4)" />
                    <Text style={styles.collageMiniText}>EXH_02</Text>
                  </View>
                )}
                <View style={styles.collageOverlay} />
                <ViewfinderBrackets size={6} thick={1} />
                <View style={styles.collageMetaMini}>
                  <Text style={styles.collageMetaMiniTitle}>EXH_02 // SUB</Text>
                </View>
                <View style={styles.collageEditBtnMini}>
                  {uploading === 'highlight2' ? <ActivityIndicator size="small" color="#fff" /> : <Ionicons name="pencil" size={10} color="#fff" />}
                </View>
              </Pressable>

              {/* Highlight 3 */}
              <Pressable
                style={[styles.highlightSmall, { height: (COLLAGE_H - GAP) / 2 }]}
                onPress={() => handlePhotoPress('highlight3')}
              >
                {highlight3Uri ? (
                  <Image source={{ uri: highlight3Uri }} style={styles.collageImg} />
                ) : (
                  <View style={styles.collagePlaceholderMini}>
                    <Ionicons name="add-outline" size={16} color="rgba(26,26,15,0.4)" />
                    <Text style={styles.collageMiniText}>EXH_03</Text>
                  </View>
                )}
                <View style={styles.collageOverlay} />
                <ViewfinderBrackets size={6} thick={1} />
                <View style={styles.collageMetaMini}>
                  <Text style={styles.collageMetaMiniTitle}>EXH_03 // DETAIL</Text>
                </View>
                <View style={styles.collageEditBtnMini}>
                  {uploading === 'highlight3' ? <ActivityIndicator size="small" color="#fff" /> : <Ionicons name="pencil" size={10} color="#fff" />}
                </View>
              </Pressable>
            </View>
          </Animated.View>

          {/* --- TYPEWRITER MINIMALIST FORM (Section 2) --- */}
          <View style={[styles.sectionHeadingRow, { marginTop: spacing[6], flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }]}>
            <View style={{ flex: 1 }}>
              <Text style={styles.sectionEyebrow}>02 // THE IDENTITY</Text>
              <Text style={styles.sectionSubtitleText}>Nhập liệu tối giản gạch dưới · Phản hồi ánh sáng</Text>
            </View>
            <Pressable
              style={styles.toggleCollapseBtn}
              onPress={() => setIdentityExpanded(!identityExpanded)}
              hitSlop={10}
            >
              <Ionicons
                name={identityExpanded ? "chevron-up" : "chevron-down"}
                size={18}
                color={colors.accentOrange}
              />
            </Pressable>
          </View>

          {identityExpanded && (
            <Animated.View entering={FadeInDown.duration(400)} style={styles.formContainer}>
              {/* Display Name Input */}
              <View style={styles.inputGroup}>
                <View style={styles.labelRow}>
                  <Text style={styles.inputIndex}>[01]</Text>
                  <Text style={styles.inputLabel}>DISPLAY NAME // TÊN HIỂN THỊ</Text>
                </View>
                <TextInput
                  style={[
                    styles.minimalInput,
                    focusedField === 'name' && styles.minimalInputActive
                  ]}
                  value={name}
                  onChangeText={setName}
                  onFocus={() => setFocusedField('name')}
                  onBlur={() => setFocusedField(null)}
                  placeholder="Ví dụ: John Doe Artistry"
                  placeholderTextColor="rgba(26,26,15,0.25)"
                />
              </View>

              {/* Email Input */}
              <View style={styles.inputGroup}>
                <View style={styles.labelRow}>
                  <Text style={styles.inputIndex}>[02]</Text>
                  <Text style={styles.inputLabel}>EMAIL CONTACT // EMAIL LIÊN HỆ</Text>
                </View>
                <TextInput
                  style={[
                    styles.minimalInput,
                    focusedField === 'email' && styles.minimalInputActive
                  ]}
                  value={email}
                  onChangeText={setEmail}
                  onFocus={() => setFocusedField('email')}
                  onBlur={() => setFocusedField(null)}
                  placeholder="you@example.com"
                  placeholderTextColor="rgba(26,26,15,0.25)"
                  keyboardType="email-address"
                  autoCapitalize="none"
                />
              </View>

              {/* Region Input */}
              <View style={styles.inputGroup}>
                <View style={styles.labelRow}>
                  <Text style={styles.inputIndex}>[03]</Text>
                  <Text style={styles.inputLabel}>REGION AREA // KHU VỰC HOẠT ĐỘNG</Text>
                </View>
                <TextInput
                  style={[
                    styles.minimalInput,
                    focusedField === 'region' && styles.minimalInputActive
                  ]}
                  value={region}
                  onChangeText={setRegion}
                  onFocus={() => setFocusedField('region')}
                  onBlur={() => setFocusedField(null)}
                  placeholder="Ví dụ: TP. Hồ Chí Minh"
                  placeholderTextColor="rgba(26,26,15,0.25)"
                />
              </View>

              <View style={styles.darkroomNoticeCard}>
                <View style={styles.darkroomNoticeIconWrap}>
                  <Ionicons name="information-circle-outline" size={16} color="#ff4200" />
                </View>
                <Text style={styles.darkroomNoticeText}>
                  Tất cả ảnh đại diện, ảnh bìa và 3 tác phẩm nổi bật của bạn sẽ được đồng bộ ngay tức thì lên trang hồ sơ cá nhân.
                </Text>
              </View>
            </Animated.View>
          )}

          {/* --- CUSTOM ROLL PREVIEW SECTION (Section 3) --- */}
          <View style={[styles.sectionHeadingRow, { marginTop: spacing[6], flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }]}>
            <View style={{ flex: 1 }}>
              <Text style={styles.sectionEyebrow}>03 // CUSTOM ROLL PREVIEW</Text>
              <Text style={styles.sectionSubtitleText}>Kích hoạt cuộn phim bản thảo cá nhân từ 4 đến 8 ảnh</Text>
            </View>
            <Pressable
              style={styles.toggleCollapseBtn}
              onPress={() => setRollExpanded(!rollExpanded)}
              hitSlop={10}
            >
              <Ionicons
                name={rollExpanded ? "chevron-up" : "chevron-down"}
                size={18}
                color={colors.accentOrange}
              />
            </Pressable>
          </View>

          {rollExpanded && (
            <Animated.View entering={FadeInDown.duration(400)} style={styles.rollSectionContainer}>
              {/* Toggle Row */}
              <Pressable
                onPress={() => setRollPreviewEnabled(!rollPreviewEnabled)}
                style={styles.toggleRow}
              >
                <View style={{ flex: 1, paddingRight: 12 }}>
                  <Text style={styles.toggleLabel}>SỬ DỤNG PHIM BẢN THẢO RIÊNG</Text>
                  <Text style={styles.toggleDesc}>
                    Bật để tự tải lên từ 4 - 8 ảnh cuộn phim. Tắt để sử dụng bộ ảnh mặc định của ShootMatch.
                  </Text>
                </View>
                <View style={[
                  styles.customSwitch,
                  rollPreviewEnabled && styles.customSwitchActive
                ]}>
                  <View style={[
                    styles.customSwitchKnob,
                    rollPreviewEnabled && styles.customSwitchKnobActive
                  ]} />
                </View>
              </Pressable>

              {rollPreviewEnabled && (
                <Animated.View entering={FadeInDown.duration(400)} style={styles.rollGridContainer}>
                  <Text style={styles.gridInfoText}>
                    ĐÃ TẢI LÊN: <Text style={styles.gridInfoHighlight}>{rollPreviewPhotos.length}/8</Text> ẢNH {rollPreviewPhotos.length < 4 && <Text style={styles.gridInfoWarning}>(Cần thêm ít nhất {4 - rollPreviewPhotos.length} ảnh)</Text>}
                  </Text>

                  <View
                    style={styles.rollGrid}
                    onLayout={(e) => setContainerWidth(e.nativeEvent.layout.width)}
                  >
                    {Array.from({ length: 8 }).map((_, i) => {
                      const hasPhoto = i < rollPreviewPhotos.length;
                      const isNextToUpload = i === rollPreviewPhotos.length;
                      const isUploading = uploadingRollIndex === i;
                      const photoUrl = hasPhoto ? formatImageUrl(rollPreviewPhotos[i]) : null;

                      if (hasPhoto) {
                        return (
                          <View key={i} style={[styles.rollSlot, { width: ROLL_SLOT_W }]}>
                            <Pressable style={[styles.rollSlotInner, { height: ROLL_SLOT_H }]} onPress={() => handleRollPhotoPress(i)}>
                              <Image source={{ uri: photoUrl! }} style={styles.rollSlotImage} />
                              <View style={styles.rollSlotOverlay} />
                              <ViewfinderBrackets size={6} thick={1} />
                              <Text style={styles.rollSlotFrameNo}>{String(i + 1).padStart(2, '0')}</Text>
                            </Pressable>

                            {/* Delete Button */}
                            <Pressable
                              style={styles.rollSlotDeleteBtn}
                              onPress={() => handleDeleteRollPhoto(i)}
                              hitSlop={8}
                            >
                              <Ionicons name="close" size={10} color="#fff" />
                            </Pressable>
                          </View>
                        );
                      }

                      if (isNextToUpload) {
                        return (
                          <View key={i} style={[styles.rollSlot, { width: ROLL_SLOT_W }]}>
                            <Pressable
                              style={[styles.rollSlotInner, styles.rollSlotEmpty, { height: ROLL_SLOT_H }]}
                              onPress={() => handleRollPhotoPress(i)}
                              disabled={isUploading}
                            >
                              {isUploading ? (
                                <ActivityIndicator size="small" color="#ff4200" />
                              ) : (
                                <>
                                  <Ionicons name="camera-outline" size={16} color="rgba(26,26,15,0.4)" />
                                  <Text style={styles.rollSlotAddText}>UPLOAD</Text>
                                </>
                              )}
                              <Text style={styles.rollSlotFrameNo}>{String(i + 1).padStart(2, '0')}</Text>
                            </Pressable>
                          </View>
                        );
                      }

                      // Locked slot
                      return (
                        <View key={i} style={[styles.rollSlot, { width: ROLL_SLOT_W }]}>
                          <View style={[styles.rollSlotInner, styles.rollSlotLocked, { height: ROLL_SLOT_H }]}>
                            <Ionicons name="lock-closed-outline" size={14} color="rgba(26,26,15,0.15)" />
                            <Text style={styles.rollSlotFrameNo}>{String(i + 1).padStart(2, '0')}</Text>
                          </View>
                        </View>
                      );
                    })}
                  </View>
                </Animated.View>
              )}
            </Animated.View>
          )}

          {/* --- PHOTOGRAPHY STYLE PREFERENCES (Section 4) --- */}
          <View style={[styles.sectionHeadingRow, { marginTop: spacing[6], flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }]}>
            <View style={{ flex: 1 }}>
              <Text style={styles.sectionEyebrow}>04 // MY STYLE PREFERENCES</Text>
              <Text style={styles.sectionSubtitleText}>Lựa chọn gu ảnh nghệ thuật đặc trưng của bạn</Text>
            </View>
            <Pressable
              style={styles.toggleCollapseBtn}
              onPress={() => setStyleExpanded(!styleExpanded)}
              hitSlop={10}
            >
              <Ionicons
                name={styleExpanded ? "chevron-up" : "chevron-down"}
                size={18}
                color={colors.accentOrange}
              />
            </Pressable>
          </View>

          {styleExpanded && (
            <Animated.View entering={FadeInDown.duration(400)} style={styles.styleSectionContainer}>
              <Text style={styles.styleHintText}>
                Chọn các phong cách chụp ảnh bạn mong muốn để hiển thị trên profile (chạm để chọn/bỏ chọn, chạm để xem giải thích):
              </Text>

              <View style={styles.stylePillsGrid}>
                {STYLE_DEFINITIONS.map(item => {
                  const isSelected = selectedStyles.includes(item.id);
                  const isActiveDesc = activeStyleId === item.id;
                  return (
                    <Pressable
                      key={item.id}
                      onPress={() => {
                        setSelectedStyles(prev =>
                          prev.includes(item.id)
                            ? prev.filter(x => x !== item.id)
                            : [...prev, item.id]
                        );
                        setActiveStyleId(item.id);
                      }}
                      style={[
                        styles.editorStylePill,
                        isSelected && styles.editorStylePillSelected,
                        isActiveDesc && styles.editorStylePillActiveDesc
                      ]}
                    >
                      <Ionicons
                        name={isSelected ? "aperture" : "aperture-outline"}
                        size={12}
                        color={isSelected ? "#fff7e1" : colors.accentOrange}
                      />
                      <Text style={[
                        styles.editorStylePillText,
                        isSelected && styles.editorStylePillTextSelected
                      ]}>
                        {item.name}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>

              {activeStyleId && (
                <View style={styles.descriptionCard}>
                  <View style={styles.descriptionTitleRow}>
                    <Ionicons name="sparkles" size={12} color="#ff4200" style={{ marginRight: 4 }} />
                    <Text style={styles.descriptionTitle}>
                      PHONG CÁCH // {activeStyleId.toUpperCase()}
                    </Text>
                  </View>
                  <Text style={styles.descriptionText}>
                    {STYLE_DEFINITIONS.find(x => x.id === activeStyleId)?.desc}
                  </Text>
                </View>
              )}
            </Animated.View>
          )}

          {/* --- SHUTTER BUTTON (CTA Save) --- */}
          <Animated.View entering={FadeInDown.duration(600).delay(400)} style={styles.ctaWrapper}>
            <Pressable
              onPress={handleSave}
              disabled={saving}
              style={({ pressed }) => [
                styles.shutterBtn,
                pressed && { transform: [{ scale: 0.97 }] }
              ]}
            >
              <LinearGradient
                colors={['#1a1a0f', '#33331f']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.shutterGradient}
              >
                {saving ? (
                  <ActivityIndicator size="small" color="#fff7e1" />
                ) : (
                  <>
                    <Ionicons name="aperture" size={18} color="#fff7e1" style={{ marginRight: 8 }} />
                    <Text style={styles.shutterText}>COMMIT CHANGES // SHUTTER SAVE</Text>
                  </>
                )}
              </LinearGradient>
            </Pressable>
            <Text style={styles.footerTag}>SHOOTMATCH STUDIO · CREATIVE SUITE v2.0</Text>
          </Animated.View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#fff7e1' },
  loadingBox: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#fff7e1' },
  loadingText: { marginTop: 12, fontSize: 13, color: '#1a1a0f', letterSpacing: 1.5, fontFamily: Platform.OS === 'ios' ? 'Georgia' : 'serif', fontStyle: 'italic' },

  // --- HEADER VIEW-FINDER ---
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing[4],
    paddingVertical: spacing[3],
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(26,26,15,0.08)',
    backgroundColor: '#fff7e1',
  },
  backBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    borderWidth: 1,
    borderColor: 'rgba(26,26,15,0.12)',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(26,26,15,0.02)',
  },
  headerTitleWrap: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 13,
    fontWeight: '900',
    color: '#1a1a0f',
    letterSpacing: 1,
  },
  headerSubtitle: {
    fontSize: 9,
    color: '#6b6b50',
    fontFamily: Platform.OS === 'ios' ? 'Courier New' : 'monospace',
    marginTop: 2,
  },
  headerRight: {
    width: 38,
    alignItems: 'flex-end',
    justifyContent: 'center',
  },
  redDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#ff4200',
  },

  // --- SCROLL CONTENT ---
  scroll: {
    padding: PAD,
    paddingBottom: spacing[12],
  },

  // --- HERO VIEWFINDER SHUTTER BLOCK (Cover & Avatar) ---
  shutterBlock: {
    marginBottom: spacing[4],
  },
  coverCardWrap: {
    position: 'relative',
    paddingBottom: 28,
  },
  coverCard: {
    height: 160,
    borderRadius: 16,
    overflow: 'hidden',
    backgroundColor: '#1a1a0f',
    borderWidth: 1,
    borderColor: 'rgba(26,26,15,0.15)',
  },
  coverImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  coverPlaceholder: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(26,26,15,0.04)',
    borderStyle: 'dashed',
    borderWidth: 1,
    borderColor: 'rgba(26,26,15,0.18)',
    borderRadius: 16,
  },
  coverPlaceholderText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#6b6b50',
    letterSpacing: 1,
  },
  coverOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(10,10,6,0.15)',
  },
  viewfinderTagCover: {
    position: 'absolute',
    left: 12,
    top: 12,
    backgroundColor: 'rgba(10,10,6,0.5)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  viewfinderTagText: {
    color: '#fff7e1',
    fontSize: 7,
    fontWeight: '900',
    fontFamily: Platform.OS === 'ios' ? 'Courier New' : 'monospace',
    letterSpacing: 0.5,
  },
  coverEditButton: {
    position: 'absolute',
    bottom: 12,
    right: 12,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#ff4200',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#fff7e1',
  },

  // Avatar circular ring
  avatarDock: {
    position: 'absolute',
    left: 20,
    bottom: 0,
    width: 82,
    height: 82,
    borderRadius: 41,
    backgroundColor: '#fff7e1',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#1a1a0f',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 6,
    elevation: 4,
  },
  avatarWrap: {
    width: 74,
    height: 74,
    borderRadius: 37,
    overflow: 'hidden',
    backgroundColor: '#1a1a0f',
    borderWidth: 2,
    borderColor: '#ff4200',
    position: 'relative',
  },
  avatarImage: {
    width: '100%',
    height: '100%',
  },
  avatarPlaceholderCircle: {
    flex: 1,
    backgroundColor: '#1a1a0f',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarLetter: {
    fontSize: 24,
    fontWeight: '900',
    color: '#fff7e1',
  },
  avatarEditButton: {
    position: 'absolute',
    right: 0,
    bottom: 0,
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: '#ff4200',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: '#fff7e1',
  },

  // --- SECTION HEADINGS ---
  sectionHeadingRow: {
    flexDirection: 'column',
    marginBottom: spacing[3],
    paddingLeft: 2,
  },
  sectionEyebrow: {
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 2,
    color: '#ff4200',
  },
  sectionSubtitleText: {
    fontSize: 11,
    color: '#6b6b50',
    fontStyle: 'italic',
    marginTop: 2,
    fontFamily: Platform.OS === 'ios' ? 'Georgia' : 'serif',
  },

  // --- ASYMMETRIC EXHIBIT COLLAGE ---
  collageContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    marginBottom: spacing[4],
  },
  highlightTall: {
    borderRadius: 14,
    overflow: 'hidden',
    backgroundColor: '#1a1a0f',
    borderWidth: 1,
    borderColor: 'rgba(26,26,15,0.15)',
    position: 'relative',
  },
  highlightSmall: {
    borderRadius: 10,
    overflow: 'hidden',
    backgroundColor: '#1a1a0f',
    borderWidth: 1,
    borderColor: 'rgba(26,26,15,0.15)',
    position: 'relative',
  },
  collageImg: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  collageOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(10,10,6,0.22)',
  },
  collagePlaceholder: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    borderStyle: 'dashed',
    borderWidth: 1.5,
    borderColor: 'rgba(26,26,15,0.15)',
    backgroundColor: 'rgba(26,26,15,0.03)',
    borderRadius: 14,
  },
  collagePlaceholderTitle: {
    fontSize: 10,
    fontWeight: '900',
    color: '#1a1a0f',
    letterSpacing: 0.8,
  },
  collagePlaceholderSub: {
    fontSize: 8,
    color: '#6b6b50',
    fontFamily: Platform.OS === 'ios' ? 'Courier New' : 'monospace',
    marginTop: 2,
  },
  collagePlaceholderMini: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    borderStyle: 'dashed',
    borderWidth: 1,
    borderColor: 'rgba(26,26,15,0.12)',
    backgroundColor: 'rgba(26,26,15,0.02)',
    borderRadius: 10,
  },
  collageMiniText: {
    fontSize: 8,
    fontWeight: '800',
    color: '#6b6b50',
    letterSpacing: 0.5,
  },
  collageMeta: {
    position: 'absolute',
    left: 12,
    bottom: 12,
    right: 36,
  },
  collageMetaTitle: {
    color: '#fff7e1',
    fontSize: 9,
    fontWeight: '900',
    letterSpacing: 0.8,
  },
  collageMetaHint: {
    color: 'rgba(255, 247, 225, 0.7)',
    fontSize: 8,
    marginTop: 2,
  },
  collageMetaMini: {
    position: 'absolute',
    left: 8,
    bottom: 8,
  },
  collageMetaMiniTitle: {
    color: '#fff7e1',
    fontSize: 7,
    fontWeight: '900',
    letterSpacing: 0.5,
    fontFamily: Platform.OS === 'ios' ? 'Courier New' : 'monospace',
  },
  collageEditBtn: {
    position: 'absolute',
    bottom: 10,
    right: 10,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#ff4200',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: '#fff7e1',
  },
  collageEditBtnMini: {
    position: 'absolute',
    bottom: 6,
    right: 6,
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: '#ff4200',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#fff7e1',
  },

  // --- TYPEWRITER FORM ---
  formContainer: {
    backgroundColor: 'rgba(26,26,15,0.02)',
    borderRadius: 20,
    padding: spacing[4],
    borderWidth: 1,
    borderColor: 'rgba(26,26,15,0.06)',
    gap: spacing[4],
  },
  inputGroup: {
    gap: 4,
  },
  labelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  inputIndex: {
    fontFamily: Platform.OS === 'ios' ? 'Courier New' : 'monospace',
    fontSize: 9,
    color: '#ff4200',
    fontWeight: '700',
  },
  inputLabel: {
    fontSize: 10,
    fontWeight: '800',
    color: '#6b6b50',
    letterSpacing: 0.8,
  },
  minimalInput: {
    borderBottomWidth: 1.5,
    borderBottomColor: 'rgba(26,26,15,0.12)',
    paddingVertical: spacing[2],
    paddingHorizontal: 2,
    color: '#1a1a0f',
    fontSize: 14,
    fontWeight: '600',
  },
  minimalInputActive: {
    borderBottomColor: '#ff4200',
  },
  darkroomNoticeCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: 'rgba(255, 66, 0, 0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255, 66, 0, 0.12)',
    borderRadius: 12,
    padding: 12,
    marginTop: 4,
    gap: 8,
  },
  darkroomNoticeIconWrap: {
    marginTop: 1,
  },
  darkroomNoticeText: {
    flex: 1,
    color: '#6b6b50',
    fontSize: 11,
    lineHeight: 16,
    fontStyle: 'italic',
    fontFamily: Platform.OS === 'ios' ? 'Georgia' : 'serif',
  },

  // --- CTA & SHUTTER SAVE ---
  ctaWrapper: {
    marginTop: spacing[7],
    alignItems: 'center',
    gap: spacing[4],
  },
  shutterBtn: {
    width: '100%',
    height: 52,
    borderRadius: 26,
    overflow: 'hidden',
    shadowColor: '#1a1a0f',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.18,
    shadowRadius: 10,
    elevation: 6,
  },
  shutterGradient: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  shutterText: {
    color: '#fff7e1',
    fontSize: 13,
    fontWeight: '900',
    letterSpacing: 1.5,
  },
  footerTag: {
    fontSize: 8,
    color: '#9b9b7a',
    letterSpacing: 2,
    fontWeight: '700',
  },
  rollSectionContainer: {
    backgroundColor: 'rgba(26,26,15,0.02)',
    borderRadius: 20,
    padding: spacing[4],
    borderWidth: 1,
    borderColor: 'rgba(26,26,15,0.06)',
    gap: spacing[4],
    marginTop: spacing[2],
  },
  toggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  toggleLabel: {
    fontSize: 11,
    fontWeight: '900',
    color: '#1a1a0f',
    letterSpacing: 0.8,
  },
  toggleDesc: {
    fontSize: 9.5,
    color: '#6b6b50',
    lineHeight: 14,
    marginTop: 2,
  },
  customSwitch: {
    width: 44,
    height: 24,
    borderRadius: 12,
    backgroundColor: 'rgba(26,26,15,0.1)',
    padding: 2,
    justifyContent: 'center',
  },
  customSwitchActive: {
    backgroundColor: '#ff4200',
  },
  customSwitchKnob: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#fff7e1',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 2,
  },
  customSwitchKnobActive: {
    transform: [{ translateX: 20 }],
  },
  rollGridContainer: {
    borderTopWidth: 1,
    borderTopColor: 'rgba(26,26,15,0.06)',
    paddingTop: spacing[4],
    gap: spacing[3],
  },
  gridInfoText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#6b6b50',
    letterSpacing: 0.5,
  },
  gridInfoHighlight: {
    color: '#ff4200',
    fontWeight: '900',
  },
  gridInfoWarning: {
    color: '#ff4200',
    fontStyle: 'italic',
    fontWeight: '500',
  },
  rollGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    justifyContent: 'flex-start',
  },
  rollSlot: {
    position: 'relative',
    marginBottom: 4,
  },
  rollSlotInner: {
    width: '100%',
    borderRadius: 8,
    overflow: 'hidden',
    backgroundColor: '#1a1a0f',
    borderWidth: 1,
    borderColor: 'rgba(26,26,15,0.12)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  rollSlotImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  rollSlotOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(10,10,6,0.15)',
  },
  rollSlotFrameNo: {
    position: 'absolute',
    bottom: 4,
    right: 4,
    fontSize: 7.5,
    fontWeight: 'bold',
    color: 'rgba(255,247,225,0.7)',
    fontFamily: Platform.OS === 'ios' ? 'Courier New' : 'monospace',
  },
  rollSlotEmpty: {
    borderStyle: 'dashed',
    borderWidth: 1.2,
    borderColor: 'rgba(26,26,15,0.22)',
    backgroundColor: 'rgba(26,26,15,0.02)',
    gap: 4,
  },
  rollSlotAddText: {
    fontSize: 8,
    fontWeight: '900',
    color: '#6b6b50',
    letterSpacing: 0.5,
  },
  rollSlotLocked: {
    backgroundColor: 'rgba(26,26,15,0.03)',
    borderColor: 'rgba(26,26,15,0.05)',
  },
  rollSlotDeleteBtn: {
    position: 'absolute',
    top: -4,
    right: -4,
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: 'rgba(26,26,15,0.85)',
    borderWidth: 1,
    borderColor: '#fff7e1',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10,
    elevation: 3,
  },
  toggleCollapseBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(26,26,15,0.08)',
    backgroundColor: 'rgba(26,26,15,0.02)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  styleSectionContainer: {
    backgroundColor: 'rgba(26,26,15,0.02)',
    borderRadius: 20,
    padding: spacing[4],
    borderWidth: 1,
    borderColor: 'rgba(26,26,15,0.06)',
    gap: spacing[3],
    marginTop: spacing[2],
  },
  styleHintText: {
    fontSize: 10,
    color: '#6b6b50',
    lineHeight: 14,
    fontStyle: 'italic',
    fontFamily: Platform.OS === 'ios' ? 'Georgia' : 'serif',
  },
  stylePillsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 4,
  },
  editorStylePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: 'rgba(26,26,15,0.04)',
    borderWidth: 1,
    borderColor: 'transparent',
  },
  editorStylePillSelected: {
    backgroundColor: '#1a1a0f',
  },
  editorStylePillActiveDesc: {
    borderColor: '#ff4200',
  },
  editorStylePillText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#1a1a0f',
  },
  editorStylePillTextSelected: {
    color: '#fff7e1',
  },
  descriptionCard: {
    backgroundColor: '#1a1a0f',
    borderRadius: 12,
    padding: 12,
    marginTop: 8,
    borderWidth: 1,
    borderColor: 'rgba(255,247,225,0.1)',
  },
  descriptionTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  descriptionTitle: {
    fontSize: 9,
    fontWeight: '900',
    color: '#ff4200',
    letterSpacing: 1,
  },
  descriptionText: {
    fontSize: 11,
    color: '#fff7e1',
    lineHeight: 16,
    opacity: 0.85,
  },
});
