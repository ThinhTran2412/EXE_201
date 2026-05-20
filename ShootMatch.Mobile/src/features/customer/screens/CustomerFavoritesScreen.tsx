import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  FlatList,
  Image,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { colors } from '../../../app/theme/colors';
import { fontSizes, fontWeights } from '../../../app/theme/typography';
import { spacing, radius } from '../../../app/theme/spacing';
import { getFavorites, removeFavorite } from '../utils/favorites';
import { Photographer } from '../api';
import { formatImageUrl } from '../../../shared/utils/formatImageUrl';

export default function CustomerFavoritesScreen() {
  const navigation = useNavigation<any>();
  const [favorites, setFavorites] = useState<Photographer[]>([]);
  const [loading, setLoading] = useState(true);

  const loadFavorites = useCallback(async () => {
    setLoading(true);
    const data = await getFavorites();
    setFavorites(data);
    setLoading(false);
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadFavorites();
    }, [loadFavorites])
  );

  const handleRemove = async (id: string) => {
    await removeFavorite(id);
    setFavorites(prev => prev.filter(p => p.id !== id));
  };

  const renderItem = ({ item, index }: { item: Photographer; index: number }) => {
    const coverUri = formatImageUrl(item.avatarUrl || item.portfolioPhotos?.[0]);
    const minBudget = item.minBudget?.toLocaleString('vi-VN') || '0';
    
    // Realistic camera setting decoration based on index
    const cameraSettings = index % 3 === 0 ? '85mm · f/1.4 · 1/250s'
      : index % 3 === 1 ? '50mm · f/1.2 · 1/160s'
      : '35mm · f/1.8 · 1/400s';

    return (
      <Pressable
        style={styles.card}
        onPress={() => navigation.navigate('PhotographerProfile', { photographerId: item.id })}
      >
        {/* Sleek Minimalist Camera Viewfinder Frame */}
        <View style={styles.avatarFrame}>
          <Image source={{ uri: coverUri }} style={styles.cardImage} />
        </View>

        {/* Details Column */}
        <View style={styles.cardDetails}>
          <View style={styles.cardHeader}>
            <View style={{ flex: 1, paddingRight: spacing[2] }}>
              <View style={styles.photoMetaRow}>
                <Text style={styles.photoMetaText}>{cameraSettings}</Text>
                {item.isPremium && (
                  <View style={styles.premiumBadge}>
                    <Text style={styles.premiumText}>PRO</Text>
                  </View>
                )}
              </View>
              
              <Text style={styles.cardName} numberOfLines={1}>{item.displayName}</Text>
              <Text style={styles.cardSub} numberOfLines={1}>
                {item.displayName.toUpperCase()} STUDIO
              </Text>
            </View>

            <Pressable
              style={styles.heartBtn}
              onPress={() => handleRemove(item.id)}
              hitSlop={12}
            >
              <Ionicons name="heart" size={16} color={colors.accentOrange} />
            </Pressable>
          </View>

          <View style={styles.divider} />

          <View style={styles.cardFooter}>
            <View style={styles.infoRow}>
              <Ionicons name="location-sharp" size={11} color={colors.textLight} />
              <Text style={styles.infoText}>
                {item.region === 'HN' ? 'Hà Nội'
                  : item.region === 'HCM' ? 'TP.HCM'
                  : item.region === 'DN' ? 'Đà Nẵng'
                  : item.region}
              </Text>
            </View>

            <View style={styles.footerRight}>
              <View style={styles.ratingBox}>
                <Ionicons name="star" size={10} color="#fbbf24" style={{ marginRight: 2 }} />
                <Text style={styles.ratingText}>{item.rating?.toFixed(1) || '0.0'}</Text>
              </View>
              <Text style={styles.budgetText}>Từ {minBudget}đ</Text>
            </View>
          </View>
        </View>
      </Pressable>
    );
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <Pressable style={styles.back} onPress={() => navigation.goBack()} hitSlop={12}>
          <Ionicons name="arrow-back" size={22} color={colors.dark} />
        </Pressable>
        <Text style={styles.title}>Yêu thích</Text>
        <View style={{ width: 40 }} />
      </View>

      {/* Body */}
      {loading ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color={colors.accentOrange} />
          <Text style={styles.loadingText}>Đang tải danh sách...</Text>
        </View>
      ) : favorites.length === 0 ? (
        <View style={styles.emptyBody}>
          <View style={styles.iconCircle}>
            <Ionicons name="heart" size={40} color={colors.accentOrange} />
          </View>
          <Text style={styles.headline}>Chưa có mục yêu thích</Text>
          <Text style={styles.desc}>
            Tại đây sẽ hiển thị các photographer bạn đã yêu thích để xem lại nhanh bất kỳ lúc nào.
          </Text>
          <Pressable
            style={styles.discoverBtn}
            onPress={() => navigation.navigate('CustomerRoot', { screen: 'Discover' })}
          >
            <Text style={styles.discoverBtnText}>Khám phá ngay</Text>
          </Pressable>
        </View>
      ) : (
        <FlatList
          data={favorites}
          keyExtractor={item => item.id}
          renderItem={({ item, index }) => renderItem({ item, index })}
          contentContainerStyle={styles.listContainer}
          showsVerticalScrollIndicator={false}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing[4],
    paddingVertical: spacing[3],
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  back: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  title: { fontSize: fontSizes.lg, fontWeight: fontWeights.bold, color: colors.dark },
  
  centerContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: spacing[2] },
  loadingText: { fontSize: fontSizes.sm, color: colors.textMuted },

  emptyBody: { flex: 1, paddingHorizontal: spacing[8], paddingTop: spacing[16], alignItems: 'center' },
  iconCircle: {
    width: 88,
    height: 88,
    borderRadius: 44,
    backgroundColor: 'rgba(255,66,0,0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing[6],
  },
  headline: { fontSize: fontSizes.xl, fontWeight: fontWeights.bold, color: colors.dark, textAlign: 'center', marginBottom: spacing[3] },
  desc: { fontSize: fontSizes.sm, color: colors.textMuted, textAlign: 'center', lineHeight: 22, marginBottom: spacing[8] },
  
  discoverBtn: {
    backgroundColor: colors.dark,
    paddingHorizontal: spacing[6],
    paddingVertical: spacing[3],
    borderRadius: radius.full,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  discoverBtnText: { color: colors.background, fontWeight: fontWeights.bold, fontSize: fontSizes.sm },

  listContainer: { padding: spacing[4], gap: spacing[4] },
  
  card: {
    flexDirection: 'row',
    backgroundColor: colors.dark,
    borderRadius: radius.lg,
    padding: spacing[4],
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.22,
    shadowRadius: 18,
    elevation: 6,
    borderWidth: 1,
    borderColor: 'rgba(255,247,225,0.06)',
    alignItems: 'center',
  },
  
  // Premium elegant rectangular print frame
  avatarFrame: {
    width: 80,
    height: 104,
    borderRadius: radius.md,
    overflow: 'hidden',
    borderWidth: 1, // Mỏng như yêu cầu
    borderColor: 'rgba(255,247,225,0.25)', // Fine light line border
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 4,
  },
  cardImage: {
    width: '100%',
    height: '100%',
    backgroundColor: colors.clay,
  },
  
  cardDetails: { flex: 1, marginLeft: spacing[4], justifyContent: 'center' },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  
  photoMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 4,
  },
  photoMetaText: {
    fontSize: 8,
    fontFamily: 'monospace',
    color: 'rgba(255,247,225,0.4)',
    letterSpacing: 0.8,
  },
  premiumBadge: {
    backgroundColor: colors.accentOrange,
    paddingHorizontal: 4,
    paddingVertical: 1,
    borderRadius: 2,
  },
  premiumText: {
    fontSize: 7,
    fontWeight: fontWeights.bold,
    color: '#fff',
    letterSpacing: 0.5,
  },
  
  cardName: { fontSize: fontSizes.md, fontWeight: fontWeights.bold, color: colors.background, fontStyle: 'italic', letterSpacing: -0.3 },
  cardSub: { fontSize: 8, color: 'rgba(255,247,225,0.4)', fontFamily: 'monospace', letterSpacing: 1.5, marginTop: 1 },
  
  heartBtn: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'rgba(255,247,225,0.06)',
    borderWidth: 1,
    borderColor: 'rgba(255,247,225,0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  
  divider: { height: 1, backgroundColor: 'rgba(255,247,225,0.06)', marginVertical: spacing[2] },
  
  cardFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  infoRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  infoText: { fontSize: 11, color: colors.textLight },
  
  footerRight: { alignItems: 'flex-end', gap: 2 },
  ratingBox: { flexDirection: 'row', alignItems: 'center' },
  ratingText: { fontSize: 10, fontWeight: fontWeights.bold, color: '#fbbf24' },
  budgetText: { fontSize: 11, fontWeight: fontWeights.bold, color: colors.background },
});
