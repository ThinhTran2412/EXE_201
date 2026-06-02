import React, { useEffect, useMemo, useState } from 'react';
import {
  ScrollView,
  StyleSheet,
  Text,
  View,
  Pressable,
  TextInput,
  Modal,
  Alert,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { colors } from '../../../app/theme/colors';
import { spacing } from '../../../app/theme/spacing';
import { radius } from '../../../app/theme/spacing';
import { deleteServicePackage, getMyServicePackages, saveServicePackage, uploadPortfolioPhoto, type ServicePackage, type ServicePackageMedia } from '../api';
import PortfolioImageCell from '../../../shared/components/PortfolioImageCell';

type ServiceForm = {
  title: string;
  tags: string;
  description: string;
  features: string;
  requirements: string;
  price: string;
  durationHours: string;
  isActive: boolean;
  media: ServicePackageMedia[];
};

const DEFAULT_FORM: ServiceForm = {
  title: '',
  tags: '',
  description: '',
  features: '',
  requirements: '',
  price: '',
  durationHours: '4',
  isActive: true,
  media: [],
};

const previewText = (text: string, max = 120) => {
  const clean = text.trim().replace(/\s+/g, ' ');
  if (clean.length <= max) return clean;
  return `${clean.slice(0, max - 1).trimEnd()}…`;
};

const formatCurrency = (value: number) => `${value.toLocaleString('vi-VN')} đ`;

const mockMedia = (base: string): ServicePackageMedia[] =>
  Array.from({ length: 5 }).map((_, index) => ({ imageUrl: `${base}/photo-${index + 1}.jpg`, sortOrder: index + 1 }));

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

  const tags = getPart('Tag ảnh:');
  const features = getPart('Features:');
  const requirements = getPart('Yêu cầu buổi chụp:');
  let description = getPart('Mô tả chi tiết:');

  if (!description) {
    const firstPrefixIdx = Math.min(
      ...['Tag ảnh:', 'Features:', 'Yêu cầu buổi chụp:']
        .map(p => text.indexOf(p))
        .filter(idx => idx !== -1)
    );
    if (firstPrefixIdx !== Infinity) {
      description = text.slice(0, firstPrefixIdx).trim();
    } else {
      description = text.trim();
    }
  }

  return { description, tags, features, requirements };
}

function renderSection(label: string, value?: string) {
  if (!value) return null;
  return (
    <View style={styles.sectionBlock}>
      <Text style={styles.sectionBlockLabel}>{label}</Text>
      <Text style={styles.sectionBlockValue}>{value}</Text>
    </View>
  );
}

export default function ServiceManagementScreen() {
  const insets = useSafeAreaInsets();
  const [services, setServices] = useState<ServicePackage[]>([]);
  const [editorVisible, setEditorVisible] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState<ServiceForm>(DEFAULT_FORM);
  const [tagInput, setTagInput] = useState('');

  useEffect(() => {
    let mounted = true;
    getMyServicePackages()
      .then((data) => { if (mounted) setServices(data); })
      .catch(() => Alert.alert('Lỗi', 'Không tải được danh sách gói dịch vụ.'))
      .finally(() => { if (mounted) setLoading(false); });
    return () => { mounted = false; };
  }, []);

  const stats = useMemo(() => {
    const total = services.length;
    const active = services.filter((s) => s.isActive).length;
    const avg = total ? Math.round(services.reduce((sum, s) => sum + Number(s.price || 0), 0) / total) : 0;
    const maxImages = total ? Math.max(...services.map((s) => s.media.length)) : 0;
    return { total, active, avg, maxImages };
  }, [services]);

  function openCreate() {
    setEditingId(null);
    setForm(DEFAULT_FORM);
    setTagInput('');
    setEditorVisible(true);
  }

  function openEdit(item: ServicePackage) {
    setEditingId(item.id);
    const parsed = splitDescriptionSections(item.description);
    setForm({
      title: item.title,
      tags: parsed.tags,
      description: parsed.description,
      features: parsed.features,
      requirements: parsed.requirements,
      price: String(item.price),
      durationHours: String(item.durationHours),
      isActive: item.isActive,
      media: item.media,
    });
    setTagInput('');
    setEditorVisible(true);
  }

  async function save() {
    const media = form.media.slice(0, 10);
    if (media.length < 5) {
      Alert.alert('Thiếu ảnh', 'Mỗi gói dịch vụ cần tối thiểu 5 ảnh.');
      return;
    }

    if (!form.title.trim()) {
      Alert.alert('Thiếu thông tin', 'Vui lòng nhập tiêu đề gói.');
      return;
    }

    setSaving(true);
    try {
      const tags = splitTags(form.tags);
      const payload = {
        ...(editingId ? { id: editingId } : {}),
        title: form.title.trim(),
        subtitle: tags.join(', '),
        description: [
          `Mô tả chi tiết: ${form.description.trim()}`,
          tags.length ? `Tag ảnh: ${tags.join(', ')}` : '',
          form.features.trim() ? `Features: ${form.features.trim()}` : '',
          form.requirements.trim() ? `Yêu cầu buổi chụp: ${form.requirements.trim()}` : '',
        ].filter(Boolean).join('\n\n'),
        heroTitle: form.title.trim(),
        heroSubtitle: tags.join(' • '),
        callToAction: 'Đặt lịch ngay',
        price: Number(form.price || 0),
        durationHours: Number(form.durationHours || 0),
        isActive: form.isActive,
        media,
      };

      const saved = await saveServicePackage(payload as any);
      setServices((prev) => {
        const others = prev.filter((item) => item.id !== saved.id);
        return [saved, ...others];
      });
      setEditorVisible(false);
      setEditingId(null);
      setForm(DEFAULT_FORM);
    } catch (error) {
      Alert.alert('Lỗi', 'Không lưu được gói dịch vụ.');
    } finally {
      setSaving(false);
    }
  }

  function remove(id: string) {
    Alert.alert('Xóa gói dịch vụ', 'Bạn muốn xóa gói này?', [
      { text: 'Hủy', style: 'cancel' },
      {
        text: 'Xóa',
        style: 'destructive',
        onPress: async () => {
          await deleteServicePackage(id);
          setServices((prev) => prev.filter((s) => s.id !== id));
        },
      },
    ]);
  }

  async function pickImagesFromDevice() {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      Alert.alert('Thiếu quyền', 'Cần cho phép truy cập thư viện ảnh để chọn ảnh cho gói.');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsMultipleSelection: true,
      selectionLimit: 10,
      quality: 0.85,
    });

    if (result.canceled) return;

    const selected = result.assets.slice(0, 10 - form.media.length);
    if (selected.length === 0) return;

    setSaving(true);
    try {
      const uploaded = await Promise.all(
        selected.map(async (asset, index) => {
          const url = await uploadPortfolioPhoto(asset.uri, asset.mimeType ?? 'image/jpeg');
          return { imageUrl: url, sortOrder: form.media.length + index + 1 };
        }),
      );

      setForm((prev) => ({
        ...prev,
        media: [...prev.media, ...uploaded].slice(0, 10),
      }));
    } catch {
      Alert.alert('Lỗi', 'Không tải được ảnh lên.');
    } finally {
      setSaving(false);
    }
  }

  function renderMediaPreview(url: string) {
    return <PortfolioImageCell uri={url} borderRadius={12} style={styles.mediaPreviewImage} resizeMode="cover" />;
  }

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <Animated.View entering={FadeInUp.duration(700)} style={styles.hero}>
          <View style={styles.heroGlow} />
          <View style={styles.heroTopRow}>
            <View style={styles.heroPill}>
              <Ionicons name="aperture-outline" size={14} color="#F3C08B" />
              <Text style={styles.heroPillText}>Bảng giá</Text>
            </View>
            <View style={styles.heroPillMuted}>
              <Ionicons name="sparkles-outline" size={14} color="#F7E7D2" />
              <Text style={styles.heroPillMutedText}>{stats.active} gói đang bật</Text>
            </View>
          </View>
          <Text style={styles.title}>Gói dịch vụ</Text>
          <Text style={styles.sub}>
            Tạo nhanh một gói thật gọn: tên gói, giá, thời lượng và ảnh.
          </Text>

          <View style={styles.heroStats}>
            <View style={styles.statCard}>
              <Text style={styles.statNum}>{stats.total}</Text>
              <Text style={styles.statLabel}>Tổng gói</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statCard}>
              <View style={styles.moneyRow}>
                <Text style={styles.moneyValue}>{stats.avg.toLocaleString('vi-VN')}</Text>
                <Text style={styles.moneyUnit}>đ</Text>
              </View>
              <Text style={styles.statLabel}>Giá TB</Text>
            </View>
          </View>

          <Pressable style={styles.heroCreateBtn} onPress={openCreate}>
            <Ionicons name="add-circle-outline" size={18} color="#fff" />
            <Text style={styles.heroCreateBtnText}>Tạo gói</Text>
          </Pressable>
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(120).duration(600)} style={styles.sectionIntro}>
          <View>
            <Text style={styles.sectionTitle}>Danh sách gói</Text>
            <Text style={styles.sectionSub}>Mỗi gói có tên, giá, thời lượng và ảnh.</Text>
          </View>
          <Pressable style={styles.addBtn} onPress={openCreate}>
            <Ionicons name="add" size={18} color="#fff" />
            <Text style={styles.addBtnText}>Tạo mới</Text>
          </Pressable>
        </Animated.View>

        <View style={styles.content}>
          {loading ? (
            <View style={styles.emptyState}>
              <Text style={styles.emptyTitle}>Đang tải danh sách gói...</Text>
            </View>
          ) : services.map((item, index) => (
            <Animated.View key={item.id} entering={FadeInDown.delay(index * 60).duration(550)} style={styles.card}>
              <View style={styles.cardHeader}>
                <View style={styles.cardHeaderLeft}>
                  <View style={styles.cardBadge}>
                    <Ionicons name="camera-outline" size={14} color={colors.accent} />
                    <Text style={styles.cardBadgeText}>Gói {index + 1}</Text>
                  </View>
                  <Text style={styles.cardName} numberOfLines={2}>{item.title}</Text>
                </View>
                <View style={styles.priceBlock}>
                  <Text style={styles.price}>{formatCurrency(item.price)}</Text>
                  <Text style={styles.duration}>{item.durationHours} giờ</Text>
                </View>
              </View>

              <Text style={styles.cardDesc}>{previewText(splitDescriptionSections(item.description).description, 140)}</Text>

              <View style={styles.divider} />

              <View style={styles.metaRow}>
                <View style={styles.metaChip}>
                  <Ionicons name="time-outline" size={14} color={colors.accent} />
                  <Text style={styles.metaChipText}>{item.durationHours} giờ</Text>
                </View>
                <View style={styles.metaChip}>
                  <Ionicons name="images-outline" size={14} color={colors.accent} />
                  <Text style={styles.metaChipText}>{item.media.length} ảnh</Text>
                </View>
              </View>

              {renderSection('Mô tả chi tiết', splitDescriptionSections(item.description).description)}
              {renderSection('Tag ảnh', splitDescriptionSections(item.description).tags)}
              {renderSection('Features', splitDescriptionSections(item.description).features)}
              {renderSection('Yêu cầu buổi chụp', splitDescriptionSections(item.description).requirements)}

              <View style={styles.mediaStrip}>
                {item.media.slice(0, 5).map((media) => (
                  <PortfolioImageCell
                    key={media.id}
                    uri={media.imageUrl}
                    borderRadius={14}
                    style={styles.mediaThumb}
                    resizeMode="cover"
                  />
                ))}
              </View>

              <View style={styles.cardActions}>
                <Pressable style={styles.actionBtnEdit} onPress={() => openEdit(item)}>
                  <View style={styles.actionIconWrapEdit}>
                    <Ionicons name="create-outline" size={16} color="#F3C08B" />
                  </View>
                  <Text style={styles.actionTextEdit}>Chỉnh sửa gói</Text>
                </Pressable>
                <Pressable style={styles.actionBtnDanger} onPress={() => remove(item.id)}>
                  <View style={styles.actionIconWrapDanger}>
                    <Ionicons name="trash-outline" size={16} color="#ff8a8a" />
                  </View>
                  <Text style={styles.actionTextDanger}>Xóa</Text>
                </Pressable>
              </View>
            </Animated.View>
          ))}

          {!loading && services.length === 0 && (
            <View style={styles.emptyState}>
              <Ionicons name="images-outline" size={30} color="rgba(255,251,240,0.35)" />
              <Text style={styles.emptyTitle}>Chưa có gói dịch vụ nào</Text>
              <Text style={styles.emptyText}>Hãy tạo gói đầu tiên để khách hàng nhìn thấy phong cách làm việc của bạn.</Text>
            </View>
          )}
        </View>
      </ScrollView>

      <Modal visible={editorVisible} animationType="slide" transparent statusBarTranslucent>
        <View style={styles.modalWrap}>
          <Pressable style={styles.modalBackdrop} onPress={() => setEditorVisible(false)} />
          <SafeAreaView style={[styles.modalSafe, { paddingTop: Math.max(insets.top, 20) + 10, paddingBottom: Math.max(insets.bottom, 16) + 10 }]}>
            <View style={styles.modalCard}>
              <View style={styles.modalHandle} />
              <View style={styles.modalHeader}>
                <View style={styles.modalHeaderText}>
                  <Text style={styles.modalTitle}>{editingId ? 'Sửa gói' : 'Tạo gói mới'}</Text>
                  <Text style={styles.modalSub}>Nhập thông tin cơ bản rồi lưu.</Text>
                </View>
                <Pressable onPress={() => setEditorVisible(false)} style={styles.closeBtn}>
                  <Ionicons name="close" size={22} color="#fff" />
                </Pressable>
              </View>

              <ScrollView style={styles.modalScroll} contentContainerStyle={styles.modalScrollContent} showsVerticalScrollIndicator={false}>
                <View style={styles.formGroup}>
                  <Text style={styles.fieldLabel}>Tiêu đề chính</Text>
                  <TextInput style={styles.input} placeholder="Ví dụ: Gói chụp cưới ngoại cảnh" placeholderTextColor="rgba(255,255,255,0.35)" value={form.title} onChangeText={(t) => setForm((prev) => ({ ...prev, title: t }))} />
                </View>

                <View style={styles.formGroup}>
                  <Text style={styles.fieldLabel}>Tag ảnh</Text>
                  <View style={[styles.input, { flexDirection: 'row', flexWrap: 'wrap', gap: 6, paddingVertical: 10, alignItems: 'center' }]}>
                    {splitTags(form.tags).map((tag, idx) => (
                      <Pressable key={`${tag}-${idx}`} onPress={() => {
                         const tagsArr = splitTags(form.tags);
                         tagsArr.splice(idx, 1);
                         setForm(prev => ({ ...prev, tags: tagsArr.join(', ') }));
                      }} style={[styles.tagPreviewChip, { flexDirection: 'row', alignItems: 'center', gap: 4 }]}>
                        <Text style={styles.tagPreviewText}>{tag}</Text>
                        <Ionicons name="close-circle" size={12} color={colors.accent} />
                      </Pressable>
                    ))}
                    <TextInput
                      style={{ flex: 1, minWidth: 100, color: colors.text, padding: 0 }}
                      placeholder={form.tags ? "" : "Ví dụ: cưới, ngoại cảnh..."}
                      placeholderTextColor="rgba(255,255,255,0.35)"
                      value={tagInput}
                      onChangeText={(t) => {
                        if (t.includes(',')) {
                          const newTags = t.split(',').map(s => s.trim()).filter(Boolean);
                          if (newTags.length) {
                             setForm(prev => ({ ...prev, tags: prev.tags ? `${prev.tags}, ${newTags.join(', ')}` : newTags.join(', ') }));
                          }
                          setTagInput('');
                        } else {
                          setTagInput(t);
                        }
                      }}
                      onSubmitEditing={() => {
                        const t = tagInput.trim();
                        if (t) {
                          setForm(prev => ({ ...prev, tags: prev.tags ? `${prev.tags}, ${t}` : t }));
                          setTagInput('');
                        }
                      }}
                      onKeyPress={({ nativeEvent }) => {
                        if (nativeEvent.key === 'Backspace' && tagInput === '') {
                          const tagsArr = splitTags(form.tags);
                          if (tagsArr.length > 0) {
                             tagsArr.pop();
                             setForm(prev => ({ ...prev, tags: tagsArr.join(', ') }));
                          }
                        }
                      }}
                    />
                  </View>
                </View>

                <View style={styles.formGroup}>
                  <Text style={styles.fieldLabel}>Mô tả chi tiết</Text>
                  <TextInput style={[styles.input, styles.textArea]} placeholder="Mô tả phong cách, điểm mạnh của gói..." placeholderTextColor="rgba(255,255,255,0.35)" value={form.description} multiline onChangeText={(t) => setForm((prev) => ({ ...prev, description: t }))} />
                </View>

                <View style={styles.formGroup}>
                  <Text style={styles.fieldLabel}>Features của gói</Text>
                  <TextInput style={[styles.input, styles.textArea]} placeholder="Ví dụ: 1 photographer, chỉnh màu, 1 album..." placeholderTextColor="rgba(255,255,255,0.35)" value={form.features} multiline onChangeText={(t) => setForm((prev) => ({ ...prev, features: t }))} />
                </View>

                <View style={styles.formGroup}>
                  <Text style={styles.fieldLabel}>Yêu cầu buổi chụp</Text>
                  <TextInput style={[styles.input, styles.textArea]} placeholder="Ví dụ: có mặt đúng giờ, chuẩn bị trang phục..." placeholderTextColor="rgba(255,255,255,0.35)" value={form.requirements} multiline onChangeText={(t) => setForm((prev) => ({ ...prev, requirements: t }))} />
                </View>

                <View style={styles.rowTwo}>
                  <View style={[styles.formGroup, styles.flex1]}>
                    <Text style={styles.fieldLabel}>Giá</Text>
                    <TextInput style={styles.input} placeholder="4500000" placeholderTextColor="rgba(255,255,255,0.35)" keyboardType="numeric" value={form.price} onChangeText={(t) => setForm((prev) => ({ ...prev, price: t }))} />
                  </View>
                  <View style={[styles.formGroup, styles.flex1]}>
                    <Text style={styles.fieldLabel}>Thời lượng (giờ)</Text>
                    <TextInput style={styles.input} placeholder="4" placeholderTextColor="rgba(255,255,255,0.35)" keyboardType="numeric" value={form.durationHours} onChangeText={(t) => setForm((prev) => ({ ...prev, durationHours: t }))} />
                  </View>
                </View>

                <View style={styles.formGroup}>
                  <View style={styles.switchRow}>
                    <Text style={styles.fieldLabel}>Kích hoạt gói</Text>
                    <Pressable onPress={() => setForm((prev) => ({ ...prev, isActive: !prev.isActive }))} style={[styles.togglePill, form.isActive && styles.togglePillActive]}>
                      <Text style={styles.togglePillText}>{form.isActive ? 'Đang bật' : 'Đang tắt'}</Text>
                    </Pressable>
                  </View>
                </View>

                <View style={styles.mediaHead}>
                  <Text style={styles.fieldLabel}>Ảnh gói dịch vụ</Text>
                  <Pressable onPress={pickImagesFromDevice} style={styles.mediaAddBtn}>
                    <Ionicons name="images-outline" size={14} color="#fff" />
                    <Text style={styles.mediaAddText}>Chọn ảnh từ máy</Text>
                  </Pressable>
                </View>

                <View style={styles.mediaEditor}>
                  {form.media.map((item) => (
                    <PortfolioImageCell
                      key={`${item.sortOrder}-${item.imageUrl}`}
                      uri={item.imageUrl}
                      borderRadius={14}
                      style={styles.mediaItem}
                      resizeMode="cover"
                    />
                  ))}
                </View>

                <Pressable style={styles.saveBtn} onPress={save} disabled={saving}>
                  <LinearButtonLabel label={saving ? 'Đang lưu...' : 'Lưu gói dịch vụ'} />
                </Pressable>
              </ScrollView>
            </View>
          </SafeAreaView>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

function LinearButtonLabel({ label }: { label: string }) {
  return (
    <View style={styles.saveBtnInner}>
      <Ionicons name="sparkles" size={16} color="#fff" />
      <Text style={styles.saveBtnText}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#f7f3ee' },
  scroll: { paddingBottom: 36 },
  hero: {
    margin: 16,
    borderRadius: 28,
    padding: 16,
    backgroundColor: '#fffaf4',
    borderWidth: 1,
    borderColor: 'rgba(207,64,40,0.08)',
    overflow: 'hidden',
    shadowColor: '#d6c2b0',
    shadowOpacity: 0.18,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 8 },
    elevation: 2,
  },
  heroGlow: {
    position: 'absolute',
    top: -60,
    right: -40,
    width: 180,
    height: 180,
    borderRadius: 90,
    backgroundColor: 'rgba(207,64,40,0.08)',
  },
  heroTopRow: { flexDirection: 'row', justifyContent: 'space-between', gap: 10, marginBottom: 18 },
  heroPill: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: 'rgba(207,64,40,0.08)', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 999 },
  heroPillText: { color: colors.accent, fontSize: 12, fontWeight: '700' },
  heroPillMuted: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: 'rgba(45,106,79,0.08)', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 999 },
  heroPillMutedText: { color: colors.success, fontSize: 12, fontWeight: '600' },
  title: { color: colors.text, fontSize: 24, fontWeight: '900', letterSpacing: 0.2, maxWidth: 280, lineHeight: 30 },
  sub: { color: colors.textMuted, marginTop: 8, lineHeight: 21, fontSize: 13 },
  heroStats: { flexDirection: 'row', alignItems: 'stretch', marginTop: 16, backgroundColor: '#fff', borderRadius: 20, padding: 12, borderWidth: 1, borderColor: colors.border },
  heroCreateBtn: { marginTop: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: colors.primary, borderRadius: 16, paddingVertical: 14 },
  heroCreateBtnText: { color: '#fff', fontWeight: '900', letterSpacing: 0.4 },
  statCard: { flex: 1, alignItems: 'center' },
  moneyRow: { flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'center' },
  moneyValue: { color: colors.text, fontSize: 16, fontWeight: '900', lineHeight: 18, includeFontPadding: false, textAlignVertical: 'center' },
  moneyUnit: { color: colors.text, fontSize: 12, fontWeight: '900', lineHeight: 18, includeFontPadding: false, marginLeft: 2, paddingBottom: 1 },
  statDivider: { width: 1, backgroundColor: colors.border, marginHorizontal: 10 },
  statNum: { color: colors.text, fontSize: 16, fontWeight: '900', marginBottom: 4, textAlign: 'center' },
  statLabel: { color: colors.textMuted, fontSize: 11, textAlign: 'center' },

  sectionIntro: { paddingHorizontal: 16, marginTop: 4, marginBottom: 8, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end', gap: 14 },
  sectionTitle: { color: colors.text, fontSize: 18, fontWeight: '800' },
  sectionSub: { color: colors.textMuted, marginTop: 6, lineHeight: 20, paddingRight: 12, flexShrink: 1 },
  addBtn: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: colors.primary, paddingHorizontal: 14, paddingVertical: 12, borderRadius: 16 },
  addBtnText: { color: '#fff', fontWeight: '800' },

  content: { paddingHorizontal: 16, gap: 14 },
  card: { backgroundColor: '#fff', borderRadius: 26, padding: 18, borderWidth: 1, borderColor: colors.border, gap: 12, shadowColor: '#d6c2b0', shadowOpacity: 0.12, shadowRadius: 16, shadowOffset: { width: 0, height: 8 }, elevation: 2 },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', gap: 12, alignItems: 'flex-start' },
  cardHeaderLeft: { flex: 1, gap: 10, paddingRight: 8 },
  cardBadge: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: 'rgba(207,64,40,0.08)', paddingHorizontal: 10, paddingVertical: 7, borderRadius: 999, alignSelf: 'flex-start' },
  cardBadgeText: { color: colors.accent, fontSize: 11, fontWeight: '700' },
  priceBlock: { alignItems: 'flex-end', flexShrink: 0 },
  price: { color: colors.text, fontWeight: '900', fontSize: 18, textAlign: 'right' },
  duration: { color: colors.textMuted, marginTop: 4, fontSize: 12 },
  cardName: { color: colors.text, fontSize: 22, fontWeight: '900', letterSpacing: 0.2, lineHeight: 28 },
  cardDesc: { color: colors.textMuted, lineHeight: 22, fontSize: 14 },
  divider: { height: 1, backgroundColor: colors.border, marginVertical: 2 },
  metaRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  metaChip: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: colors.background, paddingHorizontal: 12, paddingVertical: 9, borderRadius: 999, borderWidth: 1, borderColor: colors.border },
  metaChipText: { color: colors.text, fontSize: 12, fontWeight: '600' },
  sectionBlock: { marginTop: 12, paddingHorizontal: 4 },
  sectionBlockLabel: { color: colors.text, fontSize: 13, fontWeight: '800', marginBottom: 4 },
  sectionBlockValue: { color: colors.textMuted, fontSize: 13, lineHeight: 20 },
  cardActions: { flexDirection: 'row', gap: 10, marginTop: 12 },
  actionBtnEdit: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: 'rgba(207,64,40,0.08)', paddingVertical: 12, borderRadius: 14, borderWidth: 1, borderColor: 'rgba(207,64,40,0.12)' },
  actionBtnDanger: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: 'rgba(255,138,138,0.1)', paddingVertical: 12, borderRadius: 14, borderWidth: 1, borderColor: 'rgba(255,138,138,0.12)' },
  actionIconWrapEdit: { width: 24, height: 24, borderRadius: 12, backgroundColor: 'rgba(207,64,40,0.16)', justifyContent: 'center', alignItems: 'center' },
  actionIconWrapDanger: { width: 24, height: 24, borderRadius: 12, backgroundColor: 'rgba(255,138,138,0.16)', justifyContent: 'center', alignItems: 'center' },
  actionTextEdit: { color: colors.accent, fontWeight: '800' },
  actionTextDanger: { color: '#ff6b6b', fontWeight: '800' },

  emptyState: { marginTop: 10, borderRadius: 22, borderWidth: 1, borderColor: colors.border, borderStyle: 'dashed', backgroundColor: '#fff', padding: 24, alignItems: 'center', gap: 10 },
  emptyTitle: { color: colors.text, fontWeight: '800', fontSize: 16 },
  emptyText: { color: colors.textMuted, textAlign: 'center', lineHeight: 20 },

  modalWrap: { flex: 1, backgroundColor: 'rgba(17,13,8,0.35)' },
  modalBackdrop: { ...StyleSheet.absoluteFillObject },
  modalSafe: { flex: 1, justifyContent: 'flex-end' },
  modalCard: { backgroundColor: '#fffaf4', borderTopLeftRadius: 30, borderTopRightRadius: 30, padding: 20, paddingBottom: 28, gap: 12, borderTopWidth: 1, borderColor: 'rgba(207,64,40,0.08)', maxHeight: '94%', shadowColor: '#d6c2b0', shadowOpacity: 0.2, shadowRadius: 18, shadowOffset: { width: 0, height: -4 }, elevation: 8 },
  modalHeaderText: { flex: 1, paddingRight: 8 },
  modalScroll: { flexGrow: 0, maxHeight: '82%' },
  modalScrollContent: { paddingBottom: 8, gap: 12 },
  modalHandle: { alignSelf: 'center', width: 52, height: 5, borderRadius: 999, backgroundColor: 'rgba(255,255,255,0.14)', marginBottom: 6 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12 },
  modalTitle: { color: colors.text, fontSize: 22, fontWeight: '900' },
  modalSub: { color: colors.textMuted, marginTop: 4, lineHeight: 20, maxWidth: 270 },
  closeBtn: { width: 38, height: 38, borderRadius: 19, backgroundColor: colors.background, justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: colors.border },
  formGroup: { gap: 8 },
  rowTwo: { flexDirection: 'row', gap: 12 },
  flex1: { flex: 1 },
  switchRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  togglePill: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: 999, backgroundColor: colors.background, borderWidth: 1, borderColor: colors.border },
  togglePillActive: { backgroundColor: 'rgba(45,106,79,0.12)', borderColor: 'rgba(45,106,79,0.2)' },
  togglePillText: { color: colors.text, fontWeight: '700', fontSize: 12 },
  mediaHead: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  mediaAddBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: colors.primary, borderRadius: 999, paddingHorizontal: 12, paddingVertical: 8 },
  mediaAddText: { color: '#fff', fontWeight: '800', fontSize: 12 },
  mediaStrip: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  mediaThumb: { width: 92, height: 92, borderRadius: 14 },
  mediaEditor: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  mediaItem: { width: 84, height: 84, borderRadius: 14 },
  mediaPreviewImage: { width: 48, height: 48, borderRadius: 12 },
  mediaItemText: { color: colors.text, fontWeight: '700' },
  inputField: { backgroundColor: '#1e1c26', borderRadius: 16, padding: 16, color: '#FFFBF0', fontSize: 16, borderWidth: 1, borderColor: 'rgba(255,255,255,0.05)' },
  tagPreviewChip: { backgroundColor: 'rgba(207,64,40,0.1)', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8, borderWidth: 1, borderColor: 'rgba(207,64,40,0.2)' },
  tagPreviewText: { color: colors.accent, fontSize: 12, fontWeight: '700' },
  input: { backgroundColor: '#fff', borderRadius: 16, padding: 14, color: colors.text, borderWidth: 1, borderColor: colors.border },
  textArea: { minHeight: 100, textAlignVertical: 'top' },
  saveBtn: { backgroundColor: colors.primary, paddingVertical: 14, borderRadius: 16, alignItems: 'center', marginTop: 6, marginBottom: 8 },
  saveBtnInner: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  saveBtnText: { color: '#fff', fontWeight: '900', letterSpacing: 0.4 },
});
