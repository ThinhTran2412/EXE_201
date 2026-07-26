import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  ScrollView,
  StyleSheet,
  Text,
  View,
  Pressable,
  Image,
  Dimensions,
  Modal,
  FlatList,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, { FadeIn, FadeInDown } from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useAuth } from '../../auth/AuthContext';
import { Photographer } from '../api';
import { formatImageUrl } from '../../../shared/utils/formatImageUrl';
import PortfolioImageCell from '../../../shared/components/PortfolioImageCell';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

const THEME = {
  cream: '#fff7e1',
  dark: '#0a0a06',
  dark2: '#141410',
  orange: '#ff4200',
  glass: 'rgba(255,247,225,0.04)',
  border: 'rgba(255,247,225,0.08)',
};

type PhotoData = {
  url: string;
  displayUri: string;
  width: number;
  height: number;
  aspectRatio: number;
  originalIndex: number;
};

function SectionTitle({ title, subtitle }: { title: string; subtitle?: string }) {
  return (
    <View style={styles.sectionTitleBlock}>
      <Text style={styles.sectionTitle}>{title}</Text>
      {subtitle ? <Text style={styles.sectionSubtitle}>{subtitle}</Text> : null}
    </View>
  );
}

export default function PhotographerPortfolioScreen() {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const { photographer } = route.params as { photographer: Photographer };
  const { session } = useAuth();

  const insets = useSafeAreaInsets();

  const [loading, setLoading] = useState(true);
  const [photoData, setPhotoData] = useState<PhotoData[]>([]);

  const [viewerIndex, setViewerIndex] = useState<number | null>(null);
  const flatListRef = useRef<FlatList>(null);
  const thumbnailsRef = useRef<ScrollView>(null);

  const colWidth = (SCREEN_WIDTH - 32 - 16) / 2;

  useEffect(() => {
    loadData();
  }, [photographer]);

  async function loadData() {
    setLoading(true);
    const rawUrls = photographer.portfolioPhotos || [];
    const limit = session?.membershipTier === 'Chọn Xinh' ? 15 : (session?.membershipTier === 'Lướt Nhẹ' ? 5 : 9999);
    const urls = rawUrls.slice(0, limit);
    if (urls.length === 0) {
      setPhotoData([]);
      setLoading(false);
      return;
    }

    const displayUris = urls.map(u => formatImageUrl(u));

    try {
      const data = await Promise.all(
        displayUris.map((displayUri, idx) =>
          new Promise<PhotoData>(resolve => {
            const url = urls[idx];
            Image.getSize(
              displayUri,
              (w, h) => {
                resolve({
                  url,
                  displayUri,
                  width: w,
                  height: h,
                  aspectRatio: w > 0 && h > 0 ? w / h : 0.75,
                  originalIndex: idx,
                });
              },
              () => {
                resolve({
                  url,
                  displayUri,
                  width: 1,
                  height: 1,
                  aspectRatio: 0.75,
                  originalIndex: idx,
                });
              },
            );
          }),
        ),
      );
      setPhotoData(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  let h1 = 0;
  let h2 = 0;
  const positions = photoData.map(p => {
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

    return { ...p, top, left, height: itemHeight };
  });

  const containerHeight = Math.max(h1, h2);

  const featuredThree = useMemo(() => photoData.slice(0, 3), [photoData]);
  const recentStrip = useMemo(() => photoData.slice(3, 12), [photoData]);

  const scrollToThumbnail = (index: number) => {
    if (!thumbnailsRef.current) return;
    const center = 45 + index * 62;
    const scrollX = center - SCREEN_WIDTH / 2;
    thumbnailsRef.current.scrollTo({ x: Math.max(0, scrollX), animated: true });
  };

  if (loading) {
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
          <View style={styles.headerRow}>
            <View style={{ flex: 1, paddingRight: 12 }}>
              <Text style={styles.title}>Portfolio</Text>
              <Text style={styles.sub}>Nhiếp ảnh gia: {photographer.displayName}</Text>
              <Text style={styles.countPill}>{photoData.length} tác phẩm</Text>
            </View>
            <Pressable style={styles.backBtn} onPress={() => navigation.goBack()}>
              <Ionicons name="close" size={24} color={THEME.cream} />
            </Pressable>
          </View>
        </Animated.View>

        {photoData.length > 0 ? (
          <>
            {featuredThree.length > 0 && (
              <View style={styles.block}>
                <SectionTitle title="Nổi bật" subtitle="Ảnh đầu tiên trong portfolio" />
                <View style={styles.featuredRowEqual}>
                  {featuredThree.map((item, i) => (
                    <Pressable
                      key={`feat-${item.displayUri}-${i}`}
                      style={styles.featuredEqualCell}
                      onPress={() => setViewerIndex(item.originalIndex)}
                    >
                      <PortfolioImageCell
                        uri={item.url}
                        style={StyleSheet.absoluteFillObject}
                        borderRadius={14}
                      />
                    </Pressable>
                  ))}
                </View>
              </View>
            )}

            {recentStrip.length > 0 && (
              <View style={styles.block}>
                <SectionTitle title="Thêm nữa" subtitle="Vuốt ngang để xem nhanh" />
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.stripContent}>
                  {recentStrip.map((item, i) => (
                    <Pressable
                      key={`strip-${item.displayUri}-${i}`}
                      style={styles.stripCard}
                      onPress={() => setViewerIndex(item.originalIndex)}
                    >
                      <PortfolioImageCell uri={item.url} style={styles.stripCardInner} borderRadius={14} />
                    </Pressable>
                  ))}
                </ScrollView>
              </View>
            )}

            <View style={styles.block}>
              <SectionTitle title="Toàn bộ thư viện" subtitle="Bố cục masonry 2 cột" />
              <View style={styles.galleryContainer}>
                <View style={{ height: containerHeight, width: '100%', position: 'relative' }}>
                  {positions.map((item, index) => (
                    <Animated.View
                      key={`${item.displayUri}-${item.originalIndex}`}
                      entering={FadeIn.delay(Math.min(index * 40, 400)).duration(350)}
                      style={{
                        position: 'absolute',
                        top: item.top,
                        left: item.left,
                        width: colWidth,
                        height: item.height,
                      }}
                    >
                      <PortfolioImageCell
                        uri={item.url}
                        style={{ width: '100%', height: '100%' }}
                        borderRadius={12}
                        onPress={() => setViewerIndex(item.originalIndex)}
                      />
                    </Animated.View>
                  ))}
                </View>
              </View>
            </View>
            {session?.membershipTier === 'Chọn Xinh' && (photographer.portfolioPhotos || []).length > 15 && (
              <View style={styles.limitBanner}>
                <Ionicons name="lock-closed" size={16} color="#F59E0B" style={{ marginBottom: 4 }} />
                <Text style={styles.limitBannerText}>
                  Đang giới hạn xem 15 ảnh (gói Chọn Xinh). Nâng cấp Chốt Xịn để xem toàn bộ {(photographer.portfolioPhotos || []).length} tác phẩm.
                </Text>
                <Pressable
                  style={styles.limitBannerBtn}
                  onPress={() => {
                    navigation.navigate('CustomerSubscription');
                  }}
                >
                  <Text style={styles.limitBannerBtnText}>NÂNG CẤP</Text>
                </Pressable>
              </View>
            )}
          </>
        ) : (
          <View style={styles.emptyState}>
            <Ionicons name="images-outline" size={64} color={THEME.border} />
            <Text style={styles.emptyText}>Chưa có ảnh</Text>
          </View>
        )}

        <View style={{ height: 40 }} />
      </ScrollView>

      <Modal
        visible={viewerIndex !== null}
        transparent
        animationType="fade"
        onRequestClose={() => setViewerIndex(null)}
      >
        <View style={styles.viewerBackground}>
          <View style={[styles.viewerHeader, { top: insets.top || 20 }]}>
            <Pressable style={styles.viewerClose} onPress={() => setViewerIndex(null)}>
              <Ionicons name="close" size={28} color={THEME.cream} />
            </Pressable>
          </View>

          <FlatList
            ref={flatListRef}
            data={photoData}
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            initialScrollIndex={
              viewerIndex !== null && viewerIndex < photoData.length ? viewerIndex : 0
            }
            getItemLayout={(_, index) => ({
              length: SCREEN_WIDTH,
              offset: SCREEN_WIDTH * index,
              index,
            })}
            onMomentumScrollEnd={e => {
              if (viewerIndex === null) return;
              const idx = Math.round(e.nativeEvent.contentOffset.x / SCREEN_WIDTH);
              setViewerIndex(idx);
              scrollToThumbnail(idx);
            }}
            renderItem={({ item }) => (
              <View
                style={{
                  width: SCREEN_WIDTH,
                  flex: 1,
                  justifyContent: 'center',
                  alignItems: 'center',
                }}
              >
                <PortfolioImageCell
                  uri={item.url}
                  style={{ width: SCREEN_WIDTH * 0.95, height: SCREEN_HEIGHT * 0.75 }}
                  borderRadius={8}
                  resizeMode="contain"
                />
              </View>
            )}
            keyExtractor={(item, index) => `${item.displayUri}-${index}`}
          />

          <SafeAreaView style={styles.viewerFooter}>
            <ScrollView
              ref={thumbnailsRef}
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.thumbnailsScroll}
            >
              {photoData.map((p, i) => (
                <Pressable
                  key={`thumb-${p.displayUri}-${i}`}
                  onPress={() => {
                    setViewerIndex(i);
                    flatListRef.current?.scrollToIndex({ index: i, animated: false });
                    scrollToThumbnail(i);
                  }}
                >
                  <PortfolioImageCell
                    uri={p.url}
                    style={[
                      styles.thumbnail,
                      i === viewerIndex && styles.thumbnailActive,
                    ]}
                    borderRadius={8}
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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: THEME.dark,
  },
  scroll: { paddingHorizontal: 16, paddingTop: 16, gap: 8 },

  header: { marginBottom: 16 },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  title: { fontSize: 32, fontWeight: '800', color: THEME.cream, letterSpacing: -0.5 },
  sub: { fontSize: 14, color: 'rgba(255,247,225,0.5)', marginTop: 6 },
  countPill: {
    marginTop: 10,
    alignSelf: 'flex-start',
    fontSize: 11,
    fontWeight: '700',
    color: THEME.orange,
    letterSpacing: 1,
    textTransform: 'uppercase',
    borderWidth: 1,
    borderColor: 'rgba(255,66,0,0.35)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
    overflow: 'hidden',
  },
  backBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: THEME.glass,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: THEME.border,
  },

  block: { marginBottom: 28 },
  sectionTitleBlock: { marginBottom: 12 },
  sectionTitle: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 2,
    textTransform: 'uppercase',
    color: 'rgba(255,247,225,0.45)',
  },
  sectionSubtitle: {
    marginTop: 4,
    fontSize: 12,
    color: 'rgba(255,247,225,0.35)',
  },

  featuredRowEqual: {
    flexDirection: 'row',
    gap: 10,
  },
  featuredEqualCell: {
    flex: 1,
    aspectRatio: 0.82,
    borderRadius: 14,
    overflow: 'hidden',
    backgroundColor: THEME.dark2,
  },

  stripContent: { gap: 12, paddingVertical: 4 },
  stripCard: {
    width: 120,
    height: 160,
    borderRadius: 14,
    overflow: 'hidden',
    backgroundColor: THEME.dark2,
  },
  stripCardInner: { width: '100%', height: '100%' },

  galleryContainer: { flex: 1 },

  emptyState: { height: 280, justifyContent: 'center', alignItems: 'center', gap: 12 },
  emptyText: { color: THEME.cream, fontSize: 18, fontWeight: '600' },

  viewerBackground: { flex: 1, backgroundColor: 'rgba(0,0,0,0.95)' },
  viewerHeader: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'flex-start',
    paddingHorizontal: 20,
    paddingTop: 10,
    zIndex: 10,
  },
  viewerClose: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255,255,255,0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  viewerFooter: { position: 'absolute', bottom: 20, left: 0, right: 0, height: 80 },
  thumbnailsScroll: { paddingHorizontal: 20, alignItems: 'center', gap: 12 },
  thumbnail: { width: 50, height: 50, borderWidth: 2, borderColor: 'transparent', opacity: 0.55 },
  thumbnailActive: { borderColor: THEME.orange, opacity: 1 },
  limitBanner: {
    padding: 16,
    backgroundColor: 'rgba(217,119,6,0.1)',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(217,119,6,0.2)',
    marginHorizontal: 16,
    marginVertical: 16,
    alignItems: 'center',
  },
  limitBannerText: {
    fontSize: 12,
    color: '#F59E0B',
    textAlign: 'center',
    lineHeight: 18,
    marginBottom: 8,
  },
  limitBannerBtn: {
    backgroundColor: '#D97706',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 6,
  },
  limitBannerBtnText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});
