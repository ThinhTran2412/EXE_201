import React, { useState, useMemo, useEffect } from 'react';
import {
  ScrollView, StyleSheet, Text, View, TextInput, Alert, Platform, Pressable, Modal, Image, Dimensions,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { useNavigation, useRoute } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { ClayButton } from '../../../shared/components/ClayButton';
import { ClayCard } from '../../../shared/components/ClayCard';
import { createBooking, Photographer, getCustomerProfile } from '../api';
import { colors } from '../../../app/theme/colors';
import { fontSizes, fontWeights } from '../../../app/theme/typography';
import { radius, spacing } from '../../../app/theme/spacing';
import { formatImageUrl } from '../../../shared/utils/formatImageUrl';

const COMMISSION_RATE = 0.1;
const DEFAULT_AVATAR = 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150';
const DEFAULT_COVER = 'https://images.unsplash.com/photo-1452587925148-ce544e77e70d?w=800';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const CELL = Math.floor((SCREEN_WIDTH - 40 - 12 * 6) / 7);
const MONTH_LABELS = ['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN'];

function toKey(date: Date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

function calculateEndTime(startTimeStr: string, duration: number) {
  if (!startTimeStr) return '';
  const [h, m] = startTimeStr.split(':').map(Number);
  let totalMinutes = h * 60 + m + duration * 60;
  const endH = Math.floor(totalMinutes / 60) % 24;
  const endM = totalMinutes % 60;
  return `${String(endH).padStart(2, '0')}:${String(endM).padStart(2, '0')}`;
}

function splitTags(value: string) {
  return value.split(/[,\n]+/).map((tag) => tag.trim()).filter(Boolean).filter((tag, index, arr) => arr.indexOf(tag) === index).slice(0, 12);
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

export default function CheckoutScreen() {
  const navigation = useNavigation<any>();
  const route      = useRoute<any>();
  const insets     = useSafeAreaInsets();
  const { photographer, matchId, packageId, packages } = route.params as { photographer: Photographer; matchId?: string, packageId?: string, packages?: any[] };

  const initialPackage = useMemo(() => {
    if (!packages || packages.length === 0) return null;
    return packages.find(p => p.id === packageId) || packages[0];
  }, [packages, packageId]);

  const [selectedPackage, setSelectedPackage] = useState<any | null>(initialPackage);
  const [pkgExpanded, setPkgExpanded] = useState(true);

  const [price,     setPrice]     = useState(initialPackage ? initialPackage.price.toString() : photographer.minBudget.toString());
  
  // Date & Time Picker states
  const [selectedDate, setSelectedDate] = useState<Date | null>(new Date());
  const [selectedTime, setSelectedTime] = useState<string>('09:00');
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [calendarMonth, setCalendarMonth] = useState(new Date());

  const [phone,     setPhone]     = useState('');
  const [location,  setLocation]  = useState('');
  const [note,      setNote]      = useState('');
  const [loading,   setLoading]   = useState(false);
  const [showPackages, setShowPackages] = useState(false);

  useEffect(() => {
    async function loadPhone() {
      try {
        const profile = await getCustomerProfile();
        if (profile?.phone) {
          setPhone(profile.phone);
        }
      } catch (e) {
        console.warn('Failed to load profile phone', e);
      }
    }
    loadPhone();
  }, []);

  const numPrice   = parseFloat(price.replace(/[^0-9.]/g, '')) || 0;
  const commission = Math.round(numPrice * COMMISSION_RATE);
  const total      = numPrice + commission;

  const duration = selectedPackage?.durationHours ?? 2;
  const endTime = useMemo(() => calculateEndTime(selectedTime, duration), [selectedTime, duration]);

  // Format the date for displaying in the form input
  const dateDisplay = useMemo(() => {
    if (!selectedDate) return 'Chọn ngày & giờ chụp...';
    const dStr = selectedDate.toLocaleDateString('vi-VN', { weekday: 'long', day: '2-digit', month: '2-digit', year: 'numeric' });
    return `${dStr} (${selectedTime} - ${endTime})`;
  }, [selectedDate, selectedTime, endTime]);

  const dateValueForApi = useMemo(() => {
    if (!selectedDate) return '';
    const key = toKey(selectedDate);
    return `${key}T${selectedTime}:00`;
  }, [selectedDate, selectedTime]);

  async function handleBook() {
    if (!phone.trim()) { Alert.alert('Nhập số điện thoại', 'Vui lòng nhập số điện thoại liên hệ.'); return; }
    if (!selectedDate) { Alert.alert('Chọn ngày chụp', 'Vui lòng chọn ngày giờ bạn muốn đặt.'); return; }
    if (!location.trim()) { Alert.alert('Nhập địa điểm', 'Vui lòng nhập địa điểm chụp mong muốn.'); return; }
    if (!matchId)     { Alert.alert('Lỗi', 'Cần Match trước khi đặt lịch.'); return; }
    setLoading(true);
    try {
      const parsedPkg = splitDescriptionSections(selectedPackage?.description || '');
      await createBooking({
        matchId,
        servicePackageId: selectedPackage?.id || null,
        agreedPrice: numPrice,
        commission: commission,
        scheduledAt: new Date(dateValueForApi).toISOString(),
        phone: phone.trim(),
        location: location.trim(),
        note: note.trim(),
        requirements: parsedPkg.requirements || '',
      });
      navigation.replace('BookingSuccess', {
        photographerId: photographer.id,
        photographerName: photographer.displayName,
        packageName: selectedPackage?.name || 'Yêu cầu tùy chỉnh',
        dateDisplay: dateDisplay,
        price: numPrice,
        commission: commission,
        total: total,
        location: location.trim(),
        phone: phone.trim(),
      });
    } catch (e: any) {
      let errorMsg = 'Vui lòng thử lại.';
      if (e.response?.data) {
        if (typeof e.response.data === 'string') {
          errorMsg = e.response.data;
        } else if (e.response.data.title) {
          errorMsg = e.response.data.title;
        } else if (e.response.data.message) {
          errorMsg = e.response.data.message;
        }
      }
      Alert.alert('Đặt lịch thất bại', errorMsg);
    } finally { setLoading(false); }
  }

  // Generate days in calendar month
  const calendarDays = useMemo(() => {
    const year = calendarMonth.getFullYear();
    const month = calendarMonth.getMonth();
    const first = new Date(year, month, 1);
    const startDay = (first.getDay() + 6) % 7; // Monday is 0
    const totalDays = new Date(year, month + 1, 0).getDate();
    const grid: (Date | null)[] = [];
    for (let i = 0; i < startDay; i++) grid.push(null);
    for (let d = 1; d <= totalDays; d++) grid.push(new Date(year, month, d));
    while (grid.length % 7 !== 0) grid.push(null);
    return grid;
  }, [calendarMonth]);

  function changeCalendarMonth(direction: number) {
    setCalendarMonth(new Date(calendarMonth.getFullYear(), calendarMonth.getMonth() + direction, 1));
  }

  const shifts = [
    { title: 'Buổi sáng (07:00 - 12:00)', slots: ['07:00', '07:30', '08:00', '08:30', '09:00', '09:30', '10:00', '10:30', '11:00', '11:30'] },
    { title: 'Buổi chiều (12:00 - 17:00)', slots: ['12:00', '12:30', '13:00', '13:30', '14:00', '14:30', '15:00', '15:30', '16:00', '16:30'] },
    { title: 'Buổi tối (17:00 - 22:00)', slots: ['17:00', '17:30', '18:00', '18:30', '19:00', '19:30', '20:00', '20:30', '21:00', '21:30'] },
  ];

  return (
    <View style={styles.container}>
      {/* Header Container */}
      <View style={[styles.headerContainer, { paddingTop: insets.top }]}>
        <View style={styles.headerBar}>
          <Pressable onPress={() => navigation.goBack()} style={styles.backBtn}>
            <Ionicons name="arrow-back" size={22} color={colors.dark} />
          </Pressable>
          <Text style={styles.headerBarTitle}>Đặt lịch chụp</Text>
          <View style={{ width: 40 }} />
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        {/* Photographer Header Banner */}
        <Animated.View entering={FadeInDown.duration(500)} style={styles.profileHeaderContainer}>
          {/* Cover Photo Card */}
          <View style={styles.coverBannerCard}>
            <Image
              source={{ uri: formatImageUrl(photographer.coverPhotoUrl) || DEFAULT_COVER }}
              style={styles.coverBannerImg}
            />
            <View style={styles.coverDarkOverlay} />
            
            {/* Rating Badge Overlay */}
            <View style={styles.ratingBadgeOverlay}>
              <Ionicons name="star" size={12} color="#FFD700" />
              <Text style={styles.ratingTextOverlay}>{photographer.rating?.toFixed(1) || '5.0'}</Text>
            </View>
          </View>

          {/* Centered Avatar (overlapping the cover) */}
          <View style={styles.centeredAvatarContainer}>
            {photographer.avatarUrl ? (
              <Image
                source={{ uri: formatImageUrl(photographer.avatarUrl) }}
                style={styles.centeredAvatarImg}
              />
            ) : (
              <View style={styles.centeredAvatarPlaceholder}>
                <Text style={styles.centeredAvatarText}>{photographer.displayName?.[0]}</Text>
              </View>
            )}
          </View>

          {/* Centered Profile Text Info */}
          <View style={styles.centeredProfileInfo}>
            <Text style={styles.centeredName}>{photographer.displayName}</Text>
            <Text style={styles.centeredMeta}>
              <Ionicons name="location-outline" size={11} color={colors.textMuted} /> {photographer.region}
            </Text>
          </View>
        </Animated.View>

        {/* Form Details */}
        <Animated.View entering={FadeInDown.duration(500).delay(100)} style={styles.form}>
          <Text style={styles.sectionTitle}>Cấu hình buổi chụp</Text>

          {/* Service Package Card with details and expandable toggle */}
          {packages && packages.length > 0 && (
            <View style={styles.field}>
              <Text style={styles.label}>Gói dịch vụ lựa chọn</Text>
              {selectedPackage ? (
                <View style={styles.pkgCardContainer}>
                  <Pressable style={styles.pkgCard} onPress={() => setPkgExpanded(!pkgExpanded)}>
                    {selectedPackage.media && selectedPackage.media.length > 0 ? (
                      <Image
                        source={{ uri: formatImageUrl(selectedPackage.media[0].imageUrl) }}
                        style={styles.pkgImg}
                      />
                    ) : (
                      <View style={styles.pkgImgPlaceholder}>
                        <Ionicons name="image-outline" size={20} color={colors.textLight} />
                      </View>
                    )}
                    <View style={styles.pkgInfo}>
                      <Text style={styles.pkgTitle} numberOfLines={1}>{selectedPackage.title}</Text>
                      <Text style={styles.pkgSubtitle} numberOfLines={1}>
                        {selectedPackage.durationHours}h · {selectedPackage.subtitle}
                      </Text>
                      <Text style={styles.pkgPrice}>{selectedPackage.price.toLocaleString('vi-VN')}đ</Text>
                    </View>
                    <View style={styles.pkgRightCol}>
                      <Pressable style={styles.pkgChangeBtn} onPress={() => setShowPackages(true)}>
                        <Text style={styles.pkgChangeText}>Đổi gói</Text>
                      </Pressable>
                      <Ionicons
                        name={pkgExpanded ? 'chevron-up' : 'chevron-down'}
                        size={16}
                        color={colors.textMuted}
                        style={{ marginTop: 6, alignSelf: 'center' }}
                      />
                    </View>
                  </Pressable>

                  {/* Toggle Package details */}
                  {pkgExpanded && (
                    <View style={styles.pkgExpandedDetails}>
                      {(() => {
                        const parsed = splitDescriptionSections(selectedPackage.description || '');
                        const tags = splitTags(parsed.tags);
                        const featureLines = parsed.features.split('\n').map(l => l.trim().replace(/^- /, '')).filter(Boolean);
                        const requirementLines = parsed.requirements.split('\n').map(l => l.trim().replace(/^- /, '')).filter(Boolean);

                        return (
                          <View style={{ gap: 12, marginTop: 8 }}>
                            {/* Tags */}
                            {tags.length > 0 && (
                              <View style={styles.cardTagRow}>
                                {tags.map((tag, idx) => (
                                  <View key={idx} style={styles.cardTag}>
                                    <Text style={styles.cardTagText}>#{tag}</Text>
                                  </View>
                                ))}
                              </View>
                            )}

                            {/* Detailed description */}
                            {!!parsed.description && (
                              <View style={styles.detailSection}>
                                <Text style={styles.detailSectionTitle}>Mô tả chi tiết</Text>
                                <Text style={styles.detailSectionBody}>{parsed.description.trim()}</Text>
                              </View>
                            )}

                            {/* Features */}
                            {featureLines.length > 0 && (
                              <View style={styles.detailSection}>
                                <Text style={[styles.detailSectionTitle, { color: colors.success }]}>Tiện ích bao gồm</Text>
                                <View style={styles.featureList}>
                                  {featureLines.map((line, li) => (
                                    <View key={li} style={styles.featureItem}>
                                      <Ionicons name="checkmark-circle" size={14} color={colors.success} />
                                      <Text style={styles.featureItemText}>{line}</Text>
                                    </View>
                                  ))}
                                </View>
                              </View>
                            )}

                            {/* Requirements */}
                            {requirementLines.length > 0 && (
                              <View style={styles.detailSection}>
                                <Text style={[styles.detailSectionTitle, { color: colors.info }]}>Yêu cầu buổi chụp</Text>
                                <View style={styles.featureList}>
                                  {requirementLines.map((line, li) => (
                                    <View key={li} style={styles.featureItem}>
                                      <Ionicons name="ellipse" size={6} color={colors.info} style={{ marginTop: 5 }} />
                                      <Text style={[styles.featureItemText, { color: colors.textMuted }]}>{line}</Text>
                                    </View>
                                  ))}
                                </View>
                              </View>
                            )}

                            {/* Sample Media list */}
                            {selectedPackage.media && selectedPackage.media.length > 1 && (
                              <View style={styles.detailSection}>
                                <Text style={styles.detailSectionTitle}>Ảnh demo sản phẩm ({selectedPackage.media.length})</Text>
                                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.mediaRow}>
                                  {selectedPackage.media.slice(1).map((media: any, mi: number) => (
                                    <Image
                                      key={media.id ?? mi}
                                      source={{ uri: formatImageUrl(media.imageUrl) }}
                                      style={styles.mediaRowImg}
                                    />
                                  ))}
                                </ScrollView>
                              </View>
                            )}
                          </View>
                        );
                      })()}
                    </View>
                  )}
                </View>
              ) : (
                <Pressable style={styles.packageSelect} onPress={() => setShowPackages(true)}>
                  <View style={styles.packageSelectLeft}>
                    <Ionicons name="gift-outline" size={18} color={colors.accent} style={{ marginRight: 8 }} />
                    <Text style={styles.packageSelectText}>Chọn gói chụp...</Text>
                  </View>
                  <Ionicons name="chevron-down" size={16} color={colors.textMuted} />
                </Pressable>
              )}
            </View>
          )}

          {/* Date & Time Field (Pressable Modal trigger) */}
          <View style={styles.field}>
            <Text style={styles.label}>Ngày & Giờ chụp mong muốn</Text>
            <Pressable style={styles.dateTimeSelectorCard} onPress={() => setShowDatePicker(true)}>
              <View style={styles.dateTimeSelectLeft}>
                <Ionicons name="calendar" size={18} color={colors.accent} style={{ marginRight: 10 }} />
                <Text style={[styles.dateTimeText, !selectedDate && { color: colors.textLight }]}>
                  {dateDisplay}
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={16} color={colors.textMuted} />
            </Pressable>
          </View>

          {/* Contact Phone Number Field */}
          <View style={styles.field}>
            <Text style={styles.label}>Số điện thoại liên hệ</Text>
            <View style={styles.inputWrapper}>
              <Ionicons name="call-outline" size={18} color={colors.textMuted} style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                value={phone}
                onChangeText={setPhone}
                placeholder="Nhập số điện thoại..."
                placeholderTextColor={colors.textLight}
                keyboardType="phone-pad"
              />
            </View>
          </View>

          {/* Location Field */}
          <View style={styles.field}>
            <Text style={styles.label}>Địa điểm chụp mong muốn</Text>
            <View style={styles.inputWrapper}>
              <Ionicons name="location-outline" size={18} color={colors.textMuted} style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                value={location}
                onChangeText={setLocation}
                placeholder="Nhập địa điểm..."
                placeholderTextColor={colors.textLight}
              />
            </View>
          </View>

          {/* Creative Notes Input */}
          <View style={styles.field}>
            <Text style={styles.label}>Ý tưởng & Ghi chú sáng tạo</Text>
            <View style={styles.notesInputContainer}>
              <View style={styles.notesIconCol}>
                <Ionicons name="pencil" size={16} color={colors.textMuted} />
              </View>
              <TextInput
                style={styles.notesTextarea}
                value={note}
                onChangeText={setNote}
                multiline
                numberOfLines={4}
                placeholder="Nhập ý tưởng & ghi chú sáng tạo..."
                placeholderTextColor={colors.textLight}
                textAlignVertical="top"
              />
            </View>
          </View>
        </Animated.View>

        {/* Invoice Payment Card */}
        <Animated.View entering={FadeInDown.duration(500).delay(200)}>
          <View style={styles.invoiceCard}>
            {/* Invoice Header */}
            <View style={styles.invoiceHeader}>
              <Text style={styles.invoiceTitle}>HÓA ĐƠN ĐẶT LỊCH CHỤP</Text>
              <Text style={styles.invoiceSub}>Chi tiết chi phí tạm tính</Text>
            </View>

            {/* Invoice Body */}
            <View style={styles.invoiceBody}>
              <View style={styles.invoiceRow}>
                <Text style={styles.invoiceLabel}>Giá gói dịch vụ</Text>
                <Text style={styles.invoiceValue}>{numPrice.toLocaleString('vi-VN')}đ</Text>
              </View>
              <View style={styles.invoiceRow}>
                <Text style={styles.invoiceLabel}>Phí phục vụ nền tảng (10%)</Text>
                <Text style={styles.invoiceValue}>{commission.toLocaleString('vi-VN')}đ</Text>
              </View>
              
              {/* Dashed separator */}
              <View style={styles.dashedDivider} />

              <View style={styles.invoiceTotalRow}>
                <Text style={styles.invoiceTotalLabel}>Tổng số tiền cần thanh toán</Text>
                <Text style={styles.invoiceTotalValue}>{total.toLocaleString('vi-VN')}đ</Text>
              </View>
            </View>

            {/* Platform Trust Badge */}
            <View style={styles.trustBadge}>
              <Ionicons name="shield-checkmark" size={14} color={colors.success} />
              <Text style={styles.trustBadgeText}>Thanh toán an toàn qua cổng bảo mật PicKic</Text>
            </View>
          </View>
        </Animated.View>
        
        <View style={{ height: 60 }} />
      </ScrollView>

      {/* Action Button Bar */}
      <View style={[styles.cta, { paddingBottom: Math.max(insets.bottom, 16) }]}>
        <ClayButton
          label={`Xác nhận gửi yêu cầu — ${total.toLocaleString('vi-VN')}đ`}
          onPress={handleBook}
          loading={loading}
          variant="primary"
          size="lg"
        />
      </View>

      {/* CALENDAR DATE PICKER MODAL (Grouped hours & Live timeline) */}
      <Modal visible={showDatePicker} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <Animated.View entering={FadeInDown.duration(300)} style={styles.datePickerContent}>
            {/* Modal Header */}
            <View style={styles.modalHeader}>
              <View>
                <Text style={styles.modalTitle}>Chọn ngày & giờ chụp</Text>
                <Text style={styles.modalSubTitle}>Lên lịch hẹn chụp ảnh nghệ thuật</Text>
              </View>
              <Pressable onPress={() => setShowDatePicker(false)} style={styles.modalClose}>
                <Ionicons name="close" size={22} color={colors.dark} />
              </Pressable>
            </View>

            <ScrollView showsVerticalScrollIndicator={false} style={{ maxHeight: '80%' }}>
              {/* Calendar Controls */}
              <View style={styles.calendarControls}>
                <Pressable style={styles.monthNavBtn} onPress={() => changeCalendarMonth(-1)}>
                  <Ionicons name="chevron-back" size={16} color={colors.dark} />
                </Pressable>
                <Text style={styles.calendarMonthName}>
                  {calendarMonth.toLocaleDateString('vi-VN', { month: 'long', year: 'numeric' })}
                </Text>
                <Pressable style={styles.monthNavBtn} onPress={() => changeCalendarMonth(1)}>
                  <Ionicons name="chevron-forward" size={16} color={colors.dark} />
                </Pressable>
              </View>

              {/* Calendar Grid */}
              <View style={styles.calendarGrid}>
                <View style={styles.weekLabelsRow}>
                  {MONTH_LABELS.map((w) => (
                    <Text key={w} style={styles.weekLabel}>{w}</Text>
                  ))}
                </View>

                <View style={styles.daysGrid}>
                  {calendarDays.map((d, idx) => {
                    if (!d) return <View key={`empty-${idx}`} style={[styles.dayCell, { width: CELL, height: CELL }]} />;
                    const isSelected = selectedDate && toKey(d) === toKey(selectedDate);
                    const isToday = toKey(d) === toKey(new Date());

                    return (
                      <Pressable
                        key={idx}
                        style={[
                          styles.dayCell,
                          { width: CELL, height: CELL },
                          isSelected && styles.dayCellSelected,
                          isToday && !isSelected && styles.dayCellToday,
                        ]}
                        onPress={() => setSelectedDate(d)}
                      >
                        <Text
                          style={[
                            styles.dayCellText,
                            isSelected && styles.dayCellTextSelected,
                            isToday && !isSelected && styles.dayCellTextToday,
                          ]}
                        >
                          {d.getDate()}
                        </Text>
                      </Pressable>
                    );
                  })}
                </View>
              </View>

              {/* TIME SLOT SECTION (Grouped by shifts) */}
              <View style={styles.timeSlotSection}>
                {shifts.map((shift) => (
                  <View key={shift.title} style={styles.shiftGroup}>
                    <Text style={styles.shiftGroupTitle}>{shift.title}</Text>
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.timeSlotsRow}>
                      {shift.slots.map((t) => {
                        const isSelected = selectedTime === t;
                        return (
                          <Pressable
                            key={t}
                            style={[styles.timeSlotPill, isSelected && styles.timeSlotPillSelected]}
                            onPress={() => setSelectedTime(t)}
                          >
                            <Text style={[styles.timeSlotText, isSelected && styles.timeSlotTextSelected]}>
                              {t}
                            </Text>
                          </Pressable>
                        );
                      })}
                    </ScrollView>
                  </View>
                ))}
              </View>

              {/* LIVE DURATION TIMELINE BANNER */}
              <View style={styles.timelineBanner}>
                <View style={styles.timelineVisual}>
                  <View style={styles.timelinePill}><Text style={styles.timelineTimeText}>{selectedTime}</Text></View>
                  <View style={styles.timelineLine} />
                  <View style={styles.timelineDurationBadge}>
                    <Text style={styles.timelineDurationText}>{duration} tiếng</Text>
                  </View>
                  <View style={styles.timelineLine} />
                  <View style={[styles.timelinePill, { backgroundColor: colors.accent }]}><Text style={[styles.timelineTimeText, { color: '#fff' }]}>{endTime}</Text></View>
                </View>
                <Text style={styles.timelineHelper}>
                  Buổi chụp dự kiến sẽ kéo dài từ <Text style={styles.timelineBold}>{selectedTime}</Text> đến <Text style={styles.timelineBold}>{endTime}</Text> ({duration} tiếng).
                </Text>
              </View>
            </ScrollView>

            {/* Confirm Picker Button */}
            <Pressable
              style={styles.confirmDatePickerBtn}
              onPress={() => {
                if (!selectedDate) {
                  Alert.alert('Chưa chọn ngày', 'Vui lòng nhấn chọn một ngày trên lịch trước.');
                  return;
                }
                setShowDatePicker(false);
              }}
            >
              <Text style={styles.confirmDatePickerBtnText}>Xác nhận Ngày & Giờ</Text>
            </Pressable>
          </Animated.View>
        </View>
      </Modal>

      {/* Package Selection Modal */}
      {packages && packages.length > 0 && (
        <Modal visible={showPackages} transparent animationType="slide">
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <View>
                  <Text style={styles.modalTitle}>Chọn gói dịch vụ</Text>
                  <Text style={styles.modalSubTitle}>Sử dụng các gói chụp có sẵn</Text>
                </View>
                <Pressable onPress={() => setShowPackages(false)} style={styles.modalClose}>
                  <Ionicons name="close" size={22} color={colors.dark} />
                </Pressable>
              </View>
              
              <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 24 }}>
                {packages.map((pkg: any) => (
                  <Pressable
                    key={pkg.id}
                    style={[styles.packageOption, selectedPackage?.id === pkg.id && styles.packageOptionSelected]}
                    onPress={() => {
                      setSelectedPackage(pkg);
                      setPrice(pkg.price.toString());
                      setShowPackages(false);
                    }}
                  >
                    <View style={styles.modalPkgRow}>
                      {pkg.media && pkg.media.length > 0 ? (
                        <Image source={{ uri: formatImageUrl(pkg.media[0].imageUrl) }} style={styles.modalPkgImg} />
                      ) : (
                        <View style={styles.modalPkgImgPlaceholder}>
                          <Ionicons name="image-outline" size={14} color={colors.textLight} />
                        </View>
                      )}
                      <View style={{ flex: 1, paddingLeft: 12 }}>
                        <Text style={styles.packageOptionTitle}>{pkg.title}</Text>
                        <Text style={styles.packageOptionSub}>{pkg.durationHours} giờ · {pkg.subtitle}</Text>
                      </View>
                      <Text style={styles.packageOptionPrice}>{pkg.price.toLocaleString('vi-VN')}đ</Text>
                    </View>
                  </Pressable>
                ))}
              </ScrollView>
            </View>
          </View>
        </Modal>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  headerContainer: {
    backgroundColor: '#f3ecd8',
    borderBottomWidth: 1,
    borderColor: 'rgba(26,26,15,0.08)',
  },
  headerBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing[4],
    height: 56,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerBarTitle: {
    fontSize: 16,
    fontWeight: fontWeights.bold,
    color: colors.dark,
  },
  scroll: {
    padding: spacing[6],
    gap: spacing[5],
  },
  header: {
    marginBottom: spacing[1],
  },
  headerSubTitle: {
    fontSize: 9,
    fontWeight: fontWeights.bold,
    color: colors.accent,
    letterSpacing: 1.5,
    marginBottom: 4,
  },
  title: {
    fontSize: 26,
    fontWeight: fontWeights.bold,
    color: colors.dark,
    fontFamily: Platform.OS === 'ios' ? 'Georgia' : 'serif',
  },
  sub: {
    fontSize: fontSizes.sm,
    color: colors.textMuted,
    marginTop: 6,
    lineHeight: 18,
  },
  form: {
    gap: spacing[4],
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: fontWeights.bold,
    color: colors.dark,
    marginBottom: spacing[2],
  },
  field: {
    gap: spacing[2],
  },
  label: {
    fontSize: 9,
    fontWeight: fontWeights.bold,
    color: colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginLeft: 2,
  },
  packageSelect: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#f3ecd8',
    borderRadius: 16,
    paddingHorizontal: spacing[4],
    paddingVertical: 14,
    borderWidth: 1,
    borderColor: 'rgba(26,26,15,0.12)',
  },
  packageSelectLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  packageSelectText: {
    fontSize: fontSizes.md,
    color: colors.textLight,
  },
  pkgCardContainer: {
    backgroundColor: '#f3ecd8',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(26,26,15,0.12)',
    overflow: 'hidden',
    padding: 10,
  },
  pkgCard: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  pkgImg: {
    width: 60,
    height: 60,
    borderRadius: 12,
    resizeMode: 'cover',
  },
  pkgImgPlaceholder: {
    width: 60,
    height: 60,
    borderRadius: 12,
    backgroundColor: '#eae1c8',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(26,26,15,0.12)',
  },
  pkgInfo: {
    flex: 1,
    paddingLeft: 12,
    gap: 3,
  },
  pkgTitle: {
    fontSize: 14,
    fontWeight: fontWeights.bold,
    color: colors.dark,
  },
  pkgSubtitle: {
    fontSize: 11,
    color: colors.textMuted,
  },
  pkgPrice: {
    fontSize: 13,
    fontWeight: fontWeights.bold,
    color: colors.accent,
  },
  pkgRightCol: {
    alignItems: 'flex-end',
    justifyContent: 'center',
    paddingLeft: 8,
  },
  pkgChangeBtn: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(26,26,15,0.12)',
    backgroundColor: 'rgba(26,26,15,0.04)',
  },
  pkgChangeText: {
    fontSize: 11,
    fontWeight: fontWeights.semibold,
    color: colors.dark,
  },
  pkgExpandedDetails: {
    borderTopWidth: 1,
    borderColor: 'rgba(26,26,15,0.08)',
    marginTop: 10,
    paddingTop: 8,
  },
  cardTagRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  cardTag: {
    backgroundColor: 'rgba(207,64,40,0.07)',
    borderWidth: 1,
    borderColor: 'rgba(207,64,40,0.14)',
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: 8,
  },
  cardTagText: {
    color: colors.accent,
    fontSize: 11,
    fontWeight: '700',
  },
  detailSection: {
    gap: 6,
    paddingTop: 6,
  },
  detailSectionTitle: {
    color: colors.dark,
    fontSize: 11.5,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  detailSectionBody: {
    color: colors.textMuted,
    fontSize: 13,
    lineHeight: 18,
  },
  featureList: {
    gap: 6,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
  },
  featureItemText: {
    flex: 1,
    color: colors.dark,
    fontSize: 13,
    lineHeight: 18,
  },
  mediaRow: {
    gap: 6,
    paddingVertical: 4,
  },
  mediaRowImg: {
    width: 90,
    height: 70,
    borderRadius: 10,
    resizeMode: 'cover',
  },
  dateTimeSelectorCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#f3ecd8',
    borderRadius: 16,
    paddingHorizontal: spacing[4],
    paddingVertical: 14,
    borderWidth: 1,
    borderColor: 'rgba(26,26,15,0.12)',
  },
  dateTimeSelectLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  dateTimeText: {
    fontSize: fontSizes.sm,
    color: colors.dark,
    fontWeight: fontWeights.semibold,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f3ecd8',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(26,26,15,0.12)',
    paddingHorizontal: spacing[4],
  },
  inputIcon: {
    marginRight: spacing[3],
  },
  input: {
    flex: 1,
    paddingVertical: 14,
    fontSize: fontSizes.sm,
    color: colors.dark,
    fontWeight: fontWeights.semibold,
  },
  notesInputContainer: {
    flexDirection: 'row',
    backgroundColor: '#f3ecd8',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(26,26,15,0.12)',
    padding: spacing[4],
    gap: spacing[2],
  },
  notesIconCol: {
    width: 20,
    paddingTop: 2,
    alignItems: 'center',
  },
  notesTextarea: {
    flex: 1,
    fontSize: fontSizes.sm,
    color: colors.dark,
    lineHeight: 20,
    minHeight: 80,
  },
  invoiceCard: {
    backgroundColor: '#f3ecd8',
    borderRadius: 24,
    borderWidth: 1,
    borderColor: 'rgba(26,26,15,0.12)',
    shadowColor: colors.clay,
    shadowOpacity: 0.12,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
    elevation: 2,
    overflow: 'hidden',
  },
  invoiceHeader: {
    backgroundColor: '#eae1c8',
    padding: 16,
    borderBottomWidth: 1,
    borderColor: 'rgba(26,26,15,0.12)',
    alignItems: 'center',
  },
  invoiceTitle: {
    fontSize: 11,
    fontWeight: fontWeights.bold,
    color: colors.accent,
    letterSpacing: 2,
  },
  invoiceSub: {
    fontSize: 10,
    color: colors.textLight,
    marginTop: 2,
  },
  invoiceBody: {
    padding: 20,
    gap: 12,
  },
  invoiceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  invoiceLabel: {
    fontSize: fontSizes.sm,
    color: colors.textMuted,
  },
  invoiceValue: {
    fontSize: fontSizes.sm,
    fontWeight: fontWeights.bold,
    color: colors.dark,
  },
  dashedDivider: {
    height: 1,
    borderWidth: 1,
    borderColor: 'rgba(26,26,15,0.15)',
    borderStyle: 'dashed',
    marginVertical: 4,
  },
  invoiceTotalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  invoiceTotalLabel: {
    fontSize: fontSizes.md,
    fontWeight: fontWeights.bold,
    color: colors.dark,
  },
  invoiceTotalValue: {
    fontSize: 20,
    fontWeight: fontWeights.extrabold,
    color: colors.accent,
  },
  trustBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: 'rgba(45,106,79,0.06)',
    paddingVertical: 10,
    borderTopWidth: 1,
    borderColor: 'rgba(45,106,79,0.08)',
  },
  trustBadgeText: {
    fontSize: 10,
    color: colors.success,
    fontWeight: fontWeights.bold,
  },
  cta: {
    paddingHorizontal: spacing[6],
    paddingVertical: spacing[4],
    borderTopWidth: 1,
    borderColor: colors.border,
    backgroundColor: '#f3ecd8',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(26,26,15,0.4)',
    justifyContent: 'flex-end',
  },
  datePickerContent: {
    backgroundColor: colors.background,
    borderTopLeftRadius: radius.xl,
    borderTopRightRadius: radius.xl,
    paddingBottom: spacing[8],
  },
  modalContent: {
    backgroundColor: colors.background,
    borderTopLeftRadius: radius.xl,
    borderTopRightRadius: radius.xl,
    maxHeight: '75%',
    paddingBottom: spacing[6],
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: spacing[5],
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: fontWeights.bold,
    color: colors.dark,
  },
  modalSubTitle: {
    fontSize: 11,
    color: colors.textMuted,
    marginTop: 2,
  },
  modalClose: {
    padding: 6,
  },
  calendarControls: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 14,
  },
  monthNavBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#f3ecd8',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(26,26,15,0.12)',
  },
  calendarMonthName: {
    fontSize: 15,
    fontWeight: fontWeights.bold,
    color: colors.dark,
    textTransform: 'capitalize',
  },
  calendarGrid: {
    paddingHorizontal: 20,
    gap: 8,
    alignItems: 'center',
  },
  weekLabelsRow: {
    flexDirection: 'row',
    marginBottom: 4,
    gap: 12,
    justifyContent: 'center',
  },
  weekLabel: {
    width: CELL,
    textAlign: 'center',
    color: colors.textLight,
    fontSize: 10,
    fontWeight: fontWeights.bold,
  },
  daysGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    justifyContent: 'center',
  },
  dayCell: {
    borderRadius: 12,
    backgroundColor: '#f3ecd8',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(26,26,15,0.12)',
  },
  dayCellSelected: {
    backgroundColor: colors.dark,
    borderColor: colors.dark,
  },
  dayCellToday: {
    borderWidth: 1.5,
    borderColor: colors.accent,
  },
  dayCellText: {
    fontSize: 14,
    fontWeight: fontWeights.bold,
    color: colors.dark,
  },
  dayCellTextSelected: {
    color: colors.white,
  },
  dayCellTextToday: {
    color: colors.accent,
  },
  timeSlotSection: {
    marginTop: 16,
    gap: 14,
  },
  shiftGroup: {
    gap: 6,
  },
  shiftGroupTitle: {
    fontSize: 10,
    fontWeight: fontWeights.bold,
    color: colors.accent,
    letterSpacing: 1,
    paddingHorizontal: 20,
    textTransform: 'uppercase',
  },
  timeSlotsRow: {
    paddingHorizontal: 20,
    gap: 8,
    paddingVertical: 2,
  },
  timeSlotPill: {
    backgroundColor: '#f3ecd8',
    width: 70,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(26,26,15,0.12)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  timeSlotPillSelected: {
    backgroundColor: colors.accent,
    borderColor: colors.accent,
  },
  timeSlotText: {
    fontSize: 13,
    fontWeight: fontWeights.bold,
    color: colors.dark,
  },
  timeSlotTextSelected: {
    color: colors.white,
  },
  timelineBanner: {
    marginTop: 20,
    marginHorizontal: 20,
    padding: 16,
    backgroundColor: '#eae1c8',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(26,26,15,0.08)',
    gap: 10,
  },
  timelineVisual: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  timelinePill: {
    backgroundColor: colors.dark,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  timelineTimeText: {
    fontSize: 12,
    fontWeight: fontWeights.bold,
    color: colors.background,
  },
  timelineLine: {
    flex: 1,
    height: 2,
    backgroundColor: colors.dark,
    opacity: 0.15,
  },
  timelineDurationBadge: {
    backgroundColor: 'rgba(26,26,15,0.08)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: 'rgba(26,26,15,0.08)',
  },
  timelineDurationText: {
    fontSize: 10,
    fontWeight: fontWeights.bold,
    color: colors.dark,
  },
  timelineHelper: {
    fontSize: 11,
    color: colors.textMuted,
    textAlign: 'center',
    lineHeight: 16,
  },
  timelineBold: {
    fontWeight: fontWeights.bold,
    color: colors.dark,
  },
  confirmDatePickerBtn: {
    marginHorizontal: 20,
    marginTop: 20,
    backgroundColor: colors.dark,
    paddingVertical: 14,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  confirmDatePickerBtnText: {
    color: colors.white,
    fontSize: 14,
    fontWeight: fontWeights.bold,
  },
  packageOption: {
    padding: spacing[5],
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  packageOptionSelected: {
    backgroundColor: 'rgba(207, 64, 40, 0.08)',
  },
  modalPkgRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  modalPkgImg: {
    width: 44,
    height: 44,
    borderRadius: 8,
    resizeMode: 'cover',
  },
  modalPkgImgPlaceholder: {
    width: 44,
    height: 44,
    borderRadius: 8,
    backgroundColor: '#eae1c8',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(26,26,15,0.12)',
  },
  packageOptionTitle: {
    fontSize: 14,
    fontWeight: fontWeights.bold,
    color: colors.dark,
    marginBottom: 2,
  },
  packageOptionSub: {
    fontSize: 11,
    color: colors.textMuted,
  },
  packageOptionPrice: {
    fontSize: 14,
    fontWeight: fontWeights.extrabold,
    color: colors.accent,
  },
  profileHeaderContainer: {
    marginBottom: spacing[2],
  },
  coverBannerCard: {
    height: 220,
    width: '100%',
    borderRadius: 24,
    overflow: 'hidden',
    position: 'relative',
    backgroundColor: '#ece9db',
    borderWidth: 1,
    borderColor: 'rgba(26,26,15,0.12)',
  },
  coverBannerImg: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  coverDarkOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(26,26,15,0.15)',
  },
  ratingBadgeOverlay: {
    position: 'absolute',
    right: 12,
    top: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(255,247,225,0.92)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(26,26,15,0.08)',
  },
  ratingTextOverlay: {
    fontSize: 10,
    fontWeight: fontWeights.bold,
    color: colors.dark,
  },
  centeredAvatarContainer: {
    alignSelf: 'center',
    marginTop: -38,
    shadowColor: colors.clay,
    shadowOpacity: 0.15,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 3,
  },
  centeredAvatarImg: {
    width: 76,
    height: 76,
    borderRadius: 38,
    resizeMode: 'cover',
    borderWidth: 3,
    borderColor: colors.background,
  },
  centeredAvatarPlaceholder: {
    width: 76,
    height: 76,
    borderRadius: 38,
    backgroundColor: '#eae1c8',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
    borderColor: colors.background,
  },
  centeredAvatarText: {
    fontSize: 24,
    fontWeight: fontWeights.bold,
    color: colors.dark,
  },
  centeredProfileInfo: {
    alignItems: 'center',
    marginTop: spacing[3],
    gap: 4,
  },
  centeredName: {
    fontSize: 18,
    fontWeight: fontWeights.bold,
    color: colors.dark,
  },
  centeredMeta: {
    fontSize: 12,
    color: colors.textMuted,
  },
});
