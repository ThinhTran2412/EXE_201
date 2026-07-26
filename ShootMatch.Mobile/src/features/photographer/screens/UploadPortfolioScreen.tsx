import React, { useState, useEffect, useRef } from 'react';
import {
  ScrollView, StyleSheet, Text, View, Pressable, Alert, ActivityIndicator, Image,
  Dimensions, Modal, FlatList, TextInput, PanResponder, Platform
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, { FadeIn, FadeInUp, FadeInDown } from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import * as ImagePicker from 'expo-image-picker';
import * as ImageManipulator from 'expo-image-manipulator';
import { LinearGradient } from 'expo-linear-gradient';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  getPhotographerProfile,
  uploadPortfolioPhoto,
  deletePortfolioPhoto,
  getMyDetailedPortfolioPhotos,
  getActiveStylesAndConcepts,
  updatePortfolioPhotoTags,
  updateProfile,
  Style,
  Concept
} from '../api';
import { usePhotographerTheme } from '../PhotographerThemeContext';
import { useAuth } from '../../auth/AuthContext';
import PortfolioImageCell from '../../../shared/components/PortfolioImageCell';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

const formatPhotoUrl = (url?: string) => {
  if (!url) return '';
  const apiUrl = process.env.EXPO_PUBLIC_API_URL || '';

  // Rewrite old trycloudflare.com tunnels or localhost to current API URL
  if (url.includes('trycloudflare.com') || url.includes('localhost') || url.includes('127.0.0.1')) {
    try {
      const parsed = new URL(url);
      return `${apiUrl}${parsed.pathname}${parsed.search}`;
    } catch (e) {
      return url;
    }
  }
  return url;
};

type PhotoData = {
  id: string;
  url: string;
  width: number;
  height: number;
  aspectRatio: number;
  styles: Style[];
  concepts: Concept[];
  dominantColors?: string;
  originalIndex?: number;
};

export default function UploadPortfolioScreen() {
  const navigation = useNavigation<any>();
  const { colors, isDark } = usePhotographerTheme();
  const styles = getStyles(colors, isDark);
  const { session } = useAuth();

  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [photoData, setPhotoData] = useState<PhotoData[]>([]);
  const [selectedUrls, setSelectedUrls] = useState<string[]>([]);

  const [profile, setProfile] = useState<any>(null);
  const [stylesList, setStylesList] = useState<Style[]>([]);
  const [conceptsList, setConceptsList] = useState<Concept[]>([]);
  const [isTagModalOpen, setIsTagModalOpen] = useState(false);
  const [selectedStyles, setSelectedStyles] = useState<string[]>([]);
  const [selectedConcepts, setSelectedConcepts] = useState<string[]>([]);
  const [isSavingTags, setIsSavingTags] = useState(false);
  const [selectedTagDesc, setSelectedTagDesc] = useState<{ name: string, description: string | null } | null>(null);
  const [activeViewerDesc, setActiveViewerDesc] = useState<{ name: string, description: string | null } | null>(null);

  const [masterpiecePhotoId, setMasterpiecePhotoId] = useState<string | null>(null);
  const [moodboardPhotoIds, setMoodboardPhotoIds] = useState<string[]>([]);
  const [isEditingPhilosophy, setIsEditingPhilosophy] = useState(false);
  const [philosophyInput, setPhilosophyInput] = useState('');
  const [isSelectingMasterpiece, setIsSelectingMasterpiece] = useState(false);
  const [isSelectingMoodboard, setIsSelectingMoodboard] = useState(false);

  const insets = useSafeAreaInsets();

  // Image Viewer State
  const [viewerIndex, setViewerIndex] = useState<number | null>(null);
  const flatListRef = useRef<FlatList>(null);
  const thumbnailsRef = useRef<ScrollView>(null);

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => false,
      onMoveShouldSetPanResponder: (evt, gestureState) => {
        return gestureState.dy > 15 && Math.abs(gestureState.dx) < 20;
      },
      onPanResponderRelease: (evt, gestureState) => {
        if (gestureState.dy > 80 || gestureState.vy > 0.3) {
          setViewerIndex(null);
        }
      },
    })
  ).current;

  const onViewableItemsChanged = useRef(({ viewableItems }: any) => {
    if (viewableItems.length > 0) {
      const idx = viewableItems[0].index;
      if (idx !== null && idx !== undefined) {
        setViewerIndex(idx);
        scrollToThumbnail(idx);
      }
    }
  }).current;
  const viewabilityConfig = useRef({ itemVisiblePercentThreshold: 50 }).current;

  const colWidth = (SCREEN_WIDTH - 32 - 16) / 2; // padding 16*2, gap 16

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    setActiveViewerDesc(null);
  }, [viewerIndex]);

  async function loadData() {
    setLoading(true);
    try {
      const [p, photos, tags] = await Promise.all([
        getPhotographerProfile(),
        getMyDetailedPortfolioPhotos(),
        getActiveStylesAndConcepts()
      ]);

      if (p) {
        setProfile(p);
        setPhilosophyInput(p.quote || '');
        try {
          const storedMasterpiece = await AsyncStorage.getItem(`@masterpiece_${p.id}`);
          if (storedMasterpiece) {
            setMasterpiecePhotoId(storedMasterpiece);
          }

          const storedMoodboard = await AsyncStorage.getItem(`@moodboard_${p.id}`);
          if (storedMoodboard) {
            setMoodboardPhotoIds(JSON.parse(storedMoodboard));
          }
        } catch (e) {
          console.log('Load custom layout settings error:', e);
        }
      }
      setStylesList(tags.styles || []);
      setConceptsList(tags.concepts || []);

      if (photos) {
        const data = photos.map((p, index) => {
          // Deterministic aspect ratio for masonry
          const defaultRatio = index % 3 === 0 ? 0.8 : (index % 2 === 0 ? 1.2 : 1.0);
          return {
            id: p.id,
            url: p.imageUrl,
            width: 800,
            height: Math.round(800 / defaultRatio),
            aspectRatio: defaultRatio,
            styles: p.styles || [],
            concepts: p.concepts || [],
            dominantColors: p.dominantColors
          };
        });
        setPhotoData(data);
      }
    } catch (err) {
      console.log('Load portfolio detailed photos error:', err);
    } finally {
      setLoading(false);
    }
  }

  async function handlePickImage() {
    if (session?.membershipTier === 'Basic' && photoData.length >= 20) {
      Alert.alert(
        'Giới hạn tài khoản',
        'Tài khoản gói Basic chỉ được upload tối đa 20 tác phẩm vào Portfolio. Vui lòng nâng cấp lên gói Pro để tải lên không giới hạn.',
        [
          { text: 'Hủy', style: 'cancel' },
          { text: 'Nâng cấp ngay', onPress: () => navigation.navigate('PhotographerSubscription') }
        ]
      );
      return;
    }

    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Quyền truy cập', 'Vui lòng cấp quyền truy cập thư viện ảnh để upload portfolio.');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsMultipleSelection: true,
      allowsEditing: false,
      quality: 0.8,
      base64: false,
    });

    if (!result.canceled && result.assets && result.assets.length > 0) {
      await handleUploadMultiple(result.assets);
    }
  }

  async function handleUploadMultiple(assets: ImagePicker.ImagePickerAsset[]) {
    if (session?.membershipTier === 'Basic' && photoData.length + assets.length > 20) {
      Alert.alert(
        'Giới hạn tài khoản',
        `Tài khoản gói Basic chỉ được upload tối đa 20 tác phẩm. Bạn hiện tại đã có ${photoData.length} ảnh, không thể upload thêm ${assets.length} ảnh.\n\nVui lòng nâng cấp lên gói Pro để tải lên không giới hạn.`,
        [
          { text: 'Hủy', style: 'cancel' },
          { text: 'Nâng cấp ngay', onPress: () => navigation.navigate('PhotographerSubscription') }
        ]
      );
      return;
    }
    setUploading(true);
    let successCount = 0;
    try {
      for (const asset of assets) {
        let width = asset.width;
        let height = asset.height;
        let resizeAction: ImageManipulator.Action[] = [];

        if (width > 1920 || height > 1920) {
          const ratio = Math.min(1920 / width, 1920 / height);
          resizeAction = [{ resize: { width: Math.round(width * ratio) } }];
        }

        const manipResult = await ImageManipulator.manipulateAsync(
          asset.uri,
          resizeAction,
          { compress: 0.8, format: ImageManipulator.SaveFormat.JPEG }
        );

        await uploadPortfolioPhoto(manipResult.uri, 'image/jpeg');
        successCount++;
      }
      await loadData();
      Alert.alert('Thành công', `Đã thêm ${successCount} ảnh vào portfolio.`);
    } catch (err) {
      console.error('Upload error:', err);
      Alert.alert('Lỗi', `Quá trình tải lên bị gián đoạn. Đã tải lên được ${successCount}/${assets.length} ảnh.`);
    } finally {
      setUploading(false);
    }
  }

  const getSignaturePalette = () => {
    const colorsSet = new Set<string>();
    photoData.forEach(p => {
      if (p.dominantColors) {
        p.dominantColors.split(',').forEach(c => {
          const trimmed = c.trim();
          if (trimmed.startsWith('#')) colorsSet.add(trimmed);
        });
      }
    });
    const colorsArray = Array.from(colorsSet).slice(0, 6);
    if (colorsArray.length === 0) {
      return ['#1A1C20', '#E63B00', '#F3E5AB', '#8E9AA6', '#4A5D6E', '#C2B280'];
    }
    return colorsArray;
  };

  const openTagEditor = (index: number) => {
    const photo = photoData[index];
    if (!photo) return;
    setSelectedStyles(photo.styles.map(s => s.id));
    setSelectedConcepts(photo.concepts.map(c => c.id));
    setSelectedTagDesc(null);
    setIsTagModalOpen(true);
  };

  const handleSaveTags = async () => {
    if (viewerIndex === null || !photoData[viewerIndex]) return;
    const photo = photoData[viewerIndex];
    setIsSavingTags(true);
    try {
      await updatePortfolioPhotoTags(photo.id, selectedStyles, selectedConcepts);

      const updatedStyles = stylesList.filter(s => selectedStyles.includes(s.id));
      const updatedConcepts = conceptsList.filter(c => selectedConcepts.includes(c.id));

      setPhotoData(prev => {
        const copy = [...prev];
        copy[viewerIndex] = {
          ...copy[viewerIndex],
          styles: updatedStyles,
          concepts: updatedConcepts,
        };
        return copy;
      });

      setIsTagModalOpen(false);
      Alert.alert('Thành công', 'Đã cập nhật các tag cho tác phẩm.');
    } catch (err) {
      console.log('Update photo tags error:', err);
      Alert.alert('Lỗi', 'Không thể lưu tag. Vui lòng thử lại.');
    } finally {
      setIsSavingTags(false);
    }
  };

  const savePhilosophyText = async () => {
    try {
      setIsSavingTags(true);
      await updateProfile({ quote: philosophyInput });
      if (profile) {
        setProfile({ ...profile, quote: philosophyInput });
      }
      setIsEditingPhilosophy(false);
      Alert.alert('Thành công', 'Đã lưu triết lý nghệ thuật của bạn.');
    } catch (err) {
      console.log('Save philosophy error:', err);
      Alert.alert('Lỗi', 'Không thể lưu triết lý nghệ thuật.');
    } finally {
      setIsSavingTags(false);
    }
  };

  const selectMasterpiece = async (photoId: string) => {
    try {
      setMasterpiecePhotoId(photoId);
      if (profile?.id) {
        await AsyncStorage.setItem(`@masterpiece_${profile.id}`, photoId);
      }
      setIsSelectingMasterpiece(false);
      Alert.alert('Thành công', 'Đã chọn ảnh Masterpiece.');
    } catch (err) {
      console.log('Save masterpiece error:', err);
    }
  };

  const toggleMoodboardSelection = async (photoId: string) => {
    let updated = [...moodboardPhotoIds];
    if (updated.includes(photoId)) {
      updated = updated.filter(id => id !== photoId);
    } else {
      if (updated.length >= 2) {
        // Moodboard only needs 2 images in layout
        updated = [updated[1] || photoId, photoId];
      } else {
        updated.push(photoId);
      }
    }
    setMoodboardPhotoIds(updated);
    if (profile?.id) {
      await AsyncStorage.setItem(`@moodboard_${profile.id}`, JSON.stringify(updated));
    }
  };

  const renderMasterpiece = () => {
    if (photoData.length === 0) return null;
    const latestPhoto = photoData.find(p => p.id === masterpiecePhotoId) || photoData[0];
    const photographerName = profile?.displayName?.toUpperCase() || 'CREATIVE ARTIST';

    return (
      <Animated.View entering={FadeInDown.delay(100).duration(600)} style={styles.masterpieceCard}>
        <Image
          source={{ uri: formatPhotoUrl(latestPhoto.url) }}
          style={styles.masterpieceImage}
          resizeMode="cover"
        />
        <LinearGradient
          colors={['transparent', 'rgba(0,0,0,0.85)']}
          style={styles.masterpieceGradient}
        />

        <Pressable
          style={styles.changeMasterpieceBtn}
          onPress={() => setIsSelectingMasterpiece(true)}
        >
          <Ionicons name="camera-outline" size={20} color="#FFFBF0" />
        </Pressable>

        <View style={styles.masterpieceOverlay}>
          <Text style={styles.masterpieceHeaderLabel}>M A S T E R P I E C E</Text>
          <Text style={styles.masterpieceIssue}>ISSUE #01 / EDITORIAL</Text>

          <View style={styles.masterpieceDivider} />

          <Text style={styles.masterpieceTitleText}>{photographerName}</Text>
          <Text style={styles.masterpieceQuoteText}>
            *"Mỗi bức ảnh là một bài thơ không lời, ghi lại khoảnh khắc chạm đến trái tim."*
          </Text>

          <View style={styles.masterpieceTagsRow}>
            {latestPhoto.styles.slice(0, 2).map(s => (
              <View key={s.id} style={styles.masterpieceTagBadge}>
                <Text style={styles.masterpieceTagText}>{s.name.toUpperCase()}</Text>
              </View>
            ))}
          </View>
        </View>
      </Animated.View>
    );
  };

  const renderPhilosophy = () => {
    const quoteText = profile?.quote ||
      "Nhiếp ảnh là cách ta cảm nhận, chạm và yêu. Những gì ta ghi lại được sẽ còn mãi sau khi mọi thứ đã trôi qua.";

    return (
      <Animated.View entering={FadeInDown.delay(200).duration(600)} style={styles.philosophyCard}>
        <View style={styles.philosophyHeaderRow}>
          <Text style={styles.philosophyLabel}>TRIẾT LÝ NGHỆ THUẬT</Text>
        </View>
        <Pressable
          style={styles.editPhilosophyBtn}
          onPress={() => {
            setPhilosophyInput(quoteText);
            setIsEditingPhilosophy(true);
          }}
        >
          <Ionicons name="create-outline" size={20} color={colors.accent} />
        </Pressable>
        <View style={styles.philosophyQuoteIconWrap} pointerEvents="none">
          <Text style={{ fontSize: 64, color: colors.accent, fontWeight: '900', lineHeight: 64 }}>“</Text>
        </View>
        <Text style={styles.philosophyQuoteText}>
          {quoteText}
        </Text>
        <View style={styles.philosophyFooterLine} />
      </Animated.View>
    );
  };

  const renderMoodboard = () => {
    if (photoData.length < 2) return null;
    let items = photoData.filter(p => moodboardPhotoIds.includes(p.id));
    if (items.length < 2) {
      items = photoData.slice(1, 3);
    }
    if (items.length === 0) return null;

    return (
      <Animated.View entering={FadeInDown.delay(300).duration(600)} style={styles.moodboardContainer}>
        <View style={styles.moodboardHeaderRow}>
          <View style={{ flex: 1 }}>
            <Text style={styles.creativeSectionLabel}>INSPIRATION MOODBOARD</Text>
            <Text style={styles.creativeSectionSub}>Cảm hứng bất tận</Text>
          </View>
          <Pressable
            style={styles.editMoodboardBtn}
            onPress={() => setIsSelectingMoodboard(true)}
          >
            <Ionicons name="create-outline" size={20} color={colors.accent} />
          </Pressable>
        </View>

        <View style={styles.moodboardGrid}>
          {items[0] && (
            <View style={[styles.moodboardPhotoFrame, styles.moodboardPhoto1]}>
              <Image source={{ uri: formatPhotoUrl(items[0].url) }} style={styles.moodboardImage} />
              <Text style={styles.moodboardCaption}>#01 Inspired</Text>
            </View>
          )}
          {items[1] && (
            <View style={[styles.moodboardPhotoFrame, styles.moodboardPhoto2]}>
              <Image source={{ uri: formatPhotoUrl(items[1].url) }} style={styles.moodboardImage} />
              <Text style={styles.moodboardCaption}>#02 Concept</Text>
            </View>
          )}
        </View>
      </Animated.View>
    );
  };

  const renderSignaturePalette = () => {
    if (photoData.length === 0) return null;
    const colorsList = getSignaturePalette();

    return (
      <Animated.View entering={FadeInDown.delay(400).duration(600)} style={styles.paletteContainer}>
        <Text style={styles.creativeSectionLabel}>SIGNATURE PALETTE</Text>
        <Text style={styles.creativeSectionSub}>Bản sắc màu sắc đại diện trong các tác phẩm</Text>
        <View style={styles.paletteRow}>
          {colorsList.map((color, idx) => (
            <View key={`${color}-${idx}`} style={styles.paletteColorCol}>
              <View style={[styles.paletteColorBlock, { backgroundColor: color }]} />
              <Text style={styles.paletteColorCode}>{color}</Text>
            </View>
          ))}
        </View>
      </Animated.View>
    );
  };

  async function handleBulkDelete() {
    if (selectedUrls.length === 0) return;
    Alert.alert(
      'Xóa ảnh',
      `Bạn có chắc chắn muốn xóa ${selectedUrls.length} ảnh đã chọn?`,
      [
        { text: 'Hủy', style: 'cancel' },
        {
          text: 'Xóa',
          style: 'destructive',
          onPress: async () => {
            setLoading(true);
            try {
              for (const url of selectedUrls) {
                await deletePortfolioPhoto(url);
              }
              setPhotoData(prev => {
                const newData = prev.filter(p => !selectedUrls.includes(p.url));
                if (newData.length === 0) setViewerIndex(null);
                return newData;
              });
              setSelectedUrls([]);
            } catch (err) {
              Alert.alert('Lỗi', 'Có lỗi xảy ra khi xóa một số ảnh.');
            } finally {
              setLoading(false);
            }
          }
        }
      ]
    );
  }

  async function handleDeleteSingle(url: string) {
    Alert.alert(
      'Xóa ảnh',
      'Bạn có chắc chắn muốn xóa ảnh này?',
      [
        { text: 'Hủy', style: 'cancel' },
        {
          text: 'Xóa',
          style: 'destructive',
          onPress: async () => {
            try {
              await deletePortfolioPhoto(url);
              setPhotoData(prev => {
                const newData = prev.filter(p => p.url !== url);
                if (newData.length === 0) {
                  setViewerIndex(null);
                } else if (viewerIndex !== null && viewerIndex >= newData.length) {
                  setViewerIndex(newData.length - 1);
                }
                return newData;
              });
            } catch (err) {
              Alert.alert('Lỗi', 'Không thể xóa ảnh.');
            }
          }
        }
      ]
    );
  }

  const toggleSelection = (url: string) => {
    setSelectedUrls(prev =>
      prev.includes(url) ? prev.filter(u => u !== url) : [...prev, url]
    );
  };

  const isSelecting = selectedUrls.length > 0;

  let h1 = 0;
  let h2 = 0;
  const positions = photoData.map((p, idx) => {
    const itemHeight = colWidth / p.aspectRatio;
    let top = 0;
    let left = 0;

    if (h1 <= h2) {
      top = h1;
      left = 0;
      h1 += itemHeight + 16;
    } else {
      top = h2;
      left = colWidth + 16;
      h2 += itemHeight + 16;
    }

    return { ...p, originalIndex: idx, top, left, height: itemHeight };
  });

  const containerHeight = Math.max(h1, h2);

  const scrollToThumbnail = (index: number) => {
    if (!thumbnailsRef.current) return;
    const center = 45 + index * 62;
    const scrollX = center - SCREEN_WIDTH / 2;
    thumbnailsRef.current.scrollTo({ x: Math.max(0, scrollX), animated: true });
  };

  if (loading && photoData.length === 0) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.accent} />
      </View>
    );
  }

  return (
    <View style={[styles.safe, { paddingTop: insets.top }]}>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <Animated.View entering={FadeInDown.duration(600)} style={styles.header}>
          {isSelecting ? (
            <View style={[styles.headerRow, { alignItems: 'center' }]}>
              <Pressable style={styles.cancelBtn} onPress={() => setSelectedUrls([])}>
                <Text style={styles.cancelText}>Hủy</Text>
              </Pressable>
              <Text style={[styles.title, { fontSize: 24, textShadowRadius: 0 }]}>Đã chọn {selectedUrls.length}</Text>
              <Pressable style={styles.bulkDeleteBtn} onPress={handleBulkDelete}>
                <Ionicons name="trash" size={24} color="#ff4444" />
              </Pressable>
            </View>
          ) : (
            <View style={styles.hudContainer}>
              {/* Top Row with Back Button */}
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8, zIndex: 10 }}>
                <Pressable style={styles.hudModeDialBtn} onPress={() => navigation.goBack()}>
                  <Ionicons name="chevron-back" size={20} color={isDark ? colors.accent : colors.text} />
                </Pressable>
                <View style={styles.hudRecContainer}>
                  <View style={styles.hudRecDot} />
                  <Text style={styles.hudRecText}>REC</Text>
                </View>
                <Text style={styles.hudFormatText}>RAW 16:9</Text>
              </View>

              {/* HUD Main Title with Lens focus brackets */}
              <View style={styles.hudTitleWrapper}>
                <Text style={styles.hudBracketLeft}>[</Text>
                <View style={styles.hudTitleCenter}>
                  <Text style={styles.hudTitle}>PORTFOLIO</Text>
                  <Text style={styles.hudSub}>EXHIBITION // ACTIVE</Text>
                </View>
                <Text style={styles.hudBracketRight}>]</Text>
              </View>

              {/* HUD Bottom Bar showing photographer stats as camera settings */}
              <View style={styles.hudBottomBar}>
                <Text style={styles.hudMetaText}>ISO {photoData.length * 10 || 100}</Text>
                <Text style={styles.hudMetaText}>F/2.8</Text>
                <Text style={styles.hudMetaText}>1/250s</Text>
                <Text style={styles.hudMetaText}>EV +0.7</Text>
              </View>
            </View>
          )}
        </Animated.View>

        {/* ARTISTIC REDESIGNED SECTIONS */}
        {!isSelecting && photoData.length > 0 && (
          <>
            {renderMasterpiece()}
            {renderPhilosophy()}
            {renderMoodboard()}
            {renderSignaturePalette()}
          </>
        )}

        {/* QUICK VIEW SECTION (RESTORED) */}
        {!isSelecting && photoData.length > 0 && (
          <View style={{ marginBottom: 4 }}>
            <Text style={styles.sectionLabel}>Xem nhanh</Text>
            <Text style={styles.sectionHint}>Ảnh mới nhất — chạm để mở</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 12, paddingVertical: 8 }}>
              {[...photoData].reverse().slice(0, 12).map((item, idx) => (
                <Pressable
                  key={`quick-${item.originalIndex ?? idx}-${idx}`}
                  style={styles.quickPhotoWrap}
                  onPress={() => setViewerIndex(item.originalIndex ?? 0)}
                >
                  <PortfolioImageCell
                    uri={item.url}
                    style={styles.fullImage}
                    resizeMode="cover"
                    borderRadius={14}
                  />
                </Pressable>
              ))}
            </ScrollView>
          </View>
        )}

        {!isSelecting && photoData.length > 0 && (
          <View style={{ marginBottom: 12, marginTop: 16 }}>
            <Text style={styles.sectionLabel}>Toàn bộ thư viện</Text>
            <Text style={styles.sectionHint}>Masonry 2 cột — giữ nguyên tỷ lệ ảnh</Text>
          </View>
        )}

        {/* MASONRY GALLERY */}
        <View style={styles.galleryContainer}>
          {photoData.length > 0 ? (
            <View style={{ height: containerHeight, width: '100%', position: 'relative' }}>
              {positions.map((item, index) => {
                const isSelected = selectedUrls.includes(item.url);
                return (
                  <Animated.View
                    key={`m-${item.originalIndex ?? index}`}
                    entering={FadeIn.delay(Math.min(index * 40, 400)).duration(350)}
                    style={{ position: 'absolute', top: item.top, left: item.left, width: colWidth, height: item.height }}
                  >
                    <Pressable
                      style={{ width: '100%', height: '100%' }}
                      onPress={() => {
                        if (isSelecting) toggleSelection(item.url);
                        else setViewerIndex(item.originalIndex!);
                      }}
                      onLongPress={() => {
                        if (!isSelecting) toggleSelection(item.url);
                      }}
                    >
                      <PortfolioImageCell
                        uri={item.url}
                        style={[
                          styles.masonryImage,
                          isSelected && { opacity: 0.8 }
                        ]}
                        borderRadius={12}
                        resizeMode="cover"
                      />

                      {/* Grid Item Tag Badges Overlay */}
                      {((item.styles && item.styles.length > 0) || (item.concepts && item.concepts.length > 0)) && (
                        <View style={styles.gridTagBadgesOverlay}>
                          {item.styles.slice(0, 1).map(s => (
                            <View key={s.id} style={styles.gridMiniTag}>
                              <Text style={styles.gridMiniTagText}>{s.name}</Text>
                            </View>
                          ))}
                          {item.concepts.slice(0, 1).map(c => (
                            <View key={c.id} style={[styles.gridMiniTag, { backgroundColor: 'rgba(230,59,0,0.6)' }]}>
                              <Text style={styles.gridMiniTagText}>{c.name}</Text>
                            </View>
                          ))}
                        </View>
                      )}

                      {/* Checkmark overlay */}
                      {isSelecting && (
                        <View style={[styles.selectOverlay, isSelected && styles.selectOverlayActive]}>
                          {isSelected && <Ionicons name="checkmark" size={18} color="#FFFBF0" />}
                        </View>
                      )}
                    </Pressable>
                  </Animated.View>
                );
              })}
            </View>
          ) : (
            <View style={styles.emptyState}>
              <Ionicons name="camera-outline" size={64} color={colors.border} />
              <Text style={styles.emptyText}>Bộ sưu tập trống trải</Text>
              <Text style={styles.emptySubText}>Hãy thêm vài tác phẩm để khách hàng trầm trồ</Text>
            </View>
          )}
        </View>

        <View style={{ height: 90 }} />
      </ScrollView>

      {/* FLOATING ACTION BUTTON */}
      {!isSelecting && (
        <Animated.View entering={FadeInUp.delay(400).duration(600)} style={[styles.fabContainer, { bottom: Math.max(8, insets.bottom - 6) }]}>
          <Pressable onPress={handlePickImage} disabled={uploading} style={({ pressed }) => [styles.fabBtn, pressed && { transform: [{ scale: 0.85 }] }]}>
            <LinearGradient colors={[colors.accent, '#e63b00']} style={styles.fabGradient} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}>
              {uploading ? <ActivityIndicator color="#FFFBF0" /> : <Ionicons name="add" size={32} color="#FFFBF0" />}
            </LinearGradient>
          </Pressable>
        </Animated.View>
      )}

      {/* IMAGE VIEWER OVERLAY VIEW */}
      {viewerIndex !== null && (
        <View style={[StyleSheet.absoluteFill, styles.viewerBackground, { zIndex: 9999, paddingTop: Math.max(20, insets.top + 10), paddingBottom: Math.max(16, insets.bottom + 10) }]}>

          {/* Header */}
          <View style={styles.viewerHeader}>
            <Pressable style={styles.viewerClose} onPress={() => setViewerIndex(null)}>
              <Ionicons name="close" size={28} color="#FFFBF0" />
            </Pressable>

            <View style={{ flexDirection: 'row', gap: 12 }}>
              {viewerIndex !== null && photoData[viewerIndex] && (
                <Pressable
                  style={styles.viewerActionButton}
                  onPress={() => openTagEditor(viewerIndex!)}
                >
                  <Ionicons name="create-outline" size={20} color="#FFFBF0" />
                  <Text style={styles.viewerActionText}>Gắn thẻ</Text>
                </Pressable>
              )}
              {viewerIndex !== null && photoData[viewerIndex] && (
                <Pressable style={styles.viewerDelete} onPress={() => handleDeleteSingle(photoData[viewerIndex!].url)}>
                  <Ionicons name="trash-outline" size={24} color="#ff4444" />
                </Pressable>
              )}
            </View>
          </View>

          {/* Grouping Image, Tags and Thumbnails to shift them down visually without changing layout bounds (prevents image shrinking) */}
          <View style={{ flex: 1, transform: [{ translateY: 10 }] }}>
            {/* Main Full-Screen Area */}
            <View style={{ flex: 1, flexDirection: 'row', alignItems: 'center', position: 'relative' }} {...panResponder.panHandlers}>
              <FlatList
                ref={flatListRef}
                data={photoData}
                horizontal
                pagingEnabled
                showsHorizontalScrollIndicator={false}
                initialScrollIndex={viewerIndex !== null && viewerIndex < photoData.length ? viewerIndex : 0}
                getItemLayout={(data, index) => ({ length: SCREEN_WIDTH, offset: SCREEN_WIDTH * index, index })}
                onViewableItemsChanged={onViewableItemsChanged}
                viewabilityConfig={viewabilityConfig}
                renderItem={({ item }) => (
                  <View style={{ width: SCREEN_WIDTH, flex: 1, flexDirection: 'column', paddingBottom: 6 }}>
                    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', width: SCREEN_WIDTH, overflow: 'hidden' }}>
                      <PortfolioImageCell
                        uri={item.url}
                        style={{ width: SCREEN_WIDTH * 0.9, height: SCREEN_HEIGHT * 0.6 }}
                        borderRadius={8}
                        resizeMode="contain"
                      />
                    </View>

                    {/* Clean Tags positioned at the bottom of the middle area, right under the image */}
                    <View style={{ minHeight: 60, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 16 }}>
                      <ScrollView
                        horizontal
                        showsHorizontalScrollIndicator={false}
                        contentContainerStyle={styles.viewerTagsContainer}
                        style={{ flexGrow: 0, paddingVertical: 10, width: '100%' }}
                      >
                        {item.styles.length === 0 && item.concepts.length === 0 ? (
                          <Text style={styles.noTagsText}>Nhấn "Gắn thẻ" để phân loại ảnh</Text>
                        ) : (
                          <>
                            {item.styles.map((s: Style) => (
                              <Pressable
                                key={s.id}
                                style={styles.viewerTagBadge}
                                onPress={() => {
                                  setActiveViewerDesc(prev =>
                                    prev?.name === s.name ? null : { name: s.name, description: s.description }
                                  );
                                }}
                              >
                                <Text style={styles.viewerTagText}>#{s.name}</Text>
                              </Pressable>
                            ))}
                            {item.concepts.map((c: Concept) => (
                              <Pressable
                                key={c.id}
                                style={[styles.viewerTagBadge, { backgroundColor: 'rgba(230,59,0,0.4)' }]}
                                onPress={() => {
                                  setActiveViewerDesc(prev =>
                                    prev?.name === c.name ? null : { name: c.name, description: c.description }
                                  );
                                }}
                              >
                                <Text style={styles.viewerTagText}>#{c.name}</Text>
                              </Pressable>
                            ))}
                          </>
                        )}
                      </ScrollView>

                      {activeViewerDesc && (
                        <View style={styles.viewerDescBox}>
                          <Text style={styles.viewerDescText}>
                            <Text style={{ fontWeight: 'bold', color: colors.accent }}>{activeViewerDesc.name}: </Text>
                            {activeViewerDesc.description || 'Chưa có mô tả cho thẻ này.'}
                          </Text>
                        </View>
                      )}
                    </View>
                  </View>
                )}
                keyExtractor={item => item.url}
              />
            </View>

            {/* Thumbnails Row */}
            <View style={styles.viewerFooter}>
              <ScrollView
                ref={thumbnailsRef}
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.thumbnailsScroll}
              >
                {photoData.map((p, i) => (
                  <Pressable key={p.url} onPress={() => {
                    setViewerIndex(i);
                    flatListRef.current?.scrollToIndex({ index: i, animated: false });
                    scrollToThumbnail(i);
                  }}>
                    <Image
                      source={{ uri: formatPhotoUrl(p.url) }}
                      style={[styles.thumbnail, i === viewerIndex && styles.thumbnailActive]}
                    />
                  </Pressable>
                ))}
              </ScrollView>
            </View>
          </View>
        </View>
      )}


      {/* MASTERPIECE SELECTOR MODAL */}
      <Modal visible={isSelectingMasterpiece} transparent={true} animationType="fade" onRequestClose={() => setIsSelectingMasterpiece(false)}>
        <View style={styles.pickerOverlay}>
          <SafeAreaView style={styles.pickerContainer}>
            <View style={styles.pickerHeader}>
              <Text style={styles.pickerTitle}>Chọn ảnh Masterpiece</Text>
              <Pressable style={styles.pickerCloseBtn} onPress={() => setIsSelectingMasterpiece(false)}>
                <Ionicons name="close" size={24} color={colors.text} />
              </Pressable>
            </View>
            <FlatList
              data={photoData}
              numColumns={3}
              keyExtractor={item => item.id}
              contentContainerStyle={styles.pickerList}
              renderItem={({ item }) => (
                <Pressable
                  style={styles.pickerGridItem}
                  onPress={() => selectMasterpiece(item.id)}
                >
                  <Image source={{ uri: formatPhotoUrl(item.url) }} style={styles.pickerGridImage} />
                  {masterpiecePhotoId === item.id && (
                    <View style={styles.pickerSelectedBadge}>
                      <Ionicons name="checkmark-circle" size={20} color={colors.accent} />
                    </View>
                  )}
                </Pressable>
              )}
            />
          </SafeAreaView>
        </View>
      </Modal>

      {/* MOODBOARD SELECTOR MODAL */}
      <Modal visible={isSelectingMoodboard} transparent={true} animationType="fade" onRequestClose={() => setIsSelectingMoodboard(false)}>
        <View style={styles.pickerOverlay}>
          <SafeAreaView style={styles.pickerContainer}>
            <View style={styles.pickerHeader}>
              <View>
                <Text style={styles.pickerTitle}>Thiết kế Moodboard</Text>
                <Text style={styles.pickerSubtitle}>Chọn 2 ảnh truyền cảm hứng ({moodboardPhotoIds.length}/2)</Text>
              </View>
              <Pressable style={styles.pickerCloseBtn} onPress={() => setIsSelectingMoodboard(false)}>
                <Ionicons name="checkmark" size={24} color={colors.accent} />
              </Pressable>
            </View>
            <FlatList
              data={photoData}
              numColumns={3}
              keyExtractor={item => item.id}
              contentContainerStyle={styles.pickerList}
              renderItem={({ item }) => {
                const isSelected = moodboardPhotoIds.includes(item.id);
                return (
                  <Pressable
                    style={styles.pickerGridItem}
                    onPress={() => toggleMoodboardSelection(item.id)}
                  >
                    <Image source={{ uri: formatPhotoUrl(item.url) }} style={styles.pickerGridImage} />
                    {isSelected && (
                      <View style={styles.pickerSelectedBadge}>
                        <Ionicons name="checkmark-circle" size={20} color={colors.accent} />
                      </View>
                    )}
                  </Pressable>
                );
              }}
            />
          </SafeAreaView>
        </View>
      </Modal>

      {/* PHILOSOPHY EDIT DIALOG MODAL */}
      <Modal visible={isEditingPhilosophy} transparent={true} animationType="fade" onRequestClose={() => setIsEditingPhilosophy(false)}>
        <View style={styles.philosophyDialogOverlay}>
          <View style={styles.philosophyDialogContainer}>
            <Text style={styles.philosophyDialogTitle}>Sửa triết lý nghệ thuật</Text>
            <TextInput
              style={styles.philosophyTextInput}
              multiline
              numberOfLines={4}
              placeholder="Nhập châm ngôn, triết lý sáng tạo hoặc câu quote nghệ thuật..."
              placeholderTextColor={colors.textMuted}
              value={philosophyInput}
              onChangeText={setPhilosophyInput}
            />
            <View style={styles.philosophyDialogButtons}>
              <Pressable style={styles.philosophyDialogCancelBtn} onPress={() => setIsEditingPhilosophy(false)}>
                <Text style={styles.philosophyDialogCancelText}>Hủy</Text>
              </Pressable>
              <Pressable style={styles.philosophyDialogSaveBtn} onPress={savePhilosophyText}>
                <Text style={styles.philosophyDialogSaveText}>Lưu</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>

      {/* TAG EDITOR MODAL */}
      <Modal visible={isTagModalOpen} transparent={true} animationType="slide" onRequestClose={() => setIsTagModalOpen(false)}>
        <View style={styles.tagEditorOverlay}>
          <SafeAreaView style={styles.tagEditorContainer}>
            <View style={styles.tagEditorHeader}>
              <Text style={styles.tagEditorTitle}>Gắn tag phân loại ảnh</Text>
              <Pressable style={styles.tagEditorCloseBtn} onPress={() => setIsTagModalOpen(false)}>
                <Ionicons name="close" size={24} color={colors.text} />
              </Pressable>
            </View>

            <ScrollView contentContainerStyle={styles.tagEditorScroll}>
              <View style={styles.tagSection}>
                <Text style={styles.tagSectionTitle}>PHONG CÁCH (STYLES)</Text>
                <Text style={styles.tagSectionDesc}>Gợi ý phong cách thiết kế, tone ảnh hoặc nét đặc trưng riêng</Text>
                <View style={styles.chipsContainer}>
                  {stylesList.map(s => {
                    const isSelected = selectedStyles.includes(s.id);
                    return (
                      <Pressable
                        key={s.id}
                        onPress={() => {
                          setSelectedStyles(prev =>
                            prev.includes(s.id) ? prev.filter(id => id !== s.id) : [...prev, s.id]
                          );
                          setSelectedTagDesc({ name: s.name, description: s.description });
                        }}
                        style={[styles.tagChip, isSelected && styles.tagChipActive]}
                      >
                        <Text style={[styles.tagChipText, isSelected && styles.tagChipTextActive]}>
                          {s.name}
                        </Text>
                      </Pressable>
                    );
                  })}
                </View>
              </View>

              <View style={styles.tagSection}>
                <Text style={styles.tagSectionTitle}>Ý TƯỞNG (CONCEPTS)</Text>
                <Text style={styles.tagSectionDesc}>Gợi ý bối cảnh, chủ đề sáng tạo hoặc concept nghệ thuật</Text>
                <View style={styles.chipsContainer}>
                  {conceptsList.map(c => {
                    const isSelected = selectedConcepts.includes(c.id);
                    return (
                      <Pressable
                        key={c.id}
                        onPress={() => {
                          setSelectedConcepts(prev =>
                            prev.includes(c.id) ? prev.filter(id => id !== c.id) : [...prev, c.id]
                          );
                          setSelectedTagDesc({ name: c.name, description: c.description });
                        }}
                        style={[styles.tagChip, isSelected && [styles.tagChipActive, { backgroundColor: 'rgba(230,59,0,0.15)', borderColor: '#e63b00' }]]}
                      >
                        <Text style={[styles.tagChipText, isSelected && [styles.tagChipTextActive, { color: '#e63b00' }]]}>
                          {c.name}
                        </Text>
                      </Pressable>
                    );
                  })}
                </View>
              </View>
            </ScrollView>

            {selectedTagDesc && (
              <View style={styles.tagDescriptionBox}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                  <Ionicons name="information-circle-outline" size={16} color={colors.accent} />
                  <Text style={styles.tagDescriptionTitle}>{selectedTagDesc.name}</Text>
                </View>
                <Text style={styles.tagDescriptionText}>
                  {selectedTagDesc.description || 'Chưa có mô tả chi tiết cho thẻ này.'}
                </Text>
              </View>
            )}

            <View style={styles.tagEditorFooter}>
              <Pressable style={styles.tagEditorCancelBtn} onPress={() => setIsTagModalOpen(false)}>
                <Text style={styles.tagEditorCancelText}>Hủy</Text>
              </Pressable>

              <Pressable
                style={styles.tagEditorSaveBtn}
                onPress={handleSaveTags}
                disabled={isSavingTags}
              >
                {isSavingTags ? (
                  <ActivityIndicator size="small" color="#FFFBF0" />
                ) : (
                  <Text style={styles.tagEditorSaveText}>Lưu thay đổi</Text>
                )}
              </Pressable>
            </View>
          </SafeAreaView>
        </View>
      </Modal>
    </View>
  );
}

const getStyles = (colors: any, isDark: boolean) => StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.background },
  scroll: { paddingHorizontal: 16, paddingTop: 16, gap: 24 },

  header: { marginBottom: 8 },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  title: isDark
    ? { fontSize: 36, fontWeight: '900', color: '#FFFBF0', letterSpacing: -1, textShadowColor: colors.accent, textShadowRadius: 12, textShadowOffset: { width: 0, height: 2 } }
    : { fontSize: 36, fontWeight: '900', color: colors.text, letterSpacing: -1 },
  sub: isDark
    ? { fontSize: 14, color: 'rgba(255, 255, 255, 0.7)', marginTop: 4, fontWeight: '500' }
    : { fontSize: 14, color: colors.textMuted, marginTop: 4, fontStyle: 'italic' },
  backBtn: isDark
    ? { width: 44, height: 44, borderRadius: 22, backgroundColor: 'rgba(255,255,255,0.1)', justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: colors.accent }
    : { width: 44, height: 44, borderRadius: 22, backgroundColor: colors.surface, justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: colors.border, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4, elevation: 2 },
  sectionLabel: { fontSize: 11, fontWeight: '800', letterSpacing: 2, textTransform: 'uppercase', color: colors.textLight },
  sectionHint: { fontSize: 12, color: colors.textMuted, marginTop: 4, marginBottom: 2 },

  galleryContainer: { flex: 1 },
  masonryImage: { width: '100%', height: '100%', borderRadius: 12, backgroundColor: colors.surfaceStrong },
  quickPhotoWrap: { width: 108, height: 148, borderRadius: 14, overflow: 'hidden', backgroundColor: colors.surfaceStrong },
  fullImage: { width: '100%', height: '100%' },

  // Selection Styles
  selectOverlay: {
    position: 'absolute',
    top: 8, right: 8,
    width: 28, height: 28,
    borderRadius: 14,
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.8)',
    backgroundColor: 'rgba(0,0,0,0.3)',
    justifyContent: 'center', alignItems: 'center',
  },
  selectOverlayActive: {
    backgroundColor: colors.accent,
    borderColor: colors.accent,
  },
  cancelBtn: { paddingVertical: 8, paddingRight: 16 },
  cancelText: { color: colors.text, fontSize: 16, fontWeight: '600' },
  bulkDeleteBtn: { width: 44, height: 44, borderRadius: 22, backgroundColor: 'rgba(255,68,68,0.15)', justifyContent: 'center', alignItems: 'center' },

  emptyState: { height: 300, justifyContent: 'center', alignItems: 'center', gap: 12 },
  emptyText: { color: colors.text, fontSize: 18, fontWeight: '600' },
  emptySubText: { color: colors.textMuted, fontSize: 14 },

  fabContainer: {
    position: 'absolute',
    bottom: 20,
    right: 20,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#e63b00',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
  },
  fabBtn: { overflow: 'hidden', borderRadius: 28 },
  fabGradient: { width: 56, height: 56, justifyContent: 'center', alignItems: 'center' },

  // --- VIEWER STYLES ---
  viewerBackground: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.95)',
    flexDirection: 'column',
  },
  viewerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 10,
    width: '100%',
  },
  viewerClose: {
    width: 44, height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255,255,255,0.1)',
    justifyContent: 'center', alignItems: 'center',
  },
  viewerDelete: {
    width: 44, height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255,68,68,0.15)',
    justifyContent: 'center', alignItems: 'center',
  },
  viewerFooter: {
    height: 70,
    width: '100%',
    justifyContent: 'center',
    marginBottom: 8,
  },
  thumbnailsScroll: {
    paddingHorizontal: 20,
    alignItems: 'center',
    gap: 12,
  },
  thumbnail: {
    width: 50, height: 50,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: 'transparent',
    opacity: 0.5,
  },
  thumbnailActive: {
    borderColor: colors.accent,
    opacity: 1,
    transform: [{ scale: 1.1 }],
  },

  // Masterpiece Section
  masterpieceCard: {
    height: 380,
    borderRadius: 16,
    overflow: 'hidden',
    position: 'relative',
    backgroundColor: '#000',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.25,
    shadowRadius: 16,
    elevation: 8,
  },
  masterpieceImage: {
    width: '100%',
    height: '100%',
    opacity: 0.8,
  },
  masterpieceGradient: {
    ...StyleSheet.absoluteFillObject,
  },
  masterpieceOverlay: {
    position: 'absolute',
    bottom: 24,
    left: 20,
    right: 20,
  },
  masterpieceHeaderLabel: {
    color: '#FFFBF0',
    fontSize: 12,
    fontWeight: '300',
    letterSpacing: 6,
    opacity: 0.9,
  },
  masterpieceIssue: {
    color: '#FFFBF0',
    fontSize: 10,
    fontWeight: '600',
    opacity: 0.5,
    marginTop: 4,
    letterSpacing: 1,
  },
  masterpieceDivider: {
    height: 1,
    backgroundColor: 'rgba(255, 251, 240, 0.2)',
    marginVertical: 14,
  },
  masterpieceTitleText: {
    color: '#FFFBF0',
    fontSize: 28,
    fontWeight: '800',
    letterSpacing: -0.5,
  },
  masterpieceQuoteText: {
    color: '#FFFBF0',
    fontSize: 13,
    fontStyle: 'italic',
    lineHeight: 18,
    opacity: 0.8,
    marginTop: 8,
  },
  masterpieceTagsRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 12,
  },
  masterpieceTagBadge: {
    backgroundColor: 'rgba(255, 251, 240, 0.15)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    borderWidth: 0.5,
    borderColor: 'rgba(255, 251, 240, 0.3)',
  },
  masterpieceTagText: {
    color: '#FFFBF0',
    fontSize: 9,
    fontWeight: '700',
    letterSpacing: 1,
  },

  // Philosophy Card
  philosophyCard: {
    backgroundColor: isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.03)',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.06)',
    padding: 24,
    position: 'relative',
    overflow: 'hidden',
  },
  philosophyQuoteIconWrap: {
    position: 'absolute',
    top: 16,
    right: 56,
    opacity: 0.1,
    zIndex: 0,
  },
  philosophyLabel: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 2,
    color: colors.accent,
    marginBottom: 10,
  },
  philosophyQuoteText: {
    fontSize: 15,
    lineHeight: 22,
    color: colors.text,
    fontStyle: 'italic',
    fontWeight: '400',
  },
  philosophyFooterLine: {
    width: 40,
    height: 2,
    backgroundColor: colors.accent,
    marginTop: 16,
  },

  // Moodboard Section
  moodboardContainer: {
    gap: 10,
  },
  creativeSectionLabel: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 2,
    textTransform: 'uppercase',
    color: colors.textLight,
  },
  creativeSectionSub: {
    fontSize: 12,
    color: colors.textMuted,
    marginTop: 4,
  },
  moodboardGrid: {
    flexDirection: 'row',
    height: 240,
    justifyContent: 'space-between',
    paddingHorizontal: 8,
    alignItems: 'center',
    marginVertical: 10,
  },
  moodboardPhotoFrame: {
    backgroundColor: '#fff',
    padding: 8,
    paddingBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.15,
    shadowRadius: 10,
    elevation: 4,
  },
  moodboardPhoto1: {
    width: '46%',
    height: 200,
    transform: [{ rotate: '-4deg' }],
  },
  moodboardPhoto2: {
    width: '46%',
    height: 210,
    transform: [{ rotate: '3deg' }],
    marginTop: 16,
  },
  moodboardImage: {
    width: '100%',
    height: '85%',
    backgroundColor: colors.surfaceStrong,
  },
  moodboardCaption: {
    fontSize: 10,
    fontWeight: '600',
    color: '#333',
    textAlign: 'center',
    marginTop: 8,
  },

  // Palette Section
  paletteContainer: {
    gap: 10,
  },
  paletteRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: isDark ? 'rgba(255, 255, 255, 0.03)' : 'rgba(0, 0, 0, 0.02)',
    padding: 16,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.04)',
  },
  paletteColorCol: {
    alignItems: 'center',
    flex: 1,
  },
  paletteColorBlock: {
    width: 38,
    height: 38,
    borderRadius: 19,
    marginBottom: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  paletteColorCode: {
    fontSize: 9,
    fontFamily: 'monospace',
    color: colors.textMuted,
  },

  // Grid Mini Tag Badges
  gridTagBadgesOverlay: {
    position: 'absolute',
    bottom: 8,
    left: 8,
    right: 8,
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 4,
  },
  gridMiniTag: {
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  gridMiniTagText: {
    color: '#FFFBF0',
    fontSize: 9,
    fontWeight: '600',
  },

  // Upgraded Viewer Actions
  viewerActionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.15)',
    gap: 6,
  },
  viewerActionText: {
    color: '#FFFBF0',
    fontSize: 13,
    fontWeight: '600',
  },
  viewerTagsOverlay: {
    position: 'absolute',
    left: 20,
    right: 20,
    zIndex: 10,
  },
  viewerTagsContainer: {
    flexDirection: 'row',
    gap: 6,
    paddingHorizontal: 20,
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: '100%',
  },
  viewerTagBadge: {
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  viewerTagText: {
    color: '#FFFBF0',
    fontSize: 11,
    fontWeight: '600',
  },
  noTagsText: {
    color: '#FFFBF0',
    fontSize: 12,
    opacity: 0.7,
    fontStyle: 'italic',
    textAlign: 'center',
  },

  // Tag Editor Overlay Modal
  tagEditorOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'flex-end',
  },
  tagEditorContainer: {
    backgroundColor: colors.background,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '80%',
    paddingBottom: 20,
  },
  tagEditorHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderColor: colors.border,
  },
  tagEditorTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.text,
  },
  tagEditorCloseBtn: {
    padding: 4,
  },
  tagEditorScroll: {
    padding: 20,
    gap: 24,
  },
  tagSection: {
    gap: 8,
  },
  tagSectionTitle: {
    fontSize: 12,
    fontWeight: '800',
    color: colors.accent,
    letterSpacing: 1,
  },
  tagSectionDesc: {
    fontSize: 12,
    color: colors.textMuted,
    marginBottom: 4,
  },
  chipsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  tagChip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  tagChipActive: {
    backgroundColor: 'rgba(255, 74, 11, 0.1)',
    borderColor: colors.accent,
  },
  tagChipText: {
    fontSize: 13,
    color: colors.text,
  },
  tagChipTextActive: {
    fontWeight: '600',
    color: colors.accent,
  },
  tagEditorFooter: {
    flexDirection: 'row',
    padding: 20,
    gap: 12,
    borderTopWidth: 1,
    borderColor: colors.border,
  },
  tagEditorCancelBtn: {
    flex: 1,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },
  tagEditorCancelText: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.text,
  },
  tagEditorSaveBtn: {
    flex: 2,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.accent,
    justifyContent: 'center',
    alignItems: 'center',
  },
  tagEditorSaveText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#FFFBF0',
  },
  viewerDescBox: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 8,
    paddingVertical: 8,
    paddingHorizontal: 12,
    marginTop: 4,
    maxWidth: SCREEN_WIDTH * 0.9,
    alignSelf: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.15)',
  },
  viewerDescText: {
    color: '#FFFBF0',
    fontSize: 13,
    textAlign: 'center',
    lineHeight: 18,
  },
  tagDescriptionBox: {
    backgroundColor: colors.surfaceStrong,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    padding: 12,
    marginHorizontal: 16,
    marginBottom: 8,
  },
  tagDescriptionTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.text,
  },
  tagDescriptionText: {
    fontSize: 12,
    color: colors.textMuted,
    lineHeight: 16,
  },

  // Camera HUD view styles
  hudContainer: {
    padding: 16,
    borderWidth: 1,
    borderColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)',
    borderRadius: 12,
    backgroundColor: isDark ? 'rgba(0,0,0,0.4)' : 'rgba(255,255,255,0.4)',
    gap: 12,
    position: 'relative',
  },
  hudTopBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  hudRecContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  hudRecDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#ff4444',
  },
  hudRecText: {
    color: '#ff4444',
    fontSize: 10,
    fontFamily: 'monospace',
    fontWeight: '700',
  },
  hudFormatText: {
    color: colors.textMuted,
    fontSize: 10,
    fontFamily: 'monospace',
  },
  hudTitleWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 14,
    marginVertical: 4,
  },
  hudBracketLeft: {
    fontSize: 32,
    fontWeight: '200',
    color: colors.accent,
  },
  hudBracketRight: {
    fontSize: 32,
    fontWeight: '200',
    color: colors.accent,
  },
  hudTitleCenter: {
    alignItems: 'center',
  },
  hudTitle: {
    fontSize: 28,
    fontWeight: '900',
    color: colors.text,
    letterSpacing: 6,
  },
  hudSub: {
    fontSize: 9,
    color: colors.textMuted,
    letterSpacing: 2,
    marginTop: 2,
    fontFamily: 'monospace',
  },
  hudBottomBar: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)',
    paddingVertical: 6,
  },
  hudMetaText: {
    fontSize: 10,
    fontFamily: 'monospace',
    color: colors.textMuted,
    fontWeight: '600',
  },
  hudModeDialBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: isDark ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.2)',
    borderStyle: 'dashed',
    justifyContent: 'center',
    alignItems: 'center',
  },

  // Edit / Change Button Styles on layout cards
  changeMasterpieceBtn: {
    position: 'absolute',
    top: 16,
    right: 16,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.6)',
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 0.5,
    borderColor: 'rgba(255,255,255,0.3)',
    zIndex: 10,
  },
  changeMasterpieceText: {
    color: '#FFFBF0',
    fontSize: 11,
    fontWeight: '600',
  },
  philosophyHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  editPhilosophyBtn: {
    position: 'absolute',
    top: 16,
    right: 16,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.04)',
    width: 32,
    height: 32,
    borderRadius: 16,
    zIndex: 10,
  },
  editPhilosophyText: {
    fontSize: 10,
    fontWeight: '700',
    color: colors.accent,
    letterSpacing: 0.5,
  },
  moodboardHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingRight: 16,
  },
  editMoodboardBtn: {
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.04)',
    width: 32,
    height: 32,
    borderRadius: 16,
  },
  editMoodboardText: {
    fontSize: 10,
    fontWeight: '700',
    color: colors.accent,
    letterSpacing: 0.5,
  },

  // Picker Overlay Modals style
  pickerOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'flex-end',
  },
  pickerContainer: {
    backgroundColor: colors.background,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    height: '75%',
  },
  pickerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderColor: colors.border,
  },
  pickerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.text,
  },
  pickerSubtitle: {
    fontSize: 12,
    color: colors.textMuted,
    marginTop: 2,
  },
  pickerCloseBtn: {
    padding: 4,
  },
  pickerList: {
    padding: 10,
  },
  pickerGridItem: {
    flex: 1 / 3,
    aspectRatio: 1,
    margin: 4,
    borderRadius: 8,
    overflow: 'hidden',
    position: 'relative',
    backgroundColor: colors.surfaceStrong,
  },
  pickerGridImage: {
    width: '100%',
    height: '100%',
  },
  pickerSelectedBadge: {
    position: 'absolute',
    top: 4,
    right: 4,
    backgroundColor: 'rgba(0,0,0,0.6)',
    borderRadius: 12,
  },

  // Philosophy input dialog modal style
  philosophyDialogOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  philosophyDialogContainer: {
    backgroundColor: colors.background,
    borderRadius: 16,
    padding: 20,
    width: '100%',
    maxWidth: 340,
    gap: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.25,
    shadowRadius: 16,
    elevation: 10,
  },
  philosophyDialogTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.text,
  },
  philosophyTextInput: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    padding: 12,
    color: colors.text,
    fontSize: 14,
    height: 100,
    textAlignVertical: 'top',
    backgroundColor: colors.surface,
  },
  philosophyDialogButtons: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 12,
  },
  philosophyDialogCancelBtn: {
    paddingVertical: 8,
    paddingHorizontal: 16,
  },
  philosophyDialogCancelText: {
    color: colors.textMuted,
    fontSize: 14,
    fontWeight: '600',
  },
  philosophyDialogSaveBtn: {
    backgroundColor: colors.accent,
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 6,
  },
  philosophyDialogSaveText: {
    color: '#FFFBF0',
    fontSize: 14,
    fontWeight: '700',
  },
});
