import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Mic, MicOff, Video, VideoOff, Volume2, PhoneOff, RefreshCw } from 'lucide-react-native';
import { useChatStore } from '../../store/useChatStore';
import { triggerHaptic } from '../../utils/haptics';

export const CallModal: React.FC<{ navigation: any }> = ({ navigation }) => {
  const {
    activeCall,
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
      timer = setInterval(() => setSeconds((prev) => prev + 1), 1000);
    }
    return () => clearInterval(timer);
  }, [activeCall?.status]);

  if (!activeCall) {
    return (
      <View style={styles.emptyContainer}>
        <Text style={{ color: '#fff' }}>Call Ended</Text>
      </View>
    );
  }

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  const handleEndCall = () => {
    endCall();
    navigation.goBack();
  };

  return (
    <View style={styles.container}>
      <LinearGradient colors={['#0F0F1A', '#1E1B4B', '#0F0F1A']} style={StyleSheet.absoluteFillObject} />

      {/* Peer Header */}
      <View style={styles.header}>
        <Image
          source={{
            uri:
              activeCall.peerAvatar ||
              'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=300&q=80',
          }}
          style={styles.avatar}
        />
        <Text style={styles.peerName}>{activeCall.peerName}</Text>
        <Text style={styles.callStatus}>
          {activeCall.status === 'calling'
            ? 'Calling...'
            : `${activeCall.type === 'video' ? 'Video' : 'Voice'} Call • ${formatTime(seconds)}`}
        </Text>
      </View>

      {/* Video Simulation Canvas */}
      {activeCall.type === 'video' && activeCall.isVideoEnabled && (
        <View style={styles.videoCanvas}>
          <Image
            source={{ uri: activeCall.peerAvatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb' }}
            style={StyleSheet.absoluteFillObject}
          />
          <View style={styles.videoOverlay}>
            <Text style={styles.hdBadge}>Agora RTC HD 1080p</Text>
          </View>
        </View>
      )}

      {/* Control Buttons Bar */}
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
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0F0F1A', justifyContent: 'space-between', paddingVertical: 60, paddingHorizontal: 24 },
  emptyContainer: { flex: 1, backgroundColor: '#000', justifyContent: 'center', alignItems: 'center' },
  header: { alignItems: 'center', marginTop: 20 },
  avatar: { width: 110, height: 110, borderRadius: 55, borderWidth: 3, borderColor: '#6366f1', marginBottom: 16 },
  peerName: { fontSize: 24, fontWeight: '800', color: '#FFFFFF', marginBottom: 6 },
  callStatus: { fontSize: 14, color: '#a5b4fc', fontWeight: '600' },
  videoCanvas: { flex: 1, marginVertical: 24, borderRadius: 24, overflow: 'hidden', backgroundColor: '#1e1b4b' },
  videoOverlay: { position: 'absolute', top: 12, left: 12, backgroundColor: 'rgba(0,0,0,0.6)', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
  hdBadge: { color: '#10b981', fontSize: 11, fontWeight: '700' },
  controlsRow: { flexDirection: 'row', justifyContent: 'space-around', alignItems: 'center', width: '100%', marginBottom: 10 },
  controlBtn: { width: 56, height: 56, borderRadius: 28, backgroundColor: 'rgba(255,255,255,0.15)', justifyContent: 'center', alignItems: 'center' },
  controlBtnActive: { backgroundColor: 'rgba(255,255,255,0.3)' },
  endCallBtn: { width: 64, height: 64, borderRadius: 32, backgroundColor: '#ef4444', justifyContent: 'center', alignItems: 'center', boxShadow: '0 4px 15px rgba(239, 68, 68, 0.4)' },
});
