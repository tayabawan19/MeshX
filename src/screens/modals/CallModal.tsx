import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Mic, MicOff, Video, VideoOff, Volume2, PhoneOff, Phone, RefreshCw } from 'lucide-react-native';
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

  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (activeCall?.status === 'connected') {
      timer = setInterval(() => {
        setSeconds((prev) => {
          const next = prev + 1;
          if (activeCall) activeCall.durationSeconds = next;
          return next;
        });
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [activeCall?.status]);

  if (!activeCall) {
    return (
      <View style={styles.emptyContainer}>
        <Text style={{ color: '#fff', fontSize: 16 }}>Call Ended</Text>
      </View>
    );
  }

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  const handleEndCall = () => {
    triggerHaptic('heavy');
    endCall();
    if (navigation) navigation.goBack();
  };

  const handleAcceptCall = () => {
    triggerHaptic('success');
    acceptCall();
  };

  const handleDeclineCall = () => {
    triggerHaptic('error');
    declineCall();
    if (navigation) navigation.goBack();
  };

  const isIncoming = activeCall.isIncoming;
  const isConnected = activeCall.status === 'connected';

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
      <LinearGradient colors={['#0B0B14', '#17153B', '#0B0B14']} style={StyleSheet.absoluteFillObject} />

      {/* Header Info */}
      <View style={styles.header}>
        {(!isConnected || activeCall.type === 'voice' || !activeCall.isVideoEnabled) && (
          <Image
            source={{
              uri:
                activeCall.peerAvatar ||
                'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=300&q=80',
            }}
            style={styles.avatar}
          />
        )}
        <Text style={styles.peerName}>{activeCall.peerName}</Text>
        <Text style={styles.callStatus}>
          {isIncoming
            ? `Incoming ${activeCall.type === 'video' ? 'Video' : 'Voice'} Call...`
            : activeCall.status === 'calling'
            ? 'Calling...'
            : `${activeCall.type === 'video' ? 'Video' : 'Voice'} Call • ${formatTime(seconds)}`}
        </Text>
      </View>

      {/* Video Canvas Container */}
      {!isIncoming && activeCall.type === 'video' && (
        <View style={styles.videoCanvas}>
          {/* Remote Video Stream View */}
          <Image
            source={{
              uri:
                activeCall.peerAvatar ||
                'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=800&q=80',
            }}
            style={StyleSheet.absoluteFillObject}
          />
          <View style={styles.videoOverlay}>
            <Text style={styles.hdBadge}>Agora RTC HD 1080p</Text>
          </View>

          {/* Local User PIP View */}
          {activeCall.isVideoEnabled && (
            <View style={styles.pipView}>
              <LinearGradient colors={['#3B82F6', '#1D4ED8']} style={StyleSheet.absoluteFillObject} />
              <Text style={styles.pipLabel}>You</Text>
            </View>
          )}
        </View>
      )}

      {/* Incoming Call Controls */}
      {isIncoming ? (
        <View style={styles.incomingControlsRow}>
          <TouchableOpacity style={styles.declineBtn} onPress={handleDeclineCall}>
            <PhoneOff size={28} color="#FFFFFF" />
            <Text style={styles.btnLabel}>Decline</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.acceptBtn} onPress={handleAcceptCall}>
            <Phone size={28} color="#FFFFFF" />
            <Text style={styles.btnLabel}>Accept</Text>
          </TouchableOpacity>
        </View>
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
            {activeCall.isMuted ? <MicOff size={24} color="#ef4444" /> : <Mic size={24} color="#FFFFFF" />}
          </TouchableOpacity>

          {activeCall.type === 'video' && (
            <TouchableOpacity
              style={[styles.controlBtn, !activeCall.isVideoEnabled && styles.controlBtnActive]}
              onPress={() => {
                triggerHaptic('selection');
                toggleVideoCall();
              }}
            >
              {activeCall.isVideoEnabled ? <Video size={24} color="#FFFFFF" /> : <VideoOff size={24} color="#ef4444" />}
            </TouchableOpacity>
          )}

          <TouchableOpacity
            style={[styles.controlBtn, activeCall.isSpeakerOn && styles.controlBtnActive]}
            onPress={() => {
              triggerHaptic('selection');
              toggleSpeakerCall();
            }}
          >
            <Volume2 size={24} color={activeCall.isSpeakerOn ? '#6366f1' : '#FFFFFF'} />
          </TouchableOpacity>

          {activeCall.type === 'video' && (
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

          <TouchableOpacity style={styles.endCallBtn} onPress={handleEndCall}>
            <PhoneOff size={28} color="#FFFFFF" />
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0B0B14', justifyContent: 'space-between', paddingVertical: 50, paddingHorizontal: 20 },
  emptyContainer: { flex: 1, backgroundColor: '#000', justifyContent: 'center', alignItems: 'center' },
  header: { alignItems: 'center', marginTop: 10 },
  avatar: { width: 110, height: 110, borderRadius: 55, borderWidth: 3, borderColor: '#6366f1', marginBottom: 16 },
  peerName: { fontSize: 24, fontWeight: '800', color: '#FFFFFF', marginBottom: 6 },
  callStatus: { fontSize: 14, color: '#a5b4fc', fontWeight: '600' },
  videoCanvas: { flex: 1, marginVertical: 20, borderRadius: 24, overflow: 'hidden', backgroundColor: '#1e1b4b', position: 'relative' },
  videoOverlay: { position: 'absolute', top: 12, left: 12, backgroundColor: 'rgba(0,0,0,0.65)', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
  hdBadge: { color: '#10b981', fontSize: 11, fontWeight: '700' },
  pipView: { position: 'absolute', top: 14, right: 14, width: 90, height: 120, borderRadius: 14, overflow: 'hidden', borderWidth: 2, borderColor: '#FFFFFF', justifyContent: 'center', alignItems: 'center' },
  pipLabel: { color: '#FFFFFF', fontWeight: '700', fontSize: 12 },
  incomingControlsRow: { flexDirection: 'row', justifyContent: 'space-around', alignItems: 'center', width: '100%', marginBottom: 30 },
  acceptBtn: { width: 72, height: 72, borderRadius: 36, backgroundColor: '#10B981', justifyContent: 'center', alignItems: 'center', elevation: 8 },
  declineBtn: { width: 72, height: 72, borderRadius: 36, backgroundColor: '#EF4444', justifyContent: 'center', alignItems: 'center', elevation: 8 },
  btnLabel: { color: '#FFFFFF', fontSize: 12, fontWeight: '600', marginTop: 4 },
  controlsRow: { flexDirection: 'row', justifyContent: 'space-around', alignItems: 'center', width: '100%', marginBottom: 10 },
  controlBtn: { width: 56, height: 56, borderRadius: 28, backgroundColor: 'rgba(255,255,255,0.15)', justifyContent: 'center', alignItems: 'center' },
  controlBtnActive: { backgroundColor: 'rgba(255,255,255,0.3)' },
  endCallBtn: { width: 64, height: 64, borderRadius: 32, backgroundColor: '#ef4444', justifyContent: 'center', alignItems: 'center' },
});
