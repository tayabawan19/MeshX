import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity, TouchableWithoutFeedback } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  withDelay,
  withSpring,
  Easing,
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { Mic, MicOff, Video, VideoOff, Volume2, PhoneOff, Phone, RefreshCw, Users, AlertCircle } from 'lucide-react-native';
import { useChatStore } from '../../store/useChatStore';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { triggerHaptic } from '../../utils/haptics';

const ClayRippleRing: React.FC<{ delay: number; color: string }> = ({ delay, color }) => {
  const scale = useSharedValue(1);
  const opacity = useSharedValue(0.5);

  useEffect(() => {
    scale.value = withDelay(
      delay,
      withRepeat(
        withTiming(2.2, { duration: 2400, easing: Easing.out(Easing.sin) }),
        -1,
        false
      )
    );
    opacity.value = withDelay(
      delay,
      withRepeat(
        withTiming(0, { duration: 2400, easing: Easing.out(Easing.sin) }),
        -1,
        false
      )
    );
  }, [delay]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: opacity.value,
  }));

  return (
    <Animated.View
      style={[
        styles.rippleRing,
        { borderColor: color, backgroundColor: color },
        animatedStyle,
      ]}
    />
  );
};

export const CallModal: React.FC<{ navigation?: any }> = ({ navigation }) => {
  const insets = useSafeAreaInsets();

  const {
    activeCall,
    acceptCall,
    declineCall,
    endCall,
    toggleMuteCall,
    toggleVideoCall,
    toggleSpeakerCall,
    toggleCameraFlip,
  } = useChatStore();

  const [seconds, setSeconds] = useState(0);

  const acceptScale = useSharedValue(1);
  const declineScale = useSharedValue(1);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (activeCall && activeCall.status === 'connected') {
      interval = setInterval(() => {
        setSeconds((prev) => prev + 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [activeCall?.status]);

  if (!activeCall) return null;

  const isIncoming = activeCall.isIncoming && activeCall.status !== 'connected';
  const isBusy = activeCall.status === 'busy';

  const formatTime = (secs: number) => {
    const mins = Math.floor(secs / 60);
    const remainingSecs = secs % 60;
    return `${mins.toString().padStart(2, '0')}:${remainingSecs.toString().padStart(2, '0')}`;
  };

  const handleAcceptCall = () => {
    triggerHaptic('success');
    acceptCall();
  };

  const handleDeclineCall = () => {
    triggerHaptic('heavy');
    declineCall();
    if (navigation) navigation.goBack();
  };

  const handleEndCall = () => {
    triggerHaptic('heavy');
    endCall();
    if (navigation) navigation.goBack();
  };

  const isConnected = activeCall.status === 'connected';

  const acceptAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: acceptScale.value }],
  }));

  const declineAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: declineScale.value }],
  }));

  return (
    <View
      style={[
        styles.container,
        {
          paddingTop: Math.max(insets.top + 16, 40),
          paddingBottom: Math.max(insets.bottom + 16, 24),
        },
      ]}
    >
      {/* Header Info */}
      <View style={styles.header}>
        {isBusy ? (
          <View style={styles.busyContainer}>
            <AlertCircle size={64} color="#E57373" style={{ marginBottom: 16 }} />
            <Text style={styles.peerName}>{activeCall.peerName}</Text>
            <Text style={[styles.callStatus, { color: '#E57373' }]}>User is busy on another call</Text>
          </View>
        ) : (
          <>
            {(!isConnected || activeCall.type === 'voice' || !activeCall.isVideoEnabled) && (
              <View style={styles.avatarHolder}>
                <ClayRippleRing delay={0} color="rgba(139, 127, 209, 0.22)" />
                <ClayRippleRing delay={800} color="rgba(123, 147, 214, 0.18)" />
                <ClayRippleRing delay={1600} color="rgba(111, 175, 160, 0.15)" />

                <View style={styles.clayAvatarWrapper}>
                  {activeCall.isGroupCall ? (
                    <View style={[styles.avatar, { backgroundColor: '#7C3AED', justifyContent: 'center', alignItems: 'center' }]}>
                      <Users size={48} color="#FFFFFF" />
                    </View>
                  ) : (
                    <Image
                      source={{
                        uri:
                          activeCall.peerAvatar ||
                          'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=300&q=80',
                      }}
                      style={styles.avatar}
                    />
                  )}
                </View>
              </View>
            )}
            <Text style={styles.peerName}>{activeCall.peerName}</Text>
            <Text style={styles.callStatus}>
              {isIncoming
                ? `Incoming ${activeCall.isGroupCall ? 'Group ' : ''}${activeCall.type === 'video' ? 'Video' : 'Voice'} Call...`
                : activeCall.status === 'calling'
                ? `Calling ${activeCall.isGroupCall ? 'Group' : ''}...`
                : `${activeCall.isGroupCall ? 'Group ' : ''}${activeCall.type === 'video' ? 'Video' : 'Voice'} Call • ${formatTime(seconds)}`}
            </Text>
          </>
        )}
      </View>

      {/* Video Canvas Container (Support 1:1 or Group Multi-Tile Grid) */}
      {!isIncoming && !isBusy && activeCall.type === 'video' && (
        <View style={styles.videoCanvas}>
          {activeCall.isGroupCall ? (
            <View style={styles.groupVideoGrid}>
              <View style={styles.gridTile}>
                <Image
                  source={{ uri: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80' }}
                  style={StyleSheet.absoluteFillObject}
                />
                <Text style={styles.tileLabel}>Alex</Text>
              </View>
              <View style={styles.gridTile}>
                <Image
                  source={{ uri: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=400&q=80' }}
                  style={StyleSheet.absoluteFillObject}
                />
                <Text style={styles.tileLabel}>David</Text>
              </View>
            </View>
          ) : (
            <>
              <Image
                source={{
                  uri:
                    activeCall.peerAvatar ||
                    'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=800&q=80',
                }}
                style={StyleSheet.absoluteFillObject}
              />
              <View style={styles.videoOverlay}>
                <Text style={styles.hdBadge}>MeshX RTC HD</Text>
              </View>
            </>
          )}

          {activeCall.isVideoEnabled && (
            <View style={styles.pipView}>
              <LinearGradient colors={['#8B7FD1', '#7B93D6']} style={StyleSheet.absoluteFillObject} />
              <Text style={styles.pipLabel}>You</Text>
            </View>
          )}
        </View>
      )}

      {/* Incoming Call Controls */}
      {isIncoming ? (
        <View style={styles.incomingControlsRow}>
          <TouchableWithoutFeedback
            onPressIn={() => (declineScale.value = withSpring(0.92, { damping: 14, stiffness: 240 }))}
            onPressOut={() => (declineScale.value = withSpring(1, { damping: 12, stiffness: 180 }))}
            onPress={handleDeclineCall}
          >
            <Animated.View style={[styles.declineClayBtn, declineAnimatedStyle]}>
              <PhoneOff size={28} color="#FFFFFF" />
              <Text style={styles.btnLabel}>Decline</Text>
            </Animated.View>
          </TouchableWithoutFeedback>

          <TouchableWithoutFeedback
            onPressIn={() => (acceptScale.value = withSpring(0.92, { damping: 14, stiffness: 240 }))}
            onPressOut={() => (acceptScale.value = withSpring(1, { damping: 12, stiffness: 180 }))}
            onPress={handleAcceptCall}
          >
            <Animated.View style={[styles.acceptClayBtn, acceptAnimatedStyle]}>
              <Phone size={28} color="#FFFFFF" />
              <Text style={styles.btnLabel}>Accept</Text>
            </Animated.View>
          </TouchableWithoutFeedback>
        </View>
      ) : isBusy ? (
        <TouchableOpacity style={styles.endClayBtn} onPress={handleEndCall}>
          <PhoneOff size={24} color="#FFFFFF" />
        </TouchableOpacity>
      ) : (
        /* Connected / Outgoing Call Controls Bar */
        <View style={styles.controlsRow}>
          <TouchableOpacity
            style={[styles.controlBtn, activeCall.isMuted && styles.controlBtnActive]}
            onPress={() => {
              triggerHaptic('selection');
              toggleMuteCall();
            }}
          >
            {activeCall.isMuted ? <MicOff size={24} color="#E57373" /> : <Mic size={24} color="#FFFFFF" />}
          </TouchableOpacity>

          {activeCall.type === 'video' && (
            <TouchableOpacity
              style={[styles.controlBtn, !activeCall.isVideoEnabled && styles.controlBtnActive]}
              onPress={() => {
                triggerHaptic('selection');
                toggleVideoCall();
              }}
            >
              {activeCall.isVideoEnabled ? <Video size={24} color="#FFFFFF" /> : <VideoOff size={24} color="#E57373" />}
            </TouchableOpacity>
          )}

          {activeCall.type === 'video' && activeCall.isVideoEnabled && (
            <TouchableOpacity
              style={styles.controlBtn}
              onPress={() => {
                triggerHaptic('selection');
                toggleCameraFlip();
              }}
            >
              <RefreshCw size={22} color="#FFFFFF" />
            </TouchableOpacity>
          )}

          <TouchableOpacity
            style={[styles.controlBtn, activeCall.isSpeakerOn && styles.controlBtnActive]}
            onPress={() => {
              triggerHaptic('selection');
              toggleSpeakerCall();
            }}
          >
            <Volume2 size={24} color={activeCall.isSpeakerOn ? '#8B7FD1' : '#FFFFFF'} />
          </TouchableOpacity>

          <TouchableOpacity style={styles.endClayBtn} onPress={handleEndCall}>
            <PhoneOff size={24} color="#FFFFFF" />
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#12121A',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  header: {
    alignItems: 'center',
    marginTop: 40,
  },
  busyContainer: {
    alignItems: 'center',
    marginVertical: 40,
  },
  avatarHolder: {
    position: 'relative',
    width: 140,
    height: 140,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 28,
  },
  rippleRing: {
    position: 'absolute',
    width: 140,
    height: 140,
    borderRadius: 70,
    borderWidth: 2.5,
  },
  clayAvatarWrapper: {
    width: 130,
    height: 130,
    borderRadius: 65,
    borderWidth: 3,
    borderTopColor: 'rgba(255, 255, 255, 0.25)',
    borderLeftColor: 'rgba(255, 255, 255, 0.20)',
    borderBottomColor: 'rgba(0, 0, 0, 0.50)',
    borderRightColor: 'rgba(0, 0, 0, 0.35)',
    overflow: 'hidden',
    elevation: 12,
  },
  avatar: {
    width: '100%',
    height: '100%',
  },
  peerName: {
    fontSize: 28,
    fontWeight: '900',
    color: '#FFFFFF',
    marginBottom: 8,
  },
  callStatus: {
    fontSize: 16,
    color: '#A5A5BA',
    fontWeight: '600',
  },
  videoCanvas: {
    width: '100%',
    height: 380,
    borderRadius: 32,
    borderWidth: 2,
    borderTopColor: 'rgba(255,255,255,0.2)',
    borderLeftColor: 'rgba(255,255,255,0.15)',
    borderBottomColor: 'rgba(0,0,0,0.5)',
    borderRightColor: 'rgba(0,0,0,0.3)',
    overflow: 'hidden',
    position: 'relative',
    backgroundColor: '#1E1E2C',
    elevation: 8,
  },
  groupVideoGrid: {
    flex: 1,
    flexDirection: 'row',
    gap: 4,
  },
  gridTile: {
    flex: 1,
    position: 'relative',
    overflow: 'hidden',
    backgroundColor: '#2A2A3C',
  },
  tileLabel: {
    position: 'absolute',
    bottom: 8,
    left: 8,
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '700',
    backgroundColor: 'rgba(0,0,0,0.6)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  videoOverlay: {
    position: 'absolute',
    top: 14,
    left: 14,
  },
  hdBadge: {
    backgroundColor: 'rgba(0,0,0,0.65)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 10,
    color: '#6FAFA0',
    fontSize: 11,
    fontWeight: '700',
  },
  pipView: {
    position: 'absolute',
    bottom: 12,
    right: 12,
    width: 90,
    height: 130,
    borderRadius: 18,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  pipLabel: { color: '#FFFFFF', fontWeight: '700', fontSize: 12 },
  controlsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    marginBottom: 30,
    backgroundColor: '#1B1B26',
    paddingHorizontal: 18,
    paddingVertical: 14,
    borderRadius: 36,
    borderWidth: 1.8,
    borderTopColor: 'rgba(255,255,255,0.16)',
    borderBottomColor: 'rgba(0,0,0,0.4)',
    elevation: 8,
  },
  controlBtn: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  controlBtnActive: { backgroundColor: '#FFFFFF' },
  endClayBtn: {
    width: 54,
    height: 54,
    borderRadius: 27,
    backgroundColor: '#E57373',
    borderWidth: 1.5,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 8,
  },
  incomingControlsRow: { flexDirection: 'row', gap: 60, marginBottom: 50 },
  declineClayBtn: {
    width: 76,
    height: 76,
    borderRadius: 38,
    backgroundColor: '#E57373',
    borderWidth: 2,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 8,
  },
  acceptClayBtn: {
    width: 76,
    height: 76,
    borderRadius: 38,
    backgroundColor: '#6FAFA0',
    borderWidth: 2,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 8,
  },
  btnLabel: { color: '#FFFFFF', fontSize: 12, fontWeight: '700', marginTop: 4 },
});
