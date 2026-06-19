import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Image,
  ImageBackground,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
  Dimensions,
  Platform,
  useWindowDimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import { colors } from '../../../app/theme/colors';
import { fontSizes, fontWeights } from '../../../app/theme/typography';
import { spacing } from '../../../app/theme/spacing';
import { localPicture } from '../../../shared/assets/localPictures';
import { 
  searchPhotographers, 
  getCustomerHomeFeed, 
  getPhotographerServicePackages,
  PhotographerCard, 
  FeaturedPhotographerCard, 
  PortfolioFeedItem 
} from '../api';

const REGIONS = [
  { label: 'Tất cả khu vực', value: '' },
  { label: 'Hà Nội', value: 'HN' },
  { label: 'Hồ Chí Minh', value: 'HCM' },
  { label: 'Đà Nẵng', value: 'DN' },
  { label: 'Cần Thơ', value: 'CT' },
  { label: 'Hải Phòng', value: 'HP' },
];

const DURATIONS = [
  { label: 'Thời lượng', value: 0 },
  { label: '1 Giờ', value: 1 },
  { label: '2 Giờ', value: 2 },
  { label: '3 Giờ', value: 3 },
  { label: '4 Giờ', value: 4 },
  { label: '5 Giờ', value: 5 },
];

const LOCATION_TYPES = [
  { label: 'Tất cả địa điểm', value: '' },
  { label: 'Studio', value: 'STUDIO' },
  { label: 'Ngoại cảnh', value: 'OUTDOOR' },
  { label: 'Trong nhà / Cafe', value: 'INDOOR' },
  { label: 'Linh hoạt', value: 'FLEXIBLE' }
];

const AGE_GROUPS = [
  { label: 'Mọi độ tuổi', value: '' },
  { label: 'Sơ sinh & Bé', value: 'NEWBORN' },
  { label: 'Trẻ em & Gia đình', value: 'KIDS' },
  { label: 'Giới trẻ (Gen Z)', value: 'YOUTH' },
  { label: 'Người lớn', value: 'ADULTS' },
  { label: 'Người cao tuổi', value: 'SENIORS' },
  { label: 'Thú cưng', value: 'PETS' }
];

const GROUP_SIZES = [
  { label: 'Mọi số lượng', value: '' },
  { label: 'Cá nhân (Solo)', value: 'SOLO' },
  { label: 'Cặp đôi', value: 'COUPLE' },
  { label: 'Nhóm nhỏ (< 5 người)', value: 'SMALL_GROUP' },
  { label: 'Nhóm lớn (>= 5 người)', value: 'LARGE_GROUP' }
];

const COLOR_TONES = [
  { label: 'Tất cả tông màu', value: '', color: '#CCCCCC' },
  { label: 'Cổ điển / Trầm', value: '#8B4513', color: '#8B4513' },
  { label: 'Ấm áp / Đỏ cam', value: '#FF5733', color: '#FF5733' },
  { label: 'Trong sáng / Vàng', value: '#FFC300', color: '#FFC300' },
  { label: 'Tươi tắn / Xanh', value: '#2ECC71', color: '#2ECC71' },
  { label: 'Lạnh / Xanh biển', value: '#3498DB', color: '#3498DB' },
  { label: 'Mơ mộng / Tím', value: '#9B59B6', color: '#9B59B6' },
  { label: 'Huyền bí / Tối', value: '#2C3E50', color: '#2C3E50' }
];

const CONCEPTS = [
  { name: 'Chân dung', tag: 'Portrait', subtitle: 'Góc mặt nghệ thuật', coverIndex: 5 },
  { name: 'Ảnh cưới', tag: 'Wedding', subtitle: 'Khoảnh khắc trọn đời', coverIndex: 35 },
  { name: 'Cổ điển', tag: 'Vintage', subtitle: 'Màu film hoài niệm', coverIndex: 22 },
  { name: 'Thời trang', tag: 'Editorial', subtitle: 'Đậm chất tạp chí', coverIndex: 13 },
  { name: 'Đường phố', tag: 'Streetwear', subtitle: 'Năng động tự nhiên', coverIndex: 12 },
  { name: 'Nàng thơ', tag: 'Film look', subtitle: 'Mơ màng dịu nhẹ', coverIndex: 19 },
];

const MOCK_TOP_PACKAGES = [
  {
    id: 'pkg-1',
    title: 'Gói chụp ảnh Cưới Ngoại Cảnh Premium',
    price: 4500000,
    duration: 4,
    rating: 5.0,
    photographerName: 'Trần Thái Thịnh',
    tag: 'Wedding',
    coverIndex: 35,
    features: ['Makeup cô dâu', 'Hỗ trợ váy cưới', '150 file chỉnh sửa'],
  },
  {
    id: 'pkg-2',
    title: 'Concept Nàng Thơ Studio Cổ Điển',
    price: 3200000,
    duration: 3,
    rating: 4.9,
    photographerName: 'Nguyễn Văn Hải',
    tag: 'Vintage',
    coverIndex: 22,
    features: ['Phòng studio riêng', 'Màu film độc quyền', 'In ảnh tặng kèm'],
  },
  {
    id: 'pkg-3',
    title: 'Streetwear & Portrait Phố Cổ',
    price: 1800000,
    duration: 2,
    rating: 4.8,
    photographerName: 'Trần Thái Thịnh',
    tag: 'Portrait',
    coverIndex: 12,
    features: ['Di chuyển tự do', 'Góc chụp tự nhiên', 'Nhận ảnh nhanh'],
  }
];

const MOCK_LOOKBOOKS = [
  { title: 'Retro Sunset', desc: 'Đón hoàng hôn rực rỡ', tag: 'Vintage', coverIndex: 29 },
  { title: 'Minimalist Studio', desc: 'Tối giản và tinh tế', tag: 'Portrait', coverIndex: 8 },
  { title: 'Cinematic Rain', desc: 'Góc máy đậm chất điện ảnh', tag: 'Film look', coverIndex: 3 },
  { title: 'Street Fashion', desc: 'Phong cách đường phố bụi bặm', tag: 'Streetwear', coverIndex: 10 },
];

export default function SearchScreen() {
  const navigation = useNavigation<any>();

  const { width: windowWidth } = useWindowDimensions();
  const W = Platform.OS === 'web' ? Math.min(windowWidth, 800) : windowWidth;
  const HOT_CARD_W = W * 0.68;
  const LOOKBOOK_CARD_W = W * 0.5;
  const styles = React.useMemo(() => getStyles(W, HOT_CARD_W, LOOKBOOK_CARD_W), [W, HOT_CARD_W, LOOKBOOK_CARD_W]);

  // State filters
  const [query, setQuery] = useState('');
  const [selectedRegion, setSelectedRegion] = useState('');
  const [minBudget, setMinBudget] = useState('');
  const [maxBudget, setMaxBudget] = useState('');
  const [selectedDuration, setSelectedDuration] = useState<number>(0);
  const [selectedStyles, setSelectedStyles] = useState<string[]>([]);
  const [isEmergency, setIsEmergency] = useState(false);
  const [selectedLocationType, setSelectedLocationType] = useState('');
  const [selectedAgeGroup, setSelectedAgeGroup] = useState('');
  const [selectedGroupSize, setSelectedGroupSize] = useState('');
  const [selectedColorTone, setSelectedColorTone] = useState('');

  // UI States
  const [showFilters, setShowFilters] = useState(false);
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<PhotographerCard[]>([]);

  // Discovery Landing Page Data
  const [hotPhotographers, setHotPhotographers] = useState<FeaturedPhotographerCard[]>([]);
  const [coolPortfolios, setCoolPortfolios] = useState<PortfolioFeedItem[]>([]);
  const [realPackages, setRealPackages] = useState<any[]>([]);
  const [lookbooks, setLookbooks] = useState<any[]>([]);
  const [loadingDiscovery, setLoadingDiscovery] = useState(true);

  // Check if user is actively searching
  const isSearching = query.length > 0 || selectedRegion !== '' || minBudget !== '' || maxBudget !== '' || selectedDuration > 0 || selectedStyles.length > 0 || isEmergency || selectedLocationType !== '' || selectedAgeGroup !== '' || selectedGroupSize !== '' || selectedColorTone !== '';

  // Fetch Discovery Data
  const loadDiscoveryData = useCallback(async () => {
    try {
      setLoadingDiscovery(true);
      const feed = await getCustomerHomeFeed();
      setHotPhotographers(feed.featured ?? []);
      setCoolPortfolios(feed.latestPhotos ?? []);

      // Build real lookbooks dynamically from the latest photos in the database
      const portfolios = feed.latestPhotos ?? [];
      const titles = ['Retro Sunset', 'Minimalist Studio', 'Cinematic Rain', 'Street Fashion', 'Vintage Vibe', 'Golden Hour'];
      const descs = ['Hoàng hôn rực rỡ', 'Tối giản & tinh tế', 'Đậm chất điện ảnh', 'Phố thị năng động', 'Cổ điển hoài niệm', 'Nghệ thuật ánh sáng'];
      const tags = ['Vintage', 'Portrait', 'Film look', 'Streetwear', 'Vintage', 'Portrait'];
      
      const mappedLookbooks = portfolios.slice(0, 6).map((item, index) => ({
        title: titles[index % titles.length],
        desc: `${descs[index % descs.length]} bởi @${item.photographerName}`,
        tag: tags[index % tags.length],
        imageUrl: item.imageUrl,
        photographerId: item.photographerId
      }));
      setLookbooks(mappedLookbooks.length > 0 ? mappedLookbooks : MOCK_LOOKBOOKS);

      // Fetch real packages dynamically from database for top 3 photographers
      const topPhotographers = feed.featured?.slice(0, 3) ?? [];
      const packagesPromises = topPhotographers.map(p => 
        getPhotographerServicePackages(p.id).catch(() => [])
      );
      const packagesResults = await Promise.all(packagesPromises);
      
      const flatPackages = packagesResults.flat().map((pkg, index) => {
        const descLines = pkg.description 
          ? pkg.description.split('\n').map((l: string) => l.trim()).filter((l: string) => l.length > 0)
          : [];
        return {
          id: pkg.id || `real-pkg-${index}`,
          title: pkg.title || 'Gói chụp ảnh chuyên nghiệp',
          price: pkg.price || 1500000,
          duration: pkg.durationHours || pkg.duration || 2,
          rating: 4.8 + (index % 3) * 0.1,
          photographerName: topPhotographers.find(p => p.id === pkg.photographerId)?.displayName || 'Trần Thái Thịnh',
          photographerId: pkg.photographerId || null,
          tag: pkg.title?.toLowerCase().includes('cưới') ? 'Wedding' : 'Portrait',
          imageUrl: pkg.media?.[0]?.imageUrl || null,
          coverIndex: 10 + (index * 8) % 30,
          features: descLines.slice(0, 3).length > 0 ? descLines.slice(0, 3) : ['Góc chụp sáng tạo', 'Chỉnh sửa chuyên nghiệp', 'Trả toàn bộ ảnh gốc'],
        };
      });

      setRealPackages(flatPackages.length > 0 ? flatPackages : MOCK_TOP_PACKAGES);
    } catch (err) {
      console.error('Error loading search discovery data:', err);
      setLookbooks(MOCK_LOOKBOOKS);
      setRealPackages(MOCK_TOP_PACKAGES);
    } finally {
      setLoadingDiscovery(false);
    }
  }, []);

  useEffect(() => {
    loadDiscoveryData();
  }, [loadDiscoveryData]);

  // Execute Search Query
  const handleSearch = useCallback(async () => {
    if (!isSearching) return;
    setLoading(true);
    try {
      const min = minBudget ? parseFloat(minBudget) : undefined;
      const max = maxBudget ? parseFloat(maxBudget) : undefined;
      const dur = selectedDuration > 0 ? selectedDuration : undefined;

      const data = await searchPhotographers({
        query: query || undefined,
        region: selectedRegion || undefined,
        minBudget: min,
        maxBudget: max,
        durationHours: dur,
        styles: selectedStyles.length > 0 ? selectedStyles : undefined,
        isEmergency: isEmergency || undefined,
        locationType: selectedLocationType || undefined,
        ageGroup: selectedAgeGroup || undefined,
        groupSize: selectedGroupSize || undefined,
        colorTone: selectedColorTone || undefined,
      });

      setResults(data);
    } catch (err) {
      console.error('Search query error:', err);
    } finally {
      setLoading(false);
    }
  }, [
    query,
    selectedRegion,
    minBudget,
    maxBudget,
    selectedDuration,
    selectedStyles,
    isEmergency,
    selectedLocationType,
    selectedAgeGroup,
    selectedGroupSize,
    selectedColorTone,
    isSearching
  ]);

  // Trigger search on filter changes
  useEffect(() => {
    handleSearch();
  }, [
    selectedRegion,
    selectedDuration,
    selectedStyles,
    isEmergency,
    selectedLocationType,
    selectedAgeGroup,
    selectedGroupSize,
    selectedColorTone,
    handleSearch
  ]);

  const toggleStyle = (style: string) => {
    setSelectedStyles((prev) =>
      prev.includes(style) ? prev.filter((s) => s !== style) : [...prev, style]
    );
  };

  const getFullUrl = (url: string) => {
    if (!url) return '';
    const apiUrl = process.env.EXPO_PUBLIC_API_URL || '';
    const ipMatch = apiUrl.match(/http:\/\/((\d+\.){3}\d+)/);
    if (ipMatch && (url.includes('localhost') || url.includes('127.0.0.1'))) {
      return url.replace(/localhost|127\.0\.0\.1/, ipMatch[1]);
    }
    return url;
  };

  const resetFilters = () => {
    setQuery('');
    setSelectedRegion('');
    setMinBudget('');
    setMaxBudget('');
    setSelectedDuration(0);
    setSelectedStyles([]);
    setIsEmergency(false);
    setSelectedLocationType('');
    setSelectedAgeGroup('');
    setSelectedGroupSize('');
    setSelectedColorTone('');
    setShowFilters(false);
    setResults([]);
  };

  const renderPhotographerItem = ({ item }: { item: PhotographerCard }) => {
    const photos = item.portfolioPhotos?.slice(0, 3) ?? [];
    return (
      <Pressable
        style={styles.card}
        onPress={() => navigation.navigate('PhotographerProfile', { photographerId: item.photographerId })}
      >
        <View style={styles.cardHeader}>
          {item.avatarUrl ? (
            <Image source={{ uri: getFullUrl(item.avatarUrl) }} style={styles.avatar} />
          ) : (
            <View style={[styles.avatar, styles.avatarPlaceholder]}>
              <Text style={styles.avatarPlaceholderText}>{item.displayName[0]}</Text>
            </View>
          )}
          <View style={styles.headerInfo}>
            <View style={styles.nameRow}>
              <Text style={styles.displayName} numberOfLines={1}>{item.displayName}</Text>
              {item.isPremium && (
                <View style={styles.premiumBadge}>
                  <Ionicons name="shield-checkmark" size={12} color={colors.white} />
                  <Text style={styles.premiumText}>Pro</Text>
                </View>
              )}
            </View>
            <View style={styles.subInfoRow}>
              <Text style={styles.regionText}>★ {item.rating.toFixed(1)} · {item.region}</Text>
              <Text style={styles.priceRange}>
                {item.minBudget.toLocaleString('vi-VN')} - {item.maxBudget.toLocaleString('vi-VN')} VNĐ
              </Text>
            </View>
          </View>
          <Ionicons name="chevron-forward" size={20} color={colors.textMuted} />
        </View>

        {photos.length > 0 && (
          <View style={styles.portfolioRow}>
            {photos.map((url, idx) => (
              <Image key={idx} source={{ uri: getFullUrl(url) }} style={styles.portfolioThumbnail} />
            ))}
          </View>
        )}
      </Pressable>
    );
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      {/* Search Bar Header */}
      <View style={styles.searchHeader}>
        <Pressable onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color={colors.dark} />
        </Pressable>
        <View style={styles.searchBar}>
          <Ionicons name="search-outline" size={20} color={colors.textMuted} style={styles.searchIcon} />
          <TextInput
            style={styles.input}
            placeholder="Tìm kiếm phong cách, nhiếp ảnh gia..."
            placeholderTextColor={colors.textMuted}
            value={query}
            onChangeText={setQuery}
            onSubmitEditing={handleSearch}
            returnKeyType="search"
          />
          {isSearching && (
            <Pressable onPress={resetFilters} style={styles.clearBtn}>
              <Ionicons name="close-circle" size={16} color={colors.textMuted} />
            </Pressable>
          )}
        </View>
        <Pressable
          onPress={() => setShowFilters(!showFilters)}
          style={[styles.filterToggleBtn, showFilters && styles.filterToggleBtnActive]}
        >
          <Ionicons name="options-outline" size={22} color={showFilters ? colors.white : colors.dark} />
        </Pressable>
      </View>

      {/* Emergency & Quick Actions */}
      <View style={styles.quickBar}>
        <Pressable
          style={styles.emergencyBtn}
          onPress={() => navigation.navigate('EmergencySearch')}
        >
          <Ionicons name="flash" size={16} color={colors.accent} />
          <Text style={styles.emergencyText}>⚡ Chụp khẩn cấp (Đặt ngay)</Text>
        </Pressable>

        {isSearching && (
          <Pressable style={styles.searchButton} onPress={handleSearch}>
            <Text style={styles.searchButtonText}>Tìm kiếm</Text>
          </Pressable>
        )}
      </View>

      {/* Filters Panel */}
      {showFilters && (
        <View style={styles.filtersPanel}>
          <Text style={styles.filterTitle}>Khu Vực</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.regionList}>
            {REGIONS.map((reg) => (
              <Pressable
                key={reg.value}
                style={[styles.regionChip, selectedRegion === reg.value && styles.regionChipActive]}
                onPress={() => setSelectedRegion(reg.value)}
              >
                <Text style={[styles.regionChipText, selectedRegion === reg.value && styles.regionChipTextActive]}>
                  {reg.label}
                </Text>
              </Pressable>
            ))}
          </ScrollView>

          <Text style={styles.filterTitle}>Thời Lượng Gói Chụp</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.regionList}>
            {DURATIONS.map((dur) => (
              <Pressable
                key={dur.value}
                style={[styles.regionChip, selectedDuration === dur.value && styles.regionChipActive]}
                onPress={() => setSelectedDuration(dur.value)}
              >
                <Text style={[styles.regionChipText, selectedDuration === dur.value && styles.regionChipTextActive]}>
                  {dur.label}
                </Text>
              </Pressable>
            ))}
          </ScrollView>

          <Text style={styles.filterTitle}>Ngân Sách (VNĐ)</Text>
          <View style={styles.budgetRow}>
            <TextInput
              style={styles.budgetInput}
              placeholder="Tối thiểu"
              placeholderTextColor={colors.textMuted}
              keyboardType="numeric"
              value={minBudget}
              onChangeText={setMinBudget}
            />
            <View style={styles.budgetDivider} />
            <TextInput
              style={styles.budgetInput}
              placeholder="Tối đa"
              placeholderTextColor={colors.textMuted}
              keyboardType="numeric"
              value={maxBudget}
              onChangeText={setMaxBudget}
            />
          </View>

          <Text style={styles.filterTitle}>Địa điểm chụp</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.regionList}>
            {LOCATION_TYPES.map((loc) => (
              <Pressable
                key={loc.value}
                style={[styles.regionChip, selectedLocationType === loc.value && styles.regionChipActive]}
                onPress={() => setSelectedLocationType(loc.value)}
              >
                <Text style={[styles.regionChipText, selectedLocationType === loc.value && styles.regionChipTextActive]}>
                  {loc.label}
                </Text>
              </Pressable>
            ))}
          </ScrollView>

          <Text style={styles.filterTitle}>Đối tượng chụp</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.regionList}>
            {AGE_GROUPS.map((age) => (
              <Pressable
                key={age.value}
                style={[styles.regionChip, selectedAgeGroup === age.value && styles.regionChipActive]}
                onPress={() => setSelectedAgeGroup(age.value)}
              >
                <Text style={[styles.regionChipText, selectedAgeGroup === age.value && styles.regionChipTextActive]}>
                  {age.label}
                </Text>
              </Pressable>
            ))}
          </ScrollView>

          <Text style={styles.filterTitle}>Số lượng người</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.regionList}>
            {GROUP_SIZES.map((gs) => (
              <Pressable
                key={gs.value}
                style={[styles.regionChip, selectedGroupSize === gs.value && styles.regionChipActive]}
                onPress={() => setSelectedGroupSize(gs.value)}
              >
                <Text style={[styles.regionChipText, selectedGroupSize === gs.value && styles.regionChipTextActive]}>
                  {gs.label}
                </Text>
              </Pressable>
            ))}
          </ScrollView>

          <Text style={styles.filterTitle}>Tông màu chính</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.regionList}>
            {COLOR_TONES.map((colorTone) => (
              <Pressable
                key={colorTone.value}
                style={[
                  styles.regionChip,
                  selectedColorTone === colorTone.value && styles.regionChipActive,
                  { flexDirection: 'row', alignItems: 'center', gap: 6 }
                ]}
                onPress={() => setSelectedColorTone(colorTone.value)}
              >
                <View style={{ width: 12, height: 12, borderRadius: 6, backgroundColor: colorTone.color }} />
                <Text style={[styles.regionChipText, selectedColorTone === colorTone.value && styles.regionChipTextActive]}>
                  {colorTone.label}
                </Text>
              </Pressable>
            ))}
          </ScrollView>
        </View>
      )}

      {/* GIAO DIỆN CHÍNH */}
      {!isSearching ? (
        /* TRẠNG THÁI KHÁM PHÁ (Discovery Landing Page - Ultimate Redesign) */
        <ScrollView style={styles.discoveryScroll} showsVerticalScrollIndicator={false}>
          
          {/* Welcome Editorial Banner with Local Cover Image */}
          <View style={styles.welcomeBannerWrapper}>
            <ImageBackground 
              source={localPicture(26)} 
              style={styles.welcomeBannerImg}
              imageStyle={{ borderRadius: 24 }}
            >
              <LinearGradient
                colors={['rgba(26,26,15,0.1)', 'rgba(26,26,15,0.85)']}
                style={styles.welcomeBannerGradient}
              />
              <View style={styles.welcomeTextContainer}>
                <Text style={styles.welcomeSubtitle}>GIỚI THIỆU NHIẾP ẢNH XU HƯỚNG</Text>
                <Text style={styles.welcomeTitle}>Khám phá góc nhìn nghệ thuật</Text>
                <Text style={styles.welcomeDesc}>Tìm kiếm hàng trăm nhiếp ảnh gia hàng đầu phù hợp với gu thẩm mỹ riêng của bạn.</Text>
              </View>
            </ImageBackground>
          </View>

          {/* Section 1: Concept Nổi Bật (Redesigned with Photo Backgrounds) */}
          <View style={styles.discoverySection}>
            <View style={styles.sectionHeaderRow}>
              <Text style={styles.sectionHeaderTitle}>Concept Nổi Bật</Text>
              <Text style={styles.sectionHeaderCount}>{CONCEPTS.length} LỰA CHỌN</Text>
            </View>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.conceptsScroll}>
              {CONCEPTS.map((concept) => (
                <Pressable
                  key={concept.tag}
                  onPress={() => toggleStyle(concept.tag)}
                >
                  <ImageBackground
                    source={localPicture(concept.coverIndex)}
                    style={styles.conceptCard}
                    imageStyle={{ borderRadius: 20 }}
                  >
                    <LinearGradient
                      colors={['rgba(0,0,0,0.1)', 'rgba(0,0,0,0.7)']}
                      style={styles.conceptCardGradient}
                    />
                    <View style={styles.conceptIconBg}>
                      <Ionicons name="sparkles" size={13} color={colors.dark} />
                    </View>
                    <View style={styles.conceptBottomInfo}>
                      <Text style={styles.conceptName}>{concept.name}</Text>
                      <Text style={styles.conceptCardSub}>{concept.subtitle}</Text>
                      <Text style={styles.conceptTag}>#{concept.tag}</Text>
                    </View>
                  </ImageBackground>
                </Pressable>
              ))}
            </ScrollView>
          </View>

          {/* Section 2: Photographer Hot Trend (Outstanding Detailed Cards) */}
          <View style={styles.discoverySection}>
            <View style={styles.sectionHeaderRow}>
              <Text style={styles.sectionHeaderTitle}>Photographer Hot Trend 🔥</Text>
              <Text style={styles.sectionHeaderCount}>XU HƯỚNG TUẦN NÀY</Text>
            </View>
            {loadingDiscovery ? (
              <ActivityIndicator color={colors.accent} style={{ marginVertical: spacing[4] }} />
            ) : hotPhotographers.length === 0 ? (
              <Text style={styles.emptySectionText}>Chưa có Photographer nổi bật</Text>
            ) : (
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.hotPhotographersScroll}>
                {hotPhotographers.map((item) => (
                  <Pressable
                    key={item.id}
                    style={styles.hotCard}
                    onPress={() => navigation.navigate('PhotographerProfile', { photographerId: item.id })}
                  >
                    {item.previewPhotos?.[0] ? (
                      <Image source={{ uri: getFullUrl(item.previewPhotos[0]) }} style={styles.hotCover} />
                    ) : (
                      <View style={styles.hotCoverPlaceholder} />
                    )}
                    <LinearGradient
                      colors={['transparent', 'rgba(26,26,15,0.4)', 'rgba(26,26,15,0.95)']}
                      style={styles.hotGradient}
                    />
                    
                    {/* Floating Choice Badge */}
                    <View style={styles.hotBadge}>
                      <Ionicons name="ribbon" size={12} color={colors.white} />
                      <Text style={styles.hotBadgeText}>{item.isPremium ? 'Premium Choice' : 'Trending'}</Text>
                    </View>

                    {/* Floating Availability Badge */}
                    <View style={styles.availabilityBadge}>
                      <View style={styles.availabilityDot} />
                      <Text style={styles.availabilityText}>Có lịch trống</Text>
                    </View>

                    <View style={styles.hotDetails}>
                      <Text style={styles.hotName} numberOfLines={1}>{item.displayName}</Text>
                      <View style={styles.hotMetaRow}>
                        <Text style={styles.hotSub}>★ {item.rating.toFixed(1)}</Text>
                        <View style={styles.hotDivider} />
                        <Text style={styles.hotSub}>{item.region.toUpperCase()}</Text>
                      </View>

                      {/* Specialties / Specialty pills */}
                      <View style={styles.hotSpecialtyRow}>
                        <View style={styles.hotSpecialtyChip}>
                          <Text style={styles.hotSpecialtyText}>📸 Chân Dung</Text>
                        </View>
                        <View style={styles.hotSpecialtyChip}>
                          <Text style={styles.hotSpecialtyText}>💍 Ảnh cưới</Text>
                        </View>
                      </View>
                    </View>
                  </Pressable>
                ))}
              </ScrollView>
            )}
          </View>

          {/* Section 3: Inspiring Lookbook & Editorial (Bo góc = 5 như khách yêu cầu!) */}
          <View style={styles.discoverySection}>
            <View style={styles.sectionHeaderRow}>
              <Text style={styles.sectionHeaderTitle}>Lookbook & Cảm Hứng 📖</Text>
              <Text style={styles.sectionHeaderCount}>Ý TƯỞNG ĐỘC QUYỀN</Text>
            </View>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.lookbooksScroll}>
              {lookbooks.map((lb, idx) => (
                <Pressable
                  key={idx}
                  style={styles.lookbookCard}
                  onPress={() => {
                    if (lb.photographerId) {
                      navigation.navigate('PhotographerProfile', { photographerId: lb.photographerId });
                    } else {
                      toggleStyle(lb.tag);
                    }
                  }}
                >
                  <Image 
                    source={lb.imageUrl ? { uri: getFullUrl(lb.imageUrl) } : localPicture(lb.coverIndex)} 
                    style={styles.lookbookImg} 
                  />
                  <LinearGradient
                    colors={['transparent', 'rgba(0,0,0,0.7)']}
                    style={styles.lookbookGradient}
                  />
                  <View style={styles.lookbookTextContainer}>
                    <Text style={styles.lookbookTitle}>{lb.title}</Text>
                    <Text style={styles.lookbookDesc}>{lb.desc}</Text>
                  </View>
                </Pressable>
              ))}
            </ScrollView>
          </View>

          {/* Section 4: Portfolio Ấn Tượng (Grid of gorgeous photos) */}
          <View style={styles.discoverySection}>
            <View style={styles.sectionHeaderRow}>
              <Text style={styles.sectionHeaderTitle}>Portfolio Mới Ấn Tượng 📸</Text>
              <Text style={styles.sectionHeaderCount}>CẬP NHẬT LIÊN TỤC</Text>
            </View>
            {loadingDiscovery ? (
              <ActivityIndicator color={colors.accent} />
            ) : coolPortfolios.length === 0 ? (
              <Text style={styles.emptySectionText}>Chưa có portfolio mới</Text>
            ) : (
              <View style={styles.portfolioGrid}>
                {coolPortfolios.slice(0, 6).map((item) => (
                  <Pressable
                    key={item.photoId}
                    style={styles.portfolioGridCard}
                    onPress={() => navigation.navigate('PhotographerProfile', { photographerId: item.photographerId })}
                  >
                    <Image source={{ uri: getFullUrl(item.imageUrl) }} style={styles.portfolioGridImg} />
                    <LinearGradient
                      colors={['transparent', 'rgba(0,0,0,0.6)']}
                      style={styles.portfolioGridGradient}
                    />
                    <View style={styles.portfolioGridLabel}>
                      <Text style={styles.portfolioGridAuthor} numberOfLines={1}>@{item.photographerName}</Text>
                    </View>
                  </Pressable>
                ))}
              </View>
            )}
          </View>

          {/* Section 5: Gói Dịch Vụ Được Yêu Thích (Dữ liệu thật từ DB kết hợp Mock fallback) */}
          <View style={styles.discoverySection}>
            <View style={styles.sectionHeaderRow}>
              <Text style={styles.sectionHeaderTitle}>Gói Chụp Được Yêu Thích ⭐</Text>
              <Text style={styles.sectionHeaderCount}>DỮ LIỆU ĐANG HOẠT ĐỘNG</Text>
            </View>
            <View style={styles.packagesList}>
              {realPackages.map((pkg) => (
                <Pressable
                  key={pkg.id}
                  style={styles.packageCard}
                  onPress={() => {
                    if (pkg.photographerId) {
                      navigation.navigate('PhotographerProfile', { photographerId: pkg.photographerId });
                    } else {
                      toggleStyle(pkg.tag);
                    }
                  }}
                >
                  <View style={styles.packageBody}>
                    <Image 
                      source={pkg.imageUrl ? { uri: getFullUrl(pkg.imageUrl) } : localPicture(pkg.coverIndex)} 
                      style={styles.packageThumbnail} 
                    />
                    <View style={styles.packageInfo}>
                      <View style={styles.packageCardHeader}>
                        <Text style={styles.packageTitle} numberOfLines={1}>{pkg.title}</Text>
                      </View>
                      <Text style={styles.packageAuthor}>Bởi: {pkg.photographerName} · ★ {pkg.rating.toFixed(1)}</Text>
                      <Text style={styles.packagePrice}>{pkg.price.toLocaleString('vi-VN')} VNĐ</Text>
                    </View>
                  </View>

                  {/* Package features */}
                  <View style={styles.featurePillsRow}>
                    {pkg.features.map((feat: string, fIdx: number) => (
                      <View key={fIdx} style={styles.featurePill}>
                        <Ionicons name="checkmark" size={10} color={colors.textMuted} />
                        <Text style={styles.featurePillText}>{feat}</Text>
                      </View>
                    ))}
                  </View>

                  <View style={styles.packageCardFooter}>
                    <Text style={styles.packageMeta}>⏰ {pkg.duration}h chụp tối đa</Text>
                    <View style={styles.bookNowBtn}>
                      <Text style={styles.bookNowBtnText}>Chi tiết</Text>
                      <Ionicons name="arrow-forward" size={12} color={colors.white} />
                    </View>
                  </View>
                </Pressable>
              ))}
            </View>
          </View>

          <View style={{ height: spacing[12] }} />
        </ScrollView>
      ) : (
        /* TRẠNG THÁI KẾT QUẢ TÌM KIẾM */
        <View style={styles.resultsContainer}>
          {/* Active Style Tags list */}
          {selectedStyles.length > 0 && (
            <View style={styles.activePillsContainer}>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.activePillsScroll}>
                {selectedStyles.map((tag) => (
                  <Pressable
                    key={tag}
                    style={styles.activePill}
                    onPress={() => toggleStyle(tag)}
                  >
                    <Text style={styles.activePillText}>#{tag}</Text>
                    <Ionicons name="close-circle" size={14} color={colors.white} />
                  </Pressable>
                ))}
              </ScrollView>
            </View>
          )}

          {loading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color={colors.accent} />
              <Text style={styles.loadingText}>Đang lọc danh sách photographer...</Text>
            </View>
          ) : results.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Ionicons name="search-outline" size={60} color={colors.clay} />
              <Text style={styles.emptyTitle}>Không tìm thấy kết quả</Text>
              <Text style={styles.emptySub}>Vui lòng chỉnh bộ lọc hoặc xóa bớt tiêu chí</Text>
              <Pressable style={styles.resetBtn} onPress={resetFilters}>
                <Text style={styles.resetBtnText}>Đặt lại bộ lọc</Text>
              </Pressable>
            </View>
          ) : (
            <FlatList
              data={results}
              renderItem={renderPhotographerItem}
              keyExtractor={(item) => item.photographerId}
              contentContainerStyle={styles.listContent}
              showsVerticalScrollIndicator={false}
            />
          )}
        </View>
      )}
    </SafeAreaView>
  );
}

const getStyles = (W: number, HOT_CARD_W: number, LOOKBOOK_CARD_W: number) => StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  searchHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing[4],
    paddingVertical: spacing[3],
    gap: spacing[2],
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  backBtn: { padding: spacing[1] },
  searchBar: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.white,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: spacing[3],
    height: 42,
  },
  searchIcon: { marginRight: spacing[2] },
  input: { flex: 1, color: colors.text, fontSize: fontSizes.sm, height: '100%' },
  clearBtn: { padding: spacing[1] },
  filterToggleBtn: {
    width: 42,
    height: 42,
    borderRadius: 21,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.white,
  },
  filterToggleBtnActive: {
    backgroundColor: colors.dark,
    borderColor: colors.dark,
  },
  quickBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing[4],
    paddingVertical: spacing[2],
    gap: spacing[2],
  },
  emergencyBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.accent,
    borderRadius: 16,
    paddingHorizontal: spacing[3],
    paddingVertical: spacing[1.5],
    gap: spacing[1],
  },
  emergencyBtnActive: {
    backgroundColor: colors.accent,
    borderColor: colors.accent,
  },
  emergencyText: {
    color: colors.accent,
    fontSize: fontSizes.xs,
    fontWeight: fontWeights.semibold,
  },
  emergencyTextActive: {
    color: colors.white,
  },
  searchButton: {
    backgroundColor: colors.dark,
    paddingHorizontal: spacing[4],
    paddingVertical: spacing[1.5],
    borderRadius: 16,
  },
  searchButtonText: {
    color: colors.white,
    fontSize: fontSizes.xs,
    fontWeight: fontWeights.bold,
  },
  filtersPanel: {
    backgroundColor: colors.white,
    padding: spacing[4],
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    gap: spacing[2],
  },
  filterTitle: {
    fontSize: fontSizes.xs,
    fontWeight: fontWeights.bold,
    color: colors.textMuted,
    marginTop: spacing[1.5],
    textTransform: 'uppercase',
  },
  regionList: {
    flexDirection: 'row',
    paddingVertical: spacing[1],
  },
  regionChip: {
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 14,
    paddingHorizontal: spacing[3],
    paddingVertical: spacing[1],
    marginRight: spacing[2],
  },
  regionChipActive: {
    backgroundColor: colors.dark,
    borderColor: colors.dark,
  },
  regionChipText: {
    fontSize: fontSizes.xs,
    color: colors.textMuted,
  },
  regionChipTextActive: {
    color: colors.white,
    fontWeight: fontWeights.semibold,
  },
  budgetRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[2],
    marginTop: spacing[1],
  },
  budgetInput: {
    flex: 1,
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 10,
    paddingHorizontal: spacing[3],
    paddingVertical: spacing[1.5],
    fontSize: fontSizes.sm,
    color: colors.text,
  },
  budgetDivider: {
    width: 10,
    height: 1,
    backgroundColor: colors.textMuted,
  },
  discoveryScroll: {
    flex: 1,
  },
  welcomeBannerWrapper: {
    paddingHorizontal: spacing[4],
    paddingTop: spacing[4],
  },
  welcomeBannerImg: {
    width: '100%',
    height: 200,
    justifyContent: 'flex-end',
  },
  welcomeBannerGradient: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: 24,
  },
  welcomeTextContainer: {
    padding: spacing[4],
  },
  welcomeSubtitle: {
    fontSize: 9,
    fontWeight: fontWeights.bold,
    color: colors.accentOrange,
    letterSpacing: 2,
  },
  welcomeTitle: {
    fontSize: 26,
    fontWeight: fontWeights.bold,
    color: colors.white,
    fontStyle: 'italic',
    marginTop: spacing[0.5],
  },
  welcomeDesc: {
    fontSize: fontSizes.xs,
    color: 'rgba(255,255,255,0.7)',
    marginTop: spacing[1],
    lineHeight: 16,
  },
  discoverySection: {
    marginTop: spacing[5],
    paddingHorizontal: spacing[4],
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'baseline',
    marginBottom: spacing[3],
  },
  sectionHeaderTitle: {
    fontSize: fontSizes.md + 2,
    fontWeight: fontWeights.bold,
    color: colors.dark,
    fontStyle: 'italic',
  },
  sectionHeaderCount: {
    fontSize: 9,
    fontWeight: fontWeights.bold,
    color: colors.textLight,
    letterSpacing: 1.5,
  },
  conceptsScroll: {
    gap: spacing[3],
    paddingRight: spacing[4],
  },
  conceptCard: {
    width: 150,
    height: 120,
    borderRadius: 20,
    padding: spacing[3],
    justifyContent: 'space-between',
    shadowColor: colors.dark,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  conceptCardGradient: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: 20,
  },
  conceptIconBg: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.85)',
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'flex-start',
  },
  conceptBottomInfo: {
    gap: 1,
  },
  conceptName: {
    fontSize: fontSizes.sm + 1,
    fontWeight: fontWeights.bold,
    color: colors.white,
  },
  conceptCardSub: {
    fontSize: fontSizes.xs - 3,
    color: 'rgba(255,255,255,0.8)',
  },
  conceptTag: {
    fontSize: fontSizes.xs - 3,
    color: colors.accentOrange,
    fontWeight: fontWeights.bold,
    marginTop: 2,
  },
  hotPhotographersScroll: {
    gap: spacing[4],
    paddingRight: spacing[4],
  },
  hotCard: {
    width: HOT_CARD_W,
    height: 230,
    borderRadius: 24,
    overflow: 'hidden',
    backgroundColor: colors.white,
    shadowColor: colors.dark,
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.15,
    shadowRadius: 20,
    elevation: 8,
  },
  hotCover: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  hotCoverPlaceholder: {
    width: '100%',
    height: '100%',
    backgroundColor: colors.clayLight,
  },
  hotGradient: {
    ...StyleSheet.absoluteFillObject,
  },
  hotBadge: {
    position: 'absolute',
    top: 14,
    left: 14,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.accentOrange,
    paddingHorizontal: spacing[2.5],
    paddingVertical: spacing[1],
    borderRadius: 12,
    gap: 4,
  },
  hotBadgeText: {
    color: colors.white,
    fontSize: 9,
    fontWeight: fontWeights.bold,
    textTransform: 'uppercase',
  },
  availabilityBadge: {
    position: 'absolute',
    top: 14,
    right: 14,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.6)',
    paddingHorizontal: spacing[2],
    paddingVertical: spacing[1],
    borderRadius: 12,
    gap: 4,
  },
  availabilityDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#10b981',
  },
  availabilityText: {
    color: colors.white,
    fontSize: 9,
    fontWeight: fontWeights.semibold,
  },
  hotDetails: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: spacing[4],
  },
  hotName: {
    fontSize: fontSizes.md + 2,
    fontWeight: fontWeights.bold,
    color: colors.white,
    fontStyle: 'italic',
  },
  hotMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: spacing[1],
    gap: spacing[2],
  },
  hotSub: {
    fontSize: fontSizes.xs,
    color: 'rgba(255,255,255,0.9)',
    fontWeight: fontWeights.bold,
  },
  hotDivider: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: 'rgba(255,255,255,0.5)',
  },
  hotSpecialtyRow: {
    flexDirection: 'row',
    marginTop: spacing[2],
    gap: spacing[1.5],
  },
  hotSpecialtyChip: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: spacing[2],
    paddingVertical: spacing[0.5],
    borderRadius: 8,
  },
  hotSpecialtyText: {
    color: colors.white,
    fontSize: 9,
    fontWeight: fontWeights.semibold,
  },
  lookbooksScroll: {
    gap: spacing[3],
    paddingRight: spacing[4],
  },
  lookbookCard: {
    width: LOOKBOOK_CARD_W,
    aspectRatio: 9 / 16,
    borderRadius: 15,
    overflow: 'hidden',
    shadowColor: colors.dark,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 4,
  },
  lookbookImg: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
    borderRadius: 15,
  },
  lookbookGradient: {
    ...StyleSheet.absoluteFillObject,
  },
  lookbookTextContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: spacing[4],
  },
  lookbookTitle: {
    fontSize: fontSizes.md,
    fontWeight: fontWeights.bold,
    color: colors.white,
  },
  lookbookDesc: {
    fontSize: fontSizes.xs - 1,
    color: 'rgba(255,255,255,0.7)',
    marginTop: 2,
  },
  portfolioGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    rowGap: spacing[2],
  },
  portfolioGridCard: {
    width: '48.5%',
    height: 140,
    borderRadius: 16,
    overflow: 'hidden',
    backgroundColor: colors.clayLight,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: 0,
  },
  portfolioGridImg: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  portfolioGridGradient: {
    ...StyleSheet.absoluteFillObject,
  },
  portfolioGridLabel: {
    position: 'absolute',
    bottom: spacing[2],
    left: spacing[2],
  },
  portfolioGridAuthor: {
    color: colors.white,
    fontSize: fontSizes.xs,
    fontWeight: fontWeights.bold,
  },
  packagesList: {
    gap: spacing[3],
  },
  packageCard: {
    backgroundColor: colors.white,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing[4],
    shadowColor: colors.dark,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.04,
    shadowRadius: 12,
    elevation: 3,
  },
  packageBody: {
    flexDirection: 'row',
    gap: spacing[3],
  },
  packageThumbnail: {
    width: 70,
    height: 70,
    borderRadius: 12,
    backgroundColor: colors.clayLight,
  },
  packageInfo: {
    flex: 1,
    justifyContent: 'center',
    gap: 2,
  },
  packageCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: spacing[2],
  },
  packageTitle: {
    fontSize: fontSizes.sm + 1,
    fontWeight: fontWeights.bold,
    color: colors.dark,
  },
  packagePrice: {
    fontSize: fontSizes.sm + 1,
    color: colors.accent,
    fontWeight: fontWeights.bold,
  },
  packageAuthor: {
    fontSize: fontSizes.xs,
    color: colors.textMuted,
  },
  featurePillsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing[2],
    marginVertical: spacing[3],
  },
  featurePill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.background,
    paddingHorizontal: spacing[2.5],
    paddingVertical: spacing[0.5],
    borderRadius: 12,
    gap: 4,
    borderWidth: 1,
    borderColor: 'rgba(26,26,15,0.05)',
  },
  featurePillText: {
    fontSize: fontSizes.xs - 1,
    color: colors.textMuted,
    fontWeight: fontWeights.semibold,
  },
  packageCardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingTop: spacing[2.5],
  },
  packageMeta: {
    fontSize: fontSizes.xs,
    color: colors.textMuted,
    fontWeight: fontWeights.semibold,
  },
  bookNowBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.dark,
    paddingHorizontal: spacing[3],
    paddingVertical: spacing[1.5],
    borderRadius: 14,
    gap: spacing[1],
  },
  bookNowBtnText: {
    color: colors.white,
    fontSize: fontSizes.xs,
    fontWeight: fontWeights.bold,
  },
  emptySectionText: {
    color: colors.textMuted,
    fontSize: fontSizes.sm,
    textAlign: 'center',
    marginVertical: spacing[4],
  },
  resultsContainer: {
    flex: 1,
  },
  activePillsContainer: {
    paddingVertical: spacing[2],
    backgroundColor: colors.white,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  activePillsScroll: {
    paddingHorizontal: spacing[4],
    gap: spacing[2],
  },
  activePill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.accent,
    borderRadius: 14,
    paddingHorizontal: spacing[3],
    paddingVertical: spacing[1],
    gap: spacing[1.5],
  },
  activePillText: {
    color: colors.white,
    fontSize: fontSizes.xs,
    fontWeight: fontWeights.semibold,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: spacing[3],
  },
  loadingText: {
    color: colors.textMuted,
    fontSize: fontSizes.sm,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing[10],
  },
  emptyTitle: {
    fontSize: fontSizes.md,
    fontWeight: fontWeights.bold,
    color: colors.textMuted,
    marginTop: spacing[3],
  },
  emptySub: {
    fontSize: fontSizes.sm,
    color: colors.textLight,
    marginTop: spacing[1],
    textAlign: 'center',
    marginBottom: spacing[4],
  },
  resetBtn: {
    backgroundColor: colors.dark,
    paddingHorizontal: spacing[4],
    paddingVertical: spacing[2],
    borderRadius: 20,
  },
  resetBtnText: {
    color: colors.white,
    fontSize: fontSizes.xs,
    fontWeight: fontWeights.bold,
  },
  listContent: {
    padding: spacing[4],
    gap: spacing[4],
  },
  card: {
    backgroundColor: colors.white,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing[3],
    shadowColor: colors.dark,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[3],
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.clayLight,
  },
  avatarPlaceholder: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarPlaceholderText: {
    fontSize: fontSizes.lg,
    fontWeight: fontWeights.bold,
    color: colors.textMuted,
  },
  headerInfo: {
    flex: 1,
    gap: spacing[0.5],
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[1.5],
  },
  displayName: {
    fontSize: fontSizes.md,
    fontWeight: fontWeights.bold,
    color: colors.text,
    maxWidth: W * 0.45,
  },
  premiumBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.accentOrange,
    paddingHorizontal: spacing[1.5],
    paddingVertical: spacing[0.5],
    borderRadius: 8,
    gap: spacing[0.5],
  },
  premiumText: {
    color: colors.white,
    fontSize: fontSizes.xs - 2,
    fontWeight: fontWeights.bold,
  },
  subInfoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  regionText: {
    fontSize: fontSizes.xs,
    color: colors.textMuted,
  },
  priceRange: {
    fontSize: fontSizes.xs,
    color: colors.accent,
    fontWeight: fontWeights.semibold,
  },
  portfolioRow: {
    flexDirection: 'row',
    gap: spacing[2],
    marginTop: spacing[3],
  },
  portfolioThumbnail: {
    flex: 1,
    height: 80,
    borderRadius: 8,
    backgroundColor: colors.clayLight,
  },
});
