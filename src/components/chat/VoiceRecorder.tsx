import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Audio } from 'expo-av';
import Animated, { FadeIn, FadeOut } from 'react-native-reanimated';
import { Mic, Trash2, Send } from 'lucide-react-native';
import { useThemeStore } from '../../store/useThemeStore';
import { triggerHaptic } from '../../utils/haptics';
import { formatCallDuration } from '../../utils/dateUtils';

interface VoiceRecorderProps {
  onSendVoiceNote: (mediaUrl: string, durationSeconds: number) => void;
  onCancel: () => void;
}

export const VoiceRecorder: React.FC<VoiceRecorderProps> = ({ onSendVoiceNote, onCancel }) => {
  const palette = useThemeStore((state) => state.palette);
  const [seconds, setSeconds] = useState(0);
  const [recording, setRecording] = useState<Audio.Recording | null>(null);

  useEffect(() => {
    let timer: NodeJS.Timeout;
    timer = setInterval(() => setSeconds((s) => s + 1), 1000);
    startRecording();

    return () => {
      clearInterval(timer);
      stopRecordingCleanup();
    };
  }, []);

  const startRecording = async () => {
    try {
      triggerHaptic('medium');
      await Audio.requestPermissionsAsync();
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
      });

      const { recording: newRecording } = await Audio.Recording.createAsync(
        Audio.RecordingOptionsPresets.HIGH_QUALITY
      );
      setRecording(newRecording);
    } catch (err) {
      console.log('Failed to start recording', err);
    }
  };

  const stopRecordingCleanup = async () => {
    if (recording) {
      try {
        await recording.stopAndUnloadAsync();
      } catch (e) {}
    }
  };

  const handleSend = async () => {
    triggerHaptic('success');
    let uri = '';
    if (recording) {
      try {
        await recording.stopAndUnloadAsync();
        const recordedUri = recording.getURI();
        if (recordedUri) uri = recordedUri;
      } catch (e) {
        console.error('[VoiceRecorder Error]', e);
      }
    }

    // Reset audio mode back to playback
    try {
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: false,
        playsInSilentModeIOS: true,
        staysActiveInBackground: false,
      });
    } catch (e) {}

    if (uri) {
      onSendVoiceNote(uri, seconds || 1);
    } else {
      onCancel();
    }
  };

  const handleCancel = async () => {
    triggerHaptic('error');
    await stopRecordingCleanup();
    try {
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: false,
        playsInSilentModeIOS: true,
        staysActiveInBackground: false,
      });
    } catch (e) {}
    onCancel();
  };

  return (
    <Animated.View
      entering={FadeIn.duration(200)}
      exiting={FadeOut.duration(200)}
      style={[styles.container, { backgroundColor: palette.surfaceElevated, borderColor: palette.border }]}
    >
      <TouchableOpacity onPress={handleCancel} style={styles.trashBtn}>
        <Trash2 size={22} color={palette.error} />
      </TouchableOpacity>

      <View style={styles.recordingStatus}>
        <View style={styles.redDot} />
        <Text style={[styles.timerText, { color: palette.textPrimary }]}>{formatCallDuration(seconds)}</Text>
        <Text style={[styles.slideText, { color: palette.textMuted }]}>Release or tap trash to cancel</Text>
      </View>

      <TouchableOpacity onPress={handleSend} style={[styles.sendBtn, { backgroundColor: palette.primary }]}>
        <Send size={18} color="#FFFFFF" />
      </TouchableOpacity>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 26,
    borderWidth: 1,
    marginHorizontal: 12,
    marginBottom: 8,
  },
  trashBtn: {
    padding: 8,
  },
  recordingStatus: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: 8,
  },
  redDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#EF4444',
    marginRight: 8,
  },
  timerText: {
    fontSize: 16,
    fontWeight: '700',
  },
  slideText: {
    fontSize: 12,
    marginLeft: 12,
  },
  sendBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
