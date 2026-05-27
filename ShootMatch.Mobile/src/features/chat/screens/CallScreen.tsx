import React, { useEffect, useState, useRef } from 'react';
import {
  StyleSheet, View, Text, Image, Pressable, Animated, Easing,
  Dimensions, ActivityIndicator, Vibration
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import * as ChatHub from '../ChatHub';
import { colors } from '../../../app/theme/colors';
import { fontSizes, fontWeights } from '../../../app/theme/typography';
import { radius, spacing } from '../../../app/theme/spacing';

const { width, height } = Dimensions.get('window');

export default function CallScreen() {
  const navigation = useNavigation<any>();
  const route      = useRoute<any>();
  const params     = route.params as {
    conversationId: string;
    callSessionId?: string;
    callType: 'audio' | 'video';
    role: 'caller' | 'callee';
    name: string;
    avatarUrl?: string;
  };

  const [status,        setStatus]        = useState<'ringing' | 'active' | 'ended' | 'rejected' | 'cancelled'>('ringing');
  const [callSessionId, setCallSessionId] = useState<string | undefined>(params.callSessionId);
  const [duration,      setDuration]      = useState(0);
  
  // Call controls state
  const [isMuted,       setIsMuted]       = useState(false);
  const [isSpeakerOn,   setIsSpeakerOn]   = useState(params.callType === 'video'); // Video default speaker on
  const [isCameraOff,   setIsCameraOff]   = useState(false);
  const [isFrontCamera, setIsFrontCamera] = useState(true);

  // Animation values
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const ringAnim  = useRef(new Animated.Value(0)).current;
  
  // Ref pointers
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Trigger breathing pulse animation for ringing/audio states
  useEffect(() => {
    if (status === 'ringing' || (status === 'active' && params.callType === 'audio')) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.12,
            duration: 1500,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1.0,
            duration: 1500,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          })
        ])
      ).start();

      Animated.loop(
        Animated.sequence([
          Animated.timing(ringAnim, {
            toValue: 1.0,
            duration: 2000,
            easing: Easing.out(Easing.ease),
            useNativeDriver: true,
          }),
          Animated.timing(ringAnim, {
            toValue: 0.0,
            duration: 0,
            useNativeDriver: true,
          })
        ])
      ).start();
    } else {
      pulseAnim.setValue(1);
      ringAnim.setValue(0);
    }
  }, [status]);

  // Handle vibration pattern for incoming calls
  useEffect(() => {
    if (params.role === 'callee' && status === 'ringing') {
      const interval = setInterval(() => {
        Vibration.vibrate([0, 500, 1000]);
      }, 2000);
      return () => {
        clearInterval(interval);
        Vibration.cancel();
      };
    }
  }, [params.role, status]);

  // Duration timer
  useEffect(() => {
    if (status === 'active') {
      timerRef.current = setInterval(() => {
        setDuration(prev => prev + 1);
      }, 1000);
    } else {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [status]);

  // SignalR Event Integration
  useEffect(() => {
    let cleanup: (() => void) | undefined;

    (async () => {
      await ChatHub.connect();

      // Listen to call events realtime
      cleanup = ChatHub.onReceiveCallEvent((evt) => {
        if (evt.conversationId !== params.conversationId) return;

        switch (evt.event) {
          case 'ring':
            setCallSessionId((prev) => prev ?? evt.id);
            if (params.role === 'callee') {
              ChatHub.joinCallRoom(evt.id).catch(() => {});
            }
            break;
          case 'accept':
            setStatus('active');
            setCallSessionId(evt.id);
            break;
          case 'reject':
            setStatus('rejected');
            setTimeout(() => navigation.goBack(), 1500);
            break;
          case 'hangup':
            setStatus('ended');
            setTimeout(() => navigation.goBack(), 1500);
            break;
          case 'cancel':
            setStatus('cancelled');
            setTimeout(() => navigation.goBack(), 1500);
            break;
        }
      });

      // Caller initiates the call
      if (params.role === 'caller') {
        try {
          const sessionToken = `token_${Date.now()}`;
          await ChatHub.startCall(params.conversationId, params.callType, sessionToken);
        } catch (err) {
          console.error('[CallScreen] Failed to start call:', err);
          setStatus('ended');
          setTimeout(() => navigation.goBack(), 1500);
        }
      } else {
        // Callee joins the ephemeral call room to start signaling mock
        if (callSessionId) {
          await ChatHub.joinCallRoom(callSessionId);
        }
      }
    })();

    return () => {
      cleanup?.();
    };
  }, [callSessionId]);

  // Actions
  async function handleAccept() {
    if (!callSessionId) return;
    try {
      await ChatHub.acceptCall(callSessionId);
      setStatus('active');
    } catch {}
  }

  async function handleReject() {
    if (!callSessionId) return;
    try {
      await ChatHub.rejectCall(callSessionId, 'rejected');
      setStatus('rejected');
      setTimeout(() => navigation.goBack(), 1500);
    } catch {}
  }

  async function handleCancel() {
    // If caller cancels before callee answers
    if (params.role === 'caller') {
      try {
        if (callSessionId) {
          await ChatHub.cancelCall(callSessionId, 'cancelled');
        }
        setStatus('cancelled');
        setTimeout(() => navigation.goBack(), 1000);
      } catch {
        navigation.goBack();
      }
    }
  }

  async function handleHangup() {
    if (!callSessionId) {
      navigation.goBack();
      return;
    }
    try {
      await ChatHub.endCall(callSessionId, 'ended');
      setStatus('ended');
      setTimeout(() => navigation.goBack(), 1000);
    } catch {
      navigation.goBack();
    }
  }

  // Format Duration into mm:ss
  function formatDuration(sec: number) {
    const mins = Math.floor(sec / 60);
    const secs = sec % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }

  // Ringing ring effect opacity
  const ringScale = ringAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [1, 2.2]
  });

  const ringOpacity = ringAnim.interpolate({
    inputRange: [0, 0.8, 1],
    outputRange: [0.6, 0.3, 0]
  });

  // Mock Remote Camera Stream image url based on Call Type
  const remoteCameraUrl = params.callType === 'video'
    ? 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=800&q=80' // Beautiful female portrait
    : 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&q=80'; // Portrait backup

  const defaultAvatar = params.avatarUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&q=80';

  return (
    <View style={styles.root}>
      {/* Background Layer */}
      {params.callType === 'video' && status === 'active' && !isCameraOff ? (
        // Full screen Camera view mockup
        <View style={styles.videoBackground}>
          <Image source={{ uri: remoteCameraUrl }} style={styles.fullImage} />
          
          {/* Creative Photography Viewfinder overlay */}
          <View style={styles.viewfinderContainer}>
            {/* 3x3 Grid thin lines */}
            <View style={styles.gridLineHorizontal1} />
            <View style={styles.gridLineHorizontal2} />
            <View style={styles.gridLineVertical1} />
            <View style={styles.gridLineVertical2} />

            {/* Corner Indicators */}
            <View style={[styles.corner, styles.cornerTL]} />
            <View style={[styles.corner, styles.cornerTR]} />
            <View style={[styles.corner, styles.cornerBL]} />
            <View style={[styles.corner, styles.cornerBR]} />
            
            {/* Viewfinder stats */}
            <View style={styles.viewfinderStats}>
              <Text style={styles.statText}>RAW</Text>
              <Text style={styles.statText}>F/2.8</Text>
              <Text style={styles.statText}>1/250s</Text>
              <Text style={styles.statText}>ISO 400</Text>
            </View>
          </View>

          {/* Self Preview Mockup thumbnail at top corner */}
          <View style={styles.selfPreview}>
            <Image
              source={{ uri: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=300&q=80' }}
              style={styles.fullImage}
            />
            <View style={styles.selfPreviewOverlay}>
              <Text style={styles.selfPreviewText}>Bạn</Text>
            </View>
          </View>
        </View>
      ) : (
        // Blurred Glassmorphic Gradient for Audio/Ringing screens
        <LinearGradient
          colors={[colors.dark, '#1f1f14', '#0d0d08']}
          style={styles.gradientBg}
        />
      )}

      {/* Main Content Area */}
      <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
        
        {/* Top Header stats */}
        <View style={styles.header}>
          <View style={styles.lockBadge}>
            <Ionicons name="lock-closed" size={12} color="rgba(255,247,225,0.6)" />
            <Text style={styles.lockText}>Được mã hóa đầu-cuối</Text>
          </View>
          {status === 'active' && (
            <View style={styles.timerBadge}>
              <View style={styles.activeDot} />
              <Text style={styles.timerText}>{formatDuration(duration)}</Text>
            </View>
          )}
        </View>

        {/* User Profile Info section */}
        {!(params.callType === 'video' && status === 'active') && (
          <View style={styles.profileSection}>
            <View style={styles.avatarContainer}>
              {/* Ring pulse effects during Ringing */}
              {(status === 'ringing') && (
                <Animated.View
                  style={[
                    styles.ringPulse,
                    {
                      transform: [{ scale: ringScale }],
                      opacity: ringOpacity,
                    }
                  ]}
                />
              )}

              {/* Breathing Profile Avatar */}
              <Animated.View style={{ transform: [{ scale: pulseAnim }] }}>
                <Image source={{ uri: defaultAvatar }} style={styles.avatar} />
              </Animated.View>
            </View>

            <Text style={styles.profileName}>{params.name}</Text>
            <Text style={styles.callStatus}>
              {status === 'ringing' && (params.role === 'caller' ? 'Đang đổ chuông...' : 'Cuộc gọi đến...')}
              {status === 'active' && (params.callType === 'video' ? 'Đang gọi video...' : 'Đang kết nối (chưa có âm thanh)...')}
              {status === 'ended' && 'Cuộc gọi đã kết thúc'}
              {status === 'rejected' && 'Người nhận bận'}
              {status === 'cancelled' && 'Cuộc gọi đã hủy'}
            </Text>
            {status === 'active' && params.callType === 'audio' && (
              <View style={styles.demoBanner}>
                <Ionicons name="information-circle-outline" size={16} color={colors.warning} />
                <Text style={styles.demoBannerText}>
                  Cuộc gọi chỉ mới có tín hiệu (đổ chuông / nhận / cúp máy). Âm thanh 2 chiều cần tích hợp WebRTC — chưa có trong bản này.
                </Text>
              </View>
            )}
          </View>
        )}

        {/* Dynamic Space Filler */}
        <View style={styles.flexFiller} />

        {/* Call Controls Dock at Bottom */}
        <View style={styles.controlsSection}>
          
          {/* Outgoing controls */}
          {status === 'ringing' && params.role === 'caller' && (
            <View style={styles.controlsRowSingle}>
              <Pressable onPress={handleCancel} style={[styles.controlBtn, styles.declineBtn]}>
                <Ionicons name="close" size={32} color={colors.background} />
              </Pressable>
              <Text style={styles.controlLabel}>Hủy cuộc gọi</Text>
            </View>
          )}

          {/* Incoming controls */}
          {status === 'ringing' && params.role === 'callee' && (
            <View style={styles.incomingRow}>
              <View style={styles.incomingBtnWrap}>
                <Pressable onPress={handleReject} style={[styles.controlBtn, styles.declineBtn]}>
                  <Ionicons name="close" size={32} color={colors.background} />
                </Pressable>
                <Text style={styles.controlLabel}>Từ chối</Text>
              </View>
              <View style={styles.incomingBtnWrap}>
                <Pressable onPress={handleAccept} style={[styles.controlBtn, styles.acceptBtn]}>
                  <Ionicons name="checkmark" size={32} color={colors.background} />
                </Pressable>
                <Text style={styles.controlLabel}>Trả lời</Text>
              </View>
            </View>
          )}

          {/* Active Call Controls bar */}
          {status === 'active' && (
            <View style={styles.activeControlsContainer}>
              <View style={styles.controlBtnGroup}>
                <Pressable
                  onPress={() => setIsMuted(!isMuted)}
                  style={[styles.smallControlBtn, isMuted && styles.activeControlBtn]}
                >
                  <Ionicons
                    name={isMuted ? 'mic-off' : 'mic'}
                    size={22}
                    color={isMuted ? colors.dark : colors.background}
                  />
                </Pressable>
                <Text style={styles.smallLabel}>Mute</Text>
              </View>

              {params.callType === 'video' && (
                <View style={styles.controlBtnGroup}>
                  <Pressable
                    onPress={() => setIsCameraOff(!isCameraOff)}
                    style={[styles.smallControlBtn, isCameraOff && styles.activeControlBtn]}
                  >
                    <Ionicons
                      name={isCameraOff ? 'videocam-off' : 'videocam'}
                      size={22}
                      color={isCameraOff ? colors.dark : colors.background}
                    />
                  </Pressable>
                  <Text style={styles.smallLabel}>Camera</Text>
                </View>
              )}

              <View style={styles.controlBtnGroup}>
                <Pressable
                  onPress={() => setIsSpeakerOn(!isSpeakerOn)}
                  style={[styles.smallControlBtn, isSpeakerOn && styles.activeControlBtn]}
                >
                  <Ionicons
                    name={isSpeakerOn ? 'volume-high' : 'volume-mute'}
                    size={22}
                    color={isSpeakerOn ? colors.dark : colors.background}
                  />
                </Pressable>
                <Text style={styles.smallLabel}>Loa ngoài</Text>
              </View>

              {params.callType === 'video' && !isCameraOff && (
                <View style={styles.controlBtnGroup}>
                  <Pressable
                    onPress={() => setIsFrontCamera(!isFrontCamera)}
                    style={styles.smallControlBtn}
                  >
                    <Ionicons name="camera-reverse" size={22} color={colors.background} />
                  </Pressable>
                  <Text style={styles.smallLabel}>Lật camera</Text>
                </View>
              )}

              {/* End call center button */}
              <View style={styles.controlBtnGroup}>
                <Pressable onPress={handleHangup} style={[styles.controlBtn, styles.declineBtn, styles.hangupBtnSize]}>
                  <Ionicons name="call" size={26} color={colors.background} style={styles.rotateHangup} />
                </Pressable>
                <Text style={styles.smallLabel}>Cúp máy</Text>
              </View>
            </View>
          )}

        </View>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#0d0d08' },
  gradientBg: { ...StyleSheet.absoluteFillObject },
  videoBackground: { ...StyleSheet.absoluteFillObject },
  fullImage: { width: '100%', height: '100%', resizeMode: 'cover' },
  safe: { flex: 1, justifyContent: 'space-between', paddingHorizontal: spacing[6] },

  // Header lock & stats
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingTop: spacing[2], height: 50 },
  lockBadge: { flexDirection: 'row', alignItems: 'center', gap: spacing[1.5], paddingVertical: spacing[1.5], paddingHorizontal: spacing[3], borderRadius: radius.full, backgroundColor: 'rgba(26,26,15,0.4)' },
  lockText: { fontSize: 11, color: 'rgba(255,247,225,0.7)', fontWeight: '600' },
  timerBadge: { flexDirection: 'row', alignItems: 'center', gap: spacing[2], paddingVertical: spacing[1.5], paddingHorizontal: spacing[3], borderRadius: radius.full, backgroundColor: 'rgba(26,26,15,0.6)', borderWidth: 1, borderColor: 'rgba(255,247,225,0.1)' },
  activeDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: colors.success },
  timerText: { fontSize: fontSizes.sm, color: colors.background, fontWeight: fontWeights.bold, fontFamily: 'monospace' },

  // Profile Section
  profileSection: { alignItems: 'center', marginTop: height * 0.12, gap: spacing[4] },
  avatarContainer: { width: 140, height: 140, position: 'relative', alignItems: 'center', justifyContent: 'center' },
  avatar: { width: 130, height: 130, borderRadius: 65, borderWidth: 4, borderColor: colors.accent },
  ringPulse: { position: 'absolute', width: 130, height: 130, borderRadius: 65, borderWidth: 2, borderColor: colors.accent },
  profileName: { fontSize: fontSizes['2xl'], fontWeight: fontWeights.bold, color: colors.background, textAlign: 'center', letterSpacing: 0.5 },
  callStatus: { fontSize: fontSizes.md, color: 'rgba(255,247,225,0.6)', textAlign: 'center', letterSpacing: 0.2 },
  demoBanner: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing[2],
    marginTop: spacing[4],
    paddingHorizontal: spacing[4],
    paddingVertical: spacing[3],
    borderRadius: radius.md,
    backgroundColor: 'rgba(233,196,106,0.15)',
    borderWidth: 1,
    borderColor: 'rgba(233,196,106,0.35)',
    maxWidth: 320,
  },
  demoBannerText: {
    flex: 1,
    fontSize: fontSizes.xs,
    color: 'rgba(255,247,225,0.85)',
    lineHeight: 18,
  },

  flexFiller: { flex: 1 },

  // Controls section
  controlsSection: { paddingBottom: spacing[8], alignItems: 'center' },
  controlsRowSingle: { alignItems: 'center', gap: spacing[2] },
  incomingRow: { flexDirection: 'row', width: '100%', justifyContent: 'space-around', paddingHorizontal: spacing[4] },
  incomingBtnWrap: { alignItems: 'center', gap: spacing[2] },
  
  controlBtn: { width: 70, height: 70, borderRadius: 35, alignItems: 'center', justifyContent: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.3, shadowRadius: 10, elevation: 8 },
  declineBtn: { backgroundColor: colors.accent }, // Minimal PicKic accent color represents red/coral
  acceptBtn: { backgroundColor: colors.success },
  controlLabel: { fontSize: fontSizes.sm, color: colors.background, fontWeight: '600', marginTop: spacing[1] },

  // Active call controls layout
  activeControlsContainer: { flexDirection: 'row', width: '100%', justifyContent: 'space-around', alignItems: 'flex-end', backgroundColor: 'rgba(26,26,15,0.85)', paddingVertical: spacing[5], paddingHorizontal: spacing[4], borderRadius: radius['2xl'], borderWidth: 1, borderColor: 'rgba(255,247,225,0.08)' },
  controlBtnGroup: { alignItems: 'center', gap: spacing[1.5] },
  smallControlBtn: { width: 48, height: 48, borderRadius: 24, backgroundColor: 'rgba(255,255,255,0.08)', alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)' },
  activeControlBtn: { backgroundColor: colors.background },
  smallLabel: { fontSize: fontSizes.xs, color: 'rgba(255,247,225,0.6)', fontWeight: '600' },
  hangupBtnSize: { width: 56, height: 56, borderRadius: 28 },
  rotateHangup: { transform: [{ rotate: '135deg' }] },

  // Viewfinder camera overlays
  viewfinderContainer: { ...StyleSheet.absoluteFillObject },
  corner: { position: 'absolute', width: 20, height: 20, borderColor: 'rgba(255,255,255,0.45)', borderStyle: 'solid' },
  cornerTL: { top: 30, left: 30, borderTopWidth: 2, borderLeftWidth: 2 },
  cornerTR: { top: 30, right: 30, borderTopWidth: 2, borderRightWidth: 2 },
  cornerBL: { bottom: 30, left: 30, borderBottomWidth: 2, borderLeftWidth: 2 },
  cornerBR: { bottom: 30, right: 30, borderBottomWidth: 2, borderRightWidth: 2 },
  
  gridLineHorizontal1: { position: 'absolute', left: 0, right: 0, top: height * 0.33, height: 0.5, backgroundColor: 'rgba(255,255,255,0.15)' },
  gridLineHorizontal2: { position: 'absolute', left: 0, right: 0, top: height * 0.66, height: 0.5, backgroundColor: 'rgba(255,255,255,0.15)' },
  gridLineVertical1: { position: 'absolute', top: 0, bottom: 0, left: width * 0.33, width: 0.5, backgroundColor: 'rgba(255,255,255,0.15)' },
  gridLineVertical2: { position: 'absolute', top: 0, bottom: 0, left: width * 0.66, width: 0.5, backgroundColor: 'rgba(255,255,255,0.15)' },
  
  viewfinderStats: { position: 'absolute', bottom: 120, left: 30, right: 30, flexDirection: 'row', justifyContent: 'space-between', opacity: 0.8 },
  statText: { fontSize: 11, fontWeight: 'bold', color: colors.background, letterSpacing: 1, fontFamily: 'monospace' },

  // Self Preview thumbnail
  selfPreview: { position: 'absolute', top: 80, right: 20, width: 100, height: 150, borderRadius: radius.lg, overflow: 'hidden', borderWidth: 2, borderColor: colors.background, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 5 },
  selfPreviewOverlay: { position: 'absolute', bottom: 4, left: 4, backgroundColor: 'rgba(0,0,0,0.5)', paddingHorizontal: spacing[1.5], paddingVertical: spacing[0.5], borderRadius: radius.sm },
  selfPreviewText: { fontSize: 9, color: colors.background, fontWeight: 'bold' }
});
