import React, { useCallback, useMemo, useState } from 'react';
import {
  ScrollView,
  StyleSheet,
  Text,
  View,
  Pressable,
  Alert,
  Image,
  ImageBackground,
  ActivityIndicator,
  RefreshControl,
  Dimensions,
  Platform,
  useWindowDimensions,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as ImagePicker from 'expo-image-picker';
import * as ImageManipulator from 'expo-image-manipulator';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { useAuth } from '../../auth/AuthContext';
import { colors } from '../../../app/theme/colors';
import { fontSizes, fontWeights } from '../../../app/theme/typography';
import { radius, spacing } from '../../../app/theme/spacing';
import { formatImageUrl } from '../../../shared/utils/formatImageUrl';
import { localPictureSlice } from '../../../shared/assets/localPictures';
import {
  getCustomerProfile,
  getMyBookings,
  updateCustomerProfile,
  uploadCustomerProfileImage,
  getActiveStylesAndConceptsForLookbook,
  type CustomerPhotoSlot,
  type CustomerProfile,
} from '../api';

const DEFAULT_STYLE_TAGS = ['Portrait', 'Golden hour', 'Film look', 'Lifestyle', 'Editorial'];

const LOCATION_MAPPING: Record<string, string> = {
  cafe: 'Quán Cafe',
  studio: 'Studio',
  home: 'Tại nhà',
  museum: 'Bảo tàng',
  park: 'Công viên',
  urban: 'Đường phố/Urban',
  beach: 'Bãi biển',
  rooftop: 'Sân thượng',
  landmark: 'Landmark/Cầu',
  historical: 'Di tích/Phố cổ',
  abandoned: 'Nhà hoang',
  westlake: 'Hồ Tây/Sunset',
};

const COLOR_MAPPING: Record<string, string> = {
  warm: 'Tone Ấm',
  cool: 'Tone Lạnh',
  bright: 'Pastel Tone',
  mono: 'Đen Trắng',
  earthy: 'Tone Đất',
  cyber: 'Neon Cyber',
};

const THEME = {
  primary: '#fff7e1',
  accent: '#1a1a0f',
  orange: '#ff4200',
  danger: '#ef4444',
};

async function prepareImage(uri: string) {
  const actions = [{ resize: { width: 1024 } }];

  const result = await ImageManipulator.manipulateAsync(uri, actions, {
    compress: 0.75,
    format: ImageManipulator.SaveFormat.JPEG,
  });

  return result.uri;
}

function displayOptional(s?: string | null) {
  const t = s?.trim();
  return t && t.length > 0 ? t : null;
}

function ViewfinderFrame() {
  const c = 22;
  const t = 2;
  const color = 'rgba(255,247,225,0.55)';
  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      <View style={[vf.corner, { top: 12, left: 12, borderTopWidth: t, borderLeftWidth: t, width: c, height: c, borderColor: color }]} />
      <View style={[vf.corner, { top: 12, right: 12, borderTopWidth: t, borderRightWidth: t, width: c, height: c, borderColor: color }]} />
      <View style={[vf.corner, { bottom: 12, left: 12, borderBottomWidth: t, borderLeftWidth: t, width: c, height: c, borderColor: color }]} />
      <View style={[vf.corner, { bottom: 12, right: 12, borderBottomWidth: t, borderRightWidth: t, width: c, height: c, borderColor: color }]} />
    </View>
  );
}

const vf = StyleSheet.create({ corner: { position: 'absolute' } });

function HeroPolaroid({
  imageUri,
  fallbackLetter,
  localSource,
  rotation,
  onPress,
  saving,
  width,
}: {
  imageUri?: string;
  fallbackLetter?: string;
  localSource?: ReturnType<typeof localPictureSlice>[number];
  rotation: string;
  onPress?: () => void;
  saving?: boolean;
  width: number;
}) {
  const polaroidImgW = width - spacing[2] * 2;
  const polaroidImgH = Math.round(polaroidImgW * 1.18);

  return (
    <Pressable
      onPress={onPress}
      disabled={saving}
      style={({ pressed }) => [
        styles.heroPolaroid,
        { width: width, transform: [{ rotate: rotation }] },
        pressed && { opacity: 0.85 }
      ]}
    >
      {saving ? (
        <View style={[styles.heroPolaroidFallback, { width: polaroidImgW, height: polaroidImgH }]}>
          <ActivityIndicator size="small" color={colors.accentOrange} />
        </View>
      ) : imageUri ? (
        <Image source={{ uri: imageUri }} style={[styles.heroPolaroidImg, { width: polaroidImgW, height: polaroidImgH }]} />
      ) : localSource ? (
        <Image source={localSource} style={[styles.heroPolaroidImg, { width: polaroidImgW, height: polaroidImgH }]} resizeMode="cover" />
      ) : (
        <View style={[styles.heroPolaroidFallback, { width: polaroidImgW, height: polaroidImgH }]}>
          <Text style={styles.heroPolaroidLetter}>{fallbackLetter ?? '+'}</Text>
        </View>
      )}
    </Pressable>
  );
}

function ArchiveTile({
  title,
  caption,
  count,
  images,
  tall,
  dark,
  onPress,
  width,
  height,
}: {
  title: string;
  caption: string;
  count?: number;
  images: ReturnType<typeof localPictureSlice>;
  tall?: boolean;
  dark?: boolean;
  onPress: () => void;
  width: any;
  height: number;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.archiveTile,
        { width: width, height: height },
        pressed && { opacity: 0.94, transform: [{ scale: 0.985 }] },
      ]}
    >
      {images.length >= 2 ? (
        <View style={styles.archiveSplit}>
          <Image source={images[0]} style={styles.archiveHalf} resizeMode="cover" />
          <Image source={images[1]} style={styles.archiveHalf} resizeMode="cover" />
        </View>
      ) : (
        <ImageBackground source={images[0]} style={StyleSheet.absoluteFill} resizeMode="cover">
          <View style={StyleSheet.absoluteFill} />
        </ImageBackground>
      )}
      <LinearGradient
        colors={dark ? ['transparent', 'rgba(10,10,6,0.92)'] : ['transparent', 'rgba(26,26,15,0.88)']}
        style={StyleSheet.absoluteFill}
      />
      {count !== undefined && count > 0 ? (
        <View style={styles.countBadge}>
          <Text style={styles.countBadgeText}>{count}</Text>
        </View>
      ) : null}
      <View style={styles.archiveCopy}>
        <Text style={styles.archiveTitle}>{title}</Text>
        <Text style={styles.archiveCaption} numberOfLines={2}>{caption}</Text>
        <View style={styles.archiveArrow}>
          <Ionicons name="arrow-forward" size={14} color="#fff7e1" />
        </View>
      </View>
    </Pressable>
  );
}

export default function ProfileScreen() {
  const navigation = useNavigation<any>();
  const insets = useSafeAreaInsets();
  const { logout, session, initializing, updateMembershipTier } = useAuth();

  const { width: windowWidth } = useWindowDimensions();
  const W = Platform.OS === 'web' ? Math.min(windowWidth, 800) : windowWidth;
  const PAD = spacing[5];
  const GAP = spacing[3];
  const COL = (W - PAD * 2 - GAP) / 2;
  const POLAROID_W = Math.floor((W - PAD * 2 - spacing[3] * 2) / 3);

  const [profile, setProfile] = useState<CustomerProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [completedShoots, setCompletedShoots] = useState(0);
  const [savingImage, setSavingImage] = useState<CustomerPhotoSlot | null>(null);
  const [editLoading, setEditLoading] = useState(false);
  const [styleTags, setStyleTags] = useState<string[]>(DEFAULT_STYLE_TAGS);
  const [isBasicInfoExpanded, setIsBasicInfoExpanded] = useState(true);
  const [lookbookData, setLookbookData] = useState<any>(null);

  const filmStrip = useMemo(() => localPictureSlice(2, 6), []);
  const favImages = useMemo(() => localPictureSlice(8, 2), []);
  const shootImages = useMemo(() => localPictureSlice(14, 2), []);
  const sharedImages = useMemo(() => localPictureSlice(20, 3), []);

  const rollPreviewPhotosSource = useMemo(() => {
    if (!profile?.rollPreviewPhotos) return null;
    const urls = profile.rollPreviewPhotos
      .split(',')
      .map(url => url.trim())
      .filter(Boolean);
    if (urls.length === 0) return null;
    return urls.map(url => ({ uri: formatImageUrl(url) }));
  }, [profile?.rollPreviewPhotos]);

  const filmStripDisplay = useMemo(() => {
    if (rollPreviewPhotosSource) {
      return rollPreviewPhotosSource.map(x => ({ uri: x.uri, local: undefined }));
    }
    return filmStrip.map(src => ({ uri: undefined, local: src }));
  }, [rollPreviewPhotosSource, filmStrip]);

  const load = useCallback(async () => {
    if (initializing) return;

    if (!session?.accessToken || session.role !== 'customer') {
      setError('Phiên đăng nhập không hợp lệ. Vui lòng đăng xuất và đăng nhập lại với tài khoản khách hàng.');
      setLoading(false);
      setRefreshing(false);
      return;
    }

    setError(null);
    try {
      const [me, bookings, lookbook] = await Promise.all([
        getCustomerProfile(),
        getMyBookings().catch(() => []),
        getActiveStylesAndConceptsForLookbook().catch(() => null),
      ]);
      setProfile(me);
      setLookbookData(lookbook);
      setCompletedShoots(bookings.filter(b => b.status === 'Completed').length);
      if (!me) {
        setError('Không tìm thấy hồ sơ khách hàng. Kéo để thử lại.');
      }

      // Load style preferences from profile first, fallback to AsyncStorage/defaults
      const styleStr = me?.preferredStyles ?? '';
      if (styleStr) {
        try {
          const parsedJSON = JSON.parse(styleStr);
          if (Array.isArray(parsedJSON)) {
            setStyleTags(parsedJSON.map(s => String(s).trim()).filter(Boolean));
          } else if (parsedJSON && typeof parsedJSON === 'object') {
            const tags: string[] = [];
            // 1. Locations
            if (Array.isArray(parsedJSON.locations)) {
              parsedJSON.locations.forEach((loc: string) => {
                tags.push(LOCATION_MAPPING[loc] || loc);
              });
            }
            // 2. Colors
            if (Array.isArray(parsedJSON.colors)) {
              parsedJSON.colors.forEach((col: string) => {
                tags.push(COLOR_MAPPING[col] || col);
              });
            }
            // 3. Fashion
            if (Array.isArray(parsedJSON.fashion)) {
              parsedJSON.fashion.forEach((fash: string) => {
                const label = lookbook?.styles?.find((s: any) => s.id === fash)?.name;
                if (label) {
                  tags.push(label);
                } else if (fash && fash.length < 25) {
                  tags.push(fash);
                }
              });
            }
            // 4. Concepts
            if (Array.isArray(parsedJSON.concepts)) {
              parsedJSON.concepts.forEach((concept: string) => {
                const label = lookbook?.concepts?.find((c: any) => c.id === concept)?.name;
                if (label) {
                  tags.push(label);
                } else if (concept && concept.length < 25) {
                  tags.push(concept);
                }
              });
            }
            setStyleTags(tags.filter(Boolean));
          } else {
            setStyleTags(styleStr.split(',').map(s => s.trim()).filter(Boolean));
          }
        } catch {
          setStyleTags(styleStr.split(',').map(s => s.trim()).filter(Boolean));
        }
      } else if (session?.userId) {
        const stored = await AsyncStorage.getItem(`sm_customer_styles_${session.userId}`);
        if (stored) {
          try {
            const parsed = JSON.parse(stored);
            if (Array.isArray(parsed) && parsed.length > 0) {
              setStyleTags(parsed);
            } else {
              setStyleTags(DEFAULT_STYLE_TAGS);
            }
          } catch {
            setStyleTags(DEFAULT_STYLE_TAGS);
          }
        } else {
          setStyleTags(DEFAULT_STYLE_TAGS);
        }
      } else {
        setStyleTags(DEFAULT_STYLE_TAGS);
      }
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : '';
      if (msg.toLowerCase().includes('network')) {
        setError('Không kết nối được máy chủ. Kiểm tra API đang chạy và địa chỉ trong .env.');
      } else if (msg.toLowerCase().includes('authorized') || msg.toLowerCase().includes('authenticated')) {
        setError('Phiên đăng nhập đã hết hạn. Đăng xuất rồi đăng nhập lại.');
      } else {
        setError('Không tải được hồ sơ. Kéo để thử lại.');
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [initializing, session]);

  useFocusEffect(
    useCallback(() => {
      if (initializing) return;
      setLoading(true);
      load();
    }, [initializing, load]),
  );

  function handleLogout() {
    if (Platform.OS === 'web') {
      const confirmed = window.confirm('Bạn chắc chắn muốn đăng xuất?');
      if (confirmed) {
        logout();
      }
      return;
    }

    Alert.alert('Đăng xuất', 'Bạn chắc chắn muốn đăng xuất?', [
      { text: 'Hủy', style: 'cancel' },
      { text: 'Đăng xuất', style: 'destructive', onPress: logout },
    ]);
  }

  async function pickAndUploadImage(slot: CustomerPhotoSlot) {
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) {
      Alert.alert('Cần quyền truy cập', 'Cho phép truy cập thư viện ảnh để cập nhật hồ sơ.');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 1,
    });

    if (result.canceled || !result.assets?.[0]) return;

    const asset = result.assets[0];
    setSavingImage(slot);

    try {
      const preparedUri = await prepareImage(asset.uri);
      const uploadedUrl = await uploadCustomerProfileImage(preparedUri, asset.mimeType ?? 'image/jpeg', slot);
      const patch =
        slot === 'avatar' ? { avatarUrl: uploadedUrl }
        : slot === 'highlight1' ? { highlightPhoto1Url: uploadedUrl }
        : slot === 'highlight2' ? { highlightPhoto2Url: uploadedUrl }
        : slot === 'highlight3' ? { highlightPhoto3Url: uploadedUrl }
        : { coverPhotoUrl: uploadedUrl };
      await updateCustomerProfile(patch);
      setProfile(prev => (prev ? { ...prev, ...patch } : prev));
    } catch {
      Alert.alert('Lỗi', 'Không thể cập nhật ảnh. Vui lòng thử lại.');
    } finally {
      setSavingImage(null);
    }
  }


  const avatarUri = formatImageUrl(profile?.avatarUrl);
  const highlight1Uri = formatImageUrl(profile?.highlightPhoto1Url);
  const highlight2Uri = formatImageUrl(profile?.highlightPhoto2Url);
  const highlight3Uri = formatImageUrl(profile?.highlightPhoto3Url);
  const coverUri = formatImageUrl(profile?.coverPhotoUrl);
  const displayName = profile?.displayName?.trim() || 'Khách hàng';
  const initial = displayName.charAt(0).toUpperCase();
  const phone = displayOptional(profile?.phone);
  const email = displayOptional(profile?.email);

  const heroHeight = W * 0.72;

  if (loading && !profile && !refreshing) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.loadingBox}>
          <ActivityIndicator size="large" color={colors.accentOrange} />
          <Text style={styles.loadingText}>Đang mở album…</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => { setRefreshing(true); load(); }}
            tintColor={colors.accentOrange}
          />
        }
      >
        {error ? (
          <View style={styles.errorBanner}>
            <Ionicons name="cloud-offline-outline" size={18} color={colors.accent} />
            <Text style={styles.errorText}>{error}</Text>
          </View>
        ) : null}

        {/* ── COVER / VIEWFINDER HERO ── */}
        <Animated.View entering={FadeInUp.duration(550)}>
          <View style={[styles.hero, { height: heroHeight }]}>
            {coverUri ? (
              <Image source={{ uri: coverUri }} style={StyleSheet.absoluteFill} resizeMode="cover" />
            ) : (
              <ImageBackground
                source={filmStrip[0]}
                style={StyleSheet.absoluteFill}
                blurRadius={avatarUri ? 0 : 8}
              >
                {avatarUri ? (
                  <Image source={{ uri: avatarUri }} style={StyleSheet.absoluteFill} blurRadius={12} />
                ) : null}
              </ImageBackground>
            )}
            <LinearGradient
              colors={['rgba(10,10,6,0.25)', 'rgba(10,10,6,0.45)', 'rgba(10,10,6,0.82)']}
              locations={[0, 0.5, 1]}
              style={StyleSheet.absoluteFill}
            />
            <View style={styles.grain} pointerEvents="none" />
            <ViewfinderFrame />

            <View style={[styles.heroTop, { paddingTop: insets.top > 0 ? spacing[6] : spacing[8] }]}>
              <Text style={styles.heroEyebrow}>MY ARCHIVE · SHOOTMATCH</Text>
              <Pressable style={styles.gearBtn} onPress={() => navigation.navigate('EditProfile')} hitSlop={10}>
                <Ionicons name="create-outline" size={20} color="#fff7e1" />
              </Pressable>
            </View>

            <View style={styles.heroBottom}>
              <View style={styles.heroPolaroidRow}>
                <HeroPolaroid
                  imageUri={highlight1Uri}
                  localSource={!highlight1Uri ? filmStrip[0] : undefined}
                  rotation="-6deg"
                  saving={savingImage === 'highlight1'}
                  onPress={() => pickAndUploadImage('highlight1')}
                  width={POLAROID_W}
                />
                <HeroPolaroid
                  imageUri={highlight2Uri}
                  localSource={!highlight2Uri ? filmStrip[1] : undefined}
                  rotation="2deg"
                  saving={savingImage === 'highlight2'}
                  onPress={() => pickAndUploadImage('highlight2')}
                  width={POLAROID_W}
                />
                <HeroPolaroid
                  imageUri={highlight3Uri}
                  localSource={!highlight3Uri ? filmStrip[2] : undefined}
                  rotation="6deg"
                  saving={savingImage === 'highlight3'}
                  onPress={() => pickAndUploadImage('highlight3')}
                  width={POLAROID_W}
                />
              </View>
            </View>
          </View>
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(80).duration(450)} style={styles.avatarDock}>
          <View style={styles.heroAvatarWrap}>
            {avatarUri ? (
              <Image source={{ uri: avatarUri }} style={styles.heroAvatarImg} />
            ) : (
              <View style={styles.heroAvatarFallback}>
                <Text style={styles.heroAvatarLetter}>{initial}</Text>
              </View>
            )}
          </View>
        </Animated.View>

        {/* ── FILM STRIP ── */}
        <Animated.View entering={FadeInDown.delay(120).duration(450)} style={styles.filmBlock}>
          <View style={styles.filmHeader}>
            <Text style={styles.filmLabel}>ROLL PREVIEW</Text>
            <Text style={styles.filmCounter}>36 EXP · {filmStripDisplay.length} FRAMES</Text>
          </View>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filmScroll}>
            {filmStripDisplay.map((item, i) => (
              <View key={i} style={styles.filmFrame}>
                {item.uri ? (
                  <Image source={{ uri: item.uri }} style={styles.filmImg} resizeMode="cover" />
                ) : (
                  <Image source={item.local} style={styles.filmImg} resizeMode="cover" />
                )}
                <Text style={styles.frameNo}>{String(i + 1).padStart(2, '0')}</Text>
              </View>
            ))}
          </ScrollView>
        </Animated.View>

        {/* ── THẺ THÀNH VIÊN (COMPACT MEMBERSHIP ROW) ── */}
        <Animated.View entering={FadeInDown.delay(100).duration(450)} style={styles.section}>
          <View style={styles.compactMembershipRow}>
            <View style={styles.compactMembershipLeft}>
              <View style={[
                styles.compactMembershipIconContainer,
                {
                  backgroundColor: 
                    session?.membershipTier === 'Chốt Xịn' ? '#8B5CF615' :
                    session?.membershipTier === 'Chọn Xinh' ? '#F59E0B15' :
                    '#64748B15'
                }
              ]}>
                <Ionicons 
                  name="ribbon-outline" 
                  size={20} 
                  color={
                    session?.membershipTier === 'Chốt Xịn' ? '#8B5CF6' :
                    session?.membershipTier === 'Chọn Xinh' ? '#F59E0B' :
                    '#64748B'
                  } 
                />
              </View>
              <View>
                <Text style={styles.compactMembershipLabel}>GÓI THÀNH VIÊN</Text>
                <Text style={[
                  styles.compactMembershipValue,
                  {
                    color: 
                      session?.membershipTier === 'Chốt Xịn' ? '#8B5CF6' :
                      session?.membershipTier === 'Chọn Xinh' ? '#F59E0B' :
                      '#475569'
                  }
                ]}>
                  {session?.membershipTier || 'Lướt Nhẹ'}
                </Text>
              </View>
            </View>
            
            <Pressable
              onPress={() => navigation.navigate('CustomerSubscription')}
              style={({ pressed }) => [
                styles.compactMembershipActionBtn,
                pressed && { opacity: 0.8 },
              ]}
            >
              <Text style={styles.compactMembershipActionText}>Thay đổi</Text>
              <Ionicons name="chevron-forward" size={12} color="#8B5CF6" />
            </Pressable>
          </View>
        </Animated.View>

        {/* ── PHONG CÁCH ── */}
        <Animated.View entering={FadeInDown.delay(120).duration(450)} style={styles.section}>
          <Text style={styles.sectionEyebrow}>Phong cách</Text>
          <Text style={styles.sectionTitle}>Gu ảnh của bạn</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.tagScroll}>
            {styleTags.map(tag => (
              <View key={tag} style={styles.styleTag}>
                <Ionicons name="aperture-outline" size={12} color={colors.accentOrange} />
                <Text style={styles.styleTagText}>{tag}</Text>
              </View>
            ))}
          </ScrollView>
          <Text style={styles.styleHint}>
            Gợi ý phong cách dựa trên sở thích — sẽ đồng bộ khi bạn lưu photographer & buổi chụp.
          </Text>
        </Animated.View>

        {/* ── ARCHIVE GRID ── */}
        <Animated.View entering={FadeInDown.delay(160).duration(450)} style={styles.section}>
          <Text style={styles.sectionEyebrow}>Album cá nhân</Text>
          <Text style={styles.sectionTitle}>Không gian của bạn</Text>
          <View style={styles.archiveGrid}>
            <View style={{ flexDirection: 'row', gap: GAP, width: '100%', marginBottom: GAP }}>
              <View style={{ flex: 1 }}>
                <ArchiveTile
                  title="Yêu thích"
                  caption="Photographer & mood đã lưu"
                  images={favImages}
                  tall
                  onPress={() => navigation.navigate('CustomerFavorites')}
                  width="100%"
                  height={220}
                />
              </View>
              <View style={{ flex: 1 }}>
                <ArchiveTile
                  title="Buổi đã chụp"
                  caption="Hoàn thành & kỷ niệm"
                  count={completedShoots}
                  images={shootImages}
                  dark
                  onPress={() => navigation.navigate('Bookings')}
                  width="100%"
                  height={220}
                />
              </View>
            </View>
            <ArchiveTile
              title="Ảnh của bạn"
              caption="Chỉ hiện khi bạn đồng ý với photographer"
              images={sharedImages}
              onPress={() => navigation.navigate('CustomerSharedMedia')}
              width="100%"
              height={168}
            />
          </View>
        </Animated.View>

        {/* ── THÔNG TIN CƠ BẢN (expandable basic info section) ── */}
        <Animated.View entering={FadeInDown.delay(200).duration(450)} style={styles.section}>
          <Pressable
            onPress={() => setIsBasicInfoExpanded(!isBasicInfoExpanded)}
            style={({ pressed }) => [
              styles.toggleHeader,
              pressed && { opacity: 0.8 }
            ]}
          >
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
              <View>
                <Text style={styles.sectionEyebrow}>Hồ sơ</Text>
                <Text style={[styles.sectionTitle, { marginBottom: 0 }]}>Thông tin cơ bản</Text>
              </View>
              <Ionicons
                name={isBasicInfoExpanded ? "chevron-up" : "chevron-down"}
                size={20}
                color={colors.dark}
              />
            </View>
          </Pressable>

          {isBasicInfoExpanded && (
            <Animated.View entering={FadeInDown.duration(200)} style={styles.contactSheet}>
              <View style={styles.contactRow}>
                <Text style={styles.contactKey}>TEL</Text>
                <Text style={styles.contactVal}>{phone ?? 'Chưa cập nhật'}</Text>
              </View>
              <View style={styles.contactDivider} />
              <View style={styles.contactRow}>
                <Text style={styles.contactKey}>MAIL</Text>
                <Text style={styles.contactVal} numberOfLines={1}>{email ?? 'Chưa cập nhật'}</Text>
              </View>
            </Animated.View>
          )}
        </Animated.View>


        {/* ── SETTINGS ── */}
        <Animated.View entering={FadeInDown.delay(240).duration(450)} style={styles.section}>
          <Pressable style={[styles.settingsBtn, styles.settingsBtnDanger, { flex: 0, width: '100%' }]} onPress={handleLogout}>
            <Ionicons name="log-out-outline" size={20} color={colors.accent} />
            <Text style={[styles.settingsBtnText, { color: colors.accent }]}>Đăng xuất</Text>
          </Pressable>
        </Animated.View>

        <Text style={styles.footer}>SHOOTMATCH · CLIENT ARCHIVE</Text>
        <View style={{ height: spacing[16] }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },

  loadingBox: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: spacing[3] },
  loadingText: { fontSize: fontSizes.sm, color: colors.textMuted, letterSpacing: 2, textTransform: 'uppercase' },

  errorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[2],
    marginHorizontal: spacing[5],
    marginTop: spacing[2],
    padding: spacing[3],
    borderRadius: radius.md,
    backgroundColor: 'rgba(207,64,40,0.08)',
  },
  errorText: { flex: 1, fontSize: fontSizes.sm, color: colors.textMuted },

  hero: { width: '100%', position: 'relative', overflow: 'hidden' },
  grain: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(255,247,225,0.03)',
    opacity: 0.4,
  },
  heroTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing[5],
    zIndex: 2,
  },
  heroEyebrow: {
    fontSize: 9,
    fontWeight: fontWeights.bold,
    letterSpacing: 3,
    color: 'rgba(255,247,225,0.45)',
  },
  gearBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,247,225,0.12)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,247,225,0.15)',
  },
  heroBottom: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: spacing[5],
    paddingBottom: spacing[5],
    zIndex: 20,
    elevation: 20,
    alignItems: 'center',
    justifyContent: 'flex-end',
  },
  avatarDock: {
    marginTop: -spacing[16],
    marginBottom: spacing[5],
    alignItems: 'center',
    zIndex: 40,
    elevation: 40,
  },
  heroAvatarShell: {
    width: '100%',
    alignItems: 'center',
    zIndex: 30,
    elevation: 30,
  },
  heroAvatarWrap: {
    width: 104,
    height: 104,
    borderRadius: 52,
    overflow: 'hidden',
    borderWidth: 1.5,
    borderColor: 'rgba(255,247,225,0.8)',
    backgroundColor: '#fff7e1',
    position: 'relative',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.28,
    shadowRadius: 12,
    elevation: 8,
  },
  heroAvatarImg: { width: '100%', height: '100%' },
  heroAvatarFallback: { flex: 1, backgroundColor: THEME.accent, alignItems: 'center', justifyContent: 'center' },
  heroAvatarLetter: { fontSize: 48, fontWeight: '900', color: THEME.primary },
  heroInfoSpacer: { height: 20 },
  heroPolaroidRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'center',
    gap: spacing[3],
    width: '100%',
    zIndex: 5,
    elevation: 5,
    marginBottom: spacing[2],
  },

  heroPolaroid: {
    backgroundColor: '#fff7e1',
    padding: spacing[2],
    paddingBottom: spacing[3],
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 14,
    elevation: 12,
    position: 'relative',
  },
  heroPolaroidEditBtn: {
    position: 'absolute',
    top: spacing[2],
    right: spacing[2],
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: colors.accentOrange,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#fff7e1',
  },
  heroPolaroidImg: {
    backgroundColor: colors.clay,
  },
  heroPolaroidFallback: {
    backgroundColor: colors.dark,
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroPolaroidLetter: {
    fontSize: 28,
    fontWeight: fontWeights.bold,
    color: colors.background,
  },
  filmBlock: { marginTop: -spacing[4], marginBottom: spacing[6] },
  filmHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing[5],
    marginBottom: spacing[3],
  },
  filmLabel: { fontSize: 9, fontWeight: fontWeights.bold, letterSpacing: 2.5, color: colors.textMuted },
  filmCounter: { fontSize: 9, color: colors.textLight, fontFamily: 'monospace' },
  filmScroll: { paddingHorizontal: spacing[5], gap: spacing[2] },
  filmFrame: {
    width: 72,
    height: 96,
    borderRadius: 4,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: colors.dark,
    backgroundColor: colors.dark,
  },
  filmImg: { width: '100%', height: '100%' },
  frameNo: {
    position: 'absolute',
    bottom: 3,
    right: 4,
    fontSize: 8,
    fontWeight: fontWeights.bold,
    color: 'rgba(255,247,225,0.85)',
    fontFamily: 'monospace',
  },

  section: { paddingHorizontal: spacing[5], marginBottom: spacing[7] },
  sectionEyebrow: {
    fontSize: 9,
    fontWeight: fontWeights.bold,
    letterSpacing: 2.5,
    color: colors.accentOrange,
    textTransform: 'uppercase',
    marginBottom: 4,
  },
  sectionTitle: {
    fontSize: fontSizes.xl,
    fontWeight: fontWeights.extrabold,
    color: colors.dark,
    marginBottom: spacing[4],
    letterSpacing: -0.3,
  },
  tagScroll: { gap: spacing[2], paddingBottom: spacing[2] },
  styleTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: spacing[4],
    paddingVertical: spacing[2],
    borderRadius: radius.full,
    backgroundColor: colors.dark,
  },
  styleTagText: {
    fontSize: 11,
    fontWeight: fontWeights.semibold,
    color: colors.background,
    letterSpacing: 0.5,
  },
  styleHint: {
    marginTop: spacing[3],
    fontSize: fontSizes.xs,
    color: colors.textMuted,
    lineHeight: 18,
    fontStyle: 'italic',
  },

  archiveGrid: { width: '100%' },
  archiveTile: { borderRadius: radius.lg, overflow: 'hidden', backgroundColor: colors.dark },
  archiveSplit: { ...StyleSheet.absoluteFillObject, flexDirection: 'row' },
  archiveHalf: { flex: 1, height: '100%' },
  countBadge: {
    position: 'absolute',
    top: spacing[3],
    right: spacing[3],
    minWidth: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.accentOrange,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 8,
  },
  countBadgeText: { fontSize: fontSizes.md, fontWeight: fontWeights.extrabold, color: '#fff' },
  archiveCopy: { position: 'absolute', left: 0, right: 0, bottom: 0, padding: spacing[4] },
  archiveTitle: { fontSize: fontSizes.lg, fontWeight: fontWeights.bold, color: '#fff7e1' },
  archiveCaption: { fontSize: 10, color: 'rgba(255,247,225,0.65)', marginTop: 4, lineHeight: 14 },
  archiveArrow: {
    marginTop: spacing[2],
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'rgba(255,247,225,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'flex-start',
  },

  toggleHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: spacing[1],
    marginBottom: spacing[2],
  },
  contactSheet: {
    backgroundColor: colors.dark,
    borderRadius: radius.lg,
    padding: spacing[5],
  },
  contactRow: { flexDirection: 'row', alignItems: 'center', gap: spacing[4] },
  contactKey: {
    width: 44,
    fontSize: 10,
    fontWeight: fontWeights.bold,
    letterSpacing: 2,
    color: colors.accentOrange,
    fontFamily: 'monospace',
  },
  contactVal: { flex: 1, fontSize: fontSizes.md, fontWeight: fontWeights.semibold, color: '#fff7e1' },
  contactDivider: { height: 1, backgroundColor: 'rgba(255,247,225,0.1)', marginVertical: spacing[4] },

  settingsRow: { flexDirection: 'row', gap: spacing[3] },
  settingsBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing[2],
    paddingVertical: spacing[4],
    borderRadius: radius.lg,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  settingsBtnDanger: { backgroundColor: 'rgba(207,64,40,0.06)', borderColor: 'rgba(207,64,40,0.2)' },
  settingsBtnText: { fontSize: fontSizes.sm, fontWeight: fontWeights.semibold, color: colors.dark },

  footer: {
    textAlign: 'center',
    fontSize: 9,
    letterSpacing: 3,
    color: colors.textLight,
    fontWeight: fontWeights.bold,
  },

  // Membership Card Styles
  membershipCard: {
    borderRadius: radius.lg,
    padding: spacing[5],
    width: '100%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 4,
    marginBottom: spacing[2],
  },
  membershipCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing[4],
  },
  membershipRole: {
    fontSize: 10,
    fontWeight: '800',
    color: 'rgba(255, 255, 255, 0.8)',
    letterSpacing: 1.5,
  },
  membershipBadge: {
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
    paddingHorizontal: spacing[3],
    paddingVertical: 3,
    borderRadius: radius.sm,
  },
  membershipBadgeText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: 1,
  },
  membershipName: {
    fontSize: fontSizes.xl,
    fontWeight: fontWeights.bold,
    color: '#FFFFFF',
    marginBottom: spacing[5],
  },
  membershipFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  membershipExpiry: {
    fontSize: fontSizes.xs,
    color: 'rgba(255, 255, 255, 0.8)',
    fontWeight: '500',
  },
  membershipActionBtn: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 14,
    paddingVertical: spacing[2],
    borderRadius: radius.md,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  membershipActionText: {
    fontSize: fontSizes.xs - 1,
    fontWeight: '700',
    color: '#0F172A',
  },

  // Cheat Mode Styles
  cheatRow: {
    flexDirection: 'row',
    gap: spacing[2],
    width: '100%',
  },
  cheatBtn: {
    flex: 1,
    paddingVertical: spacing[3],
    alignItems: 'center',
    borderRadius: radius.md,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  cheatBtnActive: {
    borderColor: colors.accentOrange,
    backgroundColor: 'rgba(255,66,0,0.05)',
  },
  cheatBtnText: {
    fontSize: fontSizes.xs,
    fontWeight: '600',
    color: colors.textMuted,
  },
  cheatBtnTextActive: {
    color: colors.accentOrange,
    fontWeight: '700',
  },
  compactMembershipRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.02,
    shadowRadius: 8,
    elevation: 2,
  },
  compactMembershipLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  compactMembershipIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  compactMembershipLabel: {
    fontSize: 10,
    fontWeight: '800',
    color: '#94A3B8',
    letterSpacing: 1,
  },
  compactMembershipValue: {
    fontSize: 15,
    fontWeight: '800',
    marginTop: 2,
  },
  compactMembershipActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#8B5CF610',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    gap: 4,
  },
  compactMembershipActionText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#8B5CF6',
  },
});
