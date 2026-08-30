import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Audio } from 'expo-av';
import Animated, { FadeIn, FadeOut } from 'react-native-reanimated';
import { Trash2, Send } from 'lucide-react-native';
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

    try {
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: false,
        playsInSilentModeIOS: true,
        staysActiveInBackground: false,
        shouldDuckAndroid: true,
        playThroughEarpieceAndroid: false,
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
        shouldDuckAndroid: true,
        playThroughEarpieceAndroid: false,
      });
    } catch (e) {}
    onCancel();
  };

  return (
    <Animated.View
      entering={FadeIn.duration(150)}
      exiting={FadeOut.duration(150)}
      style={styles.container}
    >
      <View
        style={[
          styles.recorderBody,
          {
            backgroundColor: palette.surface,
            borderColor: palette.border,
          },
        ]}
      >
        <TouchableOpacity onPress={handleCancel} style={styles.trashBtn}>
          <Trash2 size={20} color={palette.error} />
        </TouchableOpacity>

        <View style={styles.recordingStatus}>
          <View style={[styles.redDot, { backgroundColor: palette.error }]} />
          <Text style={[styles.timerText, { color: palette.textPrimary }]}>{formatCallDuration(seconds)}</Text>
          <Text style={[styles.slideText, { color: palette.textMuted }]}>Recording voice note...</Text>
        </View>

        <TouchableOpacity onPress={handleSend} style={[styles.sendBtn, { backgroundColor: palette.primary }]}>
          <Send size={15} color="#FFFFFF" strokeWidth={2.2} />
        </TouchableOpacity>
      </View>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginHorizontal: 12,
    marginBottom: 6,
  },
  recorderBody: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 10,
    borderWidth: 1,
  },
  trashBtn: {
    padding: 6,
  },
  recordingStatus: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: 6,
  },
  redDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 6,
  },
  timerText: {
    fontSize: 14,
    fontWeight: '700',
  },
  slideText: {
    fontSize: 12,
    fontWeight: '400',
    marginLeft: 8,
  },
  sendBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
