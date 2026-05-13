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

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

const THEME = {
  cream: '#fff7e1',
  dark: '#0a0a06',
  dark2: '#141410',
  dark3: '#1e1e18',
  orange: '#ff4200',
  purple: '#3617cf',
  glass: 'rgba(255,247,225,0.04)',
  border: 'rgba(255,247,225,0.08)',
};

// Helper để sửa lỗi link localhost khi chạy trên thiết bị thật
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
      console.error('Load profile error:', err);
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
      allowsMultipleSelection: true, // Cho phép chọn nhiều ảnh cùng lúc
      allowsEditing: false, // BỎ CẮT ẢNH: Giữ nguyên tỷ lệ gốc
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
        let resizeAction = [];

        // Nếu ảnh quá lớn (4K, 8K), thu nhỏ về chuẩn Full HD (1920px) để chống tràn RAM (OOM)
        if (width > 1920 || height > 1920) {
          const ratio = Math.min(1920 / width, 1920 / height);
          resizeAction = [{ resize: { width: Math.round(width * ratio) } }];
        }

        // Đi qua ImageManipulator để nén nhẹ và đồng bộ hóa thành JPEG (an toàn tuyệt đối cho Android)
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
              setSelectedUrls([]); // Thoát chế độ chọn
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

  // Hàm xoá 1 ảnh dùng trong Viewer
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

  // --- Tính toán Absolute Masonry ---
  // Sử dụng Absolute Positioning giúp React KHÔNG unmount ảnh khi chúng bị đổi cột (do thêm ảnh mới lên đầu)
  // Điều này khắc phục triệt để lỗi chớp đen, xám ảnh, và hủy kết nối tải ảnh.
  let h1 = 0; let h2 = 0;
  const positions = photoData.map((p, idx) => {
    const itemHeight = colWidth / p.aspectRatio;
    let top = 0;
    let left = 0;
    
    if (h1 <= h2) {
      top = h1;
      left = 0;
      h1 += itemHeight + 16; // 16 là gap
    } else {
      top = h2;
      left = colWidth + 16;
      h2 += itemHeight + 16;
    }
    
    return { ...p, originalIndex: idx, top, left, height: itemHeight };
  });
  
  const containerHeight = Math.max(h1, h2);

  // --- Hàm cuộn Thumbnail ---
  const scrollToThumbnail = (index: number) => {
    if (!thumbnailsRef.current) return;
    // padding 20 + index * (width 50 + gap 12) + nửa width 25 = 45 + index * 62
    const center = 45 + index * 62;
    const scrollX = center - SCREEN_WIDTH / 2;
    thumbnailsRef.current.scrollTo({ x: Math.max(0, scrollX), animated: true });
  };

  if (loading && photoData.length === 0) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={THEME.orange} />
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
                <Ionicons name="close" size={24} color={THEME.cream} />
              </Pressable>
            </View>
          )}
        </Animated.View>

        {/* MASONRY GALLERY */}
        <View style={styles.galleryContainer}>
          {photoData.length > 0 ? (
            <View style={{ height: containerHeight, width: '100%', position: 'relative' }}>
              {positions.map((item, index) => {
                const isSelected = selectedUrls.includes(item.url);
                return (
                  <Animated.View 
                    key={item.url} 
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
                          { width: '100%', height: '100%', borderRadius: 12, backgroundColor: THEME.dark2 },
                          isSelected && { opacity: 0.8 }
                        ]} 
                        resizeMethod="resize"
                      />
                      
                      {/* Checkmark overlay */}
                      {isSelecting && (
                        <View style={[styles.selectOverlay, isSelected && styles.selectOverlayActive]}>
                          {isSelected && <Ionicons name="checkmark" size={18} color={THEME.cream} />}
                        </View>
                      )}
                    </Pressable>
                  </Animated.View>
                );
              })}
            </View>
          ) : (
            <View style={styles.emptyState}>
              <Ionicons name="camera-outline" size={64} color={THEME.border} />
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
            <LinearGradient colors={[THEME.orange, '#e63b00']} style={styles.fabGradient} start={{x: 0, y: 0}} end={{x: 1, y: 0}}>
              {uploading ? <ActivityIndicator color={THEME.cream} style={{ marginRight: 8 }} /> : <Ionicons name="add" size={24} color={THEME.cream} style={{ marginRight: 6 }} />}
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
              <Ionicons name="close" size={28} color={THEME.cream} />
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
              if (viewerIndex === null) return; // Chặn FlatList tự động kích hoạt khi Modal đang đóng
              
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

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: THEME.dark },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: THEME.dark },
  scroll: { paddingHorizontal: 16, paddingTop: 16, gap: 24 },
  
  header: { marginBottom: 8 },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  title: { fontSize: 36, fontWeight: '800', color: THEME.cream, letterSpacing: -1 },
  sub: { fontSize: 14, color: 'rgba(255,247,225,0.5)', marginTop: 4 },
  backBtn: { width: 44, height: 44, borderRadius: 22, backgroundColor: THEME.glass, justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: THEME.border },
  
  galleryContainer: { flex: 1 },
  masonryContainer: { flexDirection: 'row', justifyContent: 'space-between' },
  masonryCol: { gap: 16 },
  
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
    backgroundColor: THEME.orange,
    borderColor: THEME.orange,
  },
  cancelBtn: { paddingVertical: 8, paddingRight: 16 },
  cancelText: { color: THEME.cream, fontSize: 16, fontWeight: '600' },
  bulkDeleteBtn: { width: 44, height: 44, borderRadius: 22, backgroundColor: 'rgba(255,68,68,0.15)', justifyContent: 'center', alignItems: 'center' },

  emptyState: { height: 300, justifyContent: 'center', alignItems: 'center', gap: 12 },
  emptyText: { color: THEME.cream, fontSize: 18, fontWeight: '600' },
  emptySubText: { color: 'rgba(255,247,225,0.4)', fontSize: 14 },

  fabContainer: {
    position: 'absolute',
    bottom: 40,
    left: 0,
    right: 0,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.5,
    shadowRadius: 20,
    elevation: 10,
  },
  fabBtn: { overflow: 'hidden', borderRadius: 30 },
  fabGradient: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 28, paddingVertical: 16 },
  fabText: { color: THEME.cream, fontSize: 16, fontWeight: '700', letterSpacing: 1 },

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
    borderColor: THEME.orange,
    opacity: 1,
    transform: [{ scale: 1.1 }],
  },
});
