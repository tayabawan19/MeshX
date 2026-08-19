import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity, Pressable } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  withDelay,
  withSpring,
  Easing,
} from 'react-native-reanimated';
import { Mic, MicOff, Video, VideoOff, Volume2, PhoneOff, Phone, RefreshCw, Users, AlertCircle } from 'lucide-react-native';
import { useChatStore } from '../../store/useChatStore';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { triggerHaptic } from '../../utils/haptics';

const BoldRippleRing: React.FC<{ delay: number; color: string }> = ({ delay, color }) => {
  const scale = useSharedValue(1);
  const opacity = useSharedValue(0.6);

  useEffect(() => {
    scale.value = withDelay(
      delay,
      withRepeat(
        withTiming(2.2, { duration: 2200, easing: Easing.out(Easing.sin) }),
        -1,
        false
      )
    );
    opacity.value = withDelay(
      delay,
      withRepeat(
        withTiming(0, { duration: 2200, easing: Easing.out(Easing.sin) }),
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
        { borderColor: color },
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

  const acceptOffset = useSharedValue(0);
  const declineOffset = useSharedValue(0);

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
    transform: [
      { translateX: acceptOffset.value },
      { translateY: acceptOffset.value },
    ],
  }));

  const declineAnimatedStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: declineOffset.value },
      { translateY: declineOffset.value },
    ],
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
            <AlertCircle size={64} color="#FF4D5E" style={{ marginBottom: 16 }} />
            <Text style={styles.peerName}>{activeCall.peerName}</Text>
            <Text style={[styles.callStatus, { color: '#FF4D5E' }]}>User is busy on another call</Text>
          </View>
        ) : (
          <>
            {(!isConnected || activeCall.type === 'voice' || !activeCall.isVideoEnabled) && (
              <View style={styles.avatarHolder}>
                <BoldRippleRing delay={0} color="#FF4D5E" />
                <BoldRippleRing delay={800} color="#C6FF3D" />

                <View style={styles.avatarWrapper}>
                  {activeCall.isGroupCall ? (
                    <View style={[styles.avatar, { backgroundColor: '#2E4BFF', justifyContent: 'center', alignItems: 'center' }]}>
                      <Users size={52} color="#FFFFFF" />
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

      {/* Video Canvas Container */}
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
                <Text style={styles.hdBadge}>MeshX 1080p HD</Text>
              </View>
            </>
          )}

          {activeCall.isVideoEnabled && (
            <View style={styles.pipView}>
              <View style={[StyleSheet.absoluteFillObject, { backgroundColor: '#2E4BFF' }]} />
              <Text style={styles.pipLabel}>You</Text>
            </View>
          )}
        </View>
      )}

      {/* Incoming Call Controls */}
      {isIncoming ? (
        <View style={styles.incomingControlsRow}>
          {/* Decline Button */}
          <View style={styles.bigBtnWrapper}>
            <View style={styles.bigBtnShadow} />
            <Pressable
              onPressIn={() => (declineOffset.value = withSpring(4, { damping: 14, stiffness: 280 }))}
              onPressOut={() => (declineOffset.value = withSpring(0, { damping: 12, stiffness: 220 }))}
              onPress={handleDeclineCall}
            >
              <Animated.View style={[styles.declineBtn, declineAnimatedStyle]}>
                <PhoneOff size={30} color="#FFFFFF" strokeWidth={2.5} />
                <Text style={styles.btnLabel}>Decline</Text>
              </Animated.View>
            </Pressable>
          </View>

          {/* Accept Button */}
          <View style={styles.bigBtnWrapper}>
            <View style={styles.bigBtnShadow} />
            <Pressable
              onPressIn={() => (acceptOffset.value = withSpring(4, { damping: 14, stiffness: 280 }))}
              onPressOut={() => (acceptOffset.value = withSpring(0, { damping: 12, stiffness: 220 }))}
              onPress={handleAcceptCall}
            >
              <Animated.View style={[styles.acceptBtn, acceptAnimatedStyle]}>
                <Phone size={30} color="#100F17" strokeWidth={2.5} />
                <Text style={[styles.btnLabel, { color: '#100F17' }]}>Accept</Text>
              </Animated.View>
            </Pressable>
          </View>
        </View>
      ) : isBusy ? (
        <View style={styles.endBtnWrapper}>
          <View style={styles.endBtnShadow} />
          <TouchableOpacity style={styles.endBtn} onPress={handleEndCall}>
            <PhoneOff size={24} color="#FFFFFF" strokeWidth={2.5} />
          </TouchableOpacity>
        </View>
      ) : (
        /* Connected Call Controls Bar */
        <View style={styles.controlsOuter}>
          <View style={styles.controlsShadow} />
          <View style={styles.controlsRow}>
            <TouchableOpacity
              style={[styles.controlBtn, activeCall.isMuted && styles.controlBtnActive]}
              onPress={() => {
                triggerHaptic('selection');
                toggleMuteCall();
              }}
            >
              {activeCall.isMuted ? <MicOff size={24} color="#FF4D5E" /> : <Mic size={24} color="#FFFFFF" />}
            </TouchableOpacity>

            {activeCall.type === 'video' && (
              <TouchableOpacity
                style={[styles.controlBtn, !activeCall.isVideoEnabled && styles.controlBtnActive]}
                onPress={() => {
                  triggerHaptic('selection');
                  toggleVideoCall();
                }}
              >
                {activeCall.isVideoEnabled ? <Video size={24} color="#FFFFFF" /> : <VideoOff size={24} color="#FF4D5E" />}
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
              <Volume2 size={24} color={activeCall.isSpeakerOn ? '#C6FF3D' : '#FFFFFF'} />
            </TouchableOpacity>

            <TouchableOpacity style={styles.endBtn} onPress={handleEndCall}>
              <PhoneOff size={24} color="#FFFFFF" strokeWidth={2.5} />
            </TouchableOpacity>
          </View>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#100F17',
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
    borderWidth: 3,
  },
  avatarWrapper: {
    width: 130,
    height: 130,
    borderRadius: 65,
    borderWidth: 3,
    borderColor: '#000000',
    overflow: 'hidden',
    zIndex: 1,
  },
  avatar: {
    width: '100%',
    height: '100%',
  },
  peerName: {
    fontSize: 30,
    fontWeight: '900',
    color: '#FFFFFF',
    marginBottom: 8,
    letterSpacing: -0.5,
  },
  callStatus: {
    fontSize: 16,
    color: '#A5A5BA',
    fontWeight: '700',
  },
  videoCanvas: {
    width: '100%',
    height: 380,
    borderRadius: 24,
    borderWidth: 2,
    borderColor: '#000000',
    overflow: 'hidden',
    position: 'relative',
    backgroundColor: '#1C1A2E',
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
    fontSize: 12,
    fontWeight: '900',
    backgroundColor: 'rgba(0,0,0,0.7)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  videoOverlay: {
    position: 'absolute',
    top: 14,
    left: 14,
  },
  hdBadge: {
    backgroundColor: '#000000',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: '#C6FF3D',
    color: '#C6FF3D',
    fontSize: 11,
    fontWeight: '900',
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
    borderColor: '#000000',
    justifyContent: 'center',
    alignItems: 'center',
  },
  pipLabel: { color: '#FFFFFF', fontWeight: '900', fontSize: 13 },
  controlsOuter: {
    position: 'relative',
    marginBottom: 30,
  },
  controlsShadow: {
    position: 'absolute',
    top: 5,
    left: 5,
    right: -5,
    bottom: -5,
    borderRadius: 36,
    backgroundColor: '#000000',
  },
  controlsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    backgroundColor: '#1C1A2E',
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderRadius: 36,
    borderWidth: 2,
    borderColor: '#000000',
    zIndex: 1,
  },
  controlBtn: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderWidth: 2,
    borderColor: '#000000',
    justifyContent: 'center',
    alignItems: 'center',
  },
  controlBtnActive: { backgroundColor: '#FFFFFF' },
  endBtnWrapper: { position: 'relative' },
  endBtnShadow: {
    position: 'absolute',
    top: 4,
    left: 4,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#000000',
  },
  endBtn: {
    width: 54,
    height: 54,
    borderRadius: 27,
    backgroundColor: '#FF4D5E', // Hot Coral
    borderWidth: 2,
    borderColor: '#000000',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1,
  },
  incomingControlsRow: { flexDirection: 'row', gap: 50, marginBottom: 50 },
  bigBtnWrapper: { position: 'relative' },
  bigBtnShadow: {
    position: 'absolute',
    top: 5,
    left: 5,
    width: 82,
    height: 82,
    borderRadius: 41,
    backgroundColor: '#000000',
  },
  declineBtn: {
    width: 82,
    height: 82,
    borderRadius: 41,
    backgroundColor: '#FF4D5E', // Hot Coral
    borderWidth: 2,
    borderColor: '#000000',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1,
  },
  acceptBtn: {
    width: 82,
    height: 82,
    borderRadius: 41,
    backgroundColor: '#C6FF3D', // Electric Lime
    borderWidth: 2,
    borderColor: '#000000',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1,
  },
  btnLabel: { color: '#FFFFFF', fontSize: 13, fontWeight: '900', marginTop: 4 },
});
