import React, { useState, useEffect, useRef } from 'react';
import {
  ScrollView, StyleSheet, Text, View, Pressable, Alert, ActivityIndicator, Image,
  Dimensions, Modal, FlatList
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, { FadeIn, FadeInUp, FadeInDown } from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import * as ImagePicker from 'expo-image-picker';
import * as ImageManipulator from 'expo-image-manipulator';
import { LinearGradient } from 'expo-linear-gradient';
import { getPhotographerProfile, uploadPortfolioPhoto, deletePortfolioPhoto } from '../api';
import { usePhotographerTheme } from '../PhotographerThemeContext';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

const formatPhotoUrl = (url?: string) => {
  if (!url) return '';
  const apiUrl = process.env.EXPO_PUBLIC_API_URL || '';
  const ipMatch = apiUrl.match(/http:\/\/((\d+\.){3}\d+)/);
  if (ipMatch && (url.includes('localhost') || url.includes('127.0.0.1'))) {
    return url.replace(/localhost|127\.0\.0\.1/, ipMatch[1]);
  }
  return url;
};

type PhotoData = { url: string; width: number; height: number; aspectRatio: number; originalIndex?: number };

export default function UploadPortfolioScreen() {
  const navigation = useNavigation<any>();
  const { colors, isDark } = usePhotographerTheme();
  const styles = getStyles(colors);

  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [photoData, setPhotoData] = useState<PhotoData[]>([]);
  const [selectedUrls, setSelectedUrls] = useState<string[]>([]);
  
  const insets = useSafeAreaInsets();
  
  // Image Viewer State
  const [viewerIndex, setViewerIndex] = useState<number | null>(null);
  const flatListRef = useRef<FlatList>(null);
  const thumbnailsRef = useRef<ScrollView>(null);

  const colWidth = (SCREEN_WIDTH - 32 - 16) / 2; // padding 16*2, gap 16

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    setLoading(true);
    try {
      const p = await getPhotographerProfile();
      if (p && p.portfolioPhotos) {
        // Đọc kích thước thật của từng ảnh
        const data = await Promise.all(
          p.portfolioPhotos.map(url => new Promise<PhotoData>(resolve => {
            const formatted = formatPhotoUrl(url);
            Image.getSize(formatted, (w, h) => {
              resolve({ url, width: w, height: h, aspectRatio: w / h });
            }, () => {
              resolve({ url, width: 1, height: 1, aspectRatio: 1 }); // Fallback
            });
          }))
        );
        setPhotoData(data);
      }
    } catch (err) {
      console.log('Load profile error:', err);
    } finally {
      setLoading(false);
    }
  }

  async function handlePickImage() {
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

        const photoUrl = await uploadPortfolioPhoto(manipResult.uri, 'image/jpeg');
        const newPhoto = { 
          url: photoUrl, 
          width: manipResult.width, 
          height: manipResult.height, 
          aspectRatio: manipResult.width / manipResult.height 
        };
        
        setPhotoData(prev => [newPhoto, ...prev]);
        successCount++;
      }
      Alert.alert('Thành công', `Đã thêm ${successCount} ảnh vào portfolio.`);
    } catch (err) {
      console.error('Upload error:', err);
      Alert.alert('Lỗi', `Quá trình tải lên bị gián đoạn. Đã tải lên được ${successCount}/${assets.length} ảnh.`);
    } finally {
      setUploading(false);
    }
  }

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

  let h1 = 0; let h2 = 0;
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
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <Animated.View entering={FadeInDown.duration(600)} style={styles.header}>
          {isSelecting ? (
            <View style={[styles.headerRow, { alignItems: 'center' }]}>
              <Pressable style={styles.cancelBtn} onPress={() => setSelectedUrls([])}>
                <Text style={styles.cancelText}>Hủy</Text>
              </Pressable>
              <Text style={[styles.title, { fontSize: 24 }]}>Đã chọn {selectedUrls.length}</Text>
              <Pressable style={styles.bulkDeleteBtn} onPress={handleBulkDelete}>
                <Ionicons name="trash" size={24} color="#ff4444" />
              </Pressable>
            </View>
          ) : (
            <View style={styles.headerRow}>
              <View>
                <Text style={styles.title}>Tác Phẩm</Text>
                <Text style={styles.sub}>{photoData.length} hình ảnh hiển thị trên Profile</Text>
              </View>
              <Pressable style={styles.backBtn} onPress={() => navigation.goBack()}>
                <Ionicons name="close" size={24} color={colors.text} />
              </Pressable>
            </View>
          )}
        </Animated.View>

        {!isSelecting && photoData.length > 0 && (
          <View style={{ marginBottom: 20 }}>
            <Text style={styles.sectionLabel}>Xem nhanh</Text>
            <Text style={styles.sectionHint}>Ảnh mới nhất — chạm để mở</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 12, paddingVertical: 8 }}>
              {[...photoData].reverse().slice(0, 12).map((item, idx) => (
                <Pressable
                  key={`quick-${item.originalIndex ?? idx}-${idx}`}
                  style={styles.quickPhotoWrap}
                  onPress={() => setViewerIndex(item.originalIndex ?? 0)}
                >
                  <Image
                    source={{ uri: formatPhotoUrl(item.url) }}
                    style={styles.fullImage}
                    resizeMode="cover"
                    resizeMethod="resize"
                  />
                </Pressable>
              ))}
            </ScrollView>
          </View>
        )}

        {!isSelecting && photoData.length > 0 && (
          <View style={{ marginBottom: 12 }}>
            <Text style={styles.sectionLabel}>Toàn bộ</Text>
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
                    entering={FadeIn.delay(Math.min(index * 50, 500)).duration(400)}
                    style={{ position: 'absolute', top: item.top, left: item.left, width: colWidth, height: item.height }}
                  >
                    <Pressable 
                      onPress={() => {
                        if (isSelecting) toggleSelection(item.url);
                        else setViewerIndex(item.originalIndex!);
                      }}
                      onLongPress={() => {
                        if (!isSelecting) toggleSelection(item.url);
                      }}
                    >
                      <Image 
                        source={{ uri: formatPhotoUrl(item.url) }} 
                        style={[
                          styles.masonryImage,
                          isSelected && { opacity: 0.8 }
                        ]} 
                        resizeMethod="resize"
                      />
                      
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

        <View style={{ height: 120 }} />
      </ScrollView>

      {/* FLOATING ACTION BUTTON */}
      {!isSelecting && (
        <Animated.View entering={FadeInUp.delay(400).duration(600)} style={styles.fabContainer}>
          <Pressable onPress={handlePickImage} disabled={uploading} style={({pressed}) => [styles.fabBtn, pressed && { transform: [{scale: 0.96}] }]}>
            <LinearGradient colors={[colors.accent, '#e63b00']} style={styles.fabGradient} start={{x: 0, y: 0}} end={{x: 1, y: 0}}>
              {uploading ? <ActivityIndicator color="#FFFBF0" style={{ marginRight: 8 }} /> : <Ionicons name="add" size={24} color="#FFFBF0" style={{ marginRight: 6 }} />}
              <Text style={styles.fabText}>{uploading ? 'ĐANG TẢI LÊN...' : 'THÊM TÁC PHẨM'}</Text>
            </LinearGradient>
          </Pressable>
        </Animated.View>
      )}

      {/* IMAGE VIEWER MODAL */}
      <Modal visible={viewerIndex !== null} transparent={true} animationType="fade" onRequestClose={() => setViewerIndex(null)}>
        <View style={styles.viewerBackground}>
          
          {/* Header */}
          <View style={[styles.viewerHeader, { top: insets.top || 20 }]}>
            <Pressable style={styles.viewerClose} onPress={() => setViewerIndex(null)}>
              <Ionicons name="close" size={28} color="#FFFBF0" />
            </Pressable>
            {viewerIndex !== null && photoData[viewerIndex] && (
              <Pressable style={styles.viewerDelete} onPress={() => handleDeleteSingle(photoData[viewerIndex].url)}>
                <Ionicons name="trash-outline" size={24} color="#ff4444" />
              </Pressable>
            )}
          </View>

          {/* Main Full-Screen List */}
          <FlatList
            ref={flatListRef}
            data={photoData}
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            initialScrollIndex={viewerIndex !== null && viewerIndex < photoData.length ? viewerIndex : 0}
            getItemLayout={(data, index) => ({ length: SCREEN_WIDTH, offset: SCREEN_WIDTH * index, index })}
            onMomentumScrollEnd={(e) => {
              if (viewerIndex === null) return;
              
              const idx = Math.round(e.nativeEvent.contentOffset.x / SCREEN_WIDTH);
              setViewerIndex(idx);
              scrollToThumbnail(idx);
            }}
            renderItem={({ item }) => (
              <View style={{ width: SCREEN_WIDTH, flex: 1, justifyContent: 'center', alignItems: 'center' }}>
                <Image 
                  source={{ uri: formatPhotoUrl(item.url) }} 
                  style={{ width: SCREEN_WIDTH, height: '100%' }} 
                  resizeMode="contain" 
                />
              </View>
            )}
            keyExtractor={item => item.url}
          />

          {/* Thumbnails Row */}
          <SafeAreaView style={styles.viewerFooter}>
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
          </SafeAreaView>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const getStyles = (colors: any) => StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.background },
  scroll: { paddingHorizontal: 16, paddingTop: 16, gap: 24 },
  
  header: { marginBottom: 8 },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  title: { fontSize: 36, fontWeight: '800', color: colors.text, letterSpacing: -1 },
  sub: { fontSize: 14, color: colors.textMuted, marginTop: 4 },
  backBtn: { width: 44, height: 44, borderRadius: 22, backgroundColor: colors.surface, justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: colors.border },
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
    bottom: 40,
    left: 0,
    right: 0,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.2,
    shadowRadius: 20,
    elevation: 10,
  },
  fabBtn: { overflow: 'hidden', borderRadius: 30 },
  fabGradient: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 28, paddingVertical: 16 },
  fabText: { color: '#FFFBF0', fontSize: 16, fontWeight: '700', letterSpacing: 1 },

  // --- VIEWER STYLES ---
  viewerBackground: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.95)',
  },
  viewerHeader: {
    position: 'absolute',
    top: 0, left: 0, right: 0,
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 10,
    zIndex: 10,
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
    position: 'absolute',
    bottom: 20, left: 0, right: 0,
    height: 80,
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
});
