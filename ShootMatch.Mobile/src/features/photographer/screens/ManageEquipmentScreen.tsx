import React, { useEffect, useState } from 'react';
import {
  ScrollView,
  StyleSheet,
  Text,
  View,
  Pressable,
  TextInput,
  Modal,
  Alert,
  Switch,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import { fontSizes } from '../../../app/theme/typography';
import { usePhotographerTheme } from '../PhotographerThemeContext';
import { radius, spacing } from '../../../app/theme/spacing';
import {
  getPhotographerProfile,
  updateEquipments,
  PhotographerEquipment,
  EquipmentCategory,
} from '../api';

const CATEGORY_LABELS: Record<number, string> = {
  [EquipmentCategory.Camera]: 'Máy ảnh',
  [EquipmentCategory.Lens]: 'Ống kính',
  [EquipmentCategory.Lighting]: 'Đèn / Flash',
  [EquipmentCategory.Drone]: 'Flycam',
  [EquipmentCategory.Gimbal]: 'Gimbal',
  [EquipmentCategory.Audio]: 'Thu âm',
  [EquipmentCategory.Other]: 'Khác',
};

const CATEGORY_ICONS: Record<number, keyof typeof Ionicons.glyphMap> = {
  [EquipmentCategory.Camera]: 'camera-outline',
  [EquipmentCategory.Lens]: 'aperture-outline',
  [EquipmentCategory.Lighting]: 'flashlight-outline',
  [EquipmentCategory.Drone]: 'airplane-outline',
  [EquipmentCategory.Gimbal]: 'videocam-outline',
  [EquipmentCategory.Audio]: 'mic-outline',
  [EquipmentCategory.Other]: 'cube-outline',
};

const CATEGORY_COLORS: Record<number, string> = {
  [EquipmentCategory.Camera]: '#cf4028',   // Red clay
  [EquipmentCategory.Lens]: '#3498db',     // Photo blue
  [EquipmentCategory.Lighting]: '#f1c40f', // Flash yellow
  [EquipmentCategory.Drone]: '#2ecc71',    // Flight green
  [EquipmentCategory.Gimbal]: '#9b59b6',   // Stabilizer purple
  [EquipmentCategory.Audio]: '#e67e22',    // Dynamic orange
  [EquipmentCategory.Other]: '#95a5a6',    // Slate grey
};

const DEFAULT_FORM: Omit<PhotographerEquipment, 'id' | 'photographerId'> = {
  category: EquipmentCategory.Camera,
  name: '',
  description: '',
  isPrimary: false,
};

export default function ManageEquipmentScreen() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<any>();
  const { colors, isDark } = usePhotographerTheme();
  const styles = getStyles(colors);

  const [equipments, setEquipments] = useState<PhotographerEquipment[]>([]);
  const [loading, setLoading] = useState(true);
  const [editorVisible, setEditorVisible] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState(DEFAULT_FORM);
  const [editingId, setEditingId] = useState<string | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    setLoading(true);
    try {
      const profile = await getPhotographerProfile();
      if (profile && profile.equipments) {
        setEquipments(profile.equipments);
      }
    } catch (error) {
      console.log('Error loading equipments:', error);
      Alert.alert('Lỗi', 'Không thể tải danh sách thiết bị.');
    } finally {
      setLoading(false);
    }
  }

  function openCreate() {
    setEditingId(null);
    setForm(DEFAULT_FORM);
    setEditorVisible(true);
  }

  function openEdit(item: PhotographerEquipment) {
    setEditingId(item.id);
    setForm({
      category: item.category,
      name: item.name,
      description: item.description ?? '',
      isPrimary: item.isPrimary,
    });
    setEditorVisible(true);
  }

  async function save() {
    if (!form.name.trim()) {
      Alert.alert('Thiếu thông tin', 'Vui lòng nhập tên thiết bị.');
      return;
    }

    setSaving(true);
    try {
      const newEquipments = [...equipments];
      if (editingId) {
        const index = newEquipments.findIndex((e) => e.id === editingId);
        if (index >= 0) {
          newEquipments[index] = { ...newEquipments[index], ...form };
        }
      } else {
        newEquipments.push({
          id: `temp_${Date.now()}`, 
          photographerId: '', 
          ...form,
        });
      }

      await updateEquipments(newEquipments);
      setEditorVisible(false);
      loadData();
    } catch (error) {
      console.log('Error saving equipment:', error);
      Alert.alert('Lỗi', 'Không thể lưu thiết bị.');
    } finally {
      setSaving(false);
    }
  }

  async function remove(id: string) {
    Alert.alert('Xóa thiết bị', 'Bạn có chắc muốn xóa thiết bị này?', [
      { text: 'Hủy', style: 'cancel' },
      {
        text: 'Xóa',
        style: 'destructive',
        onPress: async () => {
          try {
            const newEquipments = equipments.filter((e) => e.id !== id);
            await updateEquipments(newEquipments);
            setEquipments(newEquipments);
          } catch (error) {
            console.log('Error deleting equipment:', error);
            Alert.alert('Lỗi', 'Không thể xóa thiết bị.');
          }
        },
      },
    ]);
  }

  return (
    <SafeAreaView style={styles.safe}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: Math.max(insets.top, 12) }]}>
        <Pressable style={styles.backBtn} onPress={() => navigation.goBack()}>
          <Ionicons name="chevron-back" size={22} color={colors.text} />
        </Pressable>
        <Text style={styles.headerTitle}>Quản lý thiết bị</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        {/* Intro Hero Section */}
        <Animated.View entering={FadeInUp.duration(600)} style={styles.intro}>
          <View style={styles.introHeader}>
            <View style={styles.introIconContainer}>
              <Ionicons name="aperture-outline" size={24} color={colors.accent} />
            </View>
            <Text style={styles.introTitle}>Studio Gear & Equipment</Text>
          </View>
          <Text style={styles.introDesc}>
            Liệt kê các máy ảnh, ống kính và phụ kiện chuyên nghiệp của bạn. Điều này giúp nâng cao độ uy tín của hồ sơ và thu hút khách hàng cao cấp hơn.
          </Text>
          <Pressable style={styles.createBtnContainer} onPress={openCreate}>
            <LinearGradient
              colors={['#cf4028', '#E67E22']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.createBtnGradient}
            >
              <Ionicons name="add" size={18} color="#FFFBF0" />
              <Text style={styles.createBtnText}>Thêm thiết bị mới</Text>
            </LinearGradient>
          </Pressable>
        </Animated.View>

        {/* List Section */}
        <View style={styles.list}>
          <Text style={styles.listSectionTitle}>Danh sách thiết bị ({equipments.length})</Text>

          {loading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="small" color={colors.accent} />
              <Text style={styles.loadingText}>Đang tải dữ liệu...</Text>
            </View>
          ) : equipments.length === 0 ? (
            <View style={styles.emptyState}>
              <View style={styles.emptyIconContainer}>
                <Ionicons name="camera-outline" size={44} color={colors.textLight} />
              </View>
              <Text style={styles.emptyTitle}>Chưa có thiết bị nào</Text>
              <Text style={styles.emptyText}>
                Hãy bắt đầu bằng việc bổ sung máy ảnh hoặc ống kính làm việc của bạn.
              </Text>
            </View>
          ) : (
            equipments.map((item, index) => {
              const categoryColor = CATEGORY_COLORS[item.category] || '#95a5a6';
              return (
                <Animated.View
                  key={item.id || index.toString()}
                  entering={FadeInDown.delay(index * 50).duration(500)}
                  style={[styles.card, { borderLeftColor: categoryColor }]}
                >
                  <View style={styles.cardHeader}>
                    <View style={[styles.cardIconWrap, { backgroundColor: `${categoryColor}15` }]}>
                      <Ionicons
                        name={CATEGORY_ICONS[item.category] ?? 'cube-outline'}
                        size={20}
                        color={categoryColor}
                      />
                    </View>
                    <View style={styles.cardTitleWrap}>
                      <Text style={styles.cardName}>{item.name}</Text>
                      <Text style={[styles.cardCategory, { color: categoryColor }]}>
                        {CATEGORY_LABELS[item.category].toUpperCase()}
                      </Text>
                    </View>
                    {item.isPrimary && (
                      <View style={styles.primaryBadge}>
                        <Text style={styles.primaryText}>CHÍNH</Text>
                      </View>
                    )}
                  </View>

                  {!!item.description && (
                    <Text style={styles.cardDesc}>{item.description}</Text>
                  )}

                  <View style={styles.cardActions}>
                    <Pressable style={styles.actionBtn} onPress={() => openEdit(item)}>
                      <Ionicons name="create-outline" size={15} color={colors.accent} />
                      <Text style={styles.actionText}>Sửa</Text>
                    </Pressable>
                    <Pressable style={[styles.actionBtn, styles.actionDeleteBtn]} onPress={() => remove(item.id)}>
                      <Ionicons name="trash-outline" size={15} color="#E74C3C" />
                      <Text style={[styles.actionText, { color: '#E74C3C' }]}>Xóa</Text>
                    </Pressable>
                  </View>
                </Animated.View>
              );
            })
          )}
        </View>
      </ScrollView>

      {/* Editor Modal */}
      <Modal visible={editorVisible} animationType="slide" transparent statusBarTranslucent>
        <View style={styles.modalOverlay}>
          <Pressable style={styles.modalBackdrop} onPress={() => setEditorVisible(false)} />
          <View style={[styles.modalContent, { paddingBottom: Math.max(insets.bottom, 20) }]}>
            <View style={styles.modalHandle} />
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{editingId ? 'Cập nhật thiết bị' : 'Thêm thiết bị mới'}</Text>
              <Pressable onPress={() => setEditorVisible(false)} style={styles.closeBtn}>
                <Ionicons name="close" size={20} color={colors.text} />
              </Pressable>
            </View>

            <ScrollView style={styles.modalScroll} showsVerticalScrollIndicator={false}>
              {/* Category Grid selection */}
              <View style={styles.formGroup}>
                <Text style={styles.modalLabel}>Loại thiết bị</Text>
                <View style={styles.categoryGrid}>
                  {Object.entries(CATEGORY_LABELS).map(([valStr, label]) => {
                    const val = Number(valStr);
                    const isSelected = form.category === val;
                    const catColor = CATEGORY_COLORS[val] || '#95a5a6';
                    return (
                      <Pressable
                        key={val}
                        style={[
                          styles.categoryChip,
                          isSelected && {
                            backgroundColor: `${catColor}15`,
                            borderColor: catColor,
                          },
                        ]}
                        onPress={() => setForm((prev) => ({ ...prev, category: val }))}
                      >
                        <Ionicons
                          name={CATEGORY_ICONS[val]}
                          size={15}
                          color={isSelected ? catColor : colors.textLight}
                        />
                        <Text
                          style={[
                            styles.categoryChipText,
                            isSelected ? { color: catColor, fontWeight: '700' } : { color: colors.textMuted },
                          ]}
                        >
                          {label}
                        </Text>
                      </Pressable>
                    );
                  })}
                </View>
              </View>

              {/* Equipment Name */}
              <View style={styles.formGroup}>
                <Text style={styles.modalLabel}>Tên thiết bị</Text>
                <TextInput
                  style={styles.modalInput}
                  placeholder="VD: Sony Alpha A7 Mark IV"
                  placeholderTextColor={isDark ? 'rgba(255,255,255,0.25)' : 'rgba(0,0,0,0.3)'}
                  value={form.name}
                  onChangeText={(t) => setForm((prev) => ({ ...prev, name: t }))}
                />
              </View>

              {/* Equipment Description */}
              <View style={styles.formGroup}>
                <Text style={styles.modalLabel}>Mô tả thêm (Tùy chọn)</Text>
                <TextInput
                  style={[styles.modalInput, styles.modalTextArea]}
                  placeholder="VD: Sử dụng chụp chân dung chính, kèm lens 85mm f/1.4..."
                  placeholderTextColor={isDark ? 'rgba(255,255,255,0.25)' : 'rgba(0,0,0,0.3)'}
                  value={form.description}
                  multiline
                  onChangeText={(t) => setForm((prev) => ({ ...prev, description: t }))}
                />
              </View>

              {/* Switch Primary Gear */}
              <View style={styles.switchRow}>
                <View style={{ flex: 1, paddingRight: 16 }}>
                  <Text style={styles.switchLabel}>Đặt làm thiết bị chính</Text>
                  <Text style={styles.switchDesc}>
                    Đánh dấu đây là thiết bị làm việc chính để hiển thị nổi bật trên trang cá nhân.
                  </Text>
                </View>
                <Switch
                  value={form.isPrimary}
                  onValueChange={(val) => setForm((prev) => ({ ...prev, isPrimary: val }))}
                  trackColor={{ false: colors.surface, true: 'rgba(230, 126, 34, 0.4)' }}
                  thumbColor={form.isPrimary ? '#E67E22' : 'rgba(0,0,0,0.15)'}
                />
              </View>

              {/* Save Button */}
              <Pressable style={styles.saveBtn} onPress={save} disabled={saving}>
                <LinearGradient
                  colors={['#cf4028', '#E67E22']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={styles.saveBtnGradient}
                >
                  <Text style={styles.saveBtnText}>{saving ? 'ĐANG LƯU...' : 'LƯU THIẾT BỊ'}</Text>
                </LinearGradient>
              </Pressable>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const getStyles = (colors: any) => StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: colors.background, // Dynamic background
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing[4],
    paddingBottom: spacing[4],
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.borderStrong,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: fontSizes.lg,
    fontWeight: '800',
    color: colors.text,
    letterSpacing: 0.5,
  },
  scroll: {
    padding: spacing[4],
    paddingBottom: 40,
  },
  intro: {
    marginBottom: spacing[6],
    backgroundColor: colors.surfaceStrong,
    padding: spacing[5],
    borderRadius: radius.xl,
    borderWidth: 1,
    borderColor: colors.border,
  },
  introHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[3],
    marginBottom: spacing[3],
  },
  introIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: 'rgba(230, 126, 34, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  introTitle: {
    fontSize: fontSizes.md,
    fontWeight: '800',
    color: colors.text,
  },
  introDesc: {
    fontSize: fontSizes.xs,
    color: colors.textMuted,
    lineHeight: 18,
    marginBottom: spacing[5],
  },
  createBtnContainer: {
    borderRadius: 14,
    overflow: 'hidden',
  },
  createBtnGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing[3],
    paddingHorizontal: spacing[5],
    gap: 6,
  },
  createBtnText: {
    color: '#FFFBF0',
    fontWeight: '800',
    fontSize: fontSizes.sm,
    letterSpacing: 0.5,
  },
  list: {
    gap: spacing[4],
  },
  listSectionTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.text,
    marginLeft: 4,
    marginBottom: 4,
  },
  loadingContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
    gap: spacing[3],
  },
  loadingText: {
    color: colors.textMuted,
    fontSize: fontSizes.xs,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 50,
    backgroundColor: colors.surface,
    borderRadius: radius.xl,
    borderWidth: 1,
    borderColor: colors.border,
    borderStyle: 'dashed',
    paddingHorizontal: spacing[6],
  },
  emptyIconContainer: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing[4],
  },
  emptyTitle: {
    color: colors.text,
    fontSize: fontSizes.md,
    fontWeight: '700',
    marginBottom: 6,
  },
  emptyText: {
    color: colors.textMuted,
    fontSize: fontSizes.xs,
    textAlign: 'center',
    lineHeight: 18,
  },
  card: {
    backgroundColor: colors.surface, // Dynamic surface
    borderRadius: radius.lg,
    padding: spacing[5],
    borderWidth: 1,
    borderColor: colors.border,
    borderLeftWidth: 4,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing[3],
  },
  cardIconWrap: {
    width: 38,
    height: 38,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing[3],
  },
  cardTitleWrap: {
    flex: 1,
  },
  cardName: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 2,
  },
  cardCategory: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  primaryBadge: {
    backgroundColor: 'rgba(230, 126, 34, 0.15)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: 'rgba(230, 126, 34, 0.3)',
  },
  primaryText: {
    color: '#E67E22',
    fontSize: 9,
    fontWeight: '800',
  },
  cardDesc: {
    fontSize: 13,
    color: colors.textMuted,
    lineHeight: 19,
    marginBottom: spacing[3],
    paddingLeft: 4,
  },
  cardActions: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: spacing[4],
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingTop: spacing[3],
    marginTop: spacing[2],
  },
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 8,
    backgroundColor: colors.surfaceStrong,
    borderWidth: 1,
    borderColor: colors.border,
  },
  actionDeleteBtn: {
    backgroundColor: 'rgba(231, 76, 60, 0.08)',
    borderColor: 'rgba(231, 76, 60, 0.15)',
  },
  actionText: {
    color: colors.accent,
    fontSize: 12,
    fontWeight: '700',
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  modalBackdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: colors.overlay,
  },
  modalContent: {
    backgroundColor: colors.surfaceStrong, // Dynamic modal container
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    borderWidth: 1,
    borderColor: colors.border,
    maxHeight: '90%',
  },
  modalHandle: {
    width: 36,
    height: 4,
    backgroundColor: colors.borderStrong,
    borderRadius: 2,
    alignSelf: 'center',
    marginTop: 10,
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
    fontWeight: '800',
    color: colors.text,
  },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalScroll: {
    padding: spacing[5],
  },
  formGroup: {
    marginBottom: spacing[5],
    gap: 8,
  },
  modalLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.textLight,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginLeft: 2,
  },
  modalInput: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    color: colors.text,
    paddingHorizontal: spacing[4],
    paddingVertical: 12,
    fontSize: 14,
  },
  modalTextArea: {
    height: 90,
    textAlignVertical: 'top',
  },
  categoryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing[2],
  },
  categoryChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 20,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  categoryChipText: {
    fontSize: 12,
    color: colors.textMuted,
  },
  switchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing[6],
    paddingVertical: spacing[3],
    paddingHorizontal: 4,
  },
  switchLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.text,
  },
  switchDesc: {
    fontSize: 11,
    color: colors.textMuted,
    marginTop: 4,
    lineHeight: 16,
  },
  saveBtn: {
    borderRadius: 14,
    overflow: 'hidden',
    marginTop: 10,
    marginBottom: 40,
  },
  saveBtnGradient: {
    paddingVertical: 15,
    alignItems: 'center',
    justifyContent: 'center',
  },
  saveBtnText: {
    color: '#FFFBF0',
    fontSize: 14,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
});
