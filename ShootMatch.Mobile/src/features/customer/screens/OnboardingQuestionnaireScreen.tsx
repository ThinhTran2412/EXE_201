import React, { useState, useEffect, useRef } from 'react';
import {
  StyleSheet, Text, View, Pressable, ScrollView,
  TextInput, Dimensions, ActivityIndicator, Alert, BackHandler, Image, Platform, PanResponder,
  Animated as RNAnimated
} from 'react-native';
import Animated, {
  FadeInRight, FadeOutLeft, useSharedValue,
  useAnimatedStyle, withTiming, withRepeat, withDelay, withSpring
} from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useNavigation } from '@react-navigation/native';
import { colors } from '../../../app/theme/colors';
import { fontSizes, fontWeights } from '../../../app/theme/typography';
import { spacing } from '../../../app/theme/spacing';
import { updateCustomerProfile, getActiveStylesAndConceptsForLookbook } from '../api';
import { useAuth } from '../../auth/AuthContext';
import { localPicture } from '../../../shared/assets/localPictures';

const { width, height } = Dimensions.get('window');

// ── Visual Styles & Concepts ─────────────────────────────────────────────────
const FASHION_STYLES_DEFAULT = [
  { id: 'vintage', label: 'Vintage', imgIndex: 0, tag: 'Hoài cổ' },
  { id: 'minimalist', label: 'Classic', imgIndex: 2, tag: 'Tối giản' },
  { id: 'streetwear', label: 'Streetwear', imgIndex: 6, tag: 'Cá tính' },
  { id: 'editorial', label: 'Editorial', imgIndex: 10, tag: 'Tạp chí' },
  { id: 'romantic', label: 'Romantic', imgIndex: 15, tag: 'Bay bổng' },
  { id: 'y2k', label: 'Y2K Retro', imgIndex: 5, tag: 'Hoài niệm' },
  { id: 'darkwear', label: 'Darkwear', imgIndex: 18, tag: 'Bí ẩn' },
  { id: 'preppy', label: 'Preppy', imgIndex: 11, tag: 'Học đường' },
  { id: 'boho', label: 'Bohemian', imgIndex: 14, tag: 'Tự do' },
  { id: 'highfashion', label: 'High Fashion', imgIndex: 26, tag: 'Sang trọng' },
];

const PHOTO_CONCEPTS_DEFAULT = [
  { id: 'film', label: 'Vintage Film', shortLabel: 'Vintage Film', imgIndex: 7, hud: 'RAW 12-BIT', focal: '18mm', desc: 'Màu ảnh phim cuộn hoài cổ với hạt nhiễu grain ấm áp và tương phản dịu nhẹ.' },
  { id: 'cyberpunk', label: 'Cyberpunk', shortLabel: 'Cyberpunk', imgIndex: 22, hud: 'NEON WASH', focal: '24mm', desc: 'Ánh sáng neon tương phản mạnh giữa sắc tím và xanh dương đậm chất tương lai.' },
  { id: 'night', label: 'City Lights Night', shortLabel: 'City Lights', imgIndex: 25, hud: '1/60s F/1.2', focal: '35mm', desc: 'Góc chụp đường phố ban đêm với hiệu ứng bokeh lung linh từ ánh đèn thành phố.' },
  { id: 'portrait', label: 'Studio Portrait', shortLabel: 'Studio Port', imgIndex: 13, hud: 'F/1.4 85mm', focal: '50mm', desc: 'Chân dung studio chuyên nghiệp với ánh sáng tản mềm tập trung vào chủ thể.' },
  { id: 'digital', label: 'Sharp Digital', shortLabel: 'Sharp Dig', imgIndex: 8, hud: 'ISO 200', focal: '85mm', desc: 'Độ sắc nét kỹ thuật số cực cao, tái tạo chi tiết chân thực của màu da và trang phục.' },
  { id: 'noir', label: 'Black & White Noir', shortLabel: 'B&W Noir', imgIndex: 30, hud: 'MONO HC', focal: '105mm', desc: 'Ảnh đen trắng độ tương phản cao mang đậm tính nghệ thuật và chiều sâu tự sự.' },
  { id: 'outdoor', label: 'Outdoor Nature', shortLabel: 'Outdoor Nat', imgIndex: 20, hud: 'EV +0.7', focal: '135mm', desc: 'Chụp ngoại cảnh tự nhiên với ánh sáng mặt trời dịu nhẹ và màu xanh mướt mát.' },
  { id: 'fairy', label: 'Fairy Tale Soft', shortLabel: 'Fairy Tale', imgIndex: 34, hud: 'SOFT MIST', focal: '200mm', desc: 'Phong cách mộng mơ với lớp sương mờ dịu mắt và tông màu pastel huyền ảo.' },
];

const COLOR_PALETTES = [
  { id: 'warm', label: 'Warm Tone', colors: ['rgba(245, 158, 11, 0.35)', 'rgba(217, 119, 6, 0.35)'], rawColors: ['#f59e0b', '#d97706'], desc: 'Ấm áp, thơ mộng', imgIndex: 20 },
  { id: 'cool', label: 'Cool Tone', colors: ['rgba(59, 130, 246, 0.35)', 'rgba(29, 78, 216, 0.35)'], rawColors: ['#3b82f6', '#1d4ed8'], desc: 'Lạnh lùng, chiều sâu', imgIndex: 25 },
  { id: 'bright', label: 'Pastel Tone', colors: ['rgba(244, 114, 182, 0.35)', 'rgba(219, 39, 119, 0.35)'], rawColors: ['#f472b6', '#db2777'], desc: 'Tươi sáng, năng động', imgIndex: 34 },
  { id: 'mono', label: 'Monochrome', colors: ['rgba(75, 85, 99, 0.35)', 'rgba(31, 41, 55, 0.35)'], rawColors: ['#4b5563', '#1f2937'], desc: 'Đen trắng cổ điển', imgIndex: 30 },
  { id: 'earthy', label: 'Earthy Olive', colors: ['rgba(133, 77, 14, 0.35)', 'rgba(63, 98, 18, 0.35)'], rawColors: ['#854d0e', '#3f6212'], desc: 'Mộc mạc, tự nhiên', imgIndex: 7 },
  { id: 'cyber', label: 'Neon Cyber', colors: ['rgba(162, 28, 175, 0.35)', 'rgba(99, 102, 241, 0.35)'], rawColors: ['#a21caf', '#6366f1'], desc: 'Hiện đại, phá cách', imgIndex: 22 },
];

const LOC_COLUMN_1 = [
  { id: 'cafe', label: 'Quán Cafe/Trà', icon: 'cafe-outline' },
  { id: 'studio', label: 'Studio Chuyên Nghiệp', icon: 'camera-outline' },
  { id: 'home', label: 'Căn Hộ/Nhà Ở', icon: 'home-outline' },
  { id: 'museum', label: 'Bảo Tàng/Triển Lãm', icon: 'color-palette-outline' },
];

const LOC_COLUMN_2 = [
  { id: 'park', label: 'Công Viên/Rừng', icon: 'leaf-outline' },
  { id: 'urban', label: 'Đường Phố/Urban', icon: 'business-outline' },
  { id: 'beach', label: 'Bãi Biển/Sông Hồ', icon: 'water-outline' },
  { id: 'rooftop', label: 'Sân Thượng/Rooftop', icon: 'sunny-outline' },
];

const LOC_COLUMN_3 = [
  { id: 'landmark', label: 'Landmark/Cầu', icon: 'ribbon-outline' },
  { id: 'historical', label: 'Phố Cổ/Di Tích', icon: 'trail-sign-outline' },
  { id: 'abandoned', label: 'Nhà Hoang/Nhà Máy', icon: 'construct-outline' },
  { id: 'westlake', label: 'Hồ Tây/Sunset', icon: 'time-outline' },
];

const LOCATIONS = [...LOC_COLUMN_1, ...LOC_COLUMN_2, ...LOC_COLUMN_3];

const REGIONS = [
  { code: 'HN', name: 'Hà Nội' },
  { code: 'HCM', name: 'TP. Hồ Chí Minh' },
  { code: 'DN', name: 'Đà Nẵng' },
];

const DIAL_ITEM_WIDTH = 90;
const SPACER_WIDTH = (width - 48 - DIAL_ITEM_WIDTH) / 2;

export default function OnboardingQuestionnaireScreen() {
  const navigation = useNavigation<any>();
  const { session } = useAuth();
  const [step, setStep] = useState(0); // 0: Welcome, 1: Fashion, 2: Concept, 3: Colors & Location, 4: Region & Artist
  const [loading, setLoading] = useState(false);

  // Selections
  const [selectedFashion, setSelectedFashion] = useState<string[]>([]);
  const [selectedConcepts, setSelectedConcepts] = useState<string[]>([]);
  const [selectedColors, setSelectedColors] = useState<string[]>([]);
  const [selectedLocations, setSelectedLocations] = useState<string[]>([]);
  const [selectedRegion, setSelectedRegion] = useState('HN');
  const [favoriteArtist, setFavoriteArtist] = useState('');
  const [activeConceptIndex, setActiveConceptIndex] = useState(0);
  // Active color palette for dynamic preview cover card
  const activePaletteId = selectedColors[selectedColors.length - 1] || 'warm';
  const activePalette = COLOR_PALETTES.find(p => p.id === activePaletteId) || COLOR_PALETTES[0];

  // Tinder Swipe deck state for Step 3
  const [swipeIndex, setSwipeIndex] = useState(0);
  const swipePan = useRef(new RNAnimated.ValueXY()).current;
  
  // Location vertical dial picker state
  const [pickerScrolling, setPickerScrolling] = useState(false);

  const isSwipingActive = (step === 3 && swipeIndex < COLOR_PALETTES.length) || pickerScrolling;

  const handleSwipeDecision = (liked: boolean) => {
    const currentPalette = COLOR_PALETTES[swipeIndex];
    if (currentPalette) {
      if (liked) {
        setSelectedColors(prev => {
          if (prev.includes(currentPalette.id)) return prev;
          return [...prev, currentPalette.id];
        });
      } else {
        setSelectedColors(prev => prev.filter(id => id !== currentPalette.id));
      }
    }
    
    // Move to next card
    swipePan.setValue({ x: 0, y: 0 });
    setSwipeIndex(prev => prev + 1);
  };

  const resetSwipeDeck = () => {
    setSelectedColors([]);
    setSwipeIndex(0);
    swipePan.setValue({ x: 0, y: 0 });
  };

  const swipePanResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => false,
      onStartShouldSetPanResponderCapture: () => false,
      onMoveShouldSetPanResponder: (e, gestureState) => {
        // Only respond if the drag is mainly horizontal and exceeds 10px threshold
        return Math.abs(gestureState.dx) > 10 && Math.abs(gestureState.dx) > Math.abs(gestureState.dy);
      },
      onMoveShouldSetPanResponderCapture: (e, gestureState) => {
        return Math.abs(gestureState.dx) > 10 && Math.abs(gestureState.dx) > Math.abs(gestureState.dy);
      },
      onPanResponderGrant: () => {
        // ScrollView is already locked statically while swiping is active
      },
      onPanResponderMove: RNAnimated.event(
        [null, { dx: swipePan.x, dy: swipePan.y }],
        { useNativeDriver: false }
      ),
      onPanResponderTerminationRequest: () => false, // STRICT LOCK: do not allow ScrollView to take over mid-gesture!
      onPanResponderRelease: (e, gestureState) => {
        if (gestureState.dx > 100) {
          // Swipe Right - Like
          RNAnimated.timing(swipePan, {
            toValue: { x: 500, y: gestureState.dy },
            duration: 200,
            useNativeDriver: false,
          }).start(() => {
            handleSwipeDecision(true);
          });
        } else if (gestureState.dx < -100) {
          // Swipe Left - Dislike
          RNAnimated.timing(swipePan, {
            toValue: { x: -500, y: gestureState.dy },
            duration: 200,
            useNativeDriver: false,
          }).start(() => {
            handleSwipeDecision(false);
          });
        } else {
          // Spring back
          RNAnimated.spring(swipePan, {
            toValue: { x: 0, y: 0 },
            friction: 4,
            useNativeDriver: false,
          }).start();
        }
      },
      onPanResponderTerminate: () => {
        RNAnimated.spring(swipePan, {
          toValue: { x: 0, y: 0 },
          friction: 4,
          useNativeDriver: false,
        }).start();
      },
    })
  ).current;

  // Interpolations for Tinder Swipe Card
  const likeOpacity = swipePan.x.interpolate({
    inputRange: [0, 80],
    outputRange: [0, 1],
    extrapolate: 'clamp',
  });

  const nopeOpacity = swipePan.x.interpolate({
    inputRange: [-80, 0],
    outputRange: [1, 0],
    extrapolate: 'clamp',
  });

  const cardRotate = swipePan.x.interpolate({
    inputRange: [-200, 200],
    outputRange: ['-10deg', '10deg'],
    extrapolate: 'clamp',
  });


  // Dynamic lists from backend
  const [fashionList, setFashionList] = useState<any[]>(FASHION_STYLES_DEFAULT);
  const [conceptsList, setConceptsList] = useState<any[]>(PHOTO_CONCEPTS_DEFAULT);

  // Fetch taxonomy from backend
  useEffect(() => {
    const fetchTaxonomy = async () => {
      try {
        const apiData = await getActiveStylesAndConceptsForLookbook();
        if (apiData.styles && apiData.styles.length > 0) {
          const mappedStyles = apiData.styles.map((style, idx) => ({
            id: style.id,
            label: style.name,
            imgIndex: (idx * 3) % 35,
            tag: style.name
          }));
          setFashionList(mappedStyles);
        }
        if (apiData.concepts && apiData.concepts.length > 0) {
          const focalLengths = ['18mm', '24mm', '35mm', '50mm', '85mm', '105mm', '135mm', '200mm'];
          const imgIndexes = [7, 22, 25, 13, 8, 30, 20, 34];
          const huds = ['RAW 12-BIT', 'NEON WASH', '1/60s F/1.2', 'F/1.4 85mm', 'ISO 200', 'MONO HC', 'EV +0.7', 'SOFT MIST'];

          const mappedConcepts = apiData.concepts.map((concept, idx) => {
            const focal = focalLengths[idx % focalLengths.length];
            const imgIndex = imgIndexes[idx % imgIndexes.length];
            const hud = huds[idx % huds.length];
            let shortLabel = concept.name;
            if (shortLabel.length > 11) {
              shortLabel = shortLabel.substring(0, 10) + '.';
            }
            return {
              id: concept.id,
              label: concept.name,
              shortLabel,
              imgIndex,
              hud,
              focal,
              desc: concept.description || 'Mô tả phong cách ảnh chuyên nghiệp cho các buổi chụp.'
            };
          });
          setConceptsList(mappedConcepts);
        }
      } catch (err) {
        console.warn('Error fetching onboarding taxonomy:', err);
      }
    };
    fetchTaxonomy();
  }, []);

  const lensScrollRef = useRef<ScrollView>(null);

  // Swipe gesture detector for camera viewfinder (with auto scroll sync)
  const panResponder = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (evt, gestureState) => {
        return Math.abs(gestureState.dx) > 15 && Math.abs(gestureState.dy) < 30;
      },
      onPanResponderRelease: (evt, gestureState) => {
        if (gestureState.dx > 35) {
          // Swipe Right -> previous
          setActiveConceptIndex((prev) => {
            const nextIndex = prev > 0 ? prev - 1 : conceptsList.length - 1;
            lensScrollRef.current?.scrollTo({ x: nextIndex * DIAL_ITEM_WIDTH, animated: true });
            return nextIndex;
          });
        } else if (gestureState.dx < -35) {
          // Swipe Left -> next
          setActiveConceptIndex((prev) => {
            const nextIndex = prev < conceptsList.length - 1 ? prev + 1 : 0;
            lensScrollRef.current?.scrollTo({ x: nextIndex * DIAL_ITEM_WIDTH, animated: true });
            return nextIndex;
          });
        }
      },
    })
  ).current;

  // Scroll offset listener for lens scroll wheel
  const onLensScroll = (event: any) => {
    const offsetX = event.nativeEvent.contentOffset.x;
    const index = Math.round(offsetX / DIAL_ITEM_WIDTH);
    if (index >= 0 && index < conceptsList.length) {
      if (index !== activeConceptIndex) {
        setActiveConceptIndex(index);
      }
    }
  };

  // Reanimated welcome values
  const card1Rot = useSharedValue(-8);
  const card2Rot = useSharedValue(6);
  const card3Rot = useSharedValue(2);

  useEffect(() => {
    if (step === 0) {
      card1Rot.value = withDelay(300, withSpring(-10));
      card2Rot.value = withDelay(450, withSpring(6));
      card3Rot.value = withDelay(600, withSpring(0));
    }
  }, [step]);

  // Disable physical back action
  useEffect(() => {
    const backAction = () => {
      if (step > 0) {
        setStep(step - 1);
      } else {
        Alert.alert('Thoát', 'Vui lòng hoàn thiện khảo sát sở thích.', [
          { text: 'Tiếp tục', style: 'cancel' }
        ]);
      }
      return true;
    };
    const backHandler = BackHandler.addEventListener('hardwareBackPress', backAction);
    return () => backHandler.remove();
  }, [step]);

  const toggleSelection = (id: string, list: string[], setList: React.Dispatch<React.SetStateAction<string[]>>) => {
    if (list.includes(id)) {
      setList(list.filter(item => item !== id));
    } else {
      setList([...list, id]);
    }
  };

  const handleNext = () => {
    if (step < 4) {
      setStep(step + 1);
    } else {
      submitPreferences();
    }
  };

  const handleBack = () => {
    if (step > 0) setStep(step - 1);
  };

  const submitPreferences = async () => {
    setLoading(true);
    try {
      const preferences = {
        fashion: selectedFashion,
        concepts: selectedConcepts,
        colors: selectedColors,
        locations: selectedLocations,
        region: selectedRegion,
        artists: favoriteArtist.trim()
      };

      await updateCustomerProfile({
        preferredStyles: JSON.stringify(preferences),
        region: selectedRegion,
      });

      if (session?.userId) {
        await AsyncStorage.setItem(`needs_walkthrough_${session.userId}`, 'true');
      }

      navigation.reset({
        index: 0,
        routes: [{ name: 'CustomerRoot' }]
      });
    } catch (e) {
      Alert.alert('Lỗi', 'Không thể lưu sở thích. Vui lòng thử lại.');
      console.warn(e);
    } finally {
      setLoading(false);
    }
  };

  const handleSkip = async () => {
    setLoading(true);
    try {
      await updateCustomerProfile({
        preferredStyles: 'Portrait, Golden hour, Film look, Lifestyle, Editorial',
        region: 'HN',
      });

      if (session?.userId) {
        await AsyncStorage.setItem(`needs_walkthrough_${session.userId}`, 'true');
      }

      navigation.reset({
        index: 0,
        routes: [{ name: 'CustomerRoot' }]
      });
    } catch (e) {
      Alert.alert('Lỗi', 'Không thể bỏ qua cá nhân hóa. Vui lòng thử lại.');
      console.warn(e);
    } finally {
      setLoading(false);
    }
  };

  // Reanimated style bindings
  const rCard1 = useAnimatedStyle(() => ({ transform: [{ rotate: `${card1Rot.value}deg` }] }));
  const rCard2 = useAnimatedStyle(() => ({ transform: [{ rotate: `${card2Rot.value}deg` }] }));
  const rCard3 = useAnimatedStyle(() => ({ transform: [{ rotate: `${card3Rot.value}deg` }] }));

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false} scrollEnabled={!isSwipingActive}>
        {/* Step 0: Welcome Screen with Polaroid Stack & 4 Slide Mount styled Cards */}
        {step === 0 && (
          <Animated.View entering={FadeInRight} exiting={FadeOutLeft} style={styles.welcomeSlide}>
            {/* Elegant Floating Photo Collage */}
            <View style={styles.collageContainer}>
              <Animated.View style={[styles.collagePhotoCard, styles.collageBackLeft, rCard1]}>
                <Image source={localPicture(6)} style={styles.collageImg} />
              </Animated.View>
              
              <Animated.View style={[styles.collagePhotoCard, styles.collageBackRight, rCard2]}>
                <Image source={localPicture(2)} style={styles.collageImg} />
              </Animated.View>

              <Animated.View style={[styles.collagePhotoCard, styles.collageCenter, rCard3]}>
                <Image source={localPicture(13)} style={styles.collageImg} />
                <View style={styles.collageMetaBadge}>
                  <Text style={styles.collageMetaText}>LOOKBOOK // VOL. 01</Text>
                </View>
              </Animated.View>
            </View>

            {/* Slide Card 1: Left Slide Mount, Right Text */}
            {/* Slide Card 1: Left Slide Mount, Right Text */}
            <View style={styles.layeredCard}>
              <View style={styles.slideContainer}>
                <Image source={localPicture(4)} style={styles.slideImage} />
              </View>
              <View style={styles.cardTextContent}>
                <Text style={styles.layeredCardTitle}>Cá nhân hóa phong cách</Text>
                <Text style={styles.layeredCardDesc}>Khám phá gu thời trang và tone màu phù hợp nhất với bản sắc riêng của bạn.</Text>
              </View>
            </View>

            {/* Slide Card 2: Right Slide Mount, Left Text */}
            <View style={[styles.layeredCard, { flexDirection: 'row-reverse' }]}>
              <View style={styles.slideContainer}>
                <Image source={localPicture(10)} style={styles.slideImage} />
              </View>
              <View style={[styles.cardTextContent, { paddingLeft: 0, paddingRight: 12 }]}>
                <Text style={styles.layeredCardTitle}>Tìm kiếm nhiếp ảnh gia</Text>
                <Text style={styles.layeredCardDesc}>Tìm kiếm những người cùng tần số nghệ thuật để thực hiện bộ ảnh hoàn hảo.</Text>
              </View>
            </View>

            {/* Slide Card 3: Left Slide Mount, Right Text */}
            <View style={styles.layeredCard}>
              <View style={styles.slideContainer}>
                <Image source={localPicture(15)} style={styles.slideImage} />
              </View>
              <View style={styles.cardTextContent}>
                <Text style={styles.layeredCardTitle}>Tương tác & Ghép đôi</Text>
                <Text style={styles.layeredCardDesc}>Lựa chọn nhiếp ảnh gia có phong cách tương đồng để trao đổi ý tưởng trực tiếp.</Text>
              </View>
            </View>

            {/* Slide Card 4: Right Slide Mount, Left Text */}
            <View style={[styles.layeredCard, { flexDirection: 'row-reverse' }]}>
              <View style={styles.slideContainer}>
                <Image source={localPicture(22)} style={styles.slideImage} />
              </View>
              <View style={[styles.cardTextContent, { paddingLeft: 0, paddingRight: 12 }]}>
                <Text style={styles.layeredCardTitle}>Lưu giữ khoảnh khắc</Text>
                <Text style={styles.layeredCardDesc}>Đặt lịch nhanh chóng, an toàn và lưu giữ các khung hình chất lượng cao.</Text>
              </View>
            </View>

            {/* Start button */}
            <Pressable style={styles.primaryButton} onPress={handleNext}>
              <Text style={styles.buttonText}>BẮT ĐẦU KHẢO SÁT</Text>
              <Ionicons name="arrow-forward" size={16} color="#fff" style={{ marginLeft: 8 }} />
            </Pressable>

            <Pressable style={styles.skipButton} onPress={handleSkip}>
              <Text style={styles.skipButtonText}>Bỏ qua cá nhân hóa</Text>
            </Pressable>
          </Animated.View>
        )}

        {/* Step 1: Fashion Style */}
        {step === 1 && (
          <Animated.View entering={FadeInRight} exiting={FadeOutLeft} style={styles.slide}>
            <View style={styles.stepHeader}>
              <Ionicons name="shirt-outline" size={20} color="#ff4200" />
              <Text style={styles.stepTitle}>GU THỜI TRANG CỦA BẠN?</Text>
            </View>
            <Text style={styles.stepSub}>Chọn phong cách phối đồ yêu thích cho album ảnh.</Text>
            
            <View style={styles.gridContainer}>
              {fashionList.map((style) => {
                const isSelected = selectedFashion.includes(style.id);
                return (
                  <Pressable
                    key={style.id}
                    style={[styles.photoCard, isSelected && styles.photoCardSelected]}
                    onPress={() => toggleSelection(style.id, selectedFashion, setSelectedFashion)}
                  >
                    <View style={styles.cardImageContainer}>
                      <Image source={localPicture(style.imgIndex)} style={styles.cardImage} />
                    </View>
                    <View style={styles.cardTextContainer}>
                      <Text style={styles.cardTag}>{style.tag}</Text>
                      <Text style={styles.cardLabel}>{style.label}</Text>
                    </View>
                    {isSelected && (
                      <View style={styles.selectedBadgeCorner}>
                        <Ionicons name="checkmark-circle" size={14} color="#ff4200" />
                      </View>
                    )}
                  </Pressable>
                );
              })}
            </View>
          </Animated.View>
        )}

        {/* Step 2: Camera Lens Focus Selector */}
        {step === 2 && (
          <Animated.View entering={FadeInRight} exiting={FadeOutLeft} style={styles.slide}>
            <View style={styles.stepHeader}>
              <Ionicons name="camera-outline" size={20} color="#ff4200" />
              <Text style={styles.stepTitle}>ĐIỀU CHỈNH TIÊU CỰ LENS</Text>
            </View>
            <Text style={styles.stepSub}>Xoay vòng tiêu cự để chọn concept hình ảnh mong muốn.</Text>
            
            {/* Viewfinder Focus Screen */}
            <View style={styles.viewfinderScreen} {...panResponder.panHandlers}>
              <Image 
                source={localPicture(conceptsList[activeConceptIndex]?.imgIndex ?? 7)} 
                style={styles.viewfinderImage} 
              />
              
              <LinearGradient
                colors={['transparent', 'rgba(0,0,0,0.5)']}
                style={StyleSheet.absoluteFillObject}
              />
              
              {/* DSLR focus indicator box overlay */}
              <View style={[
                styles.focusReticle, 
                selectedConcepts.includes(conceptsList[activeConceptIndex]?.id) && styles.focusReticleLocked
              ]}>
                <View style={styles.focusCenterDot} />
              </View>
 
              {/* Viewfinder metadata */}
              <View style={styles.viewfinderHeader}>
                <Text style={styles.viewfinderMetaText}>REC ●</Text>
                <Text style={styles.viewfinderMetaText}>F/2.8</Text>
              </View>
 
              <View style={styles.viewfinderFooter}>
                <Text style={styles.viewfinderMetaText}>{conceptsList[activeConceptIndex]?.hud}</Text>
                <Text style={[
                  styles.focusStatusText,
                  selectedConcepts.includes(conceptsList[activeConceptIndex]?.id) && styles.focusStatusLocked
                ]}>
                  {selectedConcepts.includes(conceptsList[activeConceptIndex]?.id) ? 'FOCUS LOCKED' : 'SEARCHING...'}
                </Text>
              </View>
            </View>
 
            {/* Lens Focal Barrel (Horizontal Concept Dial with Center Needle) */}
            <View style={styles.lensBarrelContainer}>
              {/* Center Needle Indicator */}
              <View style={styles.needlePointer}>
                <Ionicons name="caret-down" size={16} color="#ff4200" />
              </View>
 
              <View style={styles.lensBarrel}>
                <ScrollView 
                  ref={lensScrollRef}
                  horizontal 
                  showsHorizontalScrollIndicator={false}
                  snapToInterval={DIAL_ITEM_WIDTH}
                  snapToAlignment="center"
                  decelerationRate="fast"
                  scrollEventThrottle={16}
                  onScroll={onLensScroll}
                  contentContainerStyle={[
                    styles.lensBarrelScroll,
                    { paddingHorizontal: SPACER_WIDTH }
                  ]}
                >
                  {conceptsList.map((concept, index) => {
                    const isActive = index === activeConceptIndex;
                    const isSaved = selectedConcepts.includes(concept.id);
                    return (
                      <Pressable
                        key={concept.id}
                        onPress={() => {
                          setActiveConceptIndex(index);
                          lensScrollRef.current?.scrollTo({ x: index * DIAL_ITEM_WIDTH, animated: true });
                        }}
                        style={[
                          styles.focalMark,
                          { width: DIAL_ITEM_WIDTH },
                          isActive && styles.focalMarkActive,
                          isSaved && styles.focalMarkSaved
                        ]}
                      >
                        <Text style={[
                          styles.focalMarkText,
                          isActive && styles.focalMarkTextActive,
                          isSaved && styles.focalMarkTextSaved
                        ]}>
                          {concept.shortLabel}
                        </Text>
                        <View style={[
                          styles.focalTick,
                          isActive && styles.focalTickActive,
                          isSaved && styles.focalTickSaved
                        ]} />
                      </Pressable>
                    );
                  })}
                </ScrollView>
              </View>
            </View>
 
            {/* Concept Info Card (Description) */}
            <View style={styles.conceptInfoCard}>
              <View style={styles.conceptHeaderRow}>
                <Text style={styles.conceptNameText}>{conceptsList[activeConceptIndex]?.label}</Text>
                <View style={styles.conceptFocalBadge}>
                  <Text style={styles.conceptFocalBadgeText}>{conceptsList[activeConceptIndex]?.focal}</Text>
                </View>
              </View>
              <Text style={styles.conceptDescText}>{conceptsList[activeConceptIndex]?.desc}</Text>
              
              {/* Premium Technical Metadata Grid */}
              <View style={styles.conceptSpecsGrid}>
                <View style={styles.conceptSpecItem}>
                  <Text style={styles.conceptSpecLabel}>ÁNH SÁNG</Text>
                  <Text style={styles.conceptSpecValue}>
                    {activeConceptIndex % 3 === 0 ? 'Studio / Flash' : activeConceptIndex % 3 === 1 ? 'Golden Hour' : 'Natural Light'}
                  </Text>
                </View>
                <View style={styles.conceptSpecItem}>
                  <Text style={styles.conceptSpecLabel}>THỜI GIAN</Text>
                  <Text style={styles.conceptSpecValue}>
                    {activeConceptIndex % 2 === 0 ? 'Ban Ngày' : 'Ban Đêm / Chiều'}
                  </Text>
                </View>
                <View style={styles.conceptSpecItem}>
                  <Text style={styles.conceptSpecLabel}>MÔI TRƯỜNG</Text>
                  <Text style={styles.conceptSpecValue}>
                    {activeConceptIndex % 2 === 0 ? 'Ngoài Trời' : 'Trong Phòng / Studio'}
                  </Text>
                </View>
                <View style={styles.conceptSpecItem}>
                  <Text style={styles.conceptSpecLabel}>BỐ CỤC ĐỀ XUẤT</Text>
                  <Text style={styles.conceptSpecValue}>Chân dung / Đặc tả</Text>
                </View>
              </View>
            </View>
 
            {/* Camera Shutter Capture Trigger Button */}
            <View style={styles.shutterContainer}>
              <Pressable 
                style={[
                  styles.shutterButton,
                  selectedConcepts.includes(conceptsList[activeConceptIndex]?.id) && styles.shutterButtonActive
                ]}
                onPress={() => toggleSelection(conceptsList[activeConceptIndex]?.id, selectedConcepts, setSelectedConcepts)}
              >
                <View style={styles.shutterInnerCircle}>
                  <Ionicons 
                    name={selectedConcepts.includes(conceptsList[activeConceptIndex]?.id) ? "checkmark" : "camera"} 
                    size={22} 
                    color="#fff" 
                  />
                </View>
              </Pressable>
              <Text style={styles.shutterButtonLabel}>
                {selectedConcepts.includes(conceptsList[activeConceptIndex]?.id) ? 'BỎ CHỌN CONCEPT' : 'CHỤP LẠI CONCEPT'}
              </Text>
            </View>
 
            {/* Captured Concept List (Scroll down to see) */}
            {selectedConcepts.length > 0 && (
              <View style={styles.capturedListContainer}>
                <Text style={styles.capturedListTitle}>DANH SÁCH CONCEPT ĐÃ LƯU ({selectedConcepts.length})</Text>
                <View style={styles.capturedBadgesRow}>
                  {selectedConcepts.map((conceptId) => {
                    const conceptObj = conceptsList.find(c => c.id === conceptId);
                    if (!conceptObj) return null;
                    return (
                      <Pressable 
                        key={conceptId} 
                        style={styles.capturedBadge}
                        onPress={() => {
                          const idx = conceptsList.findIndex(c => c.id === conceptId);
                          if (idx !== -1) {
                            setActiveConceptIndex(idx);
                            lensScrollRef.current?.scrollTo({ x: idx * DIAL_ITEM_WIDTH, animated: true });
                          }
                        }}
                      >
                        <Ionicons name="camera" size={10} color="#ff4200" style={{ marginRight: 4 }} />
                        <Text style={styles.capturedBadgeText}>{conceptObj.label}</Text>
                        <Pressable 
                          onPress={() => toggleSelection(conceptId, selectedConcepts, setSelectedConcepts)}
                          style={{ marginLeft: 6 }}
                        >
                          <Ionicons name="close-circle" size={13} color="#8A8170" />
                        </Pressable>
                      </Pressable>
                    );
                  })}
                </View>
              </View>
            )}
          </Animated.View>
        )}

        {/* Step 3: Color Palette & Location with visual swatches */}
        {step === 3 && (
          <Animated.View entering={FadeInRight} exiting={FadeOutLeft} style={styles.slide}>
            <View style={styles.stepHeader}>
              <Ionicons name="color-palette-outline" size={20} color="#ff4200" />
              <Text style={styles.stepTitle}>MÀU SẮC & ĐỊA ĐIỂM YÊU THÍCH?</Text>
            </View>
            
            <Text style={styles.sectionHeader}>BẢN ĐỒ TÂM TRẠNG HÌNH ẢNH (QUẸT ĐỂ CHỌN MÀU)</Text>
            <Text style={styles.sectionSubText}>Quẹt PHẢI nếu bạn THÍCH phong cách ảnh/màu này, quẹt TRÁI nếu KHÔNG THÍCH. Hệ thống sẽ tự phân tích tông màu ưa thích của bạn.</Text>

            {swipeIndex < COLOR_PALETTES.length ? (
              <View style={styles.tinderWrapper}>
                {/* Underneath Card (Preview of next card) */}
                {swipeIndex + 1 < COLOR_PALETTES.length && (
                  <View style={styles.tinderCardBack}>
                    <Image 
                      source={localPicture(COLOR_PALETTES[swipeIndex + 1].imgIndex)} 
                      style={styles.tinderPhoto} 
                    />
                  </View>
                )}

                {/* Top Animated Swipable Card */}
                <RNAnimated.View
                  style={[
                    styles.tinderCardActive,
                    {
                      transform: [
                        { translateX: swipePan.x },
                        { translateY: swipePan.y },
                        { rotate: cardRotate }
                      ]
                    }
                  ]}
                  {...swipePanResponder.panHandlers}
                >
                  <Image 
                    source={localPicture(COLOR_PALETTES[swipeIndex].imgIndex)} 
                    style={styles.tinderPhoto} 
                  />
                  
                  {/* Dynamic tint overlay simulation */}
                  <LinearGradient
                    colors={COLOR_PALETTES[swipeIndex].colors as any}
                    style={StyleSheet.absoluteFillObject}
                  />

                  {/* Swipe stamps overlay */}
                  <RNAnimated.View style={[styles.swipeStamp, styles.swipeStampLike, { opacity: likeOpacity }]}>
                    <Text style={styles.swipeStampTextLike}>THÍCH</Text>
                  </RNAnimated.View>
                  <RNAnimated.View style={[styles.swipeStamp, styles.swipeStampNope, { opacity: nopeOpacity }]}>
                    <Text style={styles.swipeStampTextNope}>BỎ QUA</Text>
                  </RNAnimated.View>

                  {/* Aesthetic Camera HUD on top card */}
                  <View style={styles.cardBracketTL} />
                  <View style={styles.cardBracketTR} />
                  <View style={styles.cardBracketBL} />
                  <View style={styles.cardBracketBR} />
                  
                  {/* Minimal Floating Indicator */}
                  <View style={styles.tinderBadgeContainer}>
                    <View style={styles.focalBadge}>
                      <Text style={styles.focalBadgeText}>ẢNH {swipeIndex + 1}/6</Text>
                    </View>
                  </View>
                </RNAnimated.View>

                {/* Action buttons row */}
                <View style={styles.tinderButtonsRow}>
                  <Pressable 
                    style={[styles.tinderCircleBtn, styles.tinderBtnNope]} 
                    onPress={() => handleSwipeDecision(false)}
                  >
                    <Ionicons name="close" size={18} color="#FF3B30" />
                  </Pressable>
                  <Pressable 
                    style={[styles.tinderCircleBtn, styles.tinderBtnLike]} 
                    onPress={() => handleSwipeDecision(true)}
                  >
                    <Ionicons name="heart" size={18} color="#34C759" />
                  </Pressable>
                </View>
              </View>
            ) : (
              <View style={styles.tinderCompletedBox}>
                <Ionicons name="sparkles" size={24} color="#ff4200" style={{ marginBottom: 6 }} />
                <Text style={styles.completedHeader}>PHÂN TÍCH TÔNG MÀU HOÀN TẤT</Text>
                <Text style={styles.completedDesc}>
                  Hệ thống đã nhận diện gu màu sắc của bạn dựa trên các bức ảnh bạn đã thích:
                </Text>
                
                <View style={styles.analysisBadgesRow}>
                  {selectedColors.length > 0 ? (
                    selectedColors.map((paletteId) => {
                      const paletteObj = COLOR_PALETTES.find(p => p.id === paletteId);
                      if (!paletteObj) return null;
                      return (
                        <View key={paletteId} style={styles.analysisBadge}>
                          <LinearGradient
                            colors={paletteObj.rawColors as any}
                            style={styles.analysisBadgeColorDot}
                          />
                          <Text style={styles.analysisBadgeText}>{paletteObj.label}</Text>
                        </View>
                      );
                    })
                  ) : (
                    <View style={styles.analysisBadge}>
                      <LinearGradient
                        colors={COLOR_PALETTES[0].rawColors as any}
                        style={styles.analysisBadgeColorDot}
                      />
                      <Text style={styles.analysisBadgeText}>{COLOR_PALETTES[0].label} (Đề xuất)</Text>
                    </View>
                  )}
                </View>

                <Pressable style={styles.retryBtn} onPress={resetSwipeDeck}>
                  <Ionicons name="refresh-outline" size={14} color="#8A8170" style={{ marginRight: 6 }} />
                  <Text style={styles.retryBtnText}>QUẸT LẠI TỪ ĐẦU</Text>
                </Pressable>
              </View>
            )}

            <Text style={[styles.sectionHeader, { marginTop: spacing[8] }]}>ĐỊA ĐIỂM BẤM MÁY</Text>
            <View style={styles.locationColumnsRow}>
              {/* Column 1: Indoor specific spaces */}
              <View style={styles.locationColumn}>
                <Text style={styles.columnHeader}>TRONG NHÀ</Text>
                <ScrollView
                  style={styles.columnScrollView}
                  showsVerticalScrollIndicator={false}
                  onScrollBeginDrag={() => setPickerScrolling(true)}
                  onScrollEndDrag={() => setPickerScrolling(false)}
                  onMomentumScrollEnd={() => setPickerScrolling(false)}
                  nestedScrollEnabled={true}
                >
                  {LOC_COLUMN_1.map((item) => {
                    const isSelected = selectedLocations.includes(item.id);
                    return (
                      <Pressable
                        key={item.id}
                        style={[styles.locationItemPill, isSelected && styles.locationItemPillActive]}
                        onPress={() => toggleSelection(item.id, selectedLocations, setSelectedLocations)}
                      >
                        <Ionicons name={item.icon as any} size={11} color={isSelected ? '#ff4200' : '#8A8170'} />
                        <Text style={[styles.locationItemText, isSelected && styles.locationItemTextActive]}>
                          {item.label}
                        </Text>
                      </Pressable>
                    );
                  })}
                </ScrollView>
              </View>

              {/* Column 2: Outdoor settings */}
              <View style={styles.locationColumn}>
                <Text style={styles.columnHeader}>NGOÀI TRỜI</Text>
                <ScrollView
                  style={styles.columnScrollView}
                  showsVerticalScrollIndicator={false}
                  onScrollBeginDrag={() => setPickerScrolling(true)}
                  onScrollEndDrag={() => setPickerScrolling(false)}
                  onMomentumScrollEnd={() => setPickerScrolling(false)}
                  nestedScrollEnabled={true}
                >
                  {LOC_COLUMN_2.map((item) => {
                    const isSelected = selectedLocations.includes(item.id);
                    return (
                      <Pressable
                        key={item.id}
                        style={[styles.locationItemPill, isSelected && styles.locationItemPillActive]}
                        onPress={() => toggleSelection(item.id, selectedLocations, setSelectedLocations)}
                      >
                        <Ionicons name={item.icon as any} size={11} color={isSelected ? '#ff4200' : '#8A8170'} />
                        <Text style={[styles.locationItemText, isSelected && styles.locationItemTextActive]}>
                          {item.label}
                        </Text>
                      </Pressable>
                    );
                  })}
                </ScrollView>
              </View>

              {/* Column 3: Outstanding locations */}
              <View style={styles.locationColumn}>
                <Text style={styles.columnHeader}>NỔI BẬT</Text>
                <ScrollView
                  style={styles.columnScrollView}
                  showsVerticalScrollIndicator={false}
                  onScrollBeginDrag={() => setPickerScrolling(true)}
                  onScrollEndDrag={() => setPickerScrolling(false)}
                  onMomentumScrollEnd={() => setPickerScrolling(false)}
                  nestedScrollEnabled={true}
                >
                  {LOC_COLUMN_3.map((item) => {
                    const isSelected = selectedLocations.includes(item.id);
                    return (
                      <Pressable
                        key={item.id}
                        style={[styles.locationItemPill, isSelected && styles.locationItemPillActive]}
                        onPress={() => toggleSelection(item.id, selectedLocations, setSelectedLocations)}
                      >
                        <Ionicons name={item.icon as any} size={11} color={isSelected ? '#ff4200' : '#8A8170'} />
                        <Text style={[styles.locationItemText, isSelected && styles.locationItemTextActive]}>
                          {item.label}
                        </Text>
                      </Pressable>
                    );
                  })}
                </ScrollView>
              </View>
            </View>
          </Animated.View>
        )}

        {/* Step 4: Region & Artists */}
        {step === 4 && (
          <Animated.View entering={FadeInRight} exiting={FadeOutLeft} style={styles.slide}>
            <View style={styles.stepHeader}>
              <Ionicons name="location-outline" size={20} color="#ff4200" />
              <Text style={styles.stepTitle}>KHU VỰC & NGHỆ SĨ TRUYỀN CẢM HỨNG?</Text>
            </View>

            <Text style={styles.sectionHeader}>THÀNH PHỐ HOẠT ĐỘNG CHÍNH</Text>
            <View style={styles.regionRow}>
              {REGIONS.map((reg) => {
                const isSelected = selectedRegion === reg.code;
                return (
                  <Pressable
                    key={reg.code}
                    style={[styles.regionCard, isSelected && styles.regionCardSelected]}
                    onPress={() => setSelectedRegion(reg.code)}
                  >
                    <Text style={[styles.regionText, isSelected && styles.regionTextSelected]}>
                      {reg.name}
                    </Text>
                  </Pressable>
                );
              })}
            </View>

            <Text style={[styles.sectionHeader, { marginTop: spacing[8] }]}>NGHỆ SĨ YÊU THÍCH (NẾU CÓ)</Text>
            <View style={styles.inputUnderline}>
              <Ionicons name="search" size={16} color="#6B665C" style={{ marginRight: 8 }} />
              <TextInput
                style={styles.cleanInput}
                placeholder="Nhập tên nghệ sĩ hoặc phong cách (VD: Ansel Adams...)"
                placeholderTextColor="#A0988D"
                value={favoriteArtist}
                onChangeText={setFavoriteArtist}
                autoCapitalize="words"
              />
            </View>
          </Animated.View>
        )}
      </ScrollView>

      {/* Exposure indicator line below header */}
      {step > 0 && (
        <View style={styles.bottomProgressBarBg}>
          <View style={[styles.bottomProgressBarFill, { width: `${(step / 4) * 100}%` }]} />
        </View>
      )}

      {/* Bottom control bar */}
      {step > 0 && (
        <View style={styles.bottomControlBar}>
          <Pressable style={styles.backBtn} onPress={handleBack}>
            <Text style={styles.backBtnText}>QUAY LẠI</Text>
          </Pressable>

          <Pressable style={styles.nextBtn} onPress={handleNext} disabled={loading}>
            {loading ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <Text style={styles.nextBtnText}>{step === 4 ? 'HOÀN TẤT' : 'TIẾP TỤC'}</Text>
            )}
          </Pressable>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F7F4EF', // Beige background
    paddingTop: spacing[12],
  },
  scrollContent: {
    paddingHorizontal: spacing[6],
    paddingBottom: 90,
  },
  slide: {
    paddingTop: spacing[4],
  },

  // Welcome page layout
  welcomeSlide: {
    alignItems: 'center',
    paddingTop: spacing[4],
  },
  collageContainer: {
    width: '100%',
    height: 220,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
    marginBottom: spacing[6],
    marginTop: spacing[4],
  },
  collagePhotoCard: {
    position: 'absolute',
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    padding: 6,
    shadowColor: '#2E2A25',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.12,
    shadowRadius: 12,
    elevation: 6,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.06)',
  },
  collageImg: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
    borderRadius: 4,
  },
  collageBackLeft: {
    width: 95,
    height: 135,
    left: '8%',
    top: 15,
  },
  collageBackRight: {
    width: 95,
    height: 135,
    right: '8%',
    top: 20,
  },
  collageCenter: {
    width: 125,
    height: 170,
    zIndex: 5,
    top: 10,
    alignSelf: 'center',
  },
  collageMetaBadge: {
    position: 'absolute',
    bottom: 8,
    left: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.85)',
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 2,
  },
  collageMetaText: {
    fontSize: 7,
    fontWeight: '900',
    color: '#2E2A25',
    fontFamily: Platform.OS === 'ios' ? 'Courier-Bold' : 'monospace',
    letterSpacing: 0.8,
  },

  // Slide mount style card
  layeredCard: {
    flexDirection: 'row',
    backgroundColor: '#FAF7F2', // clean warm cardboard white/cream
    borderRadius: 10,
    padding: 10,
    paddingBottom: 14,
    marginBottom: spacing[4],
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 1, height: 3 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 3,
    width: '100%',
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.06)',
  },
  slideContainer: {
    width: 78,
    height: 78,
    backgroundColor: '#000',
    borderRadius: 3,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.85)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  slideImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  cardTextContent: {
    flex: 1,
    paddingLeft: 12,
  },
  layeredCardTitle: {
    fontSize: 10.5,
    fontWeight: '900',
    color: '#2E2A24', // handwriting charcoal color
    fontFamily: Platform.OS === 'ios' ? 'Courier-Bold' : 'monospace',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
    marginBottom: 4,
  },
  layeredCardDesc: {
    fontSize: 8.5,
    color: '#7A7062',
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    lineHeight: 13,
  },

  // Welcome Typography
  welcomeBrand: {
    color: '#ff4200',
    fontSize: 10,
    fontWeight: 'bold',
    letterSpacing: 2,
    marginBottom: spacing[2],
  },
  welcomeTitle: {
    fontSize: fontSizes.lg,
    fontWeight: '900',
    color: '#2E2A25',
    letterSpacing: 1.5,
    textAlign: 'center',
    marginBottom: spacing[3],
  },
  welcomeSub: {
    fontSize: fontSizes.xs,
    color: '#6B665C',
    textAlign: 'center',
    lineHeight: 18,
    paddingHorizontal: spacing[4],
  },
  primaryButton: {
    backgroundColor: '#ff4200',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing[8],
    height: 48,
    borderRadius: 24,
    shadowColor: '#ff4200',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 4,
    marginTop: spacing[4],
    width: '100%',
  },
  buttonText: {
    color: '#fff',
    fontWeight: fontWeights.bold,
    fontSize: fontSizes.xs,
    letterSpacing: 1.5,
  },

  // Steps headers
  stepHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: spacing[2],
  },
  stepTitle: {
    fontSize: fontSizes.md,
    fontWeight: '900',
    color: '#2E2A25',
    letterSpacing: 0.5,
  },
  stepSub: {
    fontSize: fontSizes.xs,
    color: '#6B665C',
    marginBottom: spacing[6],
  },
  sectionHeader: {
    color: '#ff4200',
    fontSize: 10,
    fontWeight: 'bold',
    letterSpacing: 1.5,
    marginBottom: spacing[4],
  },

  // Step 1: fashion photo grid
  gridContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    rowGap: spacing[4],
  },
  photoCard: {
    width: '48%',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 6,
    shadowColor: '#2E2A25',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.04,
    shadowRadius: 10,
    elevation: 2,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.04)',
    marginBottom: spacing[3],
    position: 'relative',
  },
  photoCardSelected: {
    borderColor: '#ff4200',
    borderWidth: 1.5,
    backgroundColor: '#FFF9F6',
  },
  cardImageContainer: {
    width: '100%',
    height: 110,
    borderRadius: 8,
    overflow: 'hidden',
    backgroundColor: '#FAF7F2',
    borderWidth: 0.5,
    borderColor: 'rgba(0,0,0,0.08)',
  },
  cardImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  cardTextContainer: {
    paddingTop: 8,
    paddingHorizontal: 4,
  },
  cardTag: {
    color: '#ff4200',
    fontSize: 7.5,
    fontWeight: '900',
    fontFamily: Platform.OS === 'ios' ? 'Courier-Bold' : 'monospace',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 2,
  },
  cardLabel: {
    color: '#2E2A25',
    fontSize: 10.5,
    fontWeight: 'bold',
  },
  selectedBadgeCorner: {
    position: 'absolute',
    top: 10,
    right: 10,
    backgroundColor: '#fff',
    borderRadius: 99,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
    zIndex: 10,
  },

  // Step 2: Camera Viewfinder & Lens Barrel Styles
  viewfinderScreen: {
    width: '100%',
    height: 220,
    backgroundColor: '#000',
    borderRadius: 10,
    overflow: 'hidden',
    position: 'relative',
    borderWidth: 2,
    borderColor: '#2E2A25',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.25,
    shadowRadius: 15,
    elevation: 8,
  },
  viewfinderImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  focusReticle: {
    position: 'absolute',
    top: '35%',
    left: '35%',
    width: '30%',
    height: '30%',
    borderWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.4)',
    borderRadius: 4,
    justifyContent: 'center',
    alignItems: 'center',
  },
  focusReticleLocked: {
    borderColor: '#ff4200',
  },
  focusCenterDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: 'rgba(255, 255, 255, 0.6)',
  },
  viewfinderHeader: {
    position: 'absolute',
    top: 12,
    left: 12,
    right: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  viewfinderFooter: {
    position: 'absolute',
    bottom: 12,
    left: 12,
    right: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  viewfinderMetaText: {
    color: '#fff',
    fontSize: 9,
    fontFamily: Platform.OS === 'ios' ? 'Courier-Bold' : 'monospace',
    fontWeight: 'bold',
    letterSpacing: 0.5,
    textShadowColor: 'rgba(0,0,0,0.8)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
  focusStatusText: {
    color: '#fff',
    fontSize: 9,
    fontFamily: Platform.OS === 'ios' ? 'Courier-Bold' : 'monospace',
    fontWeight: 'bold',
    letterSpacing: 0.5,
  },
  focusStatusLocked: {
    color: '#ff4200',
  },
  conceptInfoCard: {
    backgroundColor: '#FAF7F2',
    borderRadius: 14,
    padding: 14,
    marginTop: spacing[4],
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.05)',
    width: '100%',
  },
  conceptHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0, 0, 0, 0.04)',
    paddingBottom: 8,
    marginBottom: 8,
  },
  conceptNameText: {
    fontSize: fontSizes.base,
    fontWeight: 'bold',
    color: '#2E2A25',
  },
  conceptFocalBadge: {
    backgroundColor: 'rgba(255, 66, 0, 0.1)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  conceptFocalBadgeText: {
    fontSize: 9.5,
    fontWeight: 'bold',
    color: '#ff4200',
    fontFamily: Platform.OS === 'ios' ? 'Courier-Bold' : 'monospace',
  },
  conceptDescText: {
    fontSize: 10,
    color: '#6B6255',
    lineHeight: 15,
    marginBottom: 10,
  },
  conceptSpecsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    width: '100%',
    borderTopWidth: 1,
    borderTopColor: 'rgba(0, 0, 0, 0.04)',
    paddingTop: 10,
    marginTop: 6,
    gap: 8,
  },
  conceptSpecItem: {
    width: '47%',
    marginBottom: 6,
  },
  conceptSpecLabel: {
    fontSize: 8,
    fontWeight: '900',
    color: '#8A8170',
    letterSpacing: 0.5,
  },
  conceptSpecValue: {
    fontSize: 9.5,
    fontWeight: 'bold',
    color: '#2E2A25',
    marginTop: 2,
  },
  lensBarrelContainer: {
    width: '100%',
    marginVertical: spacing[4],
    position: 'relative',
  },
  needlePointer: {
    position: 'absolute',
    top: -2,
    left: '50%',
    marginLeft: -8,
    zIndex: 10,
  },
  lensBarrel: {
    width: '100%',
    backgroundColor: '#1E1E1E',
    borderRadius: 10,
    paddingVertical: 12,
    paddingHorizontal: 6,
    borderWidth: 2,
    borderColor: '#2E2A25',
  },
  lensBarrelScroll: {
    alignItems: 'center',
    paddingHorizontal: spacing[3],
  },
  focalMark: {
    alignItems: 'center',
    paddingVertical: 2,
  },
  focalMarkActive: {
    transform: [{ scale: 1.05 }],
  },
  focalMarkSaved: {
    opacity: 1,
  },
  focalMarkText: {
    fontSize: 9,
    color: '#6B665C',
    fontWeight: 'bold',
    textTransform: 'uppercase',
  },
  focalMarkTextActive: {
    color: '#ff4200',
    fontWeight: '900',
  },
  focalMarkTextSaved: {
    textDecorationLine: 'underline',
  },
  focalTick: {
    width: 2,
    height: 8,
    backgroundColor: '#6B665C',
    marginTop: 4,
    borderRadius: 1,
  },
  focalTickActive: {
    backgroundColor: '#ff4200',
    height: 12,
  },
  focalTickSaved: {
    backgroundColor: '#fff',
  },
  shutterContainer: {
    alignItems: 'center',
    marginTop: spacing[8],
    marginBottom: spacing[6],
  },
  shutterButton: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: '#2E2A25',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 6,
    borderWidth: 4,
    borderColor: '#1E1E1E',
  },
  shutterButtonActive: {
    backgroundColor: '#ff4200',
    borderColor: '#FFD5C6',
  },
  shutterInnerCircle: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: 'transparent',
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  shutterButtonLabel: {
    fontSize: 9,
    fontWeight: '900',
    color: '#ff4200',
    letterSpacing: 1.5,
    marginTop: 10,
    textTransform: 'uppercase',
  },
  capturedListContainer: {
    width: '100%',
    marginTop: spacing[4],
    paddingTop: spacing[4],
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.06)',
    paddingBottom: spacing[4],
  },
  capturedListTitle: {
    fontSize: 9,
    fontWeight: '900',
    color: '#8A8170',
    letterSpacing: 1.5,
    marginBottom: 10,
    textTransform: 'uppercase',
  },
  capturedBadgesRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  capturedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 15,
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.06)',
    shadowColor: '#2E2A25',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 1,
  },
  capturedBadgeText: {
    fontSize: 9.5,
    fontWeight: 'bold',
    color: '#2E2A25',
  },
  cardBracketTL: { position: 'absolute', top: 10, left: 10, width: 8, height: 8, borderTopWidth: 1.5, borderLeftWidth: 1.5, borderColor: 'rgba(255,255,255,0.7)' },
  cardBracketTR: { position: 'absolute', top: 10, right: 10, width: 8, height: 8, borderTopWidth: 1.5, borderRightWidth: 1.5, borderColor: 'rgba(255,255,255,0.7)' },
  cardBracketBL: { position: 'absolute', bottom: 10, left: 10, width: 8, height: 8, borderBottomWidth: 1.5, borderLeftWidth: 1.5, borderColor: 'rgba(255,255,255,0.7)' },
  cardBracketBR: { position: 'absolute', bottom: 10, right: 10, width: 8, height: 8, borderBottomWidth: 1.5, borderRightWidth: 1.5, borderColor: 'rgba(255,255,255,0.7)' },
  cardHudText: {
    position: 'absolute',
    bottom: 12,
    left: 12,
    color: 'rgba(255,255,255,0.85)',
    fontSize: 8,
    fontFamily: Platform.OS === 'ios' ? 'Courier-Bold' : 'monospace',
    fontWeight: 'bold',
  },

  // Step 3 swatches & locations
  // Step 3 swatches & locations
  sectionSubText: {
    fontSize: 9.5,
    color: '#8A8170',
    marginTop: -4,
    marginBottom: 16,
    lineHeight: 14,
  },
  moodboardGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    width: '100%',
  },
  moodboardCard: {
    width: '48%',
    height: 120,
    borderRadius: 10,
    overflow: 'hidden',
    position: 'relative',
    borderWidth: 2,
    borderColor: 'transparent',
    marginBottom: 12,
    shadowColor: '#2E2A25',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 5,
    elevation: 2,
  },
  moodboardCardSelected: {
    borderColor: '#ff4200',
    transform: [{ scale: 1.02 }],
  },
  moodboardPhoto: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  moodboardCheckbox: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    borderWidth: 1.5,
    borderColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 5,
  },
  moodboardCheckboxActive: {
    backgroundColor: '#ff4200',
    borderColor: '#ff4200',
  },
  moodTextContainer: {
    position: 'absolute',
    bottom: 8,
    left: 10,
    right: 10,
    zIndex: 5,
  },
  moodPhotoTitle: {
    color: '#fff',
    fontSize: 10.5,
    fontWeight: 'bold',
    textShadowColor: 'rgba(0,0,0,0.8)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
  moodPhotoDesc: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 8.5,
    marginTop: 1,
    textShadowColor: 'rgba(0,0,0,0.8)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 1,
  },
  analysisResultBox: {
    width: '100%',
    backgroundColor: '#FAF7F2',
    borderRadius: 8,
    padding: 10,
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.05)',
    marginTop: 6,
    marginBottom: 16,
  },
  analysisHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.04)',
    paddingBottom: 4,
  },
  analysisTitleText: {
    fontSize: 8.5,
    fontWeight: 'bold',
    color: '#8A8170',
    fontFamily: Platform.OS === 'ios' ? 'Courier-Bold' : 'monospace',
    letterSpacing: 0.5,
  },
  analysisBadgesRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  analysisBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.06)',
  },
  analysisBadgeColorDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 6,
  },
  analysisBadgeText: {
    fontSize: 9,
    fontWeight: 'bold',
    color: '#2E2A25',
  },
  colorPreviewCard: {
    width: '100%',
    height: 180,
    borderRadius: 10,
    backgroundColor: '#000',
    overflow: 'hidden',
    position: 'relative',
    borderWidth: 2,
    borderColor: '#2E2A25',
    marginBottom: spacing[6],
  },
  colorPreviewImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  colorPreviewHeader: {
    position: 'absolute',
    top: 10,
    left: 12,
    right: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  colorPreviewFooter: {
    position: 'absolute',
    bottom: 10,
    left: 12,
    right: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  colorPreviewMetaText: {
    color: '#fff',
    fontSize: 8,
    fontFamily: Platform.OS === 'ios' ? 'Courier-Bold' : 'monospace',
    fontWeight: 'bold',
    letterSpacing: 0.5,
    textShadowColor: 'rgba(0,0,0,0.8)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
  colorStatusRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  colorStatusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#ff4200',
    marginRight: 6,
  },
  colorStatusText: {
    color: '#fff',
    fontSize: 8.5,
    fontWeight: 'bold',
    letterSpacing: 0.5,
    textShadowColor: 'rgba(0,0,0,0.8)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
  tinderWrapper: {
    width: '100%',
    height: 310,
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 6,
    marginBottom: 10,
  },
  tinderCardActive: {
    position: 'absolute',
    width: '96%',
    height: 250,
    borderRadius: 12,
    backgroundColor: '#fff',
    overflow: 'hidden',
    borderWidth: 1.5,
    borderColor: 'rgba(0,0,0,0.06)',
    shadowColor: '#2E2A25',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 4,
    zIndex: 10,
  },
  tinderCardBack: {
    position: 'absolute',
    width: '92%',
    height: 250,
    borderRadius: 12,
    backgroundColor: '#eee',
    overflow: 'hidden',
    borderWidth: 1.5,
    borderColor: 'rgba(0,0,0,0.06)',
    transform: [{ translateY: 8 }, { scale: 0.96 }],
    opacity: 0.85,
    zIndex: 5,
  },
  tinderPhoto: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  tinderTextContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 16,
    zIndex: 15,
  },
  tinderLabelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  tinderCardTitle: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  tinderCardDesc: {
    color: 'rgba(255,255,255,0.85)',
    fontSize: 10.5,
    lineHeight: 14,
  },
  focalBadge: {
    backgroundColor: 'rgba(255, 66, 0, 0.25)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#ff4200',
  },
  focalBadgeText: {
    color: '#fff',
    fontSize: 8,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  swipeStamp: {
    position: 'absolute',
    top: 20,
    borderWidth: 2,
    borderRadius: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
    zIndex: 20,
    backgroundColor: 'rgba(0,0,0,0.4)',
  },
  swipeStampLike: {
    right: 30,
    borderColor: '#34C759',
  },
  swipeStampNope: {
    left: 30,
    borderColor: '#FF3B30',
  },
  swipeStampTextLike: {
    color: '#34C759',
    fontSize: 16,
    fontWeight: '900',
    letterSpacing: 1.5,
  },
  swipeStampTextNope: {
    color: '#FF3B30',
    fontSize: 16,
    fontWeight: '900',
    letterSpacing: 1.5,
  },
  tinderButtonsRow: {
    position: 'absolute',
    bottom: 5,
    flexDirection: 'row',
    gap: 16,
    zIndex: 30,
  },
  tinderCircleBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.05)',
  },
  tinderBtnNope: {
    // specific Nope button style
  },
  tinderBtnLike: {
    // specific Like button style
  },
  tinderCompletedBox: {
    width: '100%',
    backgroundColor: '#FAF7F2',
    borderRadius: 12,
    padding: 20,
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: 'rgba(46,42,37,0.06)',
    marginVertical: 12,
  },
  completedHeader: {
    fontSize: 11,
    fontWeight: '900',
    color: '#ff4200',
    letterSpacing: 1,
    marginBottom: 6,
  },
  completedDesc: {
    fontSize: 10,
    color: '#8A8170',
    textAlign: 'center',
    marginBottom: 16,
    lineHeight: 14,
  },
  retryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 18,
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: 'rgba(46,42,37,0.1)',
    backgroundColor: '#fff',
  },
  retryBtnText: {
    fontSize: 9,
    fontWeight: 'bold',
    color: '#8A8170',
    letterSpacing: 0.5,
  },
  tinderBadgeContainer: {
    position: 'absolute',
    top: 12,
    right: 12,
    zIndex: 20,
  },
  locationColumnsRow: {
    flexDirection: 'row',
    gap: 6,
    width: '100%',
    height: 180,
    marginTop: 8,
  },
  locationColumn: {
    flex: 1,
    height: '100%',
  },
  columnHeader: {
    fontSize: 9,
    fontWeight: '900',
    color: '#8A8170',
    letterSpacing: 0.5,
    marginBottom: 6,
    textAlign: 'center',
  },
  columnScrollView: {
    flex: 1,
  },
  locationItemPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: 'rgba(46,42,37,0.06)',
    paddingHorizontal: 6,
    paddingVertical: 8,
    borderRadius: 8,
    marginBottom: 6,
    shadowColor: '#2E2A25',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.02,
    shadowRadius: 4,
    elevation: 1,
  },
  locationItemPillActive: {
    borderColor: '#ff4200',
    backgroundColor: 'rgba(255, 66, 0, 0.03)',
  },
  locationItemText: {
    fontSize: 8.5,
    color: '#8A8170',
    fontWeight: 'bold',
    flexShrink: 1,
  },
  locationItemTextActive: {
    color: '#ff4200',
    fontWeight: '900',
  },

  // Step 4 region & artists
  regionRow: {
    flexDirection: 'row',
    gap: spacing[3],
  },
  regionCard: {
    paddingHorizontal: spacing[4],
    paddingVertical: spacing[3],
    backgroundColor: '#fff',
    borderWidth: 1.5,
    borderColor: 'rgba(46,42,37,0.06)',
    borderRadius: 12,
    minWidth: 78,
    alignItems: 'center',
    shadowColor: '#2E2A25',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.03,
    shadowRadius: 8,
    elevation: 1,
  },
  regionCardSelected: {
    borderColor: '#ff4200',
    backgroundColor: 'rgba(255,66,0,0.03)',
  },
  regionText: {
    color: '#6B665C',
    fontSize: fontSizes.xs,
    fontWeight: 'bold',
  },
  regionTextSelected: {
    color: '#ff4200',
  },
  inputUnderline: {
    flexDirection: 'row',
    alignItems: 'center',
    borderBottomWidth: 1.5,
    borderBottomColor: '#D3CBBF',
    paddingVertical: spacing[2.5],
  },
  cleanInput: {
    color: '#2E2A25',
    fontSize: fontSizes.sm,
    padding: 0,
    flex: 1,
  },

  // Progress Bar Line at bottom of content
  // Progress Bar Line at bottom of content
  bottomProgressBarBg: {
    width: '100%',
    height: 3,
    backgroundColor: 'rgba(46,42,37,0.06)',
    position: 'absolute',
    bottom: 74,
    left: 0,
    right: 0,
    zIndex: 100,
  },
  bottomProgressBarFill: {
    height: '100%',
    backgroundColor: '#ff4200',
  },

  // Bottom buttons
  bottomControlBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#F7F4EF', // solid background matching screen
    borderTopWidth: 1.5,
    borderTopColor: 'rgba(46,42,37,0.08)',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing[6],
    paddingTop: 12,
    paddingBottom: 24, // padding for iOS home indicator
    zIndex: 99,
  },
  backBtn: {
    height: 38,
    justifyContent: 'center',
    paddingHorizontal: spacing[3],
  },
  backBtnText: {
    color: '#6B665C',
    fontSize: fontSizes.xs - 1,
    fontWeight: 'bold',
    letterSpacing: 1.2,
  },
  nextBtn: {
    height: 38,
    backgroundColor: '#ff4200',
    borderRadius: 19,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: spacing[5],
    minWidth: 100,
    shadowColor: '#ff4200',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 2,
  },
  nextBtnText: {
    color: '#fff',
    fontWeight: fontWeights.bold,
    fontSize: fontSizes.xs - 1,
    letterSpacing: 1.2,
  },
  skipButton: {
    marginTop: 12,
    alignSelf: 'center',
    paddingVertical: 12,
    paddingHorizontal: 24,
  },
  skipButtonText: {
    fontSize: 14,
    color: '#8A8A8F',
    fontWeight: '600',
    textDecorationLine: 'underline',
  },
});
