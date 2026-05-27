import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ScrollView,
  StyleSheet,
  Text,
  View,
  Pressable,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { getCustomerHomeFeed, getMyMatches, Match } from '../api';
import {
  buildFeaturedDisplay,
  buildFallbackFeatured,
  buildMomentDisplay,
  buildFallbackMoments,
  FeaturedDisplay,
  MomentDisplay,
} from '../utils/homeMedia';
import { localPictureSlice } from '../../../shared/assets/localPictures';
import HomeTopBar from '../components/home/HomeTopBar';
import HomeHero from '../components/home/HomeHero';
import SectionHeader from '../components/home/SectionHeader';
import FeaturedStrip from '../components/home/FeaturedStrip';
import EditorialPortfolio from '../components/home/EditorialPortfolio';
import DiscoveryBanner from '../components/home/DiscoveryBanner';
import QuickActionsGrid from '../components/home/QuickActionsGrid';
import PortfolioMasonry from '../components/PortfolioMasonry';
import { colors } from '../../../app/theme/colors';
import { fontSizes, fontWeights } from '../../../app/theme/typography';
import { spacing } from '../../../app/theme/spacing';
import { useNotificationUnreadCount } from '../../../shared/notifications/NotificationContext';

export default function HomeScreen() {
  const navigation = useNavigation<any>();
  const notificationUnread = useNotificationUnreadCount();

  const [featured, setFeatured] = useState<FeaturedDisplay[]>([]);
  const [moments, setMoments] = useState<MomentDisplay[]>([]);
  const [matches, setMatches] = useState<Match[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      setError(null);
      const [feed, m] = await Promise.all([
        getCustomerHomeFeed(),
        getMyMatches().catch(() => [] as Match[]),
      ]);

      const apiFeatured = buildFeaturedDisplay(feed.featured ?? []);
      const apiMoments = buildMomentDisplay(feed.latestPhotos ?? []);

      setFeatured(apiFeatured.length > 0 ? apiFeatured : buildFallbackFeatured(8));
      setMoments(apiMoments.length > 0 ? apiMoments : buildFallbackMoments(10));
      setMatches(m.slice(0, 5));
    } catch {
      setFeatured(buildFallbackFeatured(8));
      setMoments(buildFallbackMoments(10));
      setError(null);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const openProfile = useCallback(
    (photographerId: string) => {
      if (photographerId.startsWith('local-')) return;
      navigation.navigate('PhotographerProfile', { photographerId });
    },
    [navigation],
  );

  const heroCover = useMemo(() => featured[0]?.coverSource ?? localPictureSlice(39, 1)[0], [featured]);
  const actionCovers = useMemo(() => localPictureSlice(20, 4), []);

  const goTab = useCallback(
    (screen: string) => navigation.navigate(screen),
    [navigation],
  );

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <HomeTopBar
        onSearch={() => goTab('Discover')}
        onNotifications={() => navigation.navigate('Notifications')}
        onProfile={() => goTab('Profile')}
        notificationUnread={notificationUnread}
      />

      <ScrollView
        showsVerticalScrollIndicator={false}
        removeClippedSubviews
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => { setRefreshing(true); load(); }}
            tintColor={colors.accentOrange}
          />
        }
      >
        <HomeHero
          coverSource={heroCover}
          onDiscover={() => goTab('Discover')}
          onSearch={() => goTab('Discover')}
        />

        {loading ? (
          <ActivityIndicator color={colors.accentOrange} style={styles.loader} />
        ) : error ? (
          <View style={styles.errorBox}>
            <Ionicons name="cloud-offline-outline" size={28} color={colors.textMuted} />
            <Text style={styles.errorText}>{error}</Text>
          </View>
        ) : (
          <>
            <View style={styles.section}>
              <SectionHeader title="Nổi Bật" actionLabel="Xem tất cả" onAction={() => goTab('Discover')} />
              <FeaturedStrip items={featured} onOpenProfile={openProfile} />
            </View>

            <View style={styles.section}>
              <SectionHeader
                title="Portfolio Mới"
                actionLabel="Xem tất cả"
                onAction={() => goTab('Discover')}
                actionOrange
              />
              <EditorialPortfolio
                items={moments}
                onPressItem={item => openProfile(item.photographerId)}
              />
            </View>

            <DiscoveryBanner imageSource={heroCover} onPress={() => goTab('Discover')} />

            <View style={styles.section}>
              <SectionHeader title="Dành Cho Bạn" />
              <QuickActionsGrid
                coverImages={actionCovers}
                onNavigate={goTab}
                unreadChats={matches.length > 0 ? matches.length : undefined}
              />
            </View>

            <View style={styles.section}>
              <SectionHeader
                title="Khoảnh Khắc"
                actionLabel="Xem tất cả"
                onAction={() => goTab('Discover')}
                actionOrange
              />
              <PortfolioMasonry
                items={moments}
                onPressItem={item => openProfile(item.photographerId)}
              />
            </View>
          </>
        )}

        <View style={{ height: spacing[12] }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  section: { marginBottom: spacing[6] },
  loader: { marginVertical: spacing[10] },
  errorBox: { alignItems: 'center', padding: spacing[8], gap: spacing[3] },
  errorText: { color: colors.textMuted, textAlign: 'center', lineHeight: 20, fontSize: fontSizes.sm },
});
