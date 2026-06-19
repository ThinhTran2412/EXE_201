import React, { useEffect, useMemo, useState } from 'react';
import {
  ScrollView,
  StyleSheet,
  Text,
  View,
  Pressable,
  Image,
  ImageBackground,
  ActivityIndicator,
  Dimensions,
  Platform,
  useWindowDimensions,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute } from '@react-navigation/native';
import { usePhotographerTheme } from '../PhotographerThemeContext';
import { fontSizes, fontWeights } from '../../../app/theme/typography';
import { radius, spacing } from '../../../app/theme/spacing';
import { formatImageUrl } from '../../../shared/utils/formatImageUrl';
import { localPictureSlice } from '../../../shared/assets/localPictures';
import { getCustomerById, type CustomerProfile } from '../../customer/api';

const THEME = {
  primary: '#fff7e1',
  accent: '#1a1a0f',
  orange: '#ff4200',
};

function displayOptional(s?: string | null) {
  const t = s?.trim();
  return t && t.length > 0 ? t : null;
}

function ViewfinderFrame() {
  const c = 22, t = 2;
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
  localSource,
  rotation,
  width,
}: {
  imageUri?: string;
  localSource?: ReturnType<typeof localPictureSlice>[number];
  rotation: string;
  width: number;
}) {
  const { colors } = usePhotographerTheme();
  const styles = getStyles(colors);
  const polaroidImgW = width - spacing[2] * 2;
  const polaroidImgH = Math.round(polaroidImgW * 1.18);

  return (
    <View style={[styles.heroPolaroid, { width: width, transform: [{ rotate: rotation }] }]}>
      {imageUri ? (
        <Image source={{ uri: imageUri }} style={[styles.heroPolaroidImg, { width: polaroidImgW, height: polaroidImgH }]} />
      ) : localSource ? (
        <Image source={localSource} style={[styles.heroPolaroidImg, { width: polaroidImgW, height: polaroidImgH }]} resizeMode="cover" />
      ) : (
        <View style={[styles.heroPolaroidFallback, { width: polaroidImgW, height: polaroidImgH }]}>
          <Ionicons name="person-outline" size={28} color={colors.background} />
        </View>
      )}
    </View>
  );
}

export default function CustomerProfileViewScreen() {
  const navigation = useNavigation<any>();
  const { colors, isDark } = usePhotographerTheme();
  const styles = getStyles(colors);
  const insets = useSafeAreaInsets();
  const route = useRoute<any>();
  const { customerId, customerName } = route.params as { customerId: string; customerName?: string };

  const { width: windowWidth } = useWindowDimensions();
  const W = Platform.OS === 'web' ? Math.min(windowWidth, 800) : windowWidth;
  const PAD = spacing[5];
  const GAP = spacing[3];
  const COL = (W - PAD * 2 - GAP) / 2;
  const POLAROID_W = Math.floor((W - PAD * 2 - spacing[3] * 2) / 3);

  const [profile, setProfile] = useState<CustomerProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isBasicInfoExpanded, setIsBasicInfoExpanded] = useState(true);

  const filmStrip = useMemo(() => localPictureSlice(2, 6), []);

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

  const styleTags = useMemo(() => {
    const raw = profile?.preferredStyles ?? '';
    if (!raw) return ['Portrait', 'Golden hour', 'Film look', 'Lifestyle', 'Editorial'];
    return raw.split(',').map(s => s.trim()).filter(Boolean);
  }, [profile?.preferredStyles]);

  useEffect(() => {
    (async () => {
      try {
        const data = await getCustomerById(customerId);
        setProfile(data);
        if (!data) setError('Không tìm thấy hồ sơ khách hàng.');
      } catch {
        setError('Không tải được hồ sơ khách hàng.');
      } finally {
        setLoading(false);
      }
    })();
  }, [customerId]);

  const avatarUri    = formatImageUrl(profile?.avatarUrl);
  const highlight1Uri = formatImageUrl(profile?.highlightPhoto1Url);
  const highlight2Uri = formatImageUrl(profile?.highlightPhoto2Url);
  const highlight3Uri = formatImageUrl(profile?.highlightPhoto3Url);
  const coverUri     = formatImageUrl(profile?.coverPhotoUrl);
  const displayName  = profile?.displayName?.trim() || customerName || 'Khách hàng';
  const initial      = displayName.charAt(0).toUpperCase();
  const phone        = displayOptional(profile?.phone);
  const email        = displayOptional(profile?.email);
  const heroHeight   = W * 0.72;

  if (loading) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.loadingBox}>
          <ActivityIndicator size="large" color={colors.accentOrange} />
          <Text style={styles.loadingText}>Đang tải hồ sơ…</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (error && !profile) {
    return (
      <SafeAreaView style={styles.safe}>
        <Pressable onPress={() => navigation.goBack()} style={styles.backBtnSolo}>
          <Ionicons name="chevron-back" size={26} color={colors.text} />
        </Pressable>
        <View style={styles.loadingBox}>
          <Ionicons name="person-circle-outline" size={64} color={colors.textLight} />
          <Text style={styles.loadingText}>{error}</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScrollView showsVerticalScrollIndicator={false}>

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

            {/* Back button overlay on hero */}
            <View style={[styles.heroTop, { paddingTop: insets.top > 0 ? spacing[2] : spacing[4] }]}>
              <Pressable onPress={() => navigation.goBack()} style={styles.backBtn} hitSlop={10}>
                <Ionicons name="chevron-back" size={22} color="#fff7e1" />
              </Pressable>
              <Text style={styles.heroEyebrow}>CLIENT ARCHIVE · SHOOTMATCH</Text>
              <View style={{ width: 40 }} />
            </View>

            <View style={styles.heroBottom}>
              <View style={styles.heroPolaroidRow}>
                <HeroPolaroid imageUri={highlight1Uri} localSource={!highlight1Uri ? filmStrip[0] : undefined} rotation="-6deg" width={POLAROID_W} />
                <HeroPolaroid imageUri={highlight2Uri} localSource={!highlight2Uri ? filmStrip[1] : undefined} rotation="2deg" width={POLAROID_W} />
                <HeroPolaroid imageUri={highlight3Uri} localSource={!highlight3Uri ? filmStrip[2] : undefined} rotation="6deg" width={POLAROID_W} />
              </View>
            </View>
          </View>
        </Animated.View>

        {/* ── AVATAR DOCK ── */}
        <Animated.View entering={FadeInDown.delay(80).duration(450)} style={styles.avatarDock}>
          <View style={styles.heroAvatarWrap}>
            {avatarUri ? (
              <Image source={{ uri: avatarUri }} style={styles.heroAvatarImg} />
            ) : (
              <View style={[styles.heroAvatarFallback, { backgroundColor: colors.background }]}>
                <Text style={[styles.heroAvatarLetter, { color: colors.text }]}>{initial}</Text>
              </View>
            )}
          </View>
          <Text style={styles.displayName}>{displayName}</Text>
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

        {/* ── PHONG CÁCH ── */}
        <Animated.View entering={FadeInDown.delay(120).duration(450)} style={styles.section}>
          <Text style={styles.sectionEyebrow}>Phong cách</Text>
          <Text style={styles.sectionTitle}>Gu ảnh</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.tagScroll}>
            {styleTags.map(tag => (
              <View key={tag} style={styles.styleTag}>
                <Ionicons name="aperture-outline" size={12} color={colors.accentOrange} />
                <Text style={styles.styleTagText}>{tag}</Text>
              </View>
            ))}
          </ScrollView>
        </Animated.View>

        {/* ── THÔNG TIN CƠ BẢN ── */}
        <Animated.View entering={FadeInDown.delay(200).duration(450)} style={styles.section}>
          <Pressable
            onPress={() => setIsBasicInfoExpanded(!isBasicInfoExpanded)}
            style={({ pressed }) => [styles.toggleHeader, pressed && { opacity: 0.8 }]}
          >
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
              <View>
                <Text style={styles.sectionEyebrow}>Hồ sơ</Text>
                <Text style={[styles.sectionTitle, { marginBottom: 0 }]}>Thông tin liên hệ</Text>
              </View>
              <Ionicons
                name={isBasicInfoExpanded ? 'chevron-up' : 'chevron-down'}
                size={20}
                color={colors.text}
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

        <Text style={styles.footer}>SHOOTMATCH · CLIENT ARCHIVE</Text>
        <View style={{ height: spacing[16] }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const getStyles = (colors: any) => StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },

  loadingBox: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: spacing[3] },
  loadingText: { fontSize: fontSizes.sm, color: colors.textMuted, letterSpacing: 2, textTransform: 'uppercase' },

  backBtnSolo: {
    margin: spacing[4],
    width: 44, height: 44, borderRadius: 22,
    backgroundColor: colors.surface,
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 1, borderColor: colors.border,
  },

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
  backBtn: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: 'rgba(255,247,225,0.12)',
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 1, borderColor: 'rgba(255,247,225,0.15)',
  },
  heroBottom: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    paddingHorizontal: spacing[5], paddingBottom: spacing[5],
    zIndex: 20, elevation: 20,
    alignItems: 'center', justifyContent: 'flex-end',
  },
  avatarDock: {
    marginTop: -spacing[16],
    marginBottom: spacing[3],
    alignItems: 'center',
    zIndex: 40, elevation: 40,
  },
  heroAvatarWrap: {
    width: 104, height: 104, borderRadius: 52,
    overflow: 'hidden',
    borderWidth: 1.5, borderColor: colors.borderStrong,
    backgroundColor: colors.surfaceStrong,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.28, shadowRadius: 12,
    elevation: 8,
  },
  heroAvatarImg: { width: '100%', height: '100%' },
  heroAvatarFallback: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  heroAvatarLetter: { fontSize: 48, fontWeight: '900' },
  displayName: {
    marginTop: spacing[2],
    fontSize: fontSizes.xl,
    fontWeight: fontWeights.extrabold,
    color: colors.text,
    letterSpacing: -0.3,
  },

  heroPolaroidRow: {
    flexDirection: 'row', alignItems: 'flex-end',
    justifyContent: 'center', gap: spacing[3],
    width: '100%', zIndex: 5, elevation: 5, marginBottom: spacing[2],
  },
  heroPolaroid: {
    backgroundColor: colors.surface, padding: spacing[2], paddingBottom: spacing[3],
    borderWidth: 1, borderColor: colors.border,
    shadowColor: '#000', shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4, shadowRadius: 14, elevation: 12,
  },
  heroPolaroidImg: { backgroundColor: colors.surfaceStrong },
  heroPolaroidFallback: {
    backgroundColor: colors.surfaceStrong, alignItems: 'center', justifyContent: 'center',
  },

  filmBlock: { marginTop: -spacing[4], marginBottom: spacing[6] },
  filmHeader: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: spacing[5], marginBottom: spacing[3],
  },
  filmLabel: { fontSize: 9, fontWeight: fontWeights.bold, letterSpacing: 2.5, color: colors.textMuted },
  filmCounter: { fontSize: 9, color: colors.textLight, fontFamily: 'monospace' },
  filmScroll: { paddingHorizontal: spacing[5], gap: spacing[2] },
  filmFrame: {
    width: 72, height: 96, borderRadius: 4, overflow: 'hidden',
    borderWidth: 2, borderColor: colors.borderStrong, backgroundColor: colors.surfaceStrong,
  },
  filmImg: { width: '100%', height: '100%' },
  frameNo: {
    position: 'absolute', bottom: 3, right: 4,
    fontSize: 8, fontWeight: fontWeights.bold,
    color: colors.textLight, fontFamily: 'monospace',
  },

  section: { paddingHorizontal: spacing[5], marginBottom: spacing[7] },
  sectionEyebrow: {
    fontSize: 9, fontWeight: fontWeights.bold, letterSpacing: 2.5,
    color: colors.accentOrange, textTransform: 'uppercase', marginBottom: 4,
  },
  sectionTitle: {
    fontSize: fontSizes.xl, fontWeight: fontWeights.extrabold,
    color: colors.text, marginBottom: spacing[4], letterSpacing: -0.3,
  },
  tagScroll: { gap: spacing[2], paddingBottom: spacing[2] },
  styleTag: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    paddingHorizontal: spacing[4], paddingVertical: spacing[2],
    borderRadius: radius.full, backgroundColor: colors.surfaceStrong,
    borderWidth: 1, borderColor: colors.border,
  },
  styleTagText: { fontSize: 11, fontWeight: fontWeights.semibold, color: colors.text, letterSpacing: 0.5 },

  toggleHeader: {
    flexDirection: 'row', alignItems: 'center',
    justifyContent: 'space-between', paddingVertical: spacing[1], marginBottom: spacing[2],
  },
  contactSheet: { backgroundColor: colors.surface, borderRadius: radius.lg, padding: spacing[5], borderWidth: 1, borderColor: colors.border },
  contactRow: { flexDirection: 'row', alignItems: 'center', gap: spacing[4] },
  contactKey: {
    width: 44, fontSize: 10, fontWeight: fontWeights.bold,
    letterSpacing: 2, color: colors.accentOrange, fontFamily: 'monospace',
  },
  contactVal: { flex: 1, fontSize: fontSizes.md, fontWeight: fontWeights.semibold, color: colors.text },
  contactDivider: { height: 1, backgroundColor: colors.border, marginVertical: spacing[4] },

  footer: {
    textAlign: 'center', fontSize: 9, letterSpacing: 3,
    color: colors.textLight, fontWeight: fontWeights.bold,
  },
});
