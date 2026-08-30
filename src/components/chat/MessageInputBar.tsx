import React, { useState } from 'react';
import {
  View,
  TextInput,
  TouchableOpacity,
  Pressable,
  StyleSheet,
  Text,
  Modal,
  ActivityIndicator,
  Platform,
  Alert,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
} from 'react-native-reanimated';
import * as ImagePicker from 'expo-image-picker';
import * as DocumentPicker from 'expo-document-picker';
import {
  Smile,
  Paperclip,
  Mic,
  Send,
  Camera,
  ImageIcon,
  FileText,
  X,
} from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useThemeStore } from '../../store/useThemeStore';
import { triggerHaptic } from '../../utils/haptics';
import { VoiceRecorder } from './VoiceRecorder';
import { apiClient } from '../../config/api';

interface MessageInputBarProps {
  onSendMessage: (text: string) => void;
  onSendMedia: (type: 'image' | 'voice' | 'document', url: string, extra?: any) => void;
  onTyping: (isTyping: boolean) => void;
  replyPreview?: { id: string; text: string; senderName?: string } | null;
  setReplyPreview: (preview: any) => void;
}

export const MessageInputBar: React.FC<MessageInputBarProps> = ({
  onSendMessage,
  onSendMedia,
  onTyping,
  replyPreview,
  setReplyPreview,
}) => {
  const palette = useThemeStore((state) => state.palette);
  const [text, setText] = useState('');
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [showAttachments, setShowAttachments] = useState(false);
  const [isRecordingVoice, setIsRecordingVoice] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const insets = useSafeAreaInsets();

  const sendBtnScale = useSharedValue(1);

  const handleTextChange = (val: string) => {
    setText(val);
    onTyping(val.length > 0);
  };

  const handleSend = () => {
    if (!text.trim()) return;
    triggerHaptic('light');
    onSendMessage(text);
    setText('');
    onTyping(false);
  };

  const handleSendPressIn = () => {
    triggerHaptic('light');
    sendBtnScale.value = withTiming(0.92, { duration: 100 });
  };

  const handleSendPressOut = () => {
    sendBtnScale.value = withTiming(1, { duration: 100 });
  };

  const sendBtnAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: sendBtnScale.value }],
  }));

  const uploadAndSend = async (uri: string, type: 'image' | 'voice' | 'document', extra?: any) => {
    setIsUploading(true);
    try {
      const formData = new FormData();
      const filename = uri.split('/').pop() || `file_${Date.now()}`;
      const match = /\.(\w+)$/.exec(filename);
      const ext = match ? match[1].toLowerCase() : '';
      const mime = type === 'image'
        ? `image/${ext === 'png' ? 'png' : 'jpeg'}`
        : type === 'voice'
        ? `audio/${ext || 'm4a'}`
        : `application/${ext || 'pdf'}`;

      formData.append('file', {
        uri,
        name: filename,
        type: mime,
      } as any);

      const res = await apiClient.post('/media/upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      const finalUrl = res.data?.mediaUrl || res.data?.url;
      if (finalUrl) {
        onSendMedia(type, finalUrl, extra);
      } else {
        onSendMedia(type, uri, extra);
      }
    } catch (err: any) {
      console.warn('[MediaUpload Failed, using local fallback]:', err?.message || err);
      onSendMedia(type, uri, extra);
    } finally {
      setIsUploading(false);
    }
  };

  const pickImage = async () => {
    setShowAttachments(false);
    triggerHaptic('selection');
    try {
      const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permission.granted) {
        Alert.alert(
          'Permission Required',
          'Please allow access to your photo library in device settings to send images.'
        );
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: false,
        quality: 0.8,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const asset = result.assets[0];
        await uploadAndSend(asset.uri, 'image');
      }
    } catch (error: any) {
      console.error('[PickImage Error]', error);
    }
  };

  const takePhoto = async () => {
    setShowAttachments(false);
    triggerHaptic('selection');
    try {
      const permission = await ImagePicker.requestCameraPermissionsAsync();
      if (!permission.granted) {
        Alert.alert(
          'Camera Permission Required',
          'Please allow camera access in device settings to take photos.'
        );
        return;
      }

      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: false,
        quality: 0.8,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const asset = result.assets[0];
        await uploadAndSend(asset.uri, 'image');
      }
    } catch (error: any) {
      console.error('[TakePhoto Error]', error);
    }
  };

  const pickDocument = async () => {
    setShowAttachments(false);
    triggerHaptic('selection');
    try {
      const result = await DocumentPicker.getDocumentAsync({ copyToCacheDirectory: true });
      if (!result.canceled && result.assets && result.assets.length > 0) {
        const doc = result.assets[0];
        await uploadAndSend(doc.uri, 'document', {
          mediaFileName: doc.name,
          mediaFileSize: doc.size ? `${(doc.size / (1024 * 1024)).toFixed(1)} MB` : '1.2 MB',
        });
      }
    } catch (error) {
      console.error('[PickDocument Error]', error);
    }
  };

  if (isRecordingVoice) {
    return (
      <VoiceRecorder
        onSendVoiceNote={async (url, duration) => {
          setIsRecordingVoice(false);
          await uploadAndSend(url, 'voice', { audioDuration: duration, duration });
        }}
        onCancel={() => setIsRecordingVoice(false)}
      />
    );
  }

  const bottomInset = Math.max(insets.bottom, Platform.OS === 'android' ? 10 : 6) + 2;

  return (
    <View style={[styles.wrapper, { backgroundColor: palette.background, paddingBottom: bottomInset }]}>
      {/* Reply Preview Banner */}
      {replyPreview && (
        <View style={[styles.replyBanner, { backgroundColor: palette.surfaceElevated, borderColor: palette.border }]}>
          <View style={[styles.replyBar, { backgroundColor: palette.primary }]} />
          <View style={styles.replyTextContainer}>
            <Text style={[styles.replyTitle, { color: palette.primary }]}>
              Replying to {replyPreview.senderName || 'Message'}
            </Text>
            <Text style={[styles.replySubtext, { color: palette.textPrimary }]} numberOfLines={1}>
              {replyPreview.text}
            </Text>
          </View>
          <TouchableOpacity onPress={() => setReplyPreview(null)} style={styles.closeReplyBtn}>
            <X size={16} color={palette.textMuted} />
          </TouchableOpacity>
        </View>
      )}

      {/* Quick Emoji Bar */}
      {showEmojiPicker && (
        <View
          style={[
            styles.emojiBar,
            {
              backgroundColor: palette.surfaceElevated,
              borderColor: palette.border,
            },
          ]}
        >
          {['🔥', '😂', '❤️', '👍', '🎉', '🙌', '💯', '✨', '⚡'].map((emoji) => (
            <TouchableOpacity
              key={emoji}
              onPress={() => {
                triggerHaptic('light');
                setText((prev) => prev + emoji);
              }}
              style={styles.emojiBtn}
            >
              <Text style={{ fontSize: 20 }}>{emoji}</Text>
            </TouchableOpacity>
          ))}
        </View>
      )}

      {/* Main Discord-Style Input Row */}
      <View
        style={[
          styles.inputRow,
          {
            backgroundColor: palette.surface,
            borderColor: palette.border,
          },
        ]}
      >
        <TouchableOpacity
          onPress={() => {
            triggerHaptic('light');
            setShowEmojiPicker(!showEmojiPicker);
          }}
          style={styles.iconBtn}
        >
          <Smile size={20} color={showEmojiPicker ? palette.primary : palette.textMuted} />
        </TouchableOpacity>

        <TextInput
          value={text}
          onChangeText={handleTextChange}
          placeholder="Message"
          placeholderTextColor={palette.textMuted}
          multiline
          style={[styles.textInput, { color: palette.textPrimary }]}
        />

        <TouchableOpacity
          onPress={() => {
            triggerHaptic('light');
            setShowAttachments(true);
          }}
          style={styles.iconBtn}
        >
          <Paperclip size={19} color={palette.textMuted} />
        </TouchableOpacity>

        {isUploading ? (
          <View style={styles.iconBtn}>
            <ActivityIndicator size="small" color={palette.primary} />
          </View>
        ) : text.trim().length > 0 ? (
          <Pressable
            onPressIn={handleSendPressIn}
            onPressOut={handleSendPressOut}
            onPress={handleSend}
          >
            <Animated.View
              style={[
                styles.sendBtn,
                {
                  backgroundColor: palette.primary, // Blurple #5865F2
                },
                sendBtnAnimatedStyle,
              ]}
            >
              <Send size={15} color="#FFFFFF" strokeWidth={2.2} />
            </Animated.View>
          </Pressable>
        ) : (
          <TouchableOpacity
            onPress={() => {
              triggerHaptic('medium');
              setIsRecordingVoice(true);
            }}
            style={styles.iconBtn}
          >
            <Mic size={20} color={palette.textMuted} />
          </TouchableOpacity>
        )}
      </View>

      {/* Attachment Options Modal */}
      <Modal visible={showAttachments} transparent animationType="fade" onRequestClose={() => setShowAttachments(false)}>
        <TouchableOpacity activeOpacity={1} onPress={() => setShowAttachments(false)} style={styles.modalOverlay}>
          <View style={[styles.attachmentSheet, { backgroundColor: palette.surfaceElevated, borderColor: palette.border }]}>
            <Text style={[styles.sheetTitle, { color: palette.textPrimary }]}>Share Content</Text>
            <View style={styles.optionsRow}>
              <TouchableOpacity onPress={pickImage} style={styles.optionItem}>
                <View style={[styles.optionIcon, { backgroundColor: palette.surfaceLight }]}>
                  <ImageIcon size={22} color={palette.primary} />
                </View>
                <Text style={[styles.optionLabel, { color: palette.textPrimary }]}>Gallery</Text>
              </TouchableOpacity>

              <TouchableOpacity onPress={takePhoto} style={styles.optionItem}>
                <View style={[styles.optionIcon, { backgroundColor: palette.surfaceLight }]}>
                  <Camera size={22} color={palette.primary} />
                </View>
                <Text style={[styles.optionLabel, { color: palette.textPrimary }]}>Camera</Text>
              </TouchableOpacity>

              <TouchableOpacity onPress={pickDocument} style={styles.optionItem}>
                <View style={[styles.optionIcon, { backgroundColor: palette.surfaceLight }]}>
                  <FileText size={22} color={palette.primary} />
                </View>
                <Text style={[styles.optionLabel, { color: palette.textPrimary }]}>Document</Text>
              </TouchableOpacity>
            </View>
          </View>
        </TouchableOpacity>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  wrapper: {
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  replyBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 8,
    borderRadius: 8,
    borderWidth: 1,
    marginBottom: 6,
  },
  replyBar: {
    width: 3,
    height: '100%',
    borderRadius: 1.5,
    marginRight: 8,
  },
  replyTextContainer: {
    flex: 1,
  },
  replyTitle: {
    fontSize: 11,
    fontWeight: '600',
  },
  replySubtext: {
    fontSize: 12,
    fontWeight: '400',
    marginTop: 1,
  },
  closeReplyBtn: {
    padding: 4,
  },
  emojiBar: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: 6,
    borderRadius: 10,
    borderWidth: 1,
    marginBottom: 6,
  },
  emojiBtn: {
    paddingHorizontal: 5,
    paddingVertical: 3,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 10,
    borderWidth: 1,
  },
  iconBtn: {
    padding: 6,
    justifyContent: 'center',
    alignItems: 'center',
  },
  textInput: {
    flex: 1,
    fontSize: 14,
    maxHeight: 90,
    paddingHorizontal: 6,
    paddingVertical: 4,
  },
  sendBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 2,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'flex-end',
  },
  attachmentSheet: {
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    borderWidth: 1,
    padding: 20,
    paddingBottom: 36,
  },
  sheetTitle: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 16,
    textAlign: 'center',
  },
  optionsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  optionItem: {
    alignItems: 'center',
  },
  optionIcon: {
    width: 48,
    height: 48,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 6,
  },
  optionLabel: {
    fontSize: 12,
    fontWeight: '500',
  },
});
