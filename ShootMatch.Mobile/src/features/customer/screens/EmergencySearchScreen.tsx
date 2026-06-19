import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator, FlatList, Image, ScrollView,
  Platform, Pressable, StyleSheet, Text, View,
  useWindowDimensions, StatusBar, LayoutAnimation, UIManager,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import * as Location from 'expo-location';
import { searchPhotographers, PhotographerCard } from '../api';
import { formatImageUrl } from '../../../shared/utils/formatImageUrl';

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

// ─── Haversine ───────────────────────────────────────────────────────────────
function haversineM(lat1: number, lon1: number, lat2: number, lon2: number) {
  const R = 6_371_000;
  const toRad = (d: number) => (d * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

// ─── Format Distance ────────────────────────────────────────────────────────
function formatDist(m: number) {
  if (m < 1000) return `${Math.round(m)}m`;
  return `${(m / 1000).toFixed(1)}km`;
}

// ─── Region Fallbacks ────────────────────────────────────────────────────────
const REGION_COORDS: Record<string, { lat: number; lng: number }> = {
  'hcm': { lat: 10.7769, lng: 106.7009 },
  'hồ chí minh': { lat: 10.7769, lng: 106.7009 },
  'hn': { lat: 21.0285, lng: 105.8542 },
  'hà nội': { lat: 21.0285, lng: 105.8542 },
  'dn': { lat: 16.0544, lng: 108.2022 },
  'đà nẵng': { lat: 16.0544, lng: 108.2022 },
};
const DEFAULT_COORDS = { lat: 10.7769, lng: 106.7009 };

function getRegionCoords(region: string) {
  const key = region.toLowerCase().trim();
  if (REGION_COORDS[key]) return REGION_COORDS[key];
  for (const [k, v] of Object.entries(REGION_COORDS)) {
    if (key.includes(k) || k.includes(key)) return v;
  }
  return DEFAULT_COORDS;
}

interface NearbyPhotographer extends PhotographerCard {
  estDistanceM: number;
}

export default function EmergencySearchScreen() {
  const navigation = useNavigation<any>();

  const [phase, setPhase] = useState<'loading' | 'done' | 'error'>('loading');
  const [errMsg, setErrMsg] = useState('');
  const [userPos, setUserPos] = useState<{ lat: number; lng: number } | null>(null);
  const [results, setResults] = useState<NearbyPhotographer[]>([]);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const scan = useCallback(async () => {
    setPhase('loading');
    setResults([]);

    let lat = 10.7769, lng = 106.7009;
    try {
      if (Platform.OS === 'web') {
        const pos = await new Promise<GeolocationPosition>((resolve, reject) => {
          if (!navigator?.geolocation) { reject(new Error('no geolocation')); return; }
          navigator.geolocation.getCurrentPosition(resolve, reject, {
            enableHighAccuracy: false, timeout: 10000, maximumAge: 60000,
          });
        });
        lat = pos.coords.latitude;
        lng = pos.coords.longitude;
      } else {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status === 'granted') {
          const loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
          lat = loc.coords.latitude;
          lng = loc.coords.longitude;
        }
      }
    } catch { /* use fallback */ }

    setUserPos({ lat, lng });

    try {
      const raw = await searchPhotographers({ isEmergency: true });
      const nearby: NearbyPhotographer[] = raw.map(p => {
        const cityCoords = getRegionCoords(p.region ?? '');
        const pLat = p.currentLatitude ?? cityCoords.lat;
        const pLng = p.currentLongitude ?? cityCoords.lng;
        const dist = haversineM(lat, lng, pLat, pLng);
        return { ...p, estDistanceM: dist };
      });
      nearby.sort((a, b) => a.estDistanceM - b.estDistanceM);
      setResults(nearby);
      setPhase('done');
    } catch {
      setErrMsg('Không thể kết nối. Vui lòng thử lại.');
      setPhase('error');
    }
  }, []);

  useEffect(() => { scan(); }, [scan]);

  const toggleExpand = (id: string) => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setExpandedId(prev => prev === id ? null : id);
  };

  const renderCard = ({ item, index }: { item: NearbyPhotographer; index: number }) => {
    const isExpanded = expandedId === item.photographerId;
    const avatar = formatImageUrl(item.avatarUrl);
    const photos = item.portfolioPhotos ?? [];
    const frameNum = String(index + 1).padStart(2, '0');

    // Random film name to mimic camera roll
    const filmCodes = ['PORTRA 400', 'KODAK 507D', 'TRI-X 400', 'FUJI 400H'];
    const filmCode = filmCodes[index % filmCodes.length];

    if (!isExpanded) {
      return (
        <Pressable style={styles.compactSlideCard} onPress={() => toggleExpand(item.photographerId)}>
          {/* Light-colored Slide Mount Avatar */}
          <View style={styles.compactSlideMount}>
            <View style={styles.compactSlideInner}>
              <Image source={{ uri: avatar }} style={styles.compactSlideImage} />
            </View>
            <View style={styles.slideStickerLabel}>
              <Text style={styles.compactSlideLabel}>FR-{frameNum}</Text>
            </View>
          </View>

          {/* Info Details */}
          <View style={styles.compactInfo}>
            <View style={styles.filmHeaderRow}>
              <Text style={styles.filmCodeText}>{filmCode}</Text>
              <Text style={styles.frameLabelText}>ROLL {frameNum}</Text>
            </View>
            <Text style={styles.compactName} numberOfLines={1}>{item.displayName}</Text>
            
            {/* Mini film strip of their photos under name */}
            {photos.length > 0 && (
              <View style={styles.miniFilmStrip}>
                <View style={styles.sprocketHolesRow}>
                  <View style={styles.hole} /><View style={styles.hole} /><View style={styles.hole} /><View style={styles.hole} />
                </View>
                <View style={styles.miniPhotosRow}>
                  {photos.slice(0, 3).map((ph, pi) => (
                    <Image key={pi} source={{ uri: formatImageUrl(ph) }} style={styles.miniPhotoThumb} />
                  ))}
                </View>
                <View style={styles.sprocketHolesRow}>
                  <View style={styles.hole} /><View style={styles.hole} /><View style={styles.hole} /><View style={styles.hole} />
                </View>
              </View>
            )}

            <View style={styles.compactMetaRow}>
              <Text style={styles.compactMetaText}>{item.region || 'Vietnam'}</Text>
              <View style={styles.dot} />
              <Ionicons name="star" size={10} color="#ff4200" style={{ marginRight: -1 }} />
              <Text style={[styles.compactMetaText, { color: '#ff4200', fontWeight: '800' }]}>
                {item.rating.toFixed(1)}
              </Text>
            </View>
          </View>

          <View style={styles.compactRight}>
            {/* Simplified flat active tag */}
            <View style={styles.whiteTapeSticker}>
              <Text style={styles.whiteTapeStickerText}>ACTIVE</Text>
            </View>
            
            <View style={styles.distBadge}>
              <Ionicons name="location" size={10} color="#ff4200" />
              <Text style={styles.distBadgeText}>{formatDist(item.estDistanceM)}</Text>
            </View>
            <Ionicons name="chevron-down" size={16} color="rgba(255,247,225,0.4)" style={{ marginTop: 6 }} />
          </View>
        </Pressable>
      );
    }

    return (
      <View style={styles.expandedCard}>
        {/* Card Header */}
        <Pressable style={styles.expandedHeader} onPress={() => toggleExpand(item.photographerId)}>
          <View style={styles.avatarSlideMount}>
            <View style={styles.avatarSlideInner}>
              <Image source={{ uri: avatar }} style={styles.avatarSlideImg} />
            </View>
          </View>
          <View style={styles.headerInfo}>
            <Text style={styles.expandedName}>{item.displayName}</Text>
            <Text style={styles.expandedMeta}>
              {item.region || 'Vietnam'} · {item.rating.toFixed(1)}★
            </Text>
          </View>
          <View style={styles.headerRight}>
            {/* Simplified flat active label */}
            <View style={[styles.whiteTapeSticker, { marginRight: 8 }]}>
              <Text style={styles.whiteTapeStickerText}>ONLINE</Text>
            </View>
            <View style={styles.distBadge}>
              <Ionicons name="location" size={10} color="#ff4200" />
              <Text style={styles.distBadgeText}>{formatDist(item.estDistanceM)}</Text>
            </View>
            <Pressable style={styles.collapseBtn} onPress={() => toggleExpand(item.photographerId)}>
              <Ionicons name="chevron-up" size={16} color="#fff7e1" />
            </Pressable>
          </View>
        </Pressable>

        {/* Scrollable Slide Mount strip with lighter frames for contrast */}
        <View style={styles.portfolioSection}>
          <Text style={styles.portfolioLabel}>TÁC PHẨM CỦA NHIẾP ẢNH GIA</Text>
          {photos.length > 0 ? (
            <ScrollView 
              horizontal 
              showsHorizontalScrollIndicator={false} 
              contentContainerStyle={styles.portfolioStrip}
            >
              {photos.map((photoUrl, idx) => {
                const cardHeight = 150;
                const aspectRatios = [1.2, 0.8, 1.5, 0.75];
                const ratio = aspectRatios[idx % aspectRatios.length];
                const cardWidth = Math.max(110, Math.min(200, cardHeight * ratio));
                const isPortrait = ratio < 0.95;

                return (
                  <View key={idx} style={[styles.portfolioSlideMount, { width: cardWidth }]}>
                    <View style={styles.portfolioSlideInner}>
                      <Image
                        source={{ uri: formatImageUrl(photoUrl) }}
                        style={styles.portfolioSlideImg}
                        resizeMode="cover"
                      />
                    </View>
                    <View style={styles.portfolioSlideMeta}>
                      <Text style={styles.portfolioSlideText}>FRAME {String(idx + 1).padStart(2, '0')}</Text>
                      <Text style={styles.portfolioSlideSpec}>
                        {isPortrait ? 'PORTRAIT · 3:4' : 'LANDSCAPE · 4:3'}
                      </Text>
                    </View>
                  </View>
                );
              })}
            </ScrollView>
          ) : (
            <View style={styles.emptyPortfolio}>
              <Ionicons name="images-outline" size={24} color="rgba(255,247,225,0.2)" />
              <Text style={styles.emptyPortfolioText}>Chưa tải lên tác phẩm nào</Text>
            </View>
          )}
        </View>

        {/* Card Footer */}
        <View style={styles.expandedFooter}>
          <View>
            <Text style={styles.priceLabel}>GIÁ KHỞI ĐIỂM</Text>
            <Text style={styles.priceValue}>{item.minBudget.toLocaleString()} ₫</Text>
          </View>
          <Pressable 
            style={styles.bookActionBtn}
            onPress={() => navigation.navigate('PhotographerProfile', { photographerId: item.photographerId })}
          >
            <Ionicons name="camera-outline" size={14} color="#0d0d08" />
            <Text style={styles.bookActionText}>XEM CHI TIẾT & ĐẶT</Text>
          </Pressable>
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <StatusBar barStyle="light-content" />

      {/* Header */}
      <View style={styles.header}>
        <Pressable style={styles.backBtn} onPress={() => navigation.goBack()}>
          <Ionicons name="close" size={20} color="#fff7e1" />
        </Pressable>
        <Text style={styles.headerTitle}>EMERGENCY PORTFOLIO</Text>
        <Pressable style={styles.refreshHeaderBtn} onPress={scan}>
          <Ionicons name="refresh" size={18} color="#ff4200" />
        </Pressable>
      </View>

      {/* Loading / Error States */}
      {phase === 'loading' && (
        <View style={styles.centerState}>
          <ActivityIndicator size="large" color="#ff4200" />
          <Text style={styles.stateTitle}>QUÉT THIẾT BỊ LÂN CẬN...</Text>
        </View>
      )}

      {phase === 'error' && (
        <View style={styles.centerState}>
          <Ionicons name="warning-outline" size={48} color="#ef4444" />
          <Text style={styles.stateTitle}>KẾT NỐI THẤT BẠI</Text>
          <Text style={styles.stateDesc}>{errMsg}</Text>
          <Pressable style={styles.retryBtn} onPress={scan}>
            <Text style={styles.retryBtnText}>THỬ LẠI</Text>
          </Pressable>
        </View>
      )}

      {/* Results List */}
      {phase === 'done' && (
        results.length === 0 ? (
          <View style={styles.centerState}>
            <Ionicons name="camera-outline" size={48} color="rgba(255,247,225,0.2)" />
            <Text style={styles.stateTitle}>CHƯA CÓ AI TRỰC TUYẾN</Text>
            <Text style={styles.stateDesc}>Không tìm thấy nhiếp ảnh gia nào sẵn sàng nhận lịch khẩn cấp.</Text>
            <Pressable style={styles.retryBtn} onPress={scan}>
              <Text style={styles.retryBtnText}>QUÉT LẠI</Text>
            </Pressable>
          </View>
        ) : (
          <FlatList
            data={results}
            keyExtractor={item => item.photographerId}
            renderItem={renderCard}
            contentContainerStyle={styles.listContent}
            showsVerticalScrollIndicator={false}
          />
        )
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#0d0d08' },

  // Header
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 20, paddingVertical: 14,
    borderBottomWidth: 1, borderBottomColor: 'rgba(255,247,225,0.08)',
  },
  backBtn: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: 'rgba(255,247,225,0.05)',
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 1, borderColor: 'rgba(255,247,225,0.1)',
  },
  refreshHeaderBtn: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: 'rgba(255,66,0,0.05)',
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 1, borderColor: 'rgba(255,66,0,0.15)',
  },
  headerTitle: {
    fontSize: 14, fontWeight: '900', color: '#fff7e1', letterSpacing: 2,
    fontFamily: Platform.OS === 'ios' ? 'CourierNewPS-BoldMT' : 'monospace',
  },

  // States
  centerState: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 40 },
  stateTitle: { 
    fontSize: 14, fontWeight: '900', color: '#fff7e1', letterSpacing: 2, marginTop: 16,
    fontFamily: Platform.OS === 'ios' ? 'CourierNewPS-BoldMT' : 'monospace',
  },
  stateDesc: { fontSize: 13, color: 'rgba(255,247,225,0.5)', textAlign: 'center', marginTop: 8, lineHeight: 20 },
  retryBtn: {
    marginTop: 20, paddingHorizontal: 24, paddingVertical: 12,
    borderWidth: 1, borderColor: '#ff4200', borderRadius: 24,
  },
  retryBtnText: { color: '#ff4200', fontSize: 12, fontWeight: '900', letterSpacing: 1.5 },

  // List
  listContent: { paddingHorizontal: 16, paddingTop: 16, gap: 14, paddingBottom: 40 },

  // Compact Card (Industrial Film Slide canister style)
  compactSlideCard: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: '#161613',
    borderRadius: 16, padding: 12,
    borderWidth: 1, borderColor: 'rgba(255,247,225,0.08)',
    shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.2, shadowRadius: 6, elevation: 4,
    position: 'relative', overflow: 'hidden',
  },

  // Light-colored slide mount for avatar to pop
  compactSlideMount: {
    width: 66, height: 78,
    backgroundColor: '#FAF7F2', // Light-colored paper slide frame
    borderWidth: 1, borderColor: 'rgba(0,0,0,0.08)',
    borderRadius: 6, padding: 5, paddingBottom: 8,
    alignItems: 'center', justifyContent: 'center',
    position: 'relative',
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 3, elevation: 2,
  },
  compactSlideInner: {
    width: '100%', flex: 1,
    backgroundColor: '#000', borderRadius: 2, overflow: 'hidden',
  },
  compactSlideImage: { width: '100%', height: '100%', resizeMode: 'cover' },
  
  // Clean sticker note on the slide frame
  slideStickerLabel: {
    backgroundColor: '#fff',
    paddingHorizontal: 4, paddingVertical: 1, borderRadius: 2,
    marginTop: 3,
  },
  compactSlideLabel: {
    fontSize: 7.5, fontWeight: '900', color: '#2E2A24',
    fontFamily: Platform.OS === 'ios' ? 'Courier-Bold' : 'monospace',
  },

  compactInfo: { flex: 1, paddingHorizontal: 12 },
  filmHeaderRow: { flexDirection: 'row', gap: 8, marginBottom: 2 },
  filmCodeText: { 
    fontSize: 8, color: '#ff4200', fontWeight: '900', letterSpacing: 1,
    fontFamily: Platform.OS === 'ios' ? 'CourierNewPS-BoldMT' : 'monospace' 
  },
  frameLabelText: { 
    fontSize: 8, color: 'rgba(255,247,225,0.4)', fontWeight: '800',
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace' 
  },
  compactName: { fontSize: 16, fontWeight: '900', color: '#fff7e1', letterSpacing: -0.4 },
  
  // Mini Film Strip Preview (High Contrast)
  miniFilmStrip: {
    marginVertical: 6, backgroundColor: '#000', borderRadius: 4, paddingVertical: 3, paddingHorizontal: 4,
    alignSelf: 'flex-start', borderWidth: 0.8, borderColor: 'rgba(255,247,225,0.2)',
  },
  sprocketHolesRow: {
    flexDirection: 'row', justifyContent: 'space-around', gap: 6, height: 3,
  },
  hole: { width: 3, height: 1.5, backgroundColor: '#FAF7F2', borderRadius: 0.5 },
  miniPhotosRow: {
    flexDirection: 'row', gap: 4, marginVertical: 3,
  },
  miniPhotoThumb: { width: 30, height: 20, borderRadius: 2, backgroundColor: '#111', borderWidth: 0.5, borderColor: 'rgba(255,255,255,0.1)' },

  compactMetaRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 2 },
  compactMetaText: { fontSize: 11, color: 'rgba(255,247,225,0.5)', fontWeight: '500' },
  dot: { width: 3, height: 3, borderRadius: 1.5, backgroundColor: 'rgba(255,247,225,0.2)' },
  
  compactRight: { alignItems: 'flex-end', justifyContent: 'space-between', height: 75, paddingVertical: 2 },
  
  // Simplified flat Active label sticker
  whiteTapeSticker: {
    backgroundColor: '#fff',
    paddingHorizontal: 8, paddingVertical: 3,
    borderWidth: 1, borderColor: '#fff',
    borderRadius: 3,
  },
  whiteTapeStickerText: {
    fontSize: 8, fontWeight: '900', color: '#0d0d08', letterSpacing: 0.8,
    fontFamily: Platform.OS === 'ios' ? 'Courier-Bold' : 'monospace',
  },

  distBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    backgroundColor: 'rgba(255,66,0,0.12)',
    paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8,
    borderWidth: 1, borderColor: 'rgba(255,66,0,0.25)',
  },
  distBadgeText: { fontSize: 10, fontWeight: '900', color: '#ff4200' },

  // Expanded Card (Dark themed slide mount display)
  expandedCard: {
    backgroundColor: '#161613',
    borderRadius: 18,
    borderWidth: 1, borderColor: 'rgba(255,247,225,0.12)',
    shadowColor: '#000', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.28, shadowRadius: 12, elevation: 6,
    overflow: 'hidden',
  },
  expandedHeader: {
    flexDirection: 'row', alignItems: 'center', padding: 16,
    borderBottomWidth: 1, borderBottomColor: 'rgba(255,247,225,0.06)',
  },
  avatarSlideMount: {
    width: 52, height: 62,
    backgroundColor: '#FAF7F2', // Light-colored paper slide frame
    borderWidth: 1, borderColor: 'rgba(0,0,0,0.08)',
    borderRadius: 4, padding: 4, paddingBottom: 6,
    alignItems: 'center', justifyContent: 'center',
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 3, elevation: 2,
  },
  avatarSlideInner: {
    width: '100%', flex: 1,
    backgroundColor: '#000', borderRadius: 1, overflow: 'hidden',
  },
  avatarSlideImg: { width: '100%', height: '100%', resizeMode: 'cover' },
  headerInfo: { flex: 1, paddingHorizontal: 12 },
  expandedName: { fontSize: 18, fontWeight: '900', color: '#fff7e1', letterSpacing: -0.4 },
  expandedMeta: { fontSize: 12, color: 'rgba(255,247,225,0.6)', fontWeight: '600', marginTop: 2 },
  headerRight: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  collapseBtn: {
    width: 28, height: 28, borderRadius: 14,
    backgroundColor: 'rgba(255,247,225,0.05)',
    alignItems: 'center', justifyContent: 'center',
  },

  // Portfolio Section (Horizontal scroll of slide mounts)
  portfolioSection: {
    paddingVertical: 14,
    backgroundColor: '#161613',
  },
  portfolioLabel: {
    fontSize: 9, fontWeight: '900', color: 'rgba(255,247,225,0.4)', letterSpacing: 1,
    paddingHorizontal: 16, marginBottom: 10,
    fontFamily: Platform.OS === 'ios' ? 'Courier-Bold' : 'monospace',
  },
  portfolioStrip: {
    gap: 12,
    paddingLeft: 16,
    paddingRight: 20,
  },
  // LIGHT-COLORED Slide mounts for high contrast portfolio images
  portfolioSlideMount: {
    height: 150,
    backgroundColor: '#FAF7F2', // Beautiful light cardboard paper
    borderRadius: 6,
    padding: 6,
    paddingBottom: 8,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.08)',
    shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.15, shadowRadius: 5, elevation: 3,
  },
  portfolioSlideInner: {
    flex: 1,
    backgroundColor: '#000',
    borderRadius: 2,
    overflow: 'hidden',
    borderWidth: 1, borderColor: 'rgba(0,0,0,0.85)',
  },
  portfolioSlideImg: {
    width: '100%', height: '100%',
  },
  portfolioSlideMeta: {
    marginTop: 6,
    alignItems: 'center',
  },
  portfolioSlideText: {
    fontSize: 8.5, fontWeight: '900', color: '#2E2A24', // Dark handwriting charcoal
    fontFamily: Platform.OS === 'ios' ? 'Courier-Bold' : 'monospace',
  },
  portfolioSlideSpec: {
    fontSize: 7, color: '#7A7062', marginTop: 1,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
  },
  emptyPortfolio: {
    height: 120, alignItems: 'center', justifyContent: 'center', gap: 6,
    borderWidth: 1, borderColor: 'rgba(255,247,225,0.06)', borderStyle: 'dashed',
    borderRadius: 12, marginHorizontal: 16,
  },
  emptyPortfolioText: { fontSize: 11, color: 'rgba(255,247,225,0.4)', fontWeight: '600' },

  // Expanded Footer
  expandedFooter: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    padding: 16, backgroundColor: '#20201d',
    borderTopWidth: 1, borderTopColor: 'rgba(255,247,225,0.06)',
  },
  priceLabel: { fontSize: 9, fontWeight: '900', color: 'rgba(255,247,225,0.4)', letterSpacing: 0.8 },
  priceValue: { fontSize: 16, fontWeight: '900', color: '#fff7e1', marginTop: 2 },
  bookActionBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: '#ff4200',
    paddingHorizontal: 16, paddingVertical: 10, borderRadius: 12,
  },
  bookActionText: { color: '#FFFBF0', fontSize: 11, fontWeight: '900', letterSpacing: 0.5 },
});
