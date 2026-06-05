import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable, Image, Dimensions, TouchableOpacity } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation, useRoute } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { Photographer } from '../api';
import { formatImageUrl } from '../../../shared/utils/formatImageUrl';
import PortfolioImageCell from '../../../shared/components/PortfolioImageCell';
import Animated, { FadeInDown } from 'react-native-reanimated';


const THEME = {
  primary: '#fff7e1',
  accent: '#1a1a0f',
  orange: '#ff4200',
  danger: '#ef4444',
  success: '#2d6a4f',
  info: '#1d3557',
};

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

const previewText = (text: string, max = 120) => {
  const clean = text.trim().replace(/\s+/g, ' ');
  if (clean.length <= max) return clean;
  return `${clean.slice(0, max - 1).trimEnd()}…`;
};

export default function PhotographerServicePackagesScreen() {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const insets = useSafeAreaInsets();
  const { photographer, packages, matchId } = route.params as { photographer: Photographer; packages: any[]; matchId?: string };
  
  const [expandedId, setExpandedId] = useState<string | null>(null);

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <Pressable onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color={THEME.accent} />
        </Pressable>
        <Text style={styles.headerTitle}>Gói Dịch Vụ</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {packages.map((item, i) => {
          const parsed = splitDescriptionSections(item.description || '');
          const tags = splitTags(parsed.tags);
          const isExpanded = expandedId === item.id;
          const featureLines = parsed.features.split('\n').map(l => l.trim().replace(/^- /, '')).filter(Boolean);
          const requirementLines = parsed.requirements.split('\n').map(l => l.trim().replace(/^- /, '')).filter(Boolean);
          
          return (
            <Animated.View key={item.id} entering={FadeInDown.duration(400).delay(i * 100)} style={styles.cardWrapper}>
              <View style={styles.card}>
                <TouchableOpacity onPress={() => setExpandedId(isExpanded ? null : item.id)} activeOpacity={0.9}>
                  {/* ── Cover Image ── */}
                  <View style={styles.cardCover}>
                    {item.media && item.media.length > 0 ? (
                      <Image source={{ uri: formatImageUrl(item.media[0].imageUrl) }} style={StyleSheet.absoluteFillObject} resizeMode="cover" />
                    ) : (
                      <View style={[StyleSheet.absoluteFillObject, { backgroundColor: 'rgba(26,26,15,0.05)', justifyContent: 'center', alignItems: 'center' }]}>
                        <Ionicons name="images-outline" size={48} color="rgba(26,26,15,0.2)" />
                      </View>
                    )}
                    <LinearGradient
                      colors={['rgba(0,0,0,0.1)', 'transparent', 'rgba(0,0,0,0.85)']}
                      locations={[0, 0.4, 1]}
                      style={StyleSheet.absoluteFillObject}
                    />
                    
                    <View style={styles.cardCoverContent}>
                      <View style={styles.cardPricePill}>
                        <Text style={styles.cardPriceText}>{item.price.toLocaleString('vi-VN')} đ</Text>
                        <Text style={styles.cardPriceSep}>/</Text>
                        <Text style={styles.cardPriceDuration}>{item.durationHours}h</Text>
                      </View>
                      <Text style={styles.cardCoverTitle}>{item.title}</Text>
                    </View>
                  </View>

                  {/* ── Body ── */}
                  <View style={styles.cardBody}>
                    {tags.length > 0 && (
                      <View style={styles.cardTagRow}>
                        {tags.map((tag, i) => (
                          <View key={i} style={styles.cardTag}>
                            <Text style={styles.cardTagText}>#{tag}</Text>
                          </View>
                        ))}
                      </View>
                    )}

                    <View style={styles.metaRow}>
                      <View style={styles.metaChip}>
                        <Ionicons name="time-outline" size={13} color={THEME.accent} />
                        <Text style={styles.metaChipText}>{item.durationHours} giờ</Text>
                      </View>
                      <View style={styles.metaChip}>
                        <Ionicons name="images-outline" size={13} color={THEME.accent} />
                        <Text style={styles.metaChipText}>{item.media?.length || 0} ảnh</Text>
                      </View>
                      {!!parsed.features && (
                        <View style={styles.metaChip}>
                          <Ionicons name="checkmark-circle-outline" size={13} color={THEME.success} />
                          <Text style={[styles.metaChipText, { color: THEME.success }]}>Features</Text>
                        </View>
                      )}
                    </View>

                    {/* ── COLLAPSED ── */}
                    {!isExpanded && (
                      <>
                        {!!parsed.description && (
                          <Text style={styles.cardDesc} numberOfLines={2}>
                            {previewText(parsed.description, 110)}
                          </Text>
                        )}
                        {item.media && item.media.length > 1 && (
                          <View style={styles.thumbStrip}>
                            {item.media.slice(1, 5).map((media: any, mi: number) => (
                              <PortfolioImageCell
                                key={media.id ?? mi}
                                uri={media.imageUrl}
                                borderRadius={10}
                                style={styles.thumbStripItem}
                                resizeMode="cover"
                              />
                            ))}
                            {item.media.length > 5 && (
                              <View style={styles.thumbStripMore}>
                                <Text style={styles.thumbStripMoreText}>+{item.media.length - 5}</Text>
                              </View>
                            )}
                          </View>
                        )}
                      </>
                    )}

                    {/* ── EXPANDED ── */}
                    {isExpanded && (
                      <>
                        {!!parsed.description && (
                          <View style={styles.detailSection}>
                            <View style={styles.detailSectionHeader}>
                              <Ionicons name="document-text-outline" size={14} color={THEME.accent} />
                              <Text style={styles.detailSectionTitle}>Mô tả chi tiết</Text>
                            </View>
                            <Text style={styles.detailSectionBody}>{parsed.description.trim()}</Text>
                          </View>
                        )}
                        {featureLines.length > 0 && (
                          <View style={styles.detailSection}>
                            <View style={styles.detailSectionHeader}>
                              <Ionicons name="sparkles-outline" size={14} color={THEME.success} />
                              <Text style={[styles.detailSectionTitle, { color: THEME.success }]}>Features</Text>
                            </View>
                            <View style={styles.featureList}>
                              {featureLines.map((line, li) => (
                                <View key={li} style={styles.featureItem}>
                                  <Ionicons name="checkmark-circle" size={14} color={THEME.success} />
                                  <Text style={styles.featureItemText}>{line}</Text>
                                </View>
                              ))}
                            </View>
                          </View>
                        )}
                        {requirementLines.length > 0 && (
                          <View style={styles.detailSection}>
                            <View style={styles.detailSectionHeader}>
                              <Ionicons name="clipboard-outline" size={14} color={THEME.info} />
                              <Text style={[styles.detailSectionTitle, { color: THEME.info }]}>Yêu cầu buổi chụp</Text>
                            </View>
                            <View style={styles.featureList}>
                              {requirementLines.map((line, li) => (
                                <View key={li} style={styles.featureItem}>
                                  <Ionicons name="ellipse" size={6} color={THEME.info} style={{ marginTop: 5 }} />
                                  <Text style={[styles.featureItemText, { color: 'rgba(26,26,15,0.6)' }]}>{line}</Text>
                                </View>
                              ))}
                            </View>
                          </View>
                        )}
                        {item.media && item.media.length > 0 && (
                          <View style={styles.detailSection}>
                            <View style={styles.detailSectionHeader}>
                              <Ionicons name="images-outline" size={14} color={THEME.accent} />
                              <Text style={styles.detailSectionTitle}>Ảnh mẫu ({item.media.length})</Text>
                            </View>
                            <View style={styles.expandedPhotoGrid}>
                              {item.media.map((media: any, mi: number) => (
                                <PortfolioImageCell
                                  key={media.id ?? mi}
                                  uri={media.imageUrl}
                                  borderRadius={10}
                                  style={styles.expandedPhotoItem}
                                  resizeMode="cover"
                                />
                              ))}
                            </View>
                          </View>
                        )}
                        
                        <Pressable 
                          style={styles.bookBtnExpanded} 
                          onPress={() => navigation.navigate('Checkout', { photographer, packages, packageId: item.id, matchId })}
                        >
                          <Text style={styles.bookBtnExpandedText}>Đặt Gói Này</Text>
                          <Ionicons name="arrow-forward" size={18} color="#fff" />
                        </Pressable>
                      </>
                    )}

                    {/* Toggle Indicator */}
                    <View style={styles.toggleIndicator}>
                      <Ionicons name={isExpanded ? 'chevron-up' : 'chevron-down'} size={20} color="rgba(26,26,15,0.4)" />
                    </View>
                  </View>
                </TouchableOpacity>
              </View>
              
              {/* Floating Book Button for Collapsed State */}
              {!isExpanded && (
                <View style={styles.floatingBookBtnContainer}>
                  <Pressable 
                    style={styles.floatingBookBtn}
                    onPress={() => navigation.navigate('Checkout', { photographer, packages, packageId: item.id, matchId })}
                  >
                    <Text style={styles.floatingBookBtnText}>Đặt Ngay</Text>
                  </Pressable>
                </View>
              )}
            </Animated.View>
          );
        })}
        {packages.length === 0 && (
          <Text style={{ textAlign: 'center', color: 'rgba(26,26,15,0.5)', marginTop: 40 }}>Chưa có gói dịch vụ nào.</Text>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: THEME.primary },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: 'rgba(26,26,15,0.05)' },
  backBtn: { padding: 8, marginLeft: -8 },
  headerTitle: { fontSize: 18, fontWeight: '800', color: THEME.accent },
  scrollContent: { padding: 16, gap: 16, paddingBottom: 40 },
  
  cardWrapper: { marginBottom: 4 },
  card: {
    backgroundColor: '#fffaf4',
    borderRadius: 24,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(26,26,15,0.09)',
    shadowColor: '#b8a98a',
    shadowOpacity: 0.22,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 10 },
    elevation: 5,
  },
  cardCover: { position: 'relative', height: 200 },
  cardCoverContent: {
    position: 'absolute',
    bottom: 14,
    left: 14,
    right: 14,
    gap: 6,
  },
  cardCoverTitle: {
    color: '#fffaf4',
    fontSize: 20,
    fontWeight: '900',
    letterSpacing: 0.2,
    lineHeight: 26,
    textShadowColor: 'rgba(0,0,0,0.4)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 4,
  },
  cardPricePill: {
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
  cardPriceText: { color: '#fffaf4', fontSize: 13, fontWeight: '900', letterSpacing: 0.2 },
  cardPriceSep: { color: 'rgba(255,247,225,0.5)', fontSize: 11, marginHorizontal: 1 },
  cardPriceDuration: { color: 'rgba(255,247,225,0.8)', fontSize: 12, fontWeight: '600' },

  cardBody: { padding: 16, gap: 12 },
  cardDesc: { color: 'rgba(26,26,15,0.7)', lineHeight: 21, fontSize: 13.5 },

  cardTagRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  cardTag: {
    backgroundColor: 'rgba(207,64,40,0.07)',
    borderWidth: 1,
    borderColor: 'rgba(207,64,40,0.14)',
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: 8,
  },
  cardTagText: { color: THEME.accent, fontSize: 11.5, fontWeight: '700' },

  metaRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  metaChip: {
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
  metaChipText: { color: THEME.accent, fontSize: 11.5, fontWeight: '600' },

  thumbStrip: { flexDirection: 'row', gap: 6 },
  thumbStripItem: { width: 60, height: 60, borderRadius: 10 },
  thumbStripMore: {
    width: 60,
    height: 60,
    borderRadius: 10,
    backgroundColor: 'rgba(26,26,15,0.08)',
    borderWidth: 1,
    borderColor: 'rgba(26,26,15,0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  thumbStripMoreText: { color: 'rgba(26,26,15,0.6)', fontSize: 13, fontWeight: '800' },

  detailSection: {
    gap: 8,
    paddingTop: 4,
    borderTopWidth: 1,
    borderTopColor: 'rgba(26,26,15,0.06)',
  },
  detailSectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  detailSectionTitle: {
    color: THEME.accent,
    fontSize: 12.5,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  detailSectionBody: {
    color: 'rgba(26,26,15,0.7)',
    fontSize: 13.5,
    lineHeight: 21,
  },

  featureList: { gap: 6 },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
  },
  featureItemText: {
    flex: 1,
    color: THEME.accent,
    fontSize: 13.5,
    lineHeight: 20,
  },

  expandedPhotoGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  expandedPhotoItem: { width: 80, height: 80, borderRadius: 10 },

  toggleIndicator: { alignItems: 'center', paddingTop: 4 },

  bookBtnExpanded: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: THEME.orange,
    paddingVertical: 14,
    borderRadius: 16,
    marginTop: 12,
    gap: 8,
  },
  bookBtnExpandedText: { color: '#fff', fontSize: 15, fontWeight: '800' },
  
  floatingBookBtnContainer: {
    position: 'absolute',
    bottom: 24,
    right: -4,
  },
  floatingBookBtn: {
    backgroundColor: THEME.orange,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderTopLeftRadius: 16,
    borderBottomLeftRadius: 16,
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 4,
    elevation: 4,
  },
  floatingBookBtnText: { color: '#fff', fontSize: 13, fontWeight: '800' },
});
