import React, { useState, useEffect } from 'react';
import {
  ScrollView, StyleSheet, Text, View, Pressable, Alert, TextInput, ActivityIndicator, Image, TouchableOpacity, Platform, Linking,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';
import { Ionicons, Feather } from '@expo/vector-icons';
import { useNavigation, useRoute } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import { cancelBooking, submitReview, getPhotographer, getPhotographerServicePackages, Booking, Photographer } from '../api';
import { ClayCard } from '../../../shared/components/ClayCard';
import { ClayButton } from '../../../shared/components/ClayButton';
import PortfolioImageCell from '../../../shared/components/PortfolioImageCell';
import { formatImageUrl } from '../../../shared/utils/formatImageUrl';
import { colors } from '../../../app/theme/colors';
import { usePhotographerTheme } from '../../photographer/PhotographerThemeContext';
import { fontSizes, fontWeights } from '../../../app/theme/typography';
import { radius, spacing } from '../../../app/theme/spacing';

const STATUS_CFG: Record<string, { label: string; color: string; bgColor: string; icon: string }> = {
  Pending:    { label: 'Chờ xác nhận', color: '#b88d14', bgColor: '#fef9e7', icon: 'time' },
  Processing: { label: 'Đang xử lý',    color: '#b88d14', bgColor: '#fef9e7', icon: 'sync' },
  Confirmed:  { label: 'Đã xác nhận', color: '#1d4ed8', bgColor: '#eef2ff', icon: 'checkmark-circle' },
  Completed:  { label: 'Hoàn thành',  color: '#15803d', bgColor: '#f0fdf4', icon: 'checkmark-done-circle' },
  Cancelled:  { label: 'Đã hủy',      color: '#cf4028', bgColor: '#fef2f2', icon: 'close-circle' },
  Disputed:   { label: 'Tranh chấp',  color: '#e07b39', bgColor: '#fff7ed', icon: 'warning' },
};

const STATUS_CFG_DARK: Record<string, { label: string; color: string; bgColor: string; icon: string }> = {
  Pending:    { label: 'Chờ xác nhận', color: '#ffd666', bgColor: 'rgba(255, 214, 102, 0.15)', icon: 'time' },
  Processing: { label: 'Đang xử lý',    color: '#ffd666', bgColor: 'rgba(255, 214, 102, 0.15)', icon: 'sync' },
  Confirmed:  { label: 'Đã xác nhận', color: '#63b3ed', bgColor: 'rgba(99, 179, 237, 0.15)', icon: 'checkmark-circle' },
  Completed:  { label: 'Hoàn thành',  color: '#81e6d9', bgColor: 'rgba(129, 230, 217, 0.15)', icon: 'checkmark-done-circle' },
  Cancelled:  { label: 'Đã hủy',      color: '#feb2b2', bgColor: 'rgba(254, 178, 178, 0.15)', icon: 'close-circle' },
  Disputed:   { label: 'Tranh chấp',  color: '#fbd38d', bgColor: 'rgba(251, 211, 141, 0.15)', icon: 'warning' },
};

function splitTags(value: string) {
  return value
    .split(/[,\n]+/)
    .map((tag) => tag.trim())
    .filter(Boolean)
    .filter((tag, index, arr) => arr.indexOf(tag) === index)
    .slice(0, 12);
}

function splitDescriptionSections(text: string) {
  const getPart = (key: string) => {
    const match = text.match(new RegExp(`(?:^|\\n)${key}\\s*([\\s\\S]*?)(?=\\n(?:Mô tả chi tiết:|Tag ảnh:|Features:|Yêu cầu buổi chụp:)|$)`, 'i'));
    return match ? match[1].trim() : '';
  };
  const tagsStr = getPart('Tag ảnh:');
  return {
    description: getPart('Mô tả chi tiết:') || (!text.includes('Mô tả chi tiết:') ? text.split('\n')[0] : ''),
    tags: tagsStr,
    features: getPart('Features:'),
    requirements: getPart('Yêu cầu buổi chụp:'),
  };
}

function getArtisticConcept(bookingId: string) {
  let hash = 0;
  for (let i = 0; i < bookingId.length; i++) {
    hash = bookingId.charCodeAt(i) + ((hash << 5) - hash);
  }
  const index = Math.abs(hash) % 4;

  const concepts = [
    {
      title: 'Chân dung tối giản & Đương đại',
      tips: 'Mặc trang phục đơn sắc (trắng, đen, be). Trang điểm tự nhiên nhẹ nhàng.',
      mood: 'Tập trung bắt trọn cảm xúc tự nhiên, góc máy cận cảnh nghệ thuật.'
    },
    {
      title: 'Hoàng hôn ngoại cảnh thơ màng',
      tips: 'Lựa chọn trang phục chất liệu bay bổng, tông màu pastel hoặc ấm.',
      mood: 'Khung giờ vàng (Golden Hour), hiệu ứng ánh sáng điện ảnh mơ màng.'
    },
    {
      title: 'Thời trang Đường phố cá tính',
      tips: 'Chuẩn bị trang phục năng động, phá cách (Jeans, Blazer, Jacket tối giản).',
      mood: 'Bắt trọn chuyển động ngẫu hứng trên phố, phong cách hiện đại.'
    },
    {
      title: 'Khoảnh khắc gia đình ấm áp',
      tips: 'Phối đồ đồng điệu màu sắc giữa các thành viên, tránh hoạ tiết cầu kỳ.',
      mood: 'Ấm cúng, tự nhiên, tập trung vào sự kết nối gia đình ngọt ngào.'
    }
  ];

  return concepts[index];
}

function StarRow({ value, onChange }: { value: number; onChange: (v: number) => void }) {
  const { isDark, colors: pColors } = usePhotographerTheme();
  return (
    <View style={styles.starRow}>
      {[1, 2, 3, 4, 5].map((s) => (
        <Pressable key={s} onPress={() => onChange(s)}>
          <Ionicons
            name={s <= value ? 'star' : 'star-outline'}
            size={32}
            color={s <= value ? '#f4c430' : (isDark ? pColors.textLight : colors.textLight)}
          />
        </Pressable>
      ))}
    </View>
  );
}

export default function BookingDetailScreen() {
  const { isDark, colors: pColors } = usePhotographerTheme();
  const navigation = useNavigation<any>();
  const route      = useRoute<any>();
  const insets     = useSafeAreaInsets();
  const { booking } = route.params as { booking: Booking };

  const [photographer, setPhotographer] = useState<Photographer | null>(null);
  const [packages, setPackages] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const [packageExpanded, setPackageExpanded] = useState(false);
  const [infoExpanded, setInfoExpanded] = useState(false);
  const [rating,         setRating]         = useState(5);
  const [comment,        setComment]        = useState('');
  const [submittingRev,  setSubmittingRev]  = useState(false);
  const [reviewDone,     setReviewDone]     = useState(false);
  const [cancelling,     setCancelling]     = useState(false);

  useEffect(() => {
    async function loadData() {
      try {
        const [p, pkgs] = await Promise.all([
          getPhotographer(booking.photographerId),
          getPhotographerServicePackages(booking.photographerId),
        ]);
        if (p) setPhotographer(p);
        if (pkgs) setPackages(pkgs);
      } catch (err) {
        console.log('Error loading booking detail screen data:', err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [booking.photographerId]);

  const cfg = (isDark ? STATUS_CFG_DARK[booking.status] : STATUS_CFG[booking.status]) ?? (isDark ? STATUS_CFG_DARK.Pending : STATUS_CFG.Pending);
  const canCancel = booking.status === 'Pending' || booking.status === 'Confirmed';
  const canReview = booking.status === 'Completed' && !reviewDone;

  async function handleCancel() {
    Alert.alert('Hủy lịch hẹn', 'Bạn chắc chắn muốn hủy lịch hẹn này? Hành động này không thể hoàn tác.', [
      { text: 'Không', style: 'cancel' },
      {
        text: 'Xác nhận hủy',
        style: 'destructive',
        onPress: async () => {
          setCancelling(true);
          try {
            await cancelBooking(booking.id, 'Khách hàng hủy');
            Alert.alert('Đã hủy', 'Lịch hẹn đã được hủy thành công.');
            navigation.goBack();
          } catch { Alert.alert('Lỗi', 'Không thể hủy. Vui lòng thử lại.'); }
          setCancelling(false);
        },
      },
    ]);
  }

  const handleCallPress = () => {
    if (booking.phone) {
      Linking.openURL(`tel:${booking.phone}`).catch(() => {
        Alert.alert('Lỗi', 'Không thể khởi chạy cuộc gọi trên thiết bị này.');
      });
    } else {
      Alert.alert('Thông báo', 'Không có số điện thoại liên kết.');
    }
  };

  async function handleSubmitReview() {
    if (!comment.trim()) { Alert.alert('Thiếu nhận xét', 'Vui lòng để lại nhận xét.'); return; }
    setSubmittingRev(true);
    try {
      await submitReview({ bookingId: booking.id, rating, comment: comment.trim() });
      setReviewDone(true);
      Alert.alert('✅ Cảm ơn!', 'Đánh giá của bạn đã được gửi.');
    } catch { Alert.alert('Lỗi', 'Không gửi được đánh giá.'); }
    setSubmittingRev(false);
  }

  // Find matched package
  const matchedPkg = booking.servicePackageId
    ? packages.find((p) => p.id?.toLowerCase() === booking.servicePackageId?.toLowerCase())
    : null;

  // Fallback concept
  const concept = getArtisticConcept(booking.id);
  const packageTitle = matchedPkg ? matchedPkg.title : concept.title;
  const parsedDesc = matchedPkg ? splitDescriptionSections(matchedPkg.description || '') : null;
  const packageMood = parsedDesc?.description || concept.mood;
  const packageTips = parsedDesc?.requirements || concept.tips;

  // Parse sections for package if matched
  const tags = parsedDesc?.tags ? splitTags(parsedDesc.tags) : [];
  const featureLines = parsedDesc?.features
    ? parsedDesc.features.split('\n').map((l) => l.trim().replace(/^- /, '')).filter(Boolean)
    : [];
  const requirementLines = parsedDesc?.requirements
    ? parsedDesc.requirements.split('\n').map((l) => l.trim().replace(/^- /, '')).filter(Boolean)
    : [];

  const pName = photographer?.displayName ?? 'Nhiếp ảnh gia';
  const pAvatar = formatImageUrl(photographer?.avatarUrl) || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150';
  const pCover = photographer?.coverPhotoUrl
    ? formatImageUrl(photographer.coverPhotoUrl)
    : (photographer?.portfolioPhotos && photographer.portfolioPhotos.length > 0)
      ? formatImageUrl(photographer.portfolioPhotos[0])
      : 'https://images.unsplash.com/photo-1452587925148-ce544e77e70d?w=800';

  const date = new Date(booking.scheduledAt);
  const dayStr = date.getDate();
  const months = ['Tháng 1', 'Tháng 2', 'Tháng 3', 'Tháng 4', 'Tháng 5', 'Tháng 6', 'Tháng 7', 'Tháng 8', 'Tháng 9', 'Tháng 10', 'Tháng 11', 'Tháng 12'];
  const monthStr = months[date.getMonth()];
  const yearStr = date.getFullYear();
  const daysOfWeek = ['Chủ Nhật', 'Thứ Hai', 'Thứ Ba', 'Thứ Tư', 'Thứ Năm', 'Thứ Sáu', 'Thứ Bảy'];
  const dayOfWeekStr = daysOfWeek[date.getDay()];
  
  const dateLongStr = `${dayOfWeekStr}, Ngày ${dayStr} ${monthStr}, ${yearStr}`;
  const timeStr = date.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });

  const renderPackageCard = () => {
    if (!matchedPkg) {
      // Fallback Concept Card
      return (
        <View style={[styles.conceptCard, isDark && { backgroundColor: pColors.surface, borderColor: pColors.borderStrong }]}>
          <View style={styles.conceptHeader}>
            <Ionicons name="sparkles-outline" size={16} color={isDark ? pColors.accent : colors.accent} />
            <Text style={[styles.conceptTitleLabel, isDark && { color: pColors.accent }]}>CONCEPT CHỤP ẢNH</Text>
          </View>
          <Text style={[styles.conceptTitle, isDark && { color: pColors.text }]}>{concept.title}</Text>
          <Text style={[styles.conceptMood, isDark && { color: pColors.textMuted }]}>{concept.mood}</Text>
          
          <View style={[styles.tipsBox, isDark && { backgroundColor: pColors.surfaceStrong, borderColor: pColors.accent }]}>
            <View style={styles.tipsHeader}>
              <Ionicons name="bulb-outline" size={14} color={isDark ? pColors.accent : colors.accent} />
              <Text style={[styles.tipsTitle, isDark && { color: pColors.text }]}>Gợi ý chuẩn bị cho bạn</Text>
            </View>
            <Text style={[styles.tipsText, isDark && { color: pColors.textMuted }]}>{concept.tips}</Text>
          </View>
        </View>
      );
    }

    // Actual Photographer Package Card (Expandable/Collapsible)
    const hasMedia = matchedPkg.media && matchedPkg.media.length > 0;
    
    return (
      <View style={[styles.packageCard, isDark && { backgroundColor: pColors.surface, borderColor: pColors.borderStrong }]}>
        <TouchableOpacity onPress={() => setPackageExpanded(!packageExpanded)} activeOpacity={0.9}>
          {/* Cover Image inside card */}
          <View style={styles.packageCover}>
            {hasMedia ? (
              <Image source={{ uri: formatImageUrl(matchedPkg.media[0].imageUrl) }} style={StyleSheet.absoluteFillObject} resizeMode="cover" />
            ) : (
              <View style={[StyleSheet.absoluteFillObject, { backgroundColor: 'rgba(26,26,15,0.05)', justifyContent: 'center', alignItems: 'center' }]}>
                <Ionicons name="images-outline" size={36} color="rgba(26,26,15,0.2)" />
              </View>
            )}
            <LinearGradient
              colors={['rgba(0,0,0,0.1)', 'transparent', 'rgba(0,0,0,0.8)']}
              locations={[0, 0.4, 1]}
              style={StyleSheet.absoluteFillObject}
            />
            
            <View style={styles.packageCoverContent}>
              <View style={styles.packagePricePill}>
                <Text style={styles.packagePriceText}>{matchedPkg.price?.toLocaleString('vi-VN')} đ</Text>
                <Text style={styles.packagePriceSep}>/</Text>
                <Text style={styles.packagePriceDuration}>{matchedPkg.durationHours}h</Text>
              </View>
              <Text style={styles.packageCoverTitle}>{matchedPkg.title}</Text>
            </View>
          </View>

          {/* Package Body */}
          <View style={styles.packageBody}>
            {tags.length > 0 && (
              <View style={styles.packageTagRow}>
                {tags.map((tag, idx) => (
                  <View key={idx} style={styles.packageTag}>
                    <Text style={[styles.packageTagText, isDark && { color: pColors.accent }]}>#{tag}</Text>
                  </View>
                ))}
              </View>
            )}

            <View style={styles.packageMetaRow}>
              <View style={[styles.packageMetaChip, isDark && { backgroundColor: pColors.surfaceStrong, borderColor: pColors.border }]}>
                <Ionicons name="time-outline" size={12} color={isDark ? pColors.text : colors.dark} />
                <Text style={[styles.packageMetaChipText, isDark && { color: pColors.text }]}>{matchedPkg.durationHours} giờ chụp</Text>
              </View>
              <View style={[styles.packageMetaChip, isDark && { backgroundColor: pColors.surfaceStrong, borderColor: pColors.border }]}>
                <Ionicons name="images-outline" size={12} color={isDark ? pColors.text : colors.dark} />
                <Text style={[styles.packageMetaChipText, isDark && { color: pColors.text }]}>{matchedPkg.media?.length || 0} ảnh mẫu</Text>
              </View>
            </View>

            {/* COLLAPSED STATE */}
            {!packageExpanded && (
              <>
                {!!packageMood && (
                  <Text style={[styles.packageDesc, isDark && { color: pColors.textMuted }]} numberOfLines={2}>
                    {packageMood}
                  </Text>
                )}
                {matchedPkg.media && matchedPkg.media.length > 1 && (
                  <View style={styles.packageThumbStrip}>
                    {matchedPkg.media.slice(1, 5).map((media: any, mi: number) => (
                      <PortfolioImageCell
                        key={media.id ?? mi}
                        uri={media.imageUrl}
                        borderRadius={8}
                        style={styles.packageThumbItem}
                        resizeMode="cover"
                      />
                    ))}
                    {matchedPkg.media.length > 5 && (
                      <View style={[styles.packageThumbMore, isDark && { backgroundColor: pColors.surfaceStrong, borderColor: pColors.border }]}>
                        <Text style={[styles.packageThumbMoreText, isDark && { color: pColors.textMuted }]}>+{matchedPkg.media.length - 5}</Text>
                      </View>
                    )}
                  </View>
                )}
              </>
            )}

            {/* EXPANDED STATE */}
            {packageExpanded && (
              <Animated.View entering={FadeInDown.duration(350)} style={styles.packageExpandedContent}>
                {/* Description */}
                {!!packageMood && (
                  <View style={[styles.packageSection, isDark && { borderTopColor: pColors.border }]}>
                    <View style={styles.packageSectionHeader}>
                      <Ionicons name="document-text-outline" size={13} color={isDark ? pColors.text : colors.dark} />
                      <Text style={[styles.packageSectionTitle, isDark && { color: pColors.text }]}>Mô tả chi tiết</Text>
                    </View>
                    <Text style={[styles.packageSectionBody, isDark && { color: pColors.textMuted }]}>{packageMood}</Text>
                  </View>
                )}

                {/* Features */}
                {featureLines.length > 0 && (
                  <View style={[styles.packageSection, isDark && { borderTopColor: pColors.border }]}>
                    <View style={styles.packageSectionHeader}>
                      <Ionicons name="sparkles-outline" size={13} color={isDark ? pColors.success : colors.success} />
                      <Text style={[styles.packageSectionTitle, { color: isDark ? pColors.success : colors.success }]}>Đặc điểm nổi bật</Text>
                    </View>
                    <View style={styles.packageFeatureList}>
                      {featureLines.map((line, idx) => (
                        <View key={idx} style={styles.packageFeatureItem}>
                          <Ionicons name="checkmark-circle" size={14} color={isDark ? pColors.success : colors.success} style={{ marginTop: 2 }} />
                          <Text style={[styles.packageFeatureText, isDark && { color: pColors.text }]}>{line}</Text>
                        </View>
                      ))}
                    </View>
                  </View>
                )}

                {/* Requirements */}
                {requirementLines.length > 0 && (
                  <View style={[styles.packageSection, isDark && { borderTopColor: pColors.border }]}>
                    <View style={styles.packageSectionHeader}>
                      <Ionicons name="clipboard-outline" size={13} color={isDark ? pColors.info : colors.info} />
                      <Text style={[styles.packageSectionTitle, { color: isDark ? pColors.info : colors.info }]}>Yêu cầu buổi chụp</Text>
                    </View>
                    <View style={styles.packageFeatureList}>
                      {requirementLines.map((line, idx) => (
                        <View key={idx} style={styles.packageFeatureItem}>
                          <Ionicons name="ellipse" size={5} color={isDark ? pColors.info : colors.info} style={{ marginTop: 6 }} />
                          <Text style={[styles.packageFeatureText, { color: isDark ? pColors.textMuted : colors.textMuted }]}>{line}</Text>
                        </View>
                      ))}
                    </View>
                  </View>
                )}

                {/* Sample Photos Grid */}
                {matchedPkg.media && matchedPkg.media.length > 0 && (
                  <View style={[styles.packageSection, isDark && { borderTopColor: pColors.border }]}>
                    <View style={styles.packageSectionHeader}>
                      <Ionicons name="images-outline" size={13} color={isDark ? pColors.text : colors.dark} />
                      <Text style={[styles.packageSectionTitle, isDark && { color: pColors.text }]}>Ảnh mẫu thực tế ({matchedPkg.media.length})</Text>
                    </View>
                    <View style={styles.packagePhotoGrid}>
                      {matchedPkg.media.map((media: any, mi: number) => (
                        <PortfolioImageCell
                          key={media.id ?? mi}
                          uri={media.imageUrl}
                          borderRadius={8}
                          style={styles.packagePhotoItem}
                          resizeMode="cover"
                        />
                      ))}
                    </View>
                  </View>
                )}
              </Animated.View>
            )}

            {/* Toggle Arrow Indicator */}
            <View style={[styles.packageToggleIndicator, isDark && { borderTopColor: pColors.border }]}>
              <Ionicons name={packageExpanded ? 'chevron-up' : 'chevron-down'} size={18} color={isDark ? pColors.textMuted : "rgba(26,26,15,0.4)"} />
              <Text style={[styles.packageToggleText, isDark && { color: pColors.textMuted }]}>
                {packageExpanded ? 'Thu gọn chi tiết' : 'Xem chi tiết gói dịch vụ'}
              </Text>
            </View>
          </View>
        </TouchableOpacity>
      </View>
    );
  };

  if (loading) {
    return (
      <View style={[styles.loadingContainer, isDark && { backgroundColor: pColors.background }]}>
        <ActivityIndicator size="large" color={colors.accent} />
        <Text style={[styles.loadingText, isDark && { color: pColors.textMuted }]}>Đang tải chi tiết đặt lịch...</Text>
      </View>
    );
  }

  return (
    <View style={[styles.container, isDark && { backgroundColor: pColors.background }]}>
      {/* Editorial Header Banner */}
      <View style={styles.coverSection}>
        <Image
          source={{ uri: pCover }}
          style={styles.coverImage}
        />
        <LinearGradient
          colors={['rgba(0,0,0,0.3)', 'rgba(0,0,0,0.1)', 'rgba(26,26,15,0.85)']}
          style={StyleSheet.absoluteFillObject}
        />
        
        {/* Floating Back Button with glass style */}
        <Pressable
          style={[styles.floatingBackBtn, { top: insets.top + 10 }]}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={20} color={colors.dark} />
        </Pressable>

        {/* Cover Info Overlay */}
        <View style={styles.coverInfoContainer}>
          <View style={styles.photographerHeaderRow}>
            <Image source={{ uri: pAvatar }} style={styles.headerAvatar} />
            <View style={styles.headerTextContainer}>
              <View style={[
                styles.roleBadge,
                isDark 
                  ? { backgroundColor: '#ffffff', borderColor: '#ffffff' }
                  : { backgroundColor: 'transparent', borderColor: 'rgba(255,255,255,0.4)' }
              ]}>
                <Text style={[
                  styles.headerRole,
                  isDark ? { color: '#000000' } : { color: '#ffffff' }
                ]}>NHIẾP ẢNH GIA</Text>
              </View>
              <Text style={styles.headerName}>{pName}</Text>
              <Text style={styles.headerRegion}>
                <Ionicons name="pin-outline" size={11} color="rgba(255,255,255,0.7)" /> {photographer?.region}
              </Text>
            </View>
            {photographer?.rating ? (
              <View style={styles.headerRatingBadge}>
                <Ionicons name="star" size={11} color="#FFD700" />
                <Text style={styles.headerRatingText}>{photographer.rating.toFixed(1)}</Text>
              </View>
            ) : null}
          </View>
        </View>
      </View>

      <ScrollView 
        contentContainerStyle={styles.scroll} 
        showsVerticalScrollIndicator={false}
        style={styles.scrollView}
      >
        {/* Card 1: Time & Status Hero */}
        <Animated.View entering={FadeInDown.duration(500).delay(100)}>
          <ClayCard style={[styles.card, isDark && { backgroundColor: pColors.surface, borderColor: pColors.borderStrong }]}>
            <View style={styles.timeSection}>
              <View style={[styles.timeIconWrapper, isDark && { backgroundColor: 'rgba(207,64,40,0.15)' }]}>
                <Feather name="clock" size={22} color={isDark ? pColors.accent : colors.accent} />
              </View>
              <View style={styles.timeTextWrapper}>
                <Text style={[styles.timeDateText, isDark && { color: pColors.text }]}>{dateLongStr}</Text>
                <Text style={[styles.timeHourText, isDark && { color: pColors.textMuted }]}>{timeStr} • Khung giờ chụp</Text>
              </View>
            </View>

            <View style={[styles.cardDivider, isDark && { backgroundColor: pColors.border }]} />

            <View style={styles.statusPriceRow}>
              <View style={[styles.statusBadge, { backgroundColor: cfg.bgColor }]}>
                <Ionicons name={cfg.icon as any} size={13} color={cfg.color} />
                <Text style={[styles.statusLabelText, { color: cfg.color }]}>{cfg.label}</Text>
              </View>
              <View style={styles.priceContainer}>
                <Text style={[styles.priceLabel, isDark && { color: pColors.textLight }]}>CHI PHÍ THỎA THUẬN</Text>
                <Text style={[styles.priceValue, isDark && { color: pColors.accent }]}>{booking.agreedPrice?.toLocaleString('vi-VN')} đ</Text>
              </View>
            </View>
          </ClayCard>
        </Animated.View>

        {/* Card 2: Package details card */}
        <Animated.View entering={FadeInDown.duration(500).delay(160)}>
          {renderPackageCard()}
        </Animated.View>

        {/* Card 3: Photoshoot Schedule Details */}
        <Animated.View entering={FadeInDown.duration(500).delay(220)}>
          <ClayCard style={[styles.card, isDark && { backgroundColor: pColors.surface, borderColor: pColors.borderStrong }]}>
            <Text style={[styles.cardTitle, isDark && { color: pColors.text }]}>Chi tiết cuộc hẹn</Text>
            
            <View style={{ gap: spacing[3] }}>
              {/* Highlighted Full-width Location Card */}
              <View style={[
                { backgroundColor: '#FAF7F2', borderRadius: 16, padding: 14, borderWidth: 1, borderColor: 'rgba(46,42,36,0.08)', gap: 6 },
                isDark && { backgroundColor: pColors.surfaceStrong, borderColor: pColors.borderStrong }
              ]}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                  <Ionicons name="pin" size={16} color={isDark ? pColors.accent : "#D4AF37"} />
                  <Text style={[{ fontSize: 10, fontWeight: '700', color: colors.textLight, textTransform: 'uppercase' }, isDark && { color: pColors.textLight }]}>Địa điểm chụp</Text>
                </View>
                <Text style={[{ fontSize: 14, fontWeight: '600', color: colors.dark, lineHeight: 20 }, isDark && { color: pColors.text }]}>
                  {booking.location || 'Chưa định cấu hình'}
                </Text>
              </View>

              {/* Highlighted Full-width Phone Card (Press to call) */}
              <Pressable 
                onPress={handleCallPress}
                style={({ pressed }) => [
                  {
                    backgroundColor: '#FAF7F2',
                    borderRadius: 16,
                    padding: 14,
                    borderWidth: 1,
                    borderColor: 'rgba(46,42,36,0.08)',
                    flexDirection: 'row',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    opacity: pressed ? 0.8 : 1,
                  },
                  isDark && { backgroundColor: pColors.surfaceStrong, borderColor: pColors.borderStrong }
                ]}
              >
                <View style={{ gap: 6, flex: 1 }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                    <Ionicons name="call" size={16} color={isDark ? pColors.info : "#3A6073"} />
                    <Text style={[{ fontSize: 10, fontWeight: '700', color: colors.textLight, textTransform: 'uppercase' }, isDark && { color: pColors.textLight }]}>Số điện thoại liên hệ</Text>
                  </View>
                  <Text style={[{ fontSize: 14, fontWeight: '600', color: colors.dark }, isDark && { color: pColors.text }]}>
                    {booking.phone || 'Chưa có số điện thoại'}
                  </Text>
                </View>

                {booking.phone && (
                  <View style={[{ width: 36, height: 36, borderRadius: 18, backgroundColor: 'rgba(58, 96, 115, 0.08)', alignItems: 'center', justifyContent: 'center' }, isDark && { backgroundColor: 'rgba(255,255,255,0.08)' }]}>
                    <Ionicons name="call" size={16} color={isDark ? pColors.info : "#3A6073"} />
                  </View>
                )}
              </Pressable>

              {booking.note ? (
                <View style={[styles.noteBox, { marginTop: 4 }, isDark && { backgroundColor: pColors.surfaceStrong, borderLeftColor: pColors.accent }]}>
                  <Text style={[styles.noteBoxTitle, isDark && { color: pColors.accent }]}>Ghi chú khách hàng</Text>
                  <Text style={[styles.noteBoxText, isDark && { color: pColors.textMuted }]}>"{booking.note}"</Text>
                </View>
              ) : null}

              {booking.requirements ? (
                <View style={[styles.noteBox, { borderLeftColor: colors.info, marginTop: 4 }, isDark && { backgroundColor: pColors.surfaceStrong, borderLeftColor: pColors.info }]}>
                  <Text style={[styles.noteBoxTitle, { color: colors.info }, isDark && { color: pColors.info }]}>Yêu cầu trang phục/chuẩn bị</Text>
                  <Text style={[styles.noteBoxText, isDark && { color: pColors.textMuted }]}>"{booking.requirements}"</Text>
                </View>
              ) : null}
            </View>

            {/* Collapsible toggle for Booking Code and Creation Time */}
            <Pressable 
              onPress={() => setInfoExpanded(!infoExpanded)} 
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'space-between',
                paddingVertical: 12,
                marginTop: 16,
                borderTopWidth: 1,
                borderTopColor: isDark ? pColors.border : 'rgba(26,26,15,0.06)'
              }}
            >
              <Text style={[{ fontSize: 13, fontWeight: '700', color: colors.textMuted }, isDark && { color: pColors.textMuted }]}>Xem thêm thông tin</Text>
              <Ionicons name={infoExpanded ? 'chevron-up' : 'chevron-down'} size={18} color={isDark ? pColors.textMuted : colors.textMuted} />
            </Pressable>

            {infoExpanded && (
              <Animated.View entering={FadeInDown.duration(200)} style={{ gap: spacing[3], marginTop: spacing[2] }}>
                <View style={styles.detailsRow}>
                  <View style={[styles.detailsIconWrapper, isDark && { backgroundColor: pColors.surfaceStrong, borderColor: pColors.border }]}>
                    <Ionicons name="barcode-outline" size={15} color={isDark ? pColors.textMuted : colors.textMuted} />
                  </View>
                  <View style={styles.detailsTextWrapper}>
                    <Text style={[styles.detailsLabel, isDark && { color: pColors.textLight }]}>Mã đặt lịch</Text>
                    <Text style={[styles.detailsValue, isDark && { color: pColors.text }]}>{`#${booking.id.toUpperCase()}`}</Text>
                  </View>
                </View>

                <View style={styles.detailsRow}>
                  <View style={[styles.detailsIconWrapper, isDark && { backgroundColor: pColors.surfaceStrong, borderColor: pColors.border }]}>
                    <Ionicons name="time-outline" size={15} color={isDark ? pColors.textMuted : colors.textMuted} />
                  </View>
                  <View style={styles.detailsTextWrapper}>
                    <Text style={[styles.detailsLabel, isDark && { color: pColors.textLight }]}>Thời gian đặt</Text>
                    <Text style={[styles.detailsValue, isDark && { color: pColors.text }]}>{new Date(booking.createdAt).toLocaleString('vi-VN')}</Text>
                  </View>
                </View>
              </Animated.View>
            )}

            {booking.cancellationReason && (
              <View style={[styles.cancelReasonBox, isDark && { backgroundColor: 'rgba(207,64,40,0.15)' }]}>
                <Ionicons name="warning-outline" size={16} color={isDark ? pColors.accent : colors.accent} />
                <Text style={[styles.cancelReasonText, isDark && { color: pColors.accent }]}>Lý do hủy: {booking.cancellationReason}</Text>
              </View>
            )}
          </ClayCard>
        </Animated.View>

        {/* Card 4: Timeline flow */}
        <Animated.View entering={FadeInDown.duration(500).delay(280)}>
          <ClayCard style={[styles.card, isDark && { backgroundColor: pColors.surface, borderColor: pColors.borderStrong }]}>
            <Text style={[styles.cardTitle, isDark && { color: pColors.text }]}>Trạng thái tiến trình</Text>
            {(() => {
              const getStepStatus = (index: number) => {
                const status = booking.status;
                if (status === 'Cancelled') return { done: false, active: false };
                if (index === 0) return { done: true, active: status === 'Pending' };
                if (index === 1) return { done: status === 'Confirmed' || status === 'Processing' || status === 'Completed', active: status === 'Confirmed' };
                if (index === 2) return { done: status === 'Processing' || status === 'Completed', active: status === 'Processing' };
                if (index === 3) return { done: status === 'Completed', active: status === 'Completed' };
                return { done: false, active: false };
              };

              const steps = [
                { label: 'Đặt lịch', ...getStepStatus(0) },
                { label: 'Trao đổi', ...getStepStatus(1) },
                { label: 'Chụp hình', ...getStepStatus(2) },
                { label: 'Hoàn tất', ...getStepStatus(3) },
              ];

              return (
                <View style={styles.progressTimeline}>
                  {/* Step Labels */}
                  <View style={styles.progressLabelsRow}>
                    {steps.map((step, idx) => (
                      <Text
                        key={idx}
                        style={[
                          styles.progressLabel,
                          step.active && styles.progressLabelActive,
                          step.done && !step.active && styles.progressLabelDone,
                          isDark && { color: pColors.textLight },
                          isDark && step.active && { color: pColors.accent },
                          isDark && step.done && !step.active && { color: pColors.text }
                        ]}
                      >
                        {step.label}
                      </Text>
                    ))}
                  </View>

                  {/* Progress Bars */}
                  <View style={styles.progressBarsRow}>
                    {steps.map((step, idx) => (
                      <View
                        key={idx}
                        style={[
                          styles.progressBarSegment,
                          step.done && styles.progressBarSegmentDone,
                          step.active && styles.progressBarSegmentActive,
                          isDark && { backgroundColor: pColors.surfaceStrong },
                          isDark && (step.done || step.active) && { backgroundColor: pColors.accent }
                        ]}
                      />
                    ))}
                  </View>
                </View>
              );
            })()}
          </ClayCard>
        </Animated.View>

        {/* Review Section */}
        {canReview && (
          <Animated.View entering={FadeInDown.duration(500).delay(340)}>
            <ClayCard style={[styles.card, isDark && { backgroundColor: pColors.surface, borderColor: pColors.borderStrong }]}>
              <Text style={[styles.cardTitle, isDark && { color: pColors.text }]}>⭐ Đánh giá buổi chụp</Text>
              <Text style={[styles.reviewSub, isDark && { color: pColors.textMuted }]}>Chia sẻ trải nghiệm của bạn để nâng cao dịch vụ</Text>
              <StarRow value={rating} onChange={setRating} />
              <TextInput
                style={[
                  styles.reviewInput,
                  isDark && {
                    backgroundColor: pColors.surfaceStrong,
                    color: pColors.text,
                    borderColor: pColors.borderStrong,
                  }
                ]}
                value={comment}
                onChangeText={setComment}
                placeholder="Nhận xét chi tiết của bạn về sản phẩm/phong cách nhiếp ảnh gia..."
                placeholderTextColor={isDark ? pColors.textLight : colors.textLight}
                multiline
                numberOfLines={4}
              />
              <View style={{ marginTop: spacing[3] }}>
                <ClayButton
                  label="Gửi đánh giá"
                  onPress={handleSubmitReview}
                  loading={submittingRev}
                  variant="primary"
                  size="md"
                  style={isDark ? { backgroundColor: pColors.accent, shadowColor: pColors.accent } : undefined}
                  textStyle={isDark ? { color: '#ffffff' } : undefined}
                />
              </View>
            </ClayCard>
          </Animated.View>
        )}

        {reviewDone && (
          <ClayCard style={[styles.card, { backgroundColor: colors.success + '08', borderColor: colors.success + '20' }, isDark && { backgroundColor: pColors.surface, borderColor: pColors.borderStrong }]}>
            <View style={styles.reviewDoneRow}>
              <Ionicons name="checkmark-circle" size={24} color={isDark ? pColors.success : colors.success} />
              <Text style={[styles.reviewDoneText, isDark && { color: pColors.success }]}>Cảm ơn bạn đã gửi đánh giá buổi chụp! 🙏</Text>
            </View>
          </ClayCard>
        )}

        {/* Action Buttons */}
        {canCancel && (
          <Animated.View entering={FadeInDown.duration(500).delay(400)} style={styles.actions}>
            <ClayButton
              label={cancelling ? 'Đang hủy...' : 'Hủy lịch hẹn chụp'}
              onPress={handleCancel}
              loading={cancelling}
              variant="ghost"
              size="md"
              style={isDark ? { borderColor: pColors.borderStrong } : undefined}
              textStyle={isDark ? { color: pColors.text } : undefined}
            />
          </Animated.View>
        )}

        <View style={{ height: spacing[12] }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  scrollView: { flex: 1 },
  scroll: { padding: spacing[4], gap: spacing[4] },

  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.background, gap: spacing[3] },
  loadingText: { fontSize: fontSizes.sm, color: colors.textMuted },

  // Editorial Header Banner Style
  roleBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    borderWidth: 1,
    marginBottom: 4,
  },
  coverSection: {
    height: 230,
    width: '100%',
    position: 'relative',
    overflow: 'hidden',
  },
  coverImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  floatingBackBtn: {
    position: 'absolute',
    left: spacing[4],
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: 'rgba(255,255,255,0.9)',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 4,
    zIndex: 100,
  },
  coverInfoContainer: {
    position: 'absolute',
    bottom: spacing[4],
    left: spacing[4],
    right: spacing[4],
  },
  photographerHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  headerAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    borderWidth: 2,
    borderColor: '#ffffff',
  },
  headerTextContainer: {
    flex: 1,
  },
  headerRole: {
    fontSize: 8,
    fontWeight: fontWeights.bold,
    color: '#ff4200',
    letterSpacing: 1.5,
  },
  headerName: {
    fontSize: 16,
    fontWeight: fontWeights.bold,
    color: '#ffffff',
    textShadowColor: 'rgba(0,0,0,0.5)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  headerRegion: {
    fontSize: 11,
    color: 'rgba(255,255,255,0.85)',
    marginTop: 2,
  },
  headerRatingBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: 'rgba(26,26,15,0.6)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  headerRatingText: {
    fontSize: 11,
    fontWeight: fontWeights.bold,
    color: '#ffffff',
  },

  // Cards layout
  card: {
    padding: spacing[5],
    backgroundColor: '#ffffff',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(26,26,15,0.06)',
    shadowColor: '#b8a98a',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 3,
  },
  cardTitle: {
    fontSize: fontSizes.md,
    fontWeight: fontWeights.bold,
    color: colors.dark,
    marginBottom: spacing[4],
  },
  cardDivider: {
    height: 1,
    backgroundColor: 'rgba(26,26,15,0.06)',
    marginVertical: spacing[4],
  },

  // Card 1 specific styles
  timeSection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  timeIconWrapper: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: 'rgba(207,64,40,0.08)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  timeTextWrapper: {
    flex: 1,
  },
  timeDateText: {
    fontSize: 15,
    fontWeight: fontWeights.bold,
    color: colors.dark,
  },
  timeHourText: {
    fontSize: 12,
    color: colors.textMuted,
    marginTop: 2,
  },
  statusPriceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
  },
  statusLabelText: {
    fontSize: 11.5,
    fontWeight: fontWeights.bold,
  },
  priceContainer: {
    alignItems: 'flex-end',
  },
  priceLabel: {
    fontSize: 8,
    fontWeight: fontWeights.bold,
    color: colors.textLight,
    letterSpacing: 0.8,
  },
  priceValue: {
    fontSize: 18,
    fontWeight: fontWeights.bold,
    color: colors.accent,
    marginTop: 2,
  },

  packageCard: {
    borderRadius: 24,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(26,26,15,0.09)',
    backgroundColor: '#fffaf4',
  },
  packageCover: { position: 'relative', height: 200 },
  packageCoverContent: {
    position: 'absolute',
    bottom: 14,
    left: 14,
    right: 14,
    gap: 6,
  },
  packageCoverTitle: {
    color: '#fffaf4',
    fontSize: 20,
    fontWeight: '900',
    letterSpacing: 0.2,
    lineHeight: 26,
    textShadowColor: 'rgba(0,0,0,0.4)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 4,
  },
  packagePricePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(207,64,40,0.85)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: 'rgba(255,180,140,0.3)',
  },
  packagePriceText: { color: '#fffaf4', fontSize: 13, fontWeight: '900', letterSpacing: 0.2 },
  packagePriceSep: { color: 'rgba(255,247,225,0.5)', fontSize: 11, marginHorizontal: 1 },
  packagePriceDuration: { color: 'rgba(255,247,225,0.8)', fontSize: 12, fontWeight: '600' },

  packageBody: { padding: 16, gap: 12 },
  packageDesc: { color: 'rgba(26,26,15,0.7)', lineHeight: 21, fontSize: 13.5 },

  packageTagRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  packageTag: {
    backgroundColor: 'rgba(207,64,40,0.07)',
    borderWidth: 1,
    borderColor: 'rgba(207,64,40,0.14)',
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: 8,
  },
  packageTagText: { color: colors.dark, fontSize: 11.5, fontWeight: '700' },

  packageMetaRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  packageMetaChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: '#fff7e1',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: 'rgba(26,26,15,0.08)',
  },
  packageMetaChipText: { color: colors.dark, fontSize: 11.5, fontWeight: '600' },

  packageThumbStrip: { flexDirection: 'row', gap: 6 },
  packageThumbItem: { width: 60, height: 60, borderRadius: 10 },
  packageThumbMore: {
    width: 60,
    height: 60,
    borderRadius: 10,
    backgroundColor: 'rgba(26,26,15,0.08)',
    borderWidth: 1,
    borderColor: 'rgba(26,26,15,0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  packageThumbMoreText: { color: 'rgba(26,26,15,0.6)', fontSize: 13, fontWeight: '800' },

  packageToggleIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: 'rgba(26,26,15,0.05)',
  },
  packageToggleText: { fontSize: 10, color: colors.textMuted, fontWeight: '600' },

  packageExpandedContent: { gap: 10, marginTop: 2 },
  packageSection: {
    gap: 4,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: 'rgba(26,26,15,0.05)',
  },
  packageSectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  packageSectionTitle: {
    color: colors.dark,
    fontSize: 10.5,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  packageSectionBody: {
    color: 'rgba(26,26,15,0.7)',
    fontSize: 12,
    lineHeight: 18,
  },

  packageFeatureList: { gap: 4 },
  packageFeatureItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 6,
  },
  packageFeatureText: {
    flex: 1,
    color: colors.dark,
    fontSize: 12,
    lineHeight: 16,
  },

  packagePhotoGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 5,
  },
  packagePhotoItem: { width: 62, height: 62, borderRadius: 6 },

  // Fallback concept card styling
  conceptCard: {
    padding: spacing[4],
    backgroundColor: '#fffcf7',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(26,26,15,0.06)',
    gap: spacing[2],
  },
  conceptHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  conceptTitleLabel: {
    fontSize: 8,
    fontWeight: fontWeights.bold,
    color: colors.accent,
    letterSpacing: 1.2,
  },
  conceptTitle: {
    fontSize: 15,
    fontWeight: fontWeights.bold,
    color: colors.dark,
  },
  conceptMood: {
    fontSize: 12,
    color: colors.textMuted,
    fontStyle: 'italic',
    lineHeight: 17,
    marginBottom: spacing[1],
  },
  tipsBox: {
    backgroundColor: '#eae1c8',
    borderRadius: 10,
    borderLeftWidth: 3,
    borderColor: colors.accent,
    padding: 8,
  },
  tipsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    marginBottom: 2,
  },
  tipsTitle: {
    fontSize: 10,
    fontWeight: fontWeights.bold,
    color: colors.dark,
  },
  tipsText: {
    fontSize: 10,
    color: colors.textMuted,
    lineHeight: 14,
  },

  // Card 3 Details grid list
  detailsList: {
    gap: spacing[3],
  },
  detailsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  detailsIconWrapper: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: '#fff7e1',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(26,26,15,0.04)',
  },
  detailsTextWrapper: {
    flex: 1,
  },
  detailsLabel: {
    fontSize: 9,
    color: colors.textLight,
    fontWeight: fontWeights.bold,
    textTransform: 'uppercase',
  },
  detailsValue: {
    fontSize: 13,
    color: colors.dark,
    fontWeight: fontWeights.semibold,
    marginTop: 1,
  },
  noteBox: {
    backgroundColor: '#fffaf2',
    borderLeftWidth: 3,
    borderLeftColor: colors.accent,
    padding: spacing[3],
    borderRadius: 8,
    marginTop: spacing[3],
  },
  noteBoxTitle: {
    fontSize: 10,
    fontWeight: fontWeights.bold,
    color: colors.accent,
    textTransform: 'uppercase',
  },
  noteBoxText: {
    fontSize: 12,
    color: colors.textMuted,
    marginTop: 2,
    fontStyle: 'italic',
    lineHeight: 16,
  },
  cancelReasonBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#fef2f2',
    padding: spacing[3],
    borderRadius: 8,
    marginTop: spacing[3],
  },
  cancelReasonText: {
    flex: 1,
    fontSize: 12,
    color: colors.accent,
    fontWeight: fontWeights.semibold,
  },

  // Timeline
  progressTimeline: {
    marginTop: spacing[1],
    gap: spacing[3],
  },
  progressLabelsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  progressLabel: {
    fontSize: 9.5,
    fontWeight: fontWeights.bold,
    color: colors.textLight,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    textAlign: 'center',
    flex: 1,
  },
  progressLabelActive: {
    color: colors.accent,
  },
  progressLabelDone: {
    color: colors.dark,
  },
  progressBarsRow: {
    flexDirection: 'row',
    gap: 6,
    height: 4,
    marginTop: 4,
  },
  progressBarSegment: {
    flex: 1,
    height: '100%',
    backgroundColor: '#eae1c8',
    borderRadius: 2,
  },
  progressBarSegmentDone: {
    backgroundColor: colors.accent,
  },
  progressBarSegmentActive: {
    backgroundColor: colors.accent,
  },

  // Review & Rating
  reviewSub:   { fontSize: fontSizes.sm, color: colors.textMuted, marginBottom: spacing[2] },
  starRow:     { flexDirection: 'row', gap: spacing[2], marginBottom: spacing[3] },
  reviewInput: { backgroundColor: colors.background, borderRadius: radius.md, padding: spacing[4], fontSize: fontSizes.md, color: colors.dark, borderWidth: 1, borderColor: colors.border, height: 100, textAlignVertical: 'top' },
  reviewDoneRow: { flexDirection: 'row', alignItems: 'center', gap: spacing[3] },
  reviewDoneText: { fontSize: fontSizes.md, fontWeight: fontWeights.semibold, color: colors.success },

  actions: { gap: spacing[3] },
});
