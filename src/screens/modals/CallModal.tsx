import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity, Pressable } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { Mic, MicOff, Video, VideoOff, Volume2, PhoneOff, Phone, RefreshCw, Users, AlertCircle } from 'lucide-react-native';
import { useChatStore } from '../../store/useChatStore';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { triggerHaptic } from '../../utils/haptics';

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
    <LinearGradient
      colors={['#8E0E2C', '#540F27', '#251025', '#160D1E']}
      start={{ x: 0, y: 0 }}
      end={{ x: 0.85, y: 1 }}
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
            <AlertCircle size={56} color="#FFCDD2" style={{ marginBottom: 14 }} />
            <Text style={styles.peerName}>{activeCall.peerName}</Text>
            <Text style={styles.callStatus}>User is busy on another call</Text>
          </View>
        ) : (
          <>
            {(!isConnected || activeCall.type === 'voice' || !activeCall.isVideoEnabled) && (
              <View style={styles.avatarHolder}>
                <View style={styles.avatarWrapper}>
                  {activeCall.isGroupCall ? (
                    <View style={[styles.avatar, { backgroundColor: '#8E0E2C', justifyContent: 'center', alignItems: 'center' }]}>
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
                ? `Incoming ${activeCall.isGroupCall ? 'Group ' : ''}${activeCall.type === 'video' ? 'Video' : 'Voice'} Call`
                : activeCall.status === 'calling'
                ? `Calling ${activeCall.isGroupCall ? 'Group' : ''}...`
                : `${activeCall.isGroupCall ? 'Group ' : ''}${activeCall.type === 'video' ? 'Video' : 'Voice'} • ${formatTime(seconds)}`}
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
                <Text style={styles.hdBadge}>1080p HD</Text>
              </View>
            </>
          )}

          {activeCall.isVideoEnabled && (
            <View style={styles.pipView}>
              <View style={[StyleSheet.absoluteFillObject, { backgroundColor: '#8E0E2C' }]} />
              <Text style={styles.pipLabel}>You</Text>
            </View>
          )}
        </View>
      )}

      {/* Incoming Call Controls */}
      {isIncoming ? (
        <View style={styles.incomingControlsRow}>
          {/* Decline Button */}
          <Pressable
            onPressIn={() => (declineScale.value = withTiming(0.92, { duration: 100 }))}
            onPressOut={() => (declineScale.value = withTiming(1, { duration: 100 }))}
            onPress={handleDeclineCall}
          >
            <Animated.View style={[styles.declineBtn, declineAnimatedStyle]}>
              <PhoneOff size={28} color="#FFFFFF" strokeWidth={2.2} />
              <Text style={styles.btnLabel}>Decline</Text>
            </Animated.View>
          </Pressable>

          {/* Accept Button */}
          <Pressable
            onPressIn={() => (acceptScale.value = withTiming(0.92, { duration: 100 }))}
            onPressOut={() => (acceptScale.value = withTiming(1, { duration: 100 }))}
            onPress={handleAcceptCall}
          >
            <Animated.View style={[styles.acceptBtn, acceptAnimatedStyle]}>
              <Phone size={28} color="#FFFFFF" strokeWidth={2.2} />
              <Text style={styles.btnLabel}>Accept</Text>
            </Animated.View>
          </Pressable>
        </View>
      ) : isBusy ? (
        <TouchableOpacity style={styles.endBtn} onPress={handleEndCall}>
          <PhoneOff size={22} color="#FFFFFF" strokeWidth={2.2} />
        </TouchableOpacity>
      ) : (
        /* Connected Call Controls Bar */
        <View style={styles.controlsRow}>
          <TouchableOpacity
            style={[styles.controlBtn, activeCall.isMuted && styles.controlBtnActive]}
            onPress={() => {
              triggerHaptic('selection');
              toggleMuteCall();
            }}
          >
            {activeCall.isMuted ? <MicOff size={22} color="#EF5350" /> : <Mic size={22} color="#FFFFFF" />}
          </TouchableOpacity>

          {activeCall.type === 'video' && (
            <TouchableOpacity
              style={[styles.controlBtn, !activeCall.isVideoEnabled && styles.controlBtnActive]}
              onPress={() => {
                triggerHaptic('selection');
                toggleVideoCall();
              }}
            >
              {activeCall.isVideoEnabled ? <Video size={22} color="#FFFFFF" /> : <VideoOff size={22} color="#EF5350" />}
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
              <RefreshCw size={20} color="#FFFFFF" />
            </TouchableOpacity>
          )}

          <TouchableOpacity
            style={[styles.controlBtn, activeCall.isSpeakerOn && styles.controlBtnActive]}
            onPress={() => {
              triggerHaptic('selection');
              toggleSpeakerCall();
            }}
          >
            <Volume2 size={22} color={activeCall.isSpeakerOn ? '#8E0E2C' : '#FFFFFF'} />
          </TouchableOpacity>

          <TouchableOpacity style={styles.endBtn} onPress={handleEndCall}>
            <PhoneOff size={22} color="#FFFFFF" strokeWidth={2.2} />
          </TouchableOpacity>
        </View>
      )}
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  header: {
    alignItems: 'center',
    marginTop: 32,
  },
  busyContainer: {
    alignItems: 'center',
    marginVertical: 32,
  },
  avatarHolder: {
    width: 120,
    height: 120,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  avatarWrapper: {
    width: 110,
    height: 110,
    borderRadius: 55,
    overflow: 'hidden',
    borderWidth: 3,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  avatar: {
    width: '100%',
    height: '100%',
  },
  peerName: {
    fontSize: 24,
    fontWeight: '800',
    color: '#FFFFFF',
    marginBottom: 4,
    letterSpacing: -0.3,
  },
  callStatus: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.75)',
    fontWeight: '500',
  },
  videoCanvas: {
    width: '100%',
    height: 360,
    borderRadius: 20,
    overflow: 'hidden',
    position: 'relative',
    backgroundColor: '#160D1E',
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
  },
  tileLabel: {
    position: 'absolute',
    bottom: 8,
    left: 8,
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '600',
    backgroundColor: 'rgba(0,0,0,0.6)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  videoOverlay: {
    position: 'absolute',
    top: 12,
    left: 12,
  },
  hdBadge: {
    backgroundColor: 'rgba(0,0,0,0.6)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '700',
  },
  pipView: {
    position: 'absolute',
    bottom: 12,
    right: 12,
    width: 80,
    height: 110,
    borderRadius: 12,
    overflow: 'hidden',
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  pipLabel: { color: '#FFFFFF', fontWeight: '600', fontSize: 11 },
  controlsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 28,
    marginBottom: 24,
  },
  controlBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255,255,255,0.12)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  controlBtnActive: { backgroundColor: '#FFFFFF' },
  endBtn: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: '#C62828',
    justifyContent: 'center',
    alignItems: 'center',
  },
  incomingControlsRow: { flexDirection: 'row', gap: 40, marginBottom: 40 },
  declineBtn: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: '#C62828',
    justifyContent: 'center',
    alignItems: 'center',
  },
  acceptBtn: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: '#2E7D32',
    justifyContent: 'center',
    alignItems: 'center',
  },
  btnLabel: { color: '#FFFFFF', fontSize: 11, fontWeight: '700', marginTop: 3 },
});
