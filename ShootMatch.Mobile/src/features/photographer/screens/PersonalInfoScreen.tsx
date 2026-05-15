import React, { useEffect, useState } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { colors } from '../../../app/theme/colors';
import { REGION_OPTIONS, formatRegion } from '../../../shared/constants/regions';
import { getPhotographerProfile, updatePersonalInfo, uploadProfileImage } from '../api';

export default function PersonalInfoScreen() {
  const navigation = useNavigation<any>();
  const insets = useSafeAreaInsets();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [locked, setLocked] = useState(true);
  const [form, setForm] = useState({
    nationalId: '',
    phone: '',
    email: '',
    region: '',
    personalAddress: '',
    verificationDocumentFrontUrl: '',
    verificationDocumentBackUrl: '',
    verificationPortraitUrl: '',
  });
  const [regionPickerOpen, setRegionPickerOpen] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const profile = await getPhotographerProfile();
        if (profile) {
          setForm({
            nationalId: profile.nationalId || '',
            phone: profile.phone || '',
            email: profile.email || '',
            region: profile.region || '',
            personalAddress: profile.personalAddress || '',
            verificationDocumentFrontUrl: profile.verificationDocumentFrontUrl || '',
            verificationDocumentBackUrl: profile.verificationDocumentBackUrl || '',
            verificationPortraitUrl: profile.verificationPortraitUrl || '',
          });
        }
      } catch (err) {
        console.error('Load personal info failed:', err);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  async function pickImage(field: 'verificationDocumentFrontUrl' | 'verificationDocumentBackUrl' | 'verificationPortraitUrl') {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 1,
      allowsEditing: true,
      aspect: field === 'verificationPortraitUrl' ? [1, 1] : [4, 3],
    });
    if (result.canceled || !result.assets?.length) return;
    const asset = result.assets[0];
    const uploaded = await uploadProfileImage(asset.uri, asset.mimeType ?? 'image/jpeg', 'avatar');
    setForm(prev => ({ ...prev, [field]: uploaded } as any));
  }

  async function handleSave() {
    try {
      setSaving(true);
      await updatePersonalInfo(form);
      Alert.alert('Thành công', 'Đã cập nhật thông tin cá nhân.');
      navigation.goBack();
    } catch (err: any) {
      const message = err?.response?.data?.message || err?.response?.data || err?.message || 'Không thể cập nhật thông tin cá nhân.';
      Alert.alert('Lỗi', typeof message === 'string' ? message : 'Không thể cập nhật thông tin cá nhân.');
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return <SafeAreaView style={styles.safe} />;
  }

  return (
    <SafeAreaView style={styles.safe}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.flex}>
        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          <Animated.View entering={FadeInDown.duration(500)} style={styles.hero}>
            <View style={[styles.topActions, { top: Math.max(insets.top, 16) }]}>
              <Pressable style={styles.iconBtn} onPress={() => navigation.goBack()}>
                <Ionicons name="chevron-back" size={22} color="#FFFBF0" />
              </Pressable>
              <Pressable style={styles.iconBtn} onPress={() => setLocked(v => !v)}>
                <Ionicons name={locked ? 'eye-off-outline' : 'eye-outline'} size={20} color="#FFFBF0" />
              </Pressable>
            </View>
            <View style={styles.heroBadge}>
              <Ionicons name="shield-checkmark-outline" size={13} color="#F7E7D2" />
              <Text style={styles.heroBadgeText}>Xác thực và liên hệ</Text>
            </View>
            <Text style={styles.title}>Thông tin cá nhân</Text>
            <Text style={styles.sub}>Trang riêng để quản lý dữ liệu nhận diện, liên hệ, địa chỉ và ảnh xác thực.</Text>
          </Animated.View>

          <Animated.View entering={FadeInDown.delay(120).duration(500)} style={styles.card}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Thông tin thiết yếu</Text>
              <Text style={styles.lockState}>{locked ? 'Đang khóa' : 'Đang mở'}</Text>
            </View>
            <Field label="Căn cước / CCCD" value={form.nationalId} placeholder="Nhập số căn cước" onChangeText={(nationalId) => setForm(prev => ({ ...prev, nationalId }))} icon="card-outline" locked={locked} />
            <Field label="Số điện thoại liên lạc" value={form.phone} placeholder="Nhập số điện thoại" onChangeText={(phone) => setForm(prev => ({ ...prev, phone }))} icon="call-outline" keyboardType="phone-pad" locked={locked} />
            <Field label="Email cụ thể" value={form.email} placeholder="Nhập email" onChangeText={(email) => setForm(prev => ({ ...prev, email }))} icon="mail-outline" keyboardType="email-address" autoCapitalize="none" locked={locked} />
            <View style={styles.fieldGroup}>
              <Text style={styles.label}>Tỉnh / Thành phố</Text>
              <Pressable
                style={[styles.inputWrap, locked && styles.inputLocked]}
                onPress={() => !locked && setRegionPickerOpen(true)}
                disabled={locked}
              >
                <View style={styles.inputIcon}><Ionicons name="map-outline" size={14} color="#F7E7D2" /></View>
                <Text style={[styles.regionValue, !form.region && styles.regionPlaceholder]}>
                  {form.region ? formatRegion(form.region) : 'Chọn tỉnh / thành phố'}
                </Text>
                {!locked && <Ionicons name="chevron-down" size={16} color="rgba(255,255,255,0.35)" />}
              </Pressable>
            </View>
            <Field label="Địa chỉ cụ thể" value={form.personalAddress} placeholder="Số nhà, đường, phường/xã..." onChangeText={(personalAddress) => setForm(prev => ({ ...prev, personalAddress }))} icon="location-outline" multiline locked={locked} />
          </Animated.View>

          <Animated.View entering={FadeInDown.delay(180).duration(500)} style={styles.card}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Ảnh xác thực CCCD</Text>
              <Text style={styles.sectionSubSmall}>3 ảnh cần có</Text>
            </View>
            <UploadRow label="Mặt trước CCCD" value={form.verificationDocumentFrontUrl} onPress={() => pickImage('verificationDocumentFrontUrl')} />
            <UploadRow label="Mặt sau CCCD" value={form.verificationDocumentBackUrl} onPress={() => pickImage('verificationDocumentBackUrl')} />
            <UploadRow label="Ảnh xác thực / selfie" value={form.verificationPortraitUrl} onPress={() => pickImage('verificationPortraitUrl')} />
          </Animated.View>

          <Animated.View entering={FadeInDown.delay(220).duration(500)} style={styles.noteCard}>
            <Ionicons name="information-circle-outline" size={18} color={colors.primary} />
            <Text style={styles.noteText}>Mục này dùng để lưu dữ liệu cá nhân và xác thực, tách riêng khỏi phần dịch vụ và giá.</Text>
          </Animated.View>

          <Pressable style={styles.saveBtn} onPress={handleSave} disabled={saving}>
            <LinearGradient colors={[colors.primary, '#E67E22']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.saveBtnGradient}>
              <Text style={styles.saveBtnText}>{saving ? 'Đang lưu...' : 'Lưu thông tin cá nhân'}</Text>
            </LinearGradient>
          </Pressable>
        </ScrollView>
      </KeyboardAvoidingView>

      {regionPickerOpen && (
        <View style={styles.regionOverlay}>
          <Pressable style={styles.regionBackdrop} onPress={() => setRegionPickerOpen(false)} />
          <View style={styles.regionSheet}>
            <Text style={styles.regionSheetTitle}>Chọn tỉnh / thành phố</Text>
            {REGION_OPTIONS.map(({ code, label }) => (
              <Pressable
                key={code}
                style={[styles.regionOption, form.region === code && styles.regionOptionActive]}
                onPress={() => {
                  setForm(prev => ({ ...prev, region: code }));
                  setRegionPickerOpen(false);
                }}
              >
                <Text style={[styles.regionOptionText, form.region === code && styles.regionOptionTextActive]}>{label}</Text>
                {form.region === code && <Ionicons name="checkmark" size={18} color={colors.primary} />}
              </Pressable>
            ))}
          </View>
        </View>
      )}
    </SafeAreaView>
  );
}

function Field({ label, value, placeholder, onChangeText, icon, locked, ...props }: any) {
  return (
    <View style={styles.fieldGroup}>
      <Text style={styles.label}>{label}</Text>
      <View style={styles.inputWrap}>
        <View style={styles.inputIcon}><Ionicons name={icon} size={14} color="#F7E7D2" /></View>
        <TextInput
          style={[styles.input, props.multiline && styles.textArea]}
          value={value}
          editable={!locked}
          placeholder={placeholder}
          placeholderTextColor="rgba(255,255,255,0.35)"
          onChangeText={onChangeText}
          {...props}
        />
      </View>
    </View>
  );
}

function UploadRow({ label, value, onPress }: { label: string; value: string; onPress: () => void }) {
  return (
    <Pressable style={styles.uploadRow} onPress={onPress}>
      <View style={styles.uploadIcon}><Ionicons name="image-outline" size={14} color="#F7E7D2" /></View>
      <View style={styles.uploadBody}>
        <Text style={styles.uploadLabel}>{label}</Text>
        <Text style={styles.uploadValue}>{value ? 'Đã tải ảnh' : 'Chưa có ảnh'}</Text>
      </View>
      <Ionicons name="chevron-forward" size={16} color="rgba(255,255,255,0.28)" />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#0d0b14' },
  flex: { flex: 1 },
  content: { padding: 20, gap: 14, paddingBottom: 28 },
  hero: { backgroundColor: '#141121', borderRadius: 26, padding: 20, borderWidth: 1, borderColor: 'rgba(255,255,255,0.06)', overflow: 'hidden' },
  topActions: { position: 'absolute', left: 16, right: 16, zIndex: 10, flexDirection: 'row', justifyContent: 'space-between' },
  iconBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: 'rgba(0,0,0,0.3)', justifyContent: 'center', alignItems: 'center' },
  heroBadge: { alignSelf: 'flex-start', flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: 'rgba(243,192,139,0.14)', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 999, marginTop: 30 },
  heroBadgeText: { color: '#F7E7D2', fontSize: 12, fontWeight: '700' },
  title: { color: '#FFFBF0', fontSize: 24, fontWeight: '900', marginTop: 12 },
  sub: { color: 'rgba(255,251,240,0.62)', marginTop: 8, lineHeight: 20, fontSize: 13 },
  card: { backgroundColor: '#1b1726', borderRadius: 22, padding: 16, borderWidth: 1, borderColor: 'rgba(255,255,255,0.07)', gap: 12 },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  sectionTitle: { color: '#FFFBF0', fontSize: 16, fontWeight: '800' },
  sectionSubSmall: { color: 'rgba(255,251,240,0.5)', fontSize: 11, fontWeight: '700' },
  lockState: { color: 'rgba(255,251,240,0.55)', fontSize: 11, fontWeight: '700', textTransform: 'uppercase' },
  fieldGroup: { gap: 6 },
  label: { color: 'rgba(255,251,240,0.72)', fontSize: 11, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.4 },
  inputWrap: { flexDirection: 'row', alignItems: 'flex-start', gap: 8, backgroundColor: '#141121', borderRadius: 14, paddingHorizontal: 12, paddingVertical: 11, borderWidth: 1, borderColor: 'rgba(255,255,255,0.06)' },
  inputIcon: { width: 24, height: 24, borderRadius: 8, backgroundColor: 'rgba(243,192,139,0.12)', justifyContent: 'center', alignItems: 'center', marginTop: 1 },
  input: { flex: 1, color: '#FFFBF0', fontSize: 13, minHeight: 22, padding: 0 },
  textArea: { minHeight: 70, textAlignVertical: 'top' },
  uploadRow: { flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: '#141121', borderRadius: 14, padding: 12, borderWidth: 1, borderColor: 'rgba(255,255,255,0.06)' },
  uploadIcon: { width: 24, height: 24, borderRadius: 8, backgroundColor: 'rgba(243,192,139,0.12)', justifyContent: 'center', alignItems: 'center' },
  uploadBody: { flex: 1 },
  uploadLabel: { color: '#FFFBF0', fontSize: 13, fontWeight: '700' },
  uploadValue: { color: 'rgba(255,251,240,0.55)', fontSize: 11, marginTop: 2 },
  noteCard: { flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: 'rgba(230,126,34,0.08)', borderRadius: 16, padding: 12, borderWidth: 1, borderColor: 'rgba(230,126,34,0.14)' },
  noteText: { flex: 1, color: 'rgba(255,251,240,0.72)', lineHeight: 18, fontSize: 12 },
  saveBtn: { borderRadius: 16, overflow: 'hidden', marginTop: 4 },
  saveBtnGradient: { paddingVertical: 14, alignItems: 'center' },
  saveBtnText: { color: '#fff', fontWeight: '900', fontSize: 13 },
  inputLocked: { opacity: 0.85 },
  regionValue: { flex: 1, color: '#FFFBF0', fontSize: 13, fontWeight: '600' },
  regionPlaceholder: { color: 'rgba(255,255,255,0.35)', fontWeight: '400' },
  regionOverlay: { ...StyleSheet.absoluteFillObject, justifyContent: 'flex-end', zIndex: 20 },
  regionBackdrop: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.55)' },
  regionSheet: { backgroundColor: '#1b1726', borderTopLeftRadius: 22, borderTopRightRadius: 22, padding: 16, paddingBottom: 28, borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)', maxHeight: '55%' },
  regionSheetTitle: { color: '#FFFBF0', fontSize: 16, fontWeight: '800', marginBottom: 12 },
  regionOption: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 12, paddingHorizontal: 12, borderRadius: 12 },
  regionOptionActive: { backgroundColor: 'rgba(230,126,34,0.12)' },
  regionOptionText: { color: 'rgba(255,251,240,0.85)', fontSize: 14, fontWeight: '600' },
  regionOptionTextActive: { color: colors.primary },
});
