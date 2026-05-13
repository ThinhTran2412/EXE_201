import React, { useMemo, useState } from 'react';
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
import { SafeAreaView } from 'react-native-safe-area-context';
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../../app/theme/colors';
import { spacing } from '../../../app/theme/spacing';
import { radius } from '../../../app/theme/spacing';

type ServiceItem = {
  id: string;
  name: string;
  price: string;
  duration: string;
  description: string;
};

const seedServices: ServiceItem[] = [
  { id: '1', name: 'Chụp cưới', price: '4500000', duration: '4 giờ', description: 'Gói chụp cưới ngoại cảnh, cảm xúc tự nhiên và hậu kỳ tinh tế.' },
  { id: '2', name: 'Chụp sự kiện', price: '2500000', duration: '2 giờ', description: 'Phù hợp khai trương, sinh nhật, sự kiện thương hiệu, coverage gọn gàng.' },
  { id: '3', name: 'Chụp chân dung', price: '1200000', duration: '1 giờ', description: 'Portrait nghệ thuật, lifestyle, cá nhân hoặc profile chuyên nghiệp.' },
];

const formatMoney = (value: string) => {
  const n = Number(value || 0);
  return Number.isFinite(n) ? n.toLocaleString('vi-VN') : '0';
};

const formatCurrencySummary = (value: number) => `${value.toLocaleString('vi-VN')} đ`;

const previewText = (text: string, max = 120) => {
  const clean = text.trim().replace(/\s+/g, ' ');
  if (clean.length <= max) return clean;
  return `${clean.slice(0, max - 1).trimEnd()}…`;
};

export default function ServiceManagementScreen() {
  const [services, setServices] = useState<ServiceItem[]>(seedServices);
  const [editorVisible, setEditorVisible] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState({ name: '', price: '', duration: '', description: '' });

  const stats = useMemo(() => {
    const total = services.length;
    const avg = total ? Math.round(services.reduce((sum, s) => sum + Number(s.price || 0), 0) / total) : 0;
    const min = total ? Math.min(...services.map(s => Number(s.price || 0))) : 0;
    const max = total ? Math.max(...services.map(s => Number(s.price || 0))) : 0;
    return { total, avg, min, max };
  }, [services]);

  function openCreate() {
    setEditingId(null);
    setForm({ name: '', price: '', duration: '', description: '' });
    setEditorVisible(true);
  }

  function openEdit(item: ServiceItem) {
    setEditingId(item.id);
    setForm({ name: item.name, price: item.price, duration: item.duration, description: item.description });
    setEditorVisible(true);
  }

  function save() {
    if (!form.name.trim() || !form.price.trim() || !form.duration.trim()) {
      Alert.alert('Thiếu thông tin', 'Vui lòng nhập tên, giá và thời lượng.');
      return;
    }

    if (editingId) {
      setServices(prev => prev.map(s => s.id === editingId ? { ...s, ...form } : s));
    } else {
      setServices(prev => [{ id: String(Date.now()), ...form }, ...prev]);
    }
    setEditorVisible(false);
  }

  function remove(id: string) {
    Alert.alert('Xóa dịch vụ', 'Bạn muốn xóa dịch vụ này?', [
      { text: 'Hủy', style: 'cancel' },
      { text: 'Xóa', style: 'destructive', onPress: () => setServices(prev => prev.filter(s => s.id !== id)) },
    ]);
  }

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <Animated.View entering={FadeInUp.duration(700)} style={styles.hero}>
          <View style={styles.heroGlow} />
          <View style={styles.heroTopRow}>
            <View style={styles.heroPill}>
              <Ionicons name="aperture-outline" size={14} color="#F3C08B" />
              <Text style={styles.heroPillText}>Bảng giá nghệ thuật</Text>
            </View>
            <View style={styles.heroPillMuted}>
              <Ionicons name="sparkles-outline" size={14} color="#F7E7D2" />
              <Text style={styles.heroPillMutedText}>3 gói đang hoạt động</Text>
            </View>
          </View>
          <Text style={styles.title}>Dịch vụ & giá trị sáng tạo</Text>
          <Text style={styles.sub}>
            Trình bày gói chụp như một catalogue nghệ thuật: rõ ràng, sang trọng và dễ hiểu cho khách hàng ngay từ cái nhìn đầu tiên.
          </Text>

          <View style={styles.heroStats}>
            <View style={styles.statCard}>
              <Text style={styles.statNum}>{stats.total}</Text>
              <Text style={styles.statLabel}>Gói chụp</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statCard}>
              <View style={styles.moneyRow}>
                <Text style={styles.moneyValue}>{stats.avg.toLocaleString('vi-VN')}</Text>
                <Text style={styles.moneyUnit}>đ</Text>
              </View>
              <Text style={styles.statLabel}>Giá trung bình</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statCard}>
              <View style={styles.moneyRow}>
                <Text style={styles.moneyValue}>{stats.min.toLocaleString('vi-VN')}</Text>
                <Text style={styles.moneyUnit}>đ</Text>
              </View>
              <Text style={styles.statLabel}>Mức thấp nhất</Text>
            </View>
          </View>
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(120).duration(600)} style={styles.sectionIntro}>
          <View>
            <Text style={styles.sectionTitle}>Danh sách gói</Text>
            <Text style={styles.sectionSub}>Mỗi gói là một câu chuyện hình ảnh với phạm vi, thời lượng và mức giá rõ ràng.</Text>
          </View>
          <Pressable style={styles.addBtn} onPress={openCreate}>
            <Ionicons name="add" size={18} color="#fff" />
            <Text style={styles.addBtnText}>Thêm gói</Text>
          </Pressable>
        </Animated.View>

        <View style={styles.content}>
          {services.map((item, index) => (
            <Animated.View key={item.id} entering={FadeInDown.delay(index * 60).duration(550)} style={styles.card}>
              <View style={styles.cardHeader}>
                <View style={styles.cardHeaderLeft}>
                  <View style={styles.cardBadge}>
                    <Ionicons name="camera-outline" size={14} color="#F3C08B" />
                    <Text style={styles.cardBadgeText}>Gói {index + 1}</Text>
                  </View>
                  <Text style={styles.cardName} numberOfLines={2}>{item.name}</Text>
                </View>
                <View style={styles.priceBlock}>
                  <Text style={styles.price}>{formatMoney(item.price)}đ</Text>
                  <Text style={styles.duration}>{item.duration}</Text>
                </View>
              </View>

              <Text style={styles.cardDesc}>{previewText(item.description, 150)}</Text>

              <View style={styles.divider} />

              <View style={styles.metaRow}>
                <View style={styles.metaChip}>
                  <Ionicons name="time-outline" size={14} color="rgba(255,251,240,0.8)" />
                  <Text style={styles.metaChipText}>{item.duration}</Text>
                </View>
                <View style={styles.metaChip}>
                  <Ionicons name="wallet-outline" size={14} color="rgba(255,251,240,0.8)" />
                  <Text style={styles.metaChipText}>{formatMoney(item.price)}đ</Text>
                </View>
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

          {services.length === 0 && (
            <View style={styles.emptyState}>
              <Ionicons name="images-outline" size={30} color="rgba(255,251,240,0.35)" />
              <Text style={styles.emptyTitle}>Chưa có gói dịch vụ nào</Text>
              <Text style={styles.emptyText}>Hãy tạo gói đầu tiên để khách hàng nhìn thấy phong cách làm việc của bạn.</Text>
            </View>
          )}
        </View>
      </ScrollView>

      <Modal visible={editorVisible} animationType="slide" transparent>
        <View style={styles.modalWrap}>
          <View style={styles.modalCard}>
            <View style={styles.modalHandle} />
            <View style={styles.modalHeader}>
              <View>
                <Text style={styles.modalTitle}>{editingId ? 'Chỉnh sửa gói' : 'Tạo gói mới'}</Text>
                <Text style={styles.modalSub}>Thiết kế gói dịch vụ rõ ràng, sang trọng và dễ chốt đơn hơn.</Text>
              </View>
              <Pressable onPress={() => setEditorVisible(false)} style={styles.closeBtn}>
                <Ionicons name="close" size={22} color="#fff" />
              </Pressable>
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.fieldLabel}>Tên gói</Text>
              <TextInput
                style={styles.input}
                placeholder="Ví dụ: Gói cưới điện ảnh"
                placeholderTextColor="rgba(255,255,255,0.35)"
                value={form.name}
                onChangeText={(t) => setForm(prev => ({ ...prev, name: t }))}
              />
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.fieldLabel}>Giá</Text>
              <TextInput
                style={styles.input}
                placeholder="Ví dụ: 4500000"
                placeholderTextColor="rgba(255,255,255,0.35)"
                keyboardType="numeric"
                value={form.price}
                onChangeText={(t) => setForm(prev => ({ ...prev, price: t }))}
              />
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.fieldLabel}>Thời lượng</Text>
              <TextInput
                style={styles.input}
                placeholder="Ví dụ: 4 giờ"
                placeholderTextColor="rgba(255,255,255,0.35)"
                value={form.duration}
                onChangeText={(t) => setForm(prev => ({ ...prev, duration: t }))}
              />
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.fieldLabel}>Mô tả nghệ thuật</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                placeholder="Mô tả phong cách, phạm vi, điểm nổi bật..."
                placeholderTextColor="rgba(255,255,255,0.35)"
                value={form.description}
                multiline
                onChangeText={(t) => setForm(prev => ({ ...prev, description: t }))}
              />
            </View>

            <Pressable style={styles.saveBtn} onPress={save}>
              <LinearButtonLabel label="Lưu gói dịch vụ" />
            </Pressable>
          </View>
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
  safe: { flex: 1, backgroundColor: '#0d0b14' },
  scroll: { paddingBottom: 36 },
  hero: {
    margin: 16,
    borderRadius: 28,
    padding: 20,
    backgroundColor: '#1b1726',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.07)',
    overflow: 'hidden',
  },
  heroGlow: {
    position: 'absolute',
    top: -60,
    right: -40,
    width: 180,
    height: 180,
    borderRadius: 90,
    backgroundColor: 'rgba(230,126,34,0.12)',
  },
  heroTopRow: { flexDirection: 'row', justifyContent: 'space-between', gap: 10, marginBottom: 18 },
  heroPill: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: 'rgba(243,192,139,0.14)', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 999 },
  heroPillText: { color: '#F7E7D2', fontSize: 12, fontWeight: '700' },
  heroPillMuted: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: 'rgba(255,255,255,0.06)', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 999 },
  heroPillMutedText: { color: '#F7E7D2', fontSize: 12, fontWeight: '600' },
  title: { color: '#FFFBF0', fontSize: 28, fontWeight: '900', letterSpacing: 0.2, maxWidth: 280, lineHeight: 34 },
  sub: { color: 'rgba(255,251,240,0.7)', marginTop: 10, lineHeight: 22, fontSize: 14 },
  heroStats: { flexDirection: 'row', alignItems: 'stretch', marginTop: 20, backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: 20, padding: 14 },
  statCard: { flex: 1, alignItems: 'center' },
  moneyRow: { flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'center' },
  moneyValue: { color: '#FFFBF0', fontSize: 16, fontWeight: '900', lineHeight: 18, includeFontPadding: false, textAlignVertical: 'center' },
  moneyUnit: { color: '#FFFBF0', fontSize: 12, fontWeight: '900', lineHeight: 18, includeFontPadding: false, marginLeft: 2, paddingBottom: 1 },
  statDivider: { width: 1, backgroundColor: 'rgba(255,255,255,0.06)', marginHorizontal: 10 },
  statNum: { color: '#FFFBF0', fontSize: 16, fontWeight: '900', marginBottom: 4, textAlign: 'center' },
  statLabel: { color: 'rgba(255,251,240,0.58)', fontSize: 11, textAlign: 'center' },

  sectionIntro: { paddingHorizontal: 16, marginTop: 6, marginBottom: 10, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end', gap: 14 },
  sectionTitle: { color: '#FFFBF0', fontSize: 18, fontWeight: '800' },
  sectionSub: { color: 'rgba(255,251,240,0.55)', marginTop: 6, lineHeight: 20, paddingRight: 12, flexShrink: 1 },
  addBtn: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: colors.primary, paddingHorizontal: 14, paddingVertical: 12, borderRadius: 16 },
  addBtnText: { color: '#fff', fontWeight: '800' },

  content: { paddingHorizontal: 16, gap: 14 },
  card: { backgroundColor: '#201b2d', borderRadius: 26, padding: 18, borderWidth: 1, borderColor: 'rgba(255,255,255,0.07)', gap: 12 },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', gap: 12, alignItems: 'flex-start' },
  cardHeaderLeft: { flex: 1, gap: 10, paddingRight: 8 },
  cardBadge: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: 'rgba(243,192,139,0.16)', paddingHorizontal: 10, paddingVertical: 7, borderRadius: 999, alignSelf: 'flex-start' },
  cardBadgeText: { color: '#F7E7D2', fontSize: 11, fontWeight: '700' },
  priceBlock: { alignItems: 'flex-end', flexShrink: 0 },
  price: { color: '#FFFBF0', fontWeight: '900', fontSize: 18, textAlign: 'right' },
  duration: { color: 'rgba(255,251,240,0.6)', marginTop: 4, fontSize: 12 },
  cardName: { color: '#FFFBF0', fontSize: 22, fontWeight: '900', letterSpacing: 0.2, lineHeight: 28 },
  cardDesc: { color: 'rgba(255,251,240,0.72)', lineHeight: 22, fontSize: 14 },
  divider: { height: 1, backgroundColor: 'rgba(255,255,255,0.07)', marginVertical: 2 },
  metaRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  metaChip: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: 'rgba(255,255,255,0.06)', paddingHorizontal: 12, paddingVertical: 9, borderRadius: 999 },
  metaChipText: { color: 'rgba(255,251,240,0.85)', fontSize: 12, fontWeight: '600' },
  cardActions: { flexDirection: 'row', gap: 10, marginTop: 2 },
  actionBtnEdit: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: 'rgba(243,192,139,0.1)', paddingVertical: 12, borderRadius: 14, borderWidth: 1, borderColor: 'rgba(243,192,139,0.12)' },
  actionBtnDanger: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: 'rgba(255,138,138,0.1)', paddingVertical: 12, borderRadius: 14, borderWidth: 1, borderColor: 'rgba(255,138,138,0.12)' },
  actionIconWrapEdit: { width: 24, height: 24, borderRadius: 12, backgroundColor: 'rgba(243,192,139,0.16)', justifyContent: 'center', alignItems: 'center' },
  actionIconWrapDanger: { width: 24, height: 24, borderRadius: 12, backgroundColor: 'rgba(255,138,138,0.16)', justifyContent: 'center', alignItems: 'center' },
  actionTextEdit: { color: '#F7E7D2', fontWeight: '800' },
  actionTextDanger: { color: '#ffb1b1', fontWeight: '800' },

  emptyState: { marginTop: 10, borderRadius: 22, borderWidth: 1, borderColor: 'rgba(255,255,255,0.06)', borderStyle: 'dashed', backgroundColor: 'rgba(255,255,255,0.03)', padding: 24, alignItems: 'center', gap: 10 },
  emptyTitle: { color: '#FFFBF0', fontWeight: '800', fontSize: 16 },
  emptyText: { color: 'rgba(255,251,240,0.6)', textAlign: 'center', lineHeight: 20 },

  modalWrap: { flex: 1, backgroundColor: 'rgba(0,0,0,0.68)', justifyContent: 'flex-end' },
  modalCard: { backgroundColor: '#141121', borderTopLeftRadius: 30, borderTopRightRadius: 30, padding: 20, gap: 12, borderTopWidth: 1, borderColor: 'rgba(255,255,255,0.08)' },
  modalHandle: { alignSelf: 'center', width: 52, height: 5, borderRadius: 999, backgroundColor: 'rgba(255,255,255,0.14)', marginBottom: 6 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12 },
  modalTitle: { color: '#FFFBF0', fontSize: 22, fontWeight: '900' },
  modalSub: { color: 'rgba(255,251,240,0.68)', marginTop: 4, lineHeight: 20, maxWidth: 270 },
  closeBtn: { width: 38, height: 38, borderRadius: 19, backgroundColor: 'rgba(255,255,255,0.08)', justifyContent: 'center', alignItems: 'center' },
  formGroup: { gap: 8 },
  fieldLabel: { color: 'rgba(255,251,240,0.72)', fontSize: 12, fontWeight: '700', letterSpacing: 0.6, textTransform: 'uppercase' },
  input: { backgroundColor: '#1e1c26', borderRadius: 16, padding: 14, color: '#fff', borderWidth: 1, borderColor: 'rgba(255,255,255,0.06)' },
  textArea: { minHeight: 100, textAlignVertical: 'top' },
  saveBtn: { backgroundColor: colors.primary, paddingVertical: 14, borderRadius: 16, alignItems: 'center', marginTop: 6, marginBottom: 8 },
  saveBtnInner: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  saveBtnText: { color: '#fff', fontWeight: '900', letterSpacing: 0.4 },
});
